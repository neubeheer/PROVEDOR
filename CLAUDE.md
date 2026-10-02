# Provedor Tycoon — contexto do projeto

Jogo de navegador educativo: o jogador monta um provedor de internet do zero (empresa, outorga, torres de rádio, venda porta a porta, equipe, fibra, expansão para outras cidades). Roda em Duartina/SP sobre o mapa real.

## Estrutura e publicação
- Repositório `neubeheer/PROVEDOR`, branch `main`. Publicado no Render como Static Site (sem build, pasta `.`); também funciona no GitHub Pages.
- Quase tudo está em `index.html` (HTML, CSS e JS puro, sem framework).
- `sw.js` guarda o jogo offline. **A cada versão publicada, suba o número em `VERSION`** (hoje `v18`), senão os jogadores não recebem a atualização.
- `manifest.webmanifest` permite instalar como app (abre deitado).
- Layout pensado para celular deitado; em pé aparece aviso para girar.
- Visual de jogo (último bloco `<style>` do `index.html`): fundo azul de mar, HUD em pílulas com ícones SVG (`HUD_ICO`), botões com contorno escuro, fonte Lilita One. Inspirado em jogos tycoon de celular.
- Balanceamento: `XP_STEP` (curva de nível), `bonusFor` e as constantes de custo no topo do script. O save guarda `xp3` para converter o XP de jogos antigos para a curva atual.
- Tela única: o mapa real (com as quadras) ocupa o centro; o tabuleiro SVG só aparece sem `c.geo`. As colunas Prédio/Missões/Relatório/Registro seguem no HTML (escondidas) como fonte dos painéis abertos pela barra `.tabs.dock` (`openPanel`, `refreshPanel`).
- `staffAlerts()` avisa falta de gente por setor (badge no botão Prédio + toast/registro). `S.salesTech` (both/radio/fiber) filtra o que o Comercial vende. `S.prices` guarda o preço ajustado de planos e combos (`pp`, `cbPrice`).
- Concorrência entre jogadores: `syncRivals` publica/lê a tabela `presenca` (a cada 2 min no máximo, após o save na nuvem e a cada 5 dias de jogo); `rivalPressure` entra em `chance()` e `rivalMonth()` roda no `monthEnd` (perda por troca via `requestCancel(...,'conc')`, ganho por portabilidade via `attemptSale(c,'conc',true)`); painel `openRivals`. A coluna `infra` (jsonb, `myInfra`) leva torres e CTOs, desenhadas em roxo no `drawReal`. Os números são enviados pelo próprio jogo, então um jogador mal-intencionado pode falsificar os dele (as regras do schema só limitam a faixa dos valores).
- O laço do jogo (`loop`) pega erros de `tick()` e mostra na tela (`reportErr`): um erro nunca mais para o relógio. Os painéis da barra não pausam o jogo; os outros modais pausam.
- Não há mais exportar/importar JSON: o progresso fica no aparelho e na nuvem (Supabase).

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
- [ ] Rodar (de novo) o `supabase/schema.sql` no Supabase: agora ele também cria a tabela `presenca` (concorrência).
- [x] Publishable key no `config.js` (feito). Conferir se também está nas Propriedades do script (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- [ ] Publicar a v18 e conferir em **Menu → Testar conexões**.
- [ ] Colar o novo `Code.gs` no Apps Script e publicar uma nova versão da implantação (o link `/exec` não muda).
- [ ] Criar os segredos `QUADRAS_URL` e `QUADRAS_SENHA` no GitHub para ligar o robô.

## Próximas ideias
- Disputa por território: feita (concorrência entre jogadores). Torres e CTOs dos rivais já aparecem no mapa. Próximos passos possíveis: efeito do leque do rival na venda por quadra, interferência de canal entre torres de jogadores diferentes e um ranking por cidade.
