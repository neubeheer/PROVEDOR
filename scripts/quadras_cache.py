#!/usr/bin/env python3
"""Pré-carrega o banco de quadras do Provedor Tycoon no Google Drive (via Apps Script).

Para cada município de um estado (ou do Brasil inteiro), busca as ruas no
OpenStreetMap (Overpass), desenha os quarteirões com o mesmo método do jogo e
grava um arquivo por cidade na pasta do Drive, pelo link do Apps Script. Assim o jogo abre as quadras na hora, sem
esperar o OpenStreetMap.

Uso:
  QUADRAS_URL=https://script.google.com/macros/s/.../exec QUADRAS_SENHA=... python3 scripts/quadras_cache.py --uf SP
  python3 scripts/quadras_cache.py --uf BR --limit 150     # próximas 150 cidades do país
  python3 scripts/quadras_cache.py --city "Duartina" --uf SP --dry-run

Só usa a biblioteca padrão do Python 3. Cidades já gravadas são puladas
(use --refresh para refazer).
"""
import argparse, json, math, os, sys, time, unicodedata, urllib.parse, urllib.request

UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']
UA = 'ProvedorTycoon-cache/1.0 (github.com/neubeheer/PROVEDOR)'
M_LAT = 111320.0


def m_lon(lat):
    return 111320.0 * math.cos(math.radians(lat))


def norm_name(t):
    t = unicodedata.normalize('NFD', str(t or ''))
    t = ''.join(ch for ch in t if unicodedata.category(ch) != 'Mn').lower()
    t = t.replace("'", ' ').replace('-', ' ')
    return ' '.join(t.split())


def http_json(url, data=None, headers=None, timeout=90, method=None):
    h = {'User-Agent': UA, 'Accept': 'application/json'}
    h.update(headers or {})
    body = data.encode() if isinstance(data, str) else data
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
        return json.loads(raw) if raw else None


# ----------------------------- geometria (igual ao jogo) -----------------------------
def street_faces(ways, lat0, lon0):
    kx = m_lon(lat0)
    P, adj = {}, {}

    def link(a, b):
        if a == b:
            return
        adj.setdefault(a, set()).add(b)
        adj.setdefault(b, set()).add(a)

    for w in ways:
        if w.get('type') != 'way' or not w.get('nodes') or not w.get('geometry') or len(w['nodes']) != len(w['geometry']):
            continue
        prev_ok = False
        for i, (nid, g) in enumerate(zip(w['nodes'], w['geometry'])):
            if not g:
                prev_ok = False
                continue
            if nid not in P:
                P[nid] = ((g['lon'] - lon0) * kx, (g['lat'] - lat0) * M_LAT)
            if i and prev_ok:
                link(w['nodes'][i - 1], nid)
            prev_ok = True
    # tira ruas sem saída
    stack = [k for k, v in adj.items() if len(v) < 2]
    while stack:
        k = stack.pop()
        st = adj.get(k)
        if st is None or len(st) >= 2:
            continue
        for n in list(st):
            t = adj.get(n)
            if t is not None:
                t.discard(k)
                if len(t) < 2:
                    stack.append(n)
        del adj[k]
    order = {}
    for k, st in adj.items():
        px, py = P[k]
        order[k] = [n for n, _ in sorted(((n, math.atan2(P[n][1] - py, P[n][0] - px)) for n in st), key=lambda x: x[1])]
    used, faces = set(), []
    for u, ns in order.items():
        for v0 in ns:
            if (u, v0) in used:
                continue
            ring, a, b, ok, steps = [], u, v0, False, 0
            while steps < 3000:
                steps += 1
                if (a, b) in used:
                    ok = (a == u and b == v0)
                    break
                used.add((a, b))
                ring.append(a)
                L = order[b]
                i = L.index(a)
                a, b = b, L[(i - 1) % len(L)]
            if not ok or len(ring) < 3:
                continue
            pts = [P[i] for i in ring]
            A = cx = cy = per = 0.0
            for i in range(len(pts)):
                x1, y1 = pts[i]
                x2, y2 = pts[(i + 1) % len(pts)]
                cr = x1 * y2 - x2 * y1
                A += cr
                cx += (x1 + x2) * cr
                cy += (y1 + y2) * cr
                per += math.hypot(x2 - x1, y2 - y1)
            A /= 2
            if A <= 0:
                continue
            faces.append({'pts': pts, 'area': A, 'cx': cx / (6 * A), 'cy': cy / (6 * A), 'per': per})
    return faces


