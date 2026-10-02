# Provedor Tycoon

Jogo de navegador em que você monta um provedor de internet do zero: abre a empresa, compra a outorga da cidade, sobe torres de rádio, vende de porta em porta, configura os equipamentos, cuida da equipe e, mais tarde, leva fibra óptica para os bairros e expande para outras cidades.

Funciona no computador e no celular, salva o progresso no próprio aparelho e continua funcionando sem internet depois da primeira visita.

## Como jogar

1. Dê um nome ao provedor e informe sua cidade. Ela precisa existir: o jogo confere na lista de municípios do IBGE (com sugestões se o nome vier errado) e por isso o primeiro acesso precisa de internet.
2. Siga o **tutorial**, que aparece em cima do mapa:
   1. Declarar a sede (o térreo, com a recepção, é grátis).
   2. Abrir a empresa: contrato social e CNPJ.
   3. Pedir a outorga da cidade na Anatel.
   4. Fazer o licenciamento: alvará da prefeitura.
   5. Subir e configurar a primeira torre.
   6. Conseguir o primeiro cliente.
3. Depois do tutorial, andares e setores são liberados **a cada 2 níveis**:

| Nível | Libera |
|---|---|
| 2 | Call Center e Comercial (1º e 2º andar) |
| 4 | Técnico, galpão de Logística e expansão para cidades até 200 km |
| 6 | Retenção, RH e combo internet + TV |
| 8 | Marketing, Recuperação, loja filial e carreata |
| 10 | NOC, servidores de cache e combo com telefone |
| 12 | Fibra óptica (backbone, caixas CTO, Fibra 100 Mega) |
| 14 | OLT 2ª geração (Fibra 300 Mega) |
| 16 | OLT XGS-PON (Fibra 600 Mega) |
| 18 | Concorrência entre jogadores |
| 22 | Empresa rende offline e CEO com diamantes |
| 100 | Promoções de contratação (Comercial) e campanhas para clientes (Marketing) |

Os níveis ímpares dão bônus de caixa (R$ 600 por nível, até R$ 15 mil). O botão **Ver níveis** mostra a lista completa.

**Ritmo:** o nível N começa em 100 × N × (N − 1) XP (`XP_STEP` no código). Cada nível leva o dobro do tempo das versões antigas, e torres, andares, contratações, campanhas, fibra, interligações e expansão custam cerca de 50% a mais. A ideia é obrigar o jogador a planejar o caixa antes de crescer. Jogos salvos antes disso continuam no mesmo nível e com o mesmo progresso dentro dele.

## Expansão para outras cidades

A partir do nível 4, **Expandir para outra cidade** lista as cidades de verdade num raio de 200 km de qualquer cidade que você já atende (sedes dos municípios em `data/municipios.json`, população do Censo 2022 do IBGE). A expansão anda em cadeia: cada cidade nova abre mais 200 km a partir dela. Quem começa em Duartina não pega São Paulo (310 km) nem Belo Horizonte de cara; precisa chegar antes a uma cidade a até 200 km delas. Quanto maior a cidade, mais caros o estudo de viabilidade e a outorga. Não dá para digitar uma cidade inventada.

## Rede, link e tráfego

- **Capacidade da rede:** cada cidade começa com um bloco /24 (cerca de 240 assinantes). Toque no chip **Rede** do mapa para comprar as caixas de expansão: cada uma traz um bloco de IP maior (/23, /22, /21…), com nova máscara, até a última caixa, que cobre a cidade inteira e custa por volta de R$ 1 milhão numa cidade do tamanho de Duartina. Com a rede cheia, ninguém novo assina.
- **Rádio e fibra:** o mapa e o topo mostram quantos clientes estão em cada tecnologia.
- **Link de internet:** o botão **Link** no topo mostra o tráfego no horário de pico, o consumo por serviço e o histórico. O link é contratado por mês, de 200 Mega a 100 Gigas. O consumo cresce com o tempo; com o link estourado, a internet fica lenta, a reputação cai e mais clientes cancelam. Servidores de cache no NOC tiram parte do tráfego.

## Migração e Upgrade

Setor liberado no nível 12. Os operadores ligam para a base no fechamento do mês:
- **Migração de tecnologia:** clientes de rádio em bairros com fibra passam para a fibra, mantendo o mesmo preço do rádio ou cobrando o plano de fibra.
- **Upgrade:** oferta do próximo plano (ou do próximo plano com 3 meses pela metade da diferença). O cliente aceita ou recusa, e o ticket médio sobe.

