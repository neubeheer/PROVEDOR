# Provedor Tycoon — contexto do projeto

Jogo de navegador educativo: o jogador monta um provedor de internet do zero (empresa, outorga, torres de rádio, venda porta a porta, equipe, fibra, expansão para outras cidades). Roda em Duartina/SP sobre o mapa real.

## Estrutura e publicação
- Repositório `neubeheer/PROVEDOR`, branch `main`. Publicado no Render como Static Site (sem build, pasta `.`); também funciona no GitHub Pages.
- Quase tudo está em `index.html` (HTML, CSS e JS puro, sem framework).
- `sw.js` guarda o jogo offline. **A cada versão publicada, suba o número em `VERSION`** (hoje `v14`), senão os jogadores não recebem a atualização.
- `manifest.webmanifest` permite instalar como app (abre deitado).
- Layout pensado para celular deitado; em pé aparece aviso para girar.

## Mapa e dados
- Leaflet (`vendor/leaflet`) + OpenStreetMap.
- Nominatim (acha a cidade), Overpass (ruas), ViaCEP (bairros pelas ruas), IBGE (municípios, população Censo 2022, bairros oficiais em `data/bairros`, gerados por workflow do GitHub).
- Expansão: só cidades a até `EXPAND_KM` (200 km) de alguma cidade já atendida, em cadeia. As distâncias usam `data/municipios.json` (sede de cada município, fonte: kelvins/municipios-brasileiros).
- Quadras são desenhadas a partir das ruas do OSM; o tabuleiro só aparece depois desse rastreamento. Domicílios da cidade são divididos entre as quadras (pensando em concorrentes futuros).

## Online
- **Supabase**: login e-mail/senha e progresso na tabela `saves`; o progresso também fica no aparelho e funciona offline. Tabelas e regras em `supabase/schema.sql`. A chave publishable é pública por natureza; quem protege os dados são as regras do schema.
- **Google Drive + Apps Script** (`apps-script/Code.gs`): banco de quadras, um JSON por cidade, servido por link aberto do script. Jogador logado grava cidades novas (o script confere o login no Supabase). O robô do GitHub (`scripts/quadras_cache.py`, workflow "Banco de quadras") se identifica com a senha do robô. No modo diário (`--regioes`) ele lê as cidades dos jogadores (`?regioes=1`, arquivo `_regioes.json`, alimentado pelo jogo após o save na nuvem) e desenha as vizinhas até 400 km, das mais perto para as mais longe.
- `config.js`: URL do Supabase, chave pública e link do Apps Script.
- **Nunca** colocar a senha do robô no código; ela fica só nos segredos do GitHub e nas Propriedades do script.

## Pendências de configuração (em 2026-10-02)
- [ ] Rodar `supabase/schema.sql` no Supabase, se ainda não rodou.
- [ ] Colar a Publishable key no `config.js` (`supabaseAnonKey`) e nas Propriedades do script (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- [ ] Publicar a v14 e conferir em **Menu → Testar conexões**.
- [ ] Colar o novo `Code.gs` no Apps Script e publicar uma nova versão da implantação (o link `/exec` não muda).
- [ ] Criar os segredos `QUADRAS_URL` e `QUADRAS_SENHA` no GitHub para ligar o robô.

## Próximas ideias
- Disputa por território entre provedoras: o cliente compara atendimento, tecnologia, planos, suporte e campanhas.
