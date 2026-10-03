# Provedor Tycoon — contexto do projeto

Jogo de navegador educativo: o jogador monta um provedor de internet do zero (empresa, outorga, torres de rádio, venda porta a porta, equipe, fibra, expansão para outras cidades). Roda em Duartina/SP sobre o mapa real.

## Estrutura e publicação
- Repositório `neubeheer/PROVEDOR`, branch `main`. Publicado no Render como Static Site (sem build, pasta `.`); também funciona no GitHub Pages.
- Quase tudo está em `index.html` (HTML, CSS e JS puro, sem framework).
- `sw.js` guarda os arquivos do jogo (abre mais rápido), mas o jogo exige internet e login. **A cada versão publicada, suba o número em `VERSION`** (hoje `v29`), senão os jogadores não recebem a atualização.
- `manifest.webmanifest` permite instalar como app (abre deitado).
- Tela cheia de jogo (último bloco `<style>`): o mapa ocupa a tela toda e o HUD fica por cima. Topo com recursos (`#stats`), coluna da direita com data, velocidade e link (`#hudTime`) e ferramentas do mapa (`#mapTools`), cartão da cidade à esquerda (`.ov-left`, o botão ℹ `cityInfo` junta as etiquetas em `CITY_CHIPS`), barra de painéis embaixo e botão `.fab-expand`. Tamanhos por `vmin`; funciona em pé (duas linhas no topo) e deitado. O manifest abre em qualquer orientação.
- Visual de jogo (último bloco `<style>` do `index.html`): fundo azul de mar, HUD em pílulas com ícones SVG (`HUD_ICO`), botões com contorno escuro, fonte Lilita One. Inspirado em jogos tycoon de celular.
- Balanceamento: `XP_STEP` (curva de nível), `bonusFor` e as constantes de custo no topo do script. O save guarda `xp3` para converter o XP de jogos antigos para a curva atual.
- Tela única: o mapa real (com as quadras) ocupa o centro; o tabuleiro SVG só aparece sem `c.geo`. As colunas Prédio/Missões/Relatório/Registro seguem no HTML (escondidas) como fonte dos painéis abertos pela barra `.tabs.dock` (`openPanel`, `refreshPanel`).
- `staffAlerts()` avisa falta de gente por setor (badge no botão Prédio + toast/registro). `S.salesTech` (both/radio/fiber) filtra o que o Comercial vende. `S.prices` guarda o preço ajustado de planos e combos (`pp`, `cbPrice`).
- Concorrência entre jogadores: `syncRivals` publica/lê a tabela `presenca` (a cada 2 min no máximo, após o save na nuvem e a cada 5 dias de jogo); `rivalPressure` entra em `chance()` e `rivalMonth()` roda no `monthEnd` (perda por troca via `requestCancel(...,'conc')`, ganho por portabilidade via `attemptSale(c,'conc',true)`); painel `openRivals`. A coluna `infra` (jsonb, `myInfra`) leva torres e CTOs, desenhadas em roxo no `drawReal`. Os números são enviados pelo próprio jogo, então um jogador mal-intencionado pode falsificar os dele (as regras do schema só limitam a faixa dos valores).
- Níveis: concorrência em `RIVAL_LEVEL` (18, `rivalsOn()`), offline e CEO em `OFFLINE_LEVEL` (22). Offline: `checkOffline()` ao abrir e ao voltar para a aba, usa `S.seenAt` (marcado a cada dia de jogo e ao esconder a aba); rende `OFFLINE_RATE` do saldo do último mês por hora até `OFFLINE_CAP`. CEO: `S.ceo={from,until}` em tempo real, `CEO_DIAMONDS` por hora até `CEO_MAX_H`; dobra as horas cobertas, soma R$ 10 mil ao teto por hora e bloqueia a perda para rivais em `rivalMonth`.
- Teto de clientes = habitantes: `q.dom` guarda moradores (`POT_PER_HOME` = 2,8 por domicílio); save antigo convertido uma vez (`pot2`). `netSteps` vai até cobrir `cityHomes(c)`. Regiões de outorga convertem de volta para população.
- Promoções (nível `PROMO_LEVEL` = 100): `S.promo` (oferta de entrada `ENTRY_OFFERS` + `inst`), aplicadas em `chance()` (`promoChance`) e em `activate()` (`applyEntryPromo`, desconto `l.disc` e fidelidade `l.fidUntil`); procura espontânea no fechamento do mês. `S.cpromo` (clube, indica, migra) em `clientCampaignsMonth()`; custo em `promoCost` do relatório.
- Botão fixo **Expandir** no topo do mapa (`data-act="city"`): a missão de expansão some depois de concluída, então ele é o acesso permanente à Expansão e à nova operação.
- Filial de área (`openArea`/`buildArea`/`loadArea`, `c.areas`): numa cidade grande as quadras cobrem só o centro (raio de 2,5 km); tocar fora da área abre a filial (R$ 300 mil × `costMul` + R$ 5 mil/mês, até `AREA_MAX`, exige outorga da cidade inteira). Desenha as quadras pelo Overpass num raio `areaR` em volta do ponto (quadras com `q.ar`, sem repetir as que existem), redistribui os moradores com `blockHomes` e amplia `inArea`. O balcão faz `AREA_SALES` tentativas por mês (`areaSales`). Recarregar o mapa mantém as quadras das áreas.
- Estoque por cidade (`c.eq={r,o}`: rádios e ONUs separados; `takeCpe(c)`, `takeOnu(c)`); o cancelamento guarda `l.cpeK`. Logística por cidade no `monthEnd`: `galpaoOf(c)` (sede, sede regional ou `c.galpao` da filial, que entra em `allFloors`); o galpão da sede atende cidades sem galpão gastando 2 viagens por equipamento. Painel em `logisticsHtml()` (aba Prédio). Save antigo: `S.stock` vai para a cidade da sede.
- Janelas: o cabeçalho (`.mhead`) fica fixo no topo do modal ao rolar. Missões: toda missão liberada com `act` mostra o botão. Torres: `openTowers()` lista todas; o balão da torre no mapa abre `towerInfo`; desmontar move os clientes de rádio para outra torre que cubra a casa (`towerMoves`) ou cancela. Tela cheia: botão `hud-full` (`toggleFull`); no iPhone explica como instalar na tela de início.
- `LINKS` acima de 100 Gigas têm `build` (construção única, `S.linkOwned` guarda a maior rota construída). `CITY_LINKS` ganhou DWDM 100/400 e independente 400 no fim da lista (para não mudar os índices de saves).
- Sedes regionais: `c.hq.floors` (filial convertida por `convertHQ`). `built/team/opsOf/headcount` somam todos os prédios (`allFloors`), exceto dentro de `inB(prédio, fn)` (tela do prédio, `openTeam(id, ci)`, demissões no `monthEnd`), onde valem só os dados daquele prédio. Botões de um prédio regional levam `data-hq`.
- Nova operação: `openIndep`/`indepConfirm`, liberada com `indepReq()` (5 mil × (1 + operações abertas)). A cidade tem `c.indep` e `c.costMul` (5): multiplica estudo, outorga (inclusive regiões e `cityPopulation`/`geoLoad`) e `netSteps`; só aceita o link `CITY_LINKS` com `indep:true` (R$ 10 mi).
- Campanha de meses grátis (Recuperação): `graceHtml`, `GRACE`, uma por mês (`S.graceM`); o cliente ganha `l.disc` 100% e `l.grace` (não atrasa até lá).
- O laço do jogo (`loop`) pega erros de `tick()` e mostra na tela (`reportErr`): um erro nunca mais para o relógio. Os painéis da barra não pausam o jogo; os outros modais pausam.
- Não há mais exportar/importar JSON nem save no navegador.
- Desempenho: `renderAll` só monta as colunas escondidas do painel aberto (`renderPanelSrc`); o mapa real redesenha no máximo a cada 1,5 s (`LDrawAt`). Com ~5 mil clientes, um dia de jogo leva ~10 ms. O relógio não desenha a tela direto: `renderSoon` desenha no máximo a cada 0,8 s, e o mapa redesenha a cada 5 s quando o pedido vem do relógio (`TICKR`) ou 1,5 s quando vem de uma ação. O tamanho do mapa é medido por `ResizeObserver`. Os vendedores calculam as quadras vendáveis uma vez por rodada (`vendorAttempt(V)`), e `RC` lembra a contagem de clientes durante um desenho.