## Expansão

A 1ª e a 2ª expansão só pedem o nível 4. A **3ª expansão exige 1.000 assinantes**, e cada expansão seguinte pede mais 1.000.

## Metas e plano de carreira

- **Metas (a partir de 5.000 assinantes):** vendas, instalação, atendimento, retenção, cobrança, marketing (CAC) e ticket médio. Cada meta pode ser conservadora, moderada ou agressiva. Bateu: PLR para a equipe e mais rendimento no mês seguinte. Errou uma meta moderada ou agressiva: o setor rende menos no mês seguinte.
- **Plano de carreira (RH):** implantado uma vez no RH; depois cada setor promove operadores a pleno e sênior. Promovidos ganham mais, rendem mais e pedem menos demissão.

## Celular deitado

O jogo foi pensado para o celular na horizontal: mapa grande à esquerda, prédio ou missões à direita e os botões Prédio, Mapa e Missões numa barra lateral. Em pé, aparece um aviso para girar o celular (dá para continuar em pé). Instalado como app, ele abre deitado; no Android, **Menu → Tela cheia** esconde a barra do navegador.

Tocar na **sede** (no Mapa real ou no tabuleiro) abre o prédio com todos os andares.

## Diamantes e selos

- **Diamantes:** todo jogo começa com 50. Você ganha 5 a cada nível e 1 a cada missão. Troque por selos (1 = 10 selos) ou por dinheiro (1 = R$ 500).
- **Selos:** viram dinheiro na hora ou **automaticamente** todo fechamento de mês (com uma reserva que você escolhe). Também pagam a **configuração automática** dos rádios: 3 selos na torre e 2 na casa do cliente.

## Eventos e Ouvidoria

- Crises e eventos (tempestades, raios, dólar, falta de chips, crise econômica) só começam a partir do **nível 9**.
- **Ouvidoria (nível 11):** recebe as reclamações do mês e mostra o que melhorar (atendimento, link, sinal, instalação, preço, cobrança, cache), com atalho para resolver. Reclamação sem resposta pode virar multa da Anatel.

## Cidades grandes

Em cidades com mais de 50 mil habitantes, a outorga pode ser comprada **por região de cerca de 20 mil habitantes** (ou para a cidade inteira, descontando o que já foi pago). Só as quadras das regiões licenciadas vendem; as outras aparecem apagadas no tabuleiro.

Toda cidade da expansão precisa de uma **interligação** (o backbone até a cidade): começa com um enlace de rádio de 300 Mega e pode subir até 40 Gigas. Ela aparece no chip **Rede** do mapa; estourada, deixa os clientes daquela cidade lentos.

## Conta e salvamento online (Supabase)

Sem configurar nada, o jogo salva só no aparelho. Para ter **tela de login e progresso online**:

1. Crie um projeto grátis em [supabase.com](https://supabase.com).
2. No projeto, abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. Em **Authentication → Providers**, deixe **Email** ligado. (Para testar sem confirmar e-mail, desligue *Confirm email*.)
4. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public** para o arquivo `config.js`.

O progresso fica sempre no aparelho (funciona offline) e, com conta, também no Supabase. Ao entrar em outro aparelho, vale o progresso mais recente.

## Concorrência entre jogadores

A partir do **nível 18**, jogadores logados que atendem a mesma cidade disputam os mesmos domicílios:
- Junto com o salvamento na nuvem, cada jogador publica um resumo por cidade na tabela `presenca` do Supabase: assinantes, ticket médio, rádio e fibra, reputação, atendimento (capacidade do Call Center) e campanhas de marketing.
- Os clientes dão uma nota para cada empresa (reputação 35%, atendimento 25%, fibra 20%, campanhas e preço). Onde o rival já tem clientes, vender fica mais difícil.
- No fechamento do mês, com nota menor que a do rival, parte dos seus clientes pede para trocar (a Retenção pode segurar). Com nota maior, clientes dele vêm para você por portabilidade.
- O chip **Concorrentes** no mapa abre a comparação, com dicas do que melhorar. Só entram rivais que salvaram nos últimos 30 dias.
- No mapa real, as torres dos rivais aparecem em roxo com o leque tracejado, e as caixas CTO deles como pontos roxos. Tocar mostra de quem é.

Para ligar, rode de novo o `supabase/schema.sql` no SQL Editor (ele cria a tabela `presenca` e não apaga nada). **Menu → Testar conexões** mostra se as tabelas `saves` e `presenca` respondem.

## Teto de clientes e promoções

- O teto de clientes de uma cidade é o número de **habitantes**: cada quadra guarda os moradores (domicílios × 2,8). Duartina, com 12.328 habitantes, aceita até cerca de 12,3 mil assinantes.
- A rede cresce junto: as caixas de expansão vão do /24 até o bloco que cobre a cidade inteira (em Duartina, a 7ª caixa, /18, por cerca de R$ 1,7 milhão).
- O topo do mapa mostra habitantes, clientes (e a % da cidade) e a rede da cidade aberta.
- **Nível 100, Comercial → Equipe → Promoção na contratação:** sem oferta, 1ª mensalidade grátis, 6 meses com 30% off, fidelidade de 12 meses com 15% off (fidelizado cancela menos) ou um plano em oferta com 20% off por 3 meses, mais instalação grátis (R$ 150 por cliente). A promoção aumenta a chance de fechar e, no fechamento do mês, traz procura espontânea: moradores com sinal ligam para assinar.
- **Nível 100, Marketing → Campanhas para clientes:** clube de vantagens (menos cancelamentos, R$ 1,50 por cliente/mês), indique um amigo (cerca de 1% dos clientes trazem alguém por mês) e migração premiada (1 mês grátis para quem vai para a fibra).
- Os custos aparecem no relatório do mês como **Promoções**.

## Nova operação (rede independente)

- O botão **🌎 Expandir** fica fixo no topo do mapa (a partir do nível 4). Com **5.000 assinantes**, ele mostra **nova operação** e, dentro da Expansão, aparece o botão **Nova operação**. Ele abre uma rede independente em **qualquer município do Brasil**, sem o limite de 200 km.
- A cidade não se liga à sua rede por enlace: precisa de um **backbone independente de R$ 10 milhões** (+ R$ 25 mil/mês). Estudo de viabilidade, outorga e caixas de rede custam **5 vezes** o normal.
- Cada nova operação seguinte exige mais 5.000 assinantes (10 mil para a segunda, 15 mil para a terceira…).

## Sede regional

Uma **loja filial** (fora da cidade da sede) pode virar **sede regional** por R$ 2 milhões (+ R$ 10 mil/mês): no painel **Prédio** (seção Filiais) ou tocando na loja no mapa. Ela ganha um prédio próprio, com andares e equipes próprios. As equipes de todos os prédios somam na capacidade da empresa (Call Center, vendedores, cobradores…), e cada prédio tem as próprias vagas por setor, então dá para contratar muito mais gente. No painel Prédio, as abas trocam entre a sede principal e cada sede regional.

## Link de internet acima de 100 Gigas

Depois do link de 100 Gigas vêm novas **rotas de saída**, cada uma com uma construção única e o bloco de IP público correspondente: 200 Gigas (2ª rota, R$ 100 milhões), 400 Gigas (3ª rota e ASN próprio, R$ 200 milhões), 800 Gigas (rota internacional, R$ 400 milhões) e 1,6 Tera (ponto de troca de tráfego, R$ 800 milhões). Depois de construída, a rota fica sua: dá para trocar de link sem pagar de novo. As interligações entre cidades também ganham o Backbone DWDM de 100 Gigas (R$ 5 milhões) e de 400 Gigas (R$ 20 milhões).

## Campanha de meses grátis (Recuperação)

Na equipe da **Recuperação**, uma vez por mês, dá para lançar uma campanha para os inadimplentes: 1, 2 ou 3 meses grátis (cerca de 45%, 60% e 75% aceitam). Quem aceita tem a dívida perdoada, volta a ser assinante, não atrasa durante a carência e depois paga a mensalidade normal.

## Empresa offline e CEO (nível 22)

- Enquanto você está fora (pelo menos 10 minutos), a empresa rende **10% do saldo do último mês fechado por hora**, até **R$ 10 mil**. Ao voltar, aparece o quanto entrou no caixa.
- Na tela de **Diamantes** dá para contratar um **CEO**: 20 diamantes por hora, até 8 horas seguidas. Enquanto ele está no cargo, as horas fora rendem em dobro, cada hora soma R$ 10 mil ao teto e a concorrência não leva seus clientes (vale também com o jogo aberto).
- O selo **CEO** aparece ao lado do nível no topo enquanto ele está no cargo.

## Banco de quadras no Google Drive

As quadras de cada cidade ficam como arquivos JSON numa pasta do seu Google Drive. Um Apps Script publica um link aberto que entrega as quadras para o jogo, então o tabuleiro abre na hora, sem esperar o OpenStreetMap. A pasta continua privada: só o script lê e grava nela.

**Instalar (uma vez):**
1. Abra [script.google.com](https://script.google.com) com a conta Google que vai guardar as quadras e clique em **Novo projeto**. Dê o nome *Provedor Tycoon - quadras*.
2. Apague o que vier no editor e cole todo o conteúdo de `apps-script/Code.gs`. Salve.
3. Na engrenagem **Configurações do projeto**, em **Propriedades do script**, adicione:
   - `SUPABASE_URL`: a mesma Project URL do `config.js`;
   - `SUPABASE_ANON_KEY`: a mesma chave anon do `config.js`.
4. Volte ao editor, escolha a função **configurar** e clique em **Executar**. Autorize o acesso ao Drive quando o Google pedir. No registro aparecem a pasta criada e a **SENHA_DO_ROBO**.
5. Clique em **Implantar → Nova implantação**, tipo **App da Web**: *Executar como*: **eu**; *Quem pode acessar*: **Qualquer pessoa**. Copie o link que termina em `/exec`.
6. Cole esse link em `quadrasUrl` no `config.js`.

**Como funciona:**
- O jogo pede as quadras da cidade ao link. Se a cidade já está no Drive, o tabuleiro abre na hora; se não, desenha pelo OpenStreetMap e manda o resultado para o script.
- Só grava quem está logado: o script confere o login no Supabase antes de salvar, recusa arquivo malformado ou grande demais e não deixa jogador sobrescrever uma cidade que já existe.
- Cada jogador busca uma cidade uma vez só; depois as quadras ficam no progresso dele.
- Quando o progresso de um jogador logado vai para a nuvem, o jogo avisa o script das cidades que ele atende (arquivo `_regioes.json` na pasta). O robô usa essa lista para desenhar primeiro as cidades vizinhas.

Depois de mudar o `Code.gs`, publique de novo em **Implantar → Gerenciar implantações → editar → Versão: Nova versão**. Assim o link `/exec` continua o mesmo.

**A senha do robô:** o robô do GitHub não é um jogador e não tem login no Supabase. Para o script saber que é ele, os dois compartilham uma senha: a `SENHA_DO_ROBO`, gerada pela função **configurar** e guardada nas Propriedades do script. O robô manda essa senha junto com as quadras; com ela, o script aceita gravar e também atualizar cidades. Ela nunca vai para o `config.js` nem para o jogo, só para os segredos do GitHub. Se vazar, rode **trocarSenhaDoRobo** no Apps Script e atualize o segredo no GitHub.

### Pré-carregar as quadras do Brasil

O workflow **Banco de quadras (Google Drive)** desenha as quadras de cada município e grava no Drive:
1. No GitHub: *Settings → Secrets and variables → Actions → New repository secret*. Crie:
   - `QUADRAS_URL`: o link `/exec` do Apps Script;
   - `QUADRAS_SENHA`: a `SENHA_DO_ROBO` que apareceu no registro do Apps Script.
2. Ele roda sozinho todo dia no modo **regioes**: lê as cidades dos jogadores e desenha até 150 cidades vizinhas que ainda não estão no Drive, das mais perto para as mais longe. Primeiro vêm as que estão a até 200 km (a próxima expansão do jogador), depois as que estão a até 400 km (a expansão seguinte).
3. Em **Actions → Banco de quadras (Google Drive) → Run workflow** dá para rodar na hora: deixe `regioes` ou escolha um estado (ex.: `SP`) ou `BR`, e o limite de cidades.

O Brasil inteiro tem 5.570 municípios e deve ocupar perto de 1 GB no Drive (a conta grátis tem 15 GB, divididos com Gmail e Fotos). O robô respeita os limites do OpenStreetMap, então completar o país leva algumas semanas de rodadas diárias; rode por estado para adiantar os que você mais usa.

## Proteções com selos

Na tela de **Selos** dá para comprar 1 ano (12 meses) de proteção:
- **Desastres naturais** (80 selos): tempestades e descargas elétricas não afetam a rede.
- **Geopolítica e economia** (100 selos): alta do dólar, falta de chips e crise econômica não afetam a empresa.

Comprar de novo com a proteção ativa soma mais 12 meses.

## Mapa real

O jogo abre no **Mapa real** da cidade (OpenStreetMap), com as quadras desenhadas em cima dele: toque numa quadra para bater nas portas e ver os clientes. Aproximando o mapa (zoom 15 ou mais), cada quadra mostra quantos assinantes tem: o selo fica laranja quando há cliente na fibra. O tabuleiro antigo só aparece enquanto a cidade ainda não tem mapa.

A barra de botões abre os painéis: **Prédio** (andares e equipes, com aviso quando falta gente num setor), **Planos** (preço de cada plano e combo), **Missões** (e metas do mês), **Relatório** e **Registro**. No **Comercial** você escolhe se os vendedores oferecem rádio, fibra ou os dois.

- **Cidade:** no começo, **Usar minha localização** pega a cidade pelo GPS.
- **Bairros:** o jogo procura em três fontes, nesta ordem:
  1. **IBGE (Censo 2022):** contorno oficial de cada bairro, com moradores e domicílios de verdade. Precisa gerar os arquivos uma vez (veja "Bairros do IBGE" abaixo).
  2. **CEPs dos Correios (ViaCEP):** pega as ruas da cidade no OpenStreetMap e pergunta o bairro de cada rua. Funciona em cidades com CEP por rua; cidades com CEP único não têm essa informação.
  3. **OpenStreetMap:** bairros cadastrados no mapa e, onde não houver, o nome do lugar em cada região.
- **Sede:** toque no ponto exato do prédio no mapa. O jogo descobre o bairro sozinho e declara a sede ali.
- **Consultar um lugar:** toque em qualquer ponto para ver o bairro, a rua e o preço do m² do terreno (mais caro perto do centro).
- **Torre:** toque em **Torre aqui** ou **+ Nova torre** e escolha:
  - o terreno: 150 m² (torre de 18 m), 300 m² (30 m) ou 600 m² (45 m); terreno maior permite torre mais alta e mais alcance;
  - a antena setorial: 60°, 90° ou 120°;
  - a direção da antena, arrastando a bolinha laranja ou usando **Melhor direção**.
- **Cobertura:** o leque mostra quantos domicílios a torre alcança e quantos ainda estão sem sinal, além das construções mapeadas no OpenStreetMap dentro do leque.
- O custo é o terreno (m² × preço) mais torre e rádio. Depois vem a configuração do rádio, como sempre.
- **Quadras reais:** o jogo baixa as ruas da cidade no OpenStreetMap e desenha cada quarteirão fechado por ruas como uma quadra. O tabuleiro **Quadras** mostra esses mesmos quarteirões, então o leque da torre cobre no tabuleiro exatamente as quadras que cobre no mapa.
  - Os domicílios da cidade são divididos entre as quadras pelo tamanho de cada uma (com o IBGE, pelos domicílios de cada bairro).
  - No tabuleiro: arraste para mover, use **+** e **−** para aproximar e **⤢** para ver a cidade toda. Toque numa quadra para bater nas portas.
  - Cada quadra mostra quantos já são seus clientes e fica mais escura conforme a sua participação. Isso prepara o jogo para dividir o mercado com outras provedoras no futuro.
  - Jogos salvos antes desta versão ganham as quadras reais sozinhos na próxima vez que abrirem com internet; clientes e pendências passam para a quadra real mais próxima, dentro do sinal da mesma torre.
  - O tabuleiro só aparece depois do rastreamento das ruas. Enquanto isso, ele mostra o andamento e tenta de novo sozinho (4 servidores do OpenStreetMap, com novas tentativas a cada poucos segundos); a sede e as torres podem ser escolhidas no Mapa real, e as vendas esperam as quadras.
  - Só numa cidade que realmente não tem ruas no OpenStreetMap o jogo usa o tabuleiro simples de 9 × 9.

O mapa real precisa de internet. Sem conexão, o jogo continua normalmente no tabuleiro de quadras já baixado.

## Bairros do IBGE

Os arquivos ficam em `data/bairros/` e são gerados a partir da [malha de bairros do Censo 2022 do IBGE](https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/malha_com_atributos/bairros/shp/BR/).

**Pelo GitHub (recomendado):**
1. No repositório, abra a aba **Actions** e escolha **Bairros do IBGE**.
2. Clique em **Run workflow**, digite o estado (por exemplo `SP`) ou `BR` para o Brasil inteiro e confirme.
3. Em poucos minutos o GitHub grava os arquivos no repositório, e o Render publica sozinho.

Se o botão de rodar não aparecer, vá em *Settings → Actions → General* e permita os workflows; em *Workflow permissions*, marque *Read and write permissions*.

**No seu computador (precisa de Python 3):**
```bash
python3 scripts/ibge_bairros.py --uf SP
```

O IBGE só tem bairros onde a prefeitura definiu bairros oficialmente. Nas cidades sem bairros no IBGE, o jogo usa os CEPs e o OpenStreetMap.

## Onde o progresso fica salvo

- O progresso fica **só na conta** (Supabase): para jogar, é preciso entrar e estar com internet. Sem conexão, o jogo pausa e mostra um aviso até a internet voltar.
- O jogo envia o progresso a cada 30 segundos, poucos segundos depois de uma ação importante e ao sair da aba.
- Um progresso antigo que estava salvo no navegador é enviado para a conta na primeira vez (se for mais novo) e depois apagado do navegador.
- Para o envio ser leve, o save guarda só a semente de cada família (o nome e o perfil são refeitos ao carregar) e não guarda a lista de cidades vizinhas.

## Instalar como app

O jogo pode ser instalado como app (abre mais rápido), mas precisa de internet para jogar.

- **Android (Chrome):** menu ⋮ → *Instalar app* ou *Adicionar à tela inicial*. O botão **Instalar** também aparece no menu do jogo.
- **iPhone (Safari):** botão Compartilhar → *Adicionar à Tela de Início*.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (por exemplo, `provedor-tycoon`). No plano gratuito, ele precisa ser **público** para usar o GitHub Pages.
2. Envie os arquivos desta pasta para o repositório:
   - Pelo site: *Add file → Upload files*, arraste todos os arquivos e a pasta `icons`, e clique em *Commit changes*.
   - Pelo terminal:
     ```bash
     git remote add origin https://github.com/SEU-USUARIO/provedor-tycoon.git
     git branch -M main
     git push -u origin main
     ```
3. No repositório: *Settings → Pages → Build and deployment → Source: Deploy from a branch*, escolha `main` e a pasta `/ (root)`, e salve.
4. Em um ou dois minutos o jogo fica disponível em `https://SEU-USUARIO.github.io/provedor-tycoon/`.

## Publicar uma versão nova

1. Altere os arquivos e envie para o GitHub.
2. Abra `sw.js` e aumente o número em `const VERSION = 'v1';` (por exemplo, para `'v2'`).
3. Quem já tem o jogo aberto vê a mensagem **Nova versão do jogo disponível** e toca em **Atualizar**. O progresso salvo continua.

## Testar no computador

O modo offline precisa de um servidor; abrir o `index.html` direto funciona, mas sem o modo offline.

```bash
python3 -m http.server 8080
```

Depois, abra `http://localhost:8080`.

O GPS só funciona em `https://` ou em `localhost`.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O jogo inteiro (visual, regras e telas) |
| `sw.js` | Guarda o jogo no aparelho para abrir sem internet |
| `manifest.webmanifest` | Nome, cores e ícones para instalar como app |
| `icons/` | Ícones do app |
| `data/bairros/` | Bairros oficiais do IBGE por cidade (gerados pelo script) |
| `data/municipios.json` | Sede de cada município do Brasil (código IBGE, nome, lat, lon), para o raio da expansão e o robô |
| `scripts/ibge_bairros.py` | Converte a malha de bairros do IBGE para o jogo |
| `.github/workflows/` | Botão no GitHub que roda o script |
| `config.js` | Supabase (login e progresso) e link do banco de quadras (opcional) |
| `apps-script/Code.gs` | Apps Script do banco de quadras no Google Drive |
| `supabase/schema.sql` | Tabela de progresso e regras de acesso do Supabase |
| `scripts/quadras_cache.py` | Robô que desenha as quadras das cidades e grava no Drive |
| `vendor/leaflet/` | Biblioteca do mapa (Leaflet 1.9.4, licença BSD-2) |
| `.nojekyll` | Faz o GitHub Pages publicar os arquivos como estão |

## Créditos

- Mapas e dados de bairros: © colaboradores do [OpenStreetMap](https://www.openstreetmap.org/copyright), via Nominatim e Overpass.
- Bairros, moradores e domicílios: IBGE, Censo Demográfico 2022.
- Bairros por CEP: [ViaCEP](https://viacep.com.br/).
- Mapa interativo: [Leaflet](https://leafletjs.com).