def simplify_ring(pts, tol):
    if len(pts) <= 4:
        return pts
    keep = []
    n = len(pts)
    for i, p in enumerate(pts):
        a, b = pts[(i - 1) % n], pts[(i + 1) % n]
        L = math.hypot(b[0] - a[0], b[1] - a[1]) or 1
        d = abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / L
        if d > tol:
            keep.append(p)
    return keep if len(keep) >= 3 else pts


def blocks_for(lat, lon, R, elements):
    faces = [f for f in street_faces(elements, lat, lon)
             if 500 <= f['area'] <= 60000 and f['area'] / (f['per'] ** 2) > 0.018 and math.hypot(f['cx'], f['cy']) <= R * 1.05]
    faces.sort(key=lambda f: math.hypot(f['cx'], f['cy']))
    faces = faces[:1500]
    kx = m_lon(lat)
    return [{'a': round(f['area']), 'p': [[round(lat + y / M_LAT, 6), round(lon + x / kx, 6)] for x, y in simplify_ring(f['pts'], 1.5)]} for f in faces]


# ----------------------------- fontes -----------------------------
def municipios(uf):
    url = f'https://servicodados.ibge.gov.br/api/v1/localidades/estados/{uf}/municipios?orderBy=nome'
    return [{'id': str(m['id']), 'nome': m['nome'], 'uf': uf} for m in http_json(url)]


def populacoes(codes):
    out = {}
    for i in range(0, len(codes), 100):
        part = ','.join(codes[i:i + 100])
        try:
            r = http_json(f'https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N6[{part}]')
            for s in r[0]['resultados'][0]['series']:
                v = list(s['serie'].values())[0]
                out[s['localidade']['id']] = int(v)
        except Exception as e:  # população é só para escolher o raio
            print('  população indisponível:', e, file=sys.stderr)
    return out


_last_nomi = [0.0]


def geocode(name, uf):
    """Mesmo critério do jogo: relação administrativa do município (centro = sede)."""
    wait = 1.1 - (time.time() - _last_nomi[0])
    if wait > 0:
        time.sleep(wait)
    q = urllib.parse.quote(f'{name}, {uf}, Brasil')
    lst = http_json(f'https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=br&limit=6&addressdetails=1&accept-language=pt-BR&q={q}')
    _last_nomi[0] = time.time()
    if not lst:
        return None
    good = next((r for r in lst if r.get('osm_type') == 'relation' and (r.get('type') == 'administrative' or r.get('addresstype') in ('municipality', 'city', 'town'))), None) \
        or next((r for r in lst if r.get('addresstype') in ('city', 'town', 'village', 'municipality')), None) or lst[0]
    return float(good['lat']), float(good['lon'])


def overpass(q):
    last = None
    for url in OVERPASS:
        try:
            r = http_json(url, data='data=' + urllib.parse.quote(q), headers={'Content-Type': 'application/x-www-form-urlencoded'}, timeout=120)
            if r and r.get('remark') and any(k in r['remark'].lower() for k in ('error', 'timed out', 'timeout')):
                raise RuntimeError(r['remark'])
            return r
        except Exception as e:
            last = e
            time.sleep(3)
    raise last


def streets(lat, lon, R):
    ar = f'(around:{R},{lat:.6f},{lon:.6f})'
    q = (f'[out:json][timeout:90];(way{ar}[highway~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|'
         f'pedestrian|road|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"];way{ar}[railway=rail];);out geom;')
    return overpass(q).get('elements', [])