## Mapa e dados
- Leaflet (`vendor/leaflet`) + OpenStreetMap.
- Nominatim (acha a cidade), Overpass (ruas), ViaCEP (bairros pelas ruas), IBGE (municípios, população Censo 2022, bairros oficiais em `data/bairros`, gerados por workflow do GitHub).
- Expansão: só cidades a até `EXPAND_KM` (200 km) de alguma cidade já atendida, em cadeia. As distâncias usam `data/municipios.json` (sede de cada município, fonte: kelvins/municipios-brasileiros).
- Quadras são desenhadas a partir das ruas do OSM; o tabuleiro só aparece depois desse rastreamento. Domicílios da cidade são divididos entre as quadras (pensando em concorrentes futuros).

## Online
- **Supabase**: login e-mail/senha e progresso na tabela `saves`. O progresso fica **só na nuvem** (sem `localStorage` para o save): `start` → `openLogin` → `bootCloud` (carrega a conta; save antigo do navegador sobe uma vez e é apagado). O relógio só anda com `cloud.ref` e internet. Envio por `scheduleCloud` (a cada 30 s, no mínimo 12 s entre envios, e ao esconder a aba), com `saveJson()` sem `fam` (refeito pela semente `f.fk` em `hydrateFams`) e sem `c.near`. Tabelas e regras em `supabase/schema.sql`. A chave publishable é pública por natureza; quem protege os dados são as regras do schema.
- **Google Drive + Apps Script** (`apps-script/Code.gs`): banco de quadras, um JSON por cidade, servido por link aberto do script. Jogador logado grava cidades novas (o script confere o login no Supabase). O robô do GitHub (`scripts/quadras_cache.py`, workflow "Banco de quadras") se identifica com a senha do robô. No modo diário (`--regioes`) ele lê as cidades dos jogadores (`?regioes=1`, arquivo `_regioes.json`, alimentado pelo jogo após o save na nuvem) e desenha as vizinhas até 400 km, das mais perto para as mais longe.
- `config.js`: URL do Supabase, chave pública e link do Apps Script.
- **Nunca** colocar a senha do robô no código; ela fica só nos segredos do GitHub e nas Propriedades do script.

## Pendências de configuração (em 2026-10-02)
- [x] `supabase/schema.sql` rodado: as tabelas `saves` e `presenca` existem (conferido em 2026-10-02).
- [x] Publishable key no `config.js` (feito). Conferir se também está nas Propriedades do script (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- [ ] Publicar a v29 e conferir em **Menu → Testar conexões**.
- [ ] Colar o novo `Code.gs` no Apps Script e publicar uma nova versão da implantação (o link `/exec` não muda). Em 2026-10-02 o link ainda respondia a versão antiga (`?regioes=1` dava erro).
- [ ] Criar os segredos `QUADRAS_URL` e `QUADRAS_SENHA` no GitHub para ligar o robô. Em 2026-10-02 o workflow nunca tinha rodado (0 execuções) e o `quadras_cache.py` nunca foi executado de verdade (sem Python na máquina de desenvolvimento): conferir o log da primeira execução.

## Próximas ideias
- Disputa por território: feita (concorrência entre jogadores). Torres e CTOs dos rivais já aparecem no mapa. Próximos passos possíveis: efeito do leque do rival na venda por quadra, interferência de canal entre torres de jogadores diferentes e um ranking por cidade.
