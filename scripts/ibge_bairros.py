#!/usr/bin/env python3
"""
Gera os arquivos de bairros do jogo a partir da malha de bairros do IBGE (Censo 2022).

Uso:
    python3 scripts/ibge_bairros.py --uf SP            # baixa do IBGE e gera só São Paulo
    python3 scripts/ibge_bairros.py --uf BR            # gera o Brasil inteiro
    python3 scripts/ibge_bairros.py --zip arquivo.zip  # usa um zip já baixado

Saída (pasta data/bairros/):
    index.json          -> {"duartina|SP": "3514304", ...}
    <codigo_ibge>.json  -> bairros da cidade com nome, população, domicílios, área, centro e contorno

Não precisa instalar nada: só Python 3 (lê shapefile e dbf na mão).
"""
import argparse, io, json, math, os, struct, sys, unicodedata, urllib.request, zipfile

URL = ('https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/'
       'malha_com_atributos/bairros/shp/BR/BR_bairros_CD2022.zip')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'bairros')
TOL = 0.00015      # simplificação do contorno (~15 m)
NDIG = 5           # casas decimais nas coordenadas (~1 m)

# ---------------- leitura de .dbf ----------------
def read_dbf(data, encoding):
    nrec, hlen, rlen = struct.unpack('<xxxxIHH', data[:12])
    fields, pos = [], 32
    while data[pos] != 0x0D:
        name = data[pos:pos + 11].split(b'\x00')[0].decode('ascii', 'ignore')
        ftype = chr(data[pos + 11]); flen = data[pos + 16]; fdec = data[pos + 17]
        fields.append((name, ftype, flen, fdec)); pos += 32
    rows, pos = [], hlen
    for _ in range(nrec):
        rec = data[pos:pos + rlen]; pos += rlen
        if rec[:1] == b'*':
            rows.append(None); continue
        off, row = 1, {}
        for name, ftype, flen, fdec in fields:
            raw = rec[off:off + flen]; off += flen
            try:
                txt = raw.decode(encoding).strip()
            except UnicodeDecodeError:
                txt = raw.decode('latin-1').strip()
            if ftype in 'NF':
                try:
                    row[name] = float(txt) if txt else None
                except ValueError:
                    row[name] = None
            else:
                row[name] = txt
        rows.append(row)
    return rows

# ---------------- leitura de .shp (polígonos) ----------------
def read_shp(data):
    shapes, pos = [], 100
    while pos < len(data):
        _, clen = struct.unpack('>ii', data[pos:pos + 8]); pos += 8
        content = data[pos:pos + clen * 2]; pos += clen * 2
        stype = struct.unpack('<i', content[:4])[0]
        if stype == 0:
            shapes.append([]); continue
        if stype not in (5, 15, 25):
            shapes.append([]); continue
        nparts, npoints = struct.unpack('<ii', content[36:44])
        parts = list(struct.unpack('<%di' % nparts, content[44:44 + 4 * nparts]))
        p0 = 44 + 4 * nparts
        pts = [struct.unpack('<2d', content[p0 + 16 * i:p0 + 16 * i + 16]) for i in range(npoints)]
        parts.append(npoints)
        shapes.append([pts[parts[i]:parts[i + 1]] for i in range(nparts)])
    return shapes

# ---------------- geometria ----------------
def ring_area(r):
    a = 0.0
    for i in range(len(r) - 1):
        a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]
    return a / 2.0

def ring_centroid(r):
    a = ring_area(r)
    if abs(a) < 1e-14:
        xs = [p[0] for p in r]; ys = [p[1] for p in r]
        return (sum(xs) / len(xs), sum(ys) / len(ys)), 0.0
    cx = cy = 0.0
    for i in range(len(r) - 1):
        f = r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]
        cx += (r[i][0] + r[i + 1][0]) * f; cy += (r[i][1] + r[i + 1][1]) * f
    return (cx / (6 * a), cy / (6 * a)), a

def simplify(pts, tol):
    if len(pts) < 5:
        return pts
    def rdp(a, b):
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy) or 1e-12
        best, idx = -1.0, -1
        for i in range(a + 1, b):
            d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / L
            if d > best:
                best, idx = d, i
        if best > tol:
            return rdp(a, idx)[:-1] + rdp(idx, b)
        return [pts[a], pts[b]]
    out = rdp(0, len(pts) - 1)
    return out if len(out) >= 4 else pts

def km2(ring_deg, lat0):
    kx = 111.32 * math.cos(math.radians(lat0)); ky = 110.57
    return abs(ring_area([(x * kx, y * ky) for x, y in ring_deg]))

def norm(s):
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode().lower()
    return ' '.join(s.replace("'", ' ').replace('-', ' ').split())

def pick(row, *names):
    low = {k.lower(): k for k in row}
    for n in names:
        if n.lower() in low:
            return row[low[n.lower()]]
    return None