# ----------------------------- Banco de quadras no Google Drive (Apps Script) -----------------------------
class Drive:
    def __init__(self, url, senha, dry=False):
        self.url, self.senha, self.dry = url, senha, dry

    def existing(self, uf):
        if self.dry:
            return set()
        r = http_json(self.url + ('&' if '?' in self.url else '?') + 'lista=1', timeout=120)
        if not r or not r.get('ok'):
            raise RuntimeError(f'não deu para listar o banco: {r}')
        return set(r.get('chaves') or [])

    def put(self, row):
        if self.dry:
            return
        row = dict(row, senha=self.senha)
        r = http_json(self.url, data=json.dumps(row), headers={'Content-Type': 'text/plain;charset=utf-8'}, method='POST', timeout=120)
        if not r or not r.get('ok'):
            raise RuntimeError(f'o banco recusou: {r}')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--uf', default='SP', help='sigla do estado ou BR para o Brasil inteiro')
    ap.add_argument('--city', help='só uma cidade (nome)')
    ap.add_argument('--limit', type=int, default=0, help='máximo de cidades nesta rodada (0 = todas)')
    ap.add_argument('--sleep', type=float, default=4.0, help='pausa entre cidades, em segundos (respeite o Overpass)')
    ap.add_argument('--refresh', action='store_true', help='refaz cidades já gravadas')
    ap.add_argument('--dry-run', action='store_true', help='não grava nada, só mostra')
    ap.add_argument('--streets-json', help='arquivo de ruas no formato Overpass (testes)')
    a = ap.parse_args()

    url, senha = os.environ.get('QUADRAS_URL', '').strip(), os.environ.get('QUADRAS_SENHA', '').strip()
    if not a.dry_run and not (url and senha):
        sys.exit('Defina QUADRAS_URL (link /exec do Apps Script) e QUADRAS_SENHA (a SENHA_DO_ROBO do script).')
    sb = Drive(url, senha, a.dry_run)

    if a.streets_json:  # teste local do desenho das quadras
        els = json.load(open(a.streets_json))['elements']
        g = [n for w in els for n in (w.get('geometry') or [])]
        lat = sum(p['lat'] for p in g) / len(g)
        lon = sum(p['lon'] for p in g) / len(g)
        print(len(blocks_for(lat, lon, 4000, els)), 'quadras')
        return

    ufs = UFS if a.uf.upper() == 'BR' else [a.uf.upper()]
    done = set() if a.refresh else sb.existing(a.uf.upper())
    count = 0
    for uf in ufs:
        mun = municipios(uf)
        if a.city:
            mun = [m for m in mun if norm_name(m['nome']) == norm_name(a.city)]
        todo = [m for m in mun if m['id'] not in done]
        if not todo:
            continue
        pops = populacoes([m['id'] for m in todo])
        for m in todo:
            if a.limit and count >= a.limit:
                print(f'Limite de {a.limit} cidades atingido.')
                return
            count += 1
            pop = pops.get(m['id'], 0)
            R = 2500 if pop >= 200000 else 3000 if pop >= 30000 else 2000
            try:
                pos = geocode(m['nome'], uf)
                if not pos:
                    print(f'[{uf}] {m["nome"]}: não achei no mapa')
                    continue
                els = streets(pos[0], pos[1], R)
                bl = blocks_for(pos[0], pos[1], R, els)
                if len(bl) < 6:
                    print(f'[{uf}] {m["nome"]}: só {len(bl)} quadra(s), pulando')
                    continue
                sb.put({'city_key': m['id'], 'name_key': f"{norm_name(m['nome'])}|{uf}", 'name': m['nome'], 'uf': uf,
                        'lat': pos[0], 'lon': pos[1], 'radius': R, 'faces': bl})
                print(f'[{uf}] {m["nome"]}: {len(bl)} quadras ({pop:,} hab.)'.replace(',', '.'))
            except Exception as e:
                print(f'[{uf}] {m["nome"]}: erro {e}')
            time.sleep(a.sleep)
    print(f'Pronto: {count} cidade(s) processada(s).')


if __name__ == '__main__':
    main()