# ---------------- principal ----------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--uf', default='SP', help='sigla do estado ou BR para todos')
    ap.add_argument('--zip', help='zip do IBGE já baixado')
    ap.add_argument('--out', default=OUT)
    a = ap.parse_args()
    uf = a.uf.upper()

    if a.zip:
        raw = open(a.zip, 'rb').read()
    else:
        print('Baixando', URL, flush=True)
        req = urllib.request.Request(URL, headers={'User-Agent': 'provedor-tycoon/1.0'})
        raw = urllib.request.urlopen(req, timeout=600).read()
    z = zipfile.ZipFile(io.BytesIO(raw))
    names = z.namelist()
    shp = next(n for n in names if n.lower().endswith('.shp'))
    base = shp[:-4]
    dbf = next(n for n in names if n.lower() == (base + '.dbf').lower())
    cpg = next((n for n in names if n.lower() == (base + '.cpg').lower()), None)
    enc = z.read(cpg).decode('ascii', 'ignore').strip() if cpg else 'utf-8'
    enc = {'UTF-8': 'utf-8', '1252': 'cp1252', 'ISO-8859-1': 'latin-1'}.get(enc.upper(), enc) or 'utf-8'
    rows = read_dbf(z.read(dbf), enc)
    shapes = read_shp(z.read(shp))
    if rows and rows[0]:
        print('Colunas:', ', '.join(rows[0].keys()), flush=True)
    print(f'{len(rows)} bairros no arquivo', flush=True)

    cities = {}
    for row, parts in zip(rows, shapes):
        if not row or not parts:
            continue
        sig = (pick(row, 'SIGLA_UF', 'SG_UF', 'UF') or '').upper()
        cd_mun = str(pick(row, 'CD_MUN', 'CD_MUNICIP', 'CD_GEOCODM') or '').split('.')[0]
        if not sig and cd_mun:
            sig = {'11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO','21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA','31':'MG','32':'ES','33':'RJ','35':'SP','41':'PR','42':'SC','43':'RS','50':'MS','51':'MT','52':'GO','53':'DF'}.get(cd_mun[:2], '')
        if uf != 'BR' and sig != uf:
            continue
        nm_mun = pick(row, 'NM_MUN', 'NM_MUNICIP') or ''
        nome = pick(row, 'NM_BAIRRO', 'NM_BAI', 'NOME') or 'Sem nome'
        pop = pick(row, 'v0001', 'V0001', 'POP')
        dom = pick(row, 'v0002', 'V0002', 'v0003', 'V0003', 'DOM')
        # anel externo principal (maior área) e partes extras
        rings = [r for r in parts if len(r) >= 4]
        if not rings:
            continue
        outer = max(rings, key=lambda r: abs(ring_area(r)))
        (cx, cy), _ = ring_centroid(outer)
        polys = []
        for r in sorted(rings, key=lambda r: -abs(ring_area(r)))[:3]:
            if r is not outer and abs(ring_area(r)) < abs(ring_area(outer)) * 0.05:
                continue
            sr = simplify(r, TOL)
            polys.append([[round(x, NDIG), round(y, NDIG)] for x, y in sr])
        c = cities.setdefault(cd_mun, {'cd_mun': cd_mun, 'nm_mun': nm_mun, 'uf': sig,
                                        'fonte': 'IBGE, Censo Demográfico 2022 (malha de bairros)', 'bairros': []})
        c['bairros'].append({
            'id': str(pick(row, 'CD_BAIRRO', 'CD_BAI') or '').split('.')[0],
            'nome': nome,
            'pop': int(pop) if pop else None,
            'dom': int(dom) if dom else None,
            'area': round(km2(outer, cy), 3),
            'c': [round(cy, NDIG), round(cx, NDIG)],
            'poly': polys,
        })

    os.makedirs(a.out, exist_ok=True)
    idx_path = os.path.join(a.out, 'index.json')
    index = json.load(open(idx_path, encoding='utf-8')) if os.path.exists(idx_path) else {}
    total = 0
    for cd, c in cities.items():
        c['bairros'].sort(key=lambda b: -(b['dom'] or 0))
        with open(os.path.join(a.out, f'{cd}.json'), 'w', encoding='utf-8') as f:
            json.dump(c, f, ensure_ascii=False, separators=(',', ':'))
        index[f"{norm(c['nm_mun'])}|{c['uf']}"] = cd
        total += len(c['bairros'])
    with open(idx_path, 'w', encoding='utf-8') as f:
        json.dump(dict(sorted(index.items())), f, ensure_ascii=False, separators=(',', ':'))
    print(f'Pronto: {len(cities)} cidades e {total} bairros em {os.path.relpath(a.out)}', flush=True)

if __name__ == '__main__':
    main()
