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
| 4 | Técnico, galpão de Logística e expansão para cidades até 100 km |
| 6 | Retenção, RH e combo internet + TV |
| 8 | Marketing, Recuperação, loja filial e carreata |
| 10 | NOC, servidores de cache e combo com telefone |
| 12 | Fibra óptica (backbone, caixas CTO, Fibra 100 Mega) |
| 14 | OLT 2ª geração (Fibra 300 Mega) |
| 16 | OLT XGS-PON (Fibra 600 Mega) |

Os níveis ímpares dão bônus de caixa. O botão **Ver níveis** mostra a lista completa. Jogos salvos antes desta versão têm o XP ajustado para não perder o que já estava liberado.

## Expansão para outras cidades

A partir do nível 4, **Expandir para outra cidade** lista as cidades de verdade num raio de 100 km de qualquer cidade que você já atende (municípios do OpenStreetMap, população do Censo 2022 do IBGE). Quanto maior a cidade, mais caros o estudo de viabilidade e a outorga. Não dá para digitar uma cidade inventada.

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

## Proteções com selos

Na tela de **Selos** dá para comprar 1 ano (12 meses) de proteção:
- **Desastres naturais** (80 selos): tempestades e descargas elétricas não afetam a rede.
- **Geopolítica e economia** (100 selos): alta do dólar, falta de chips e crise econômica não afetam a empresa.

Comprar de novo com a proteção ativa soma mais 12 meses.

## Mapa real

O jogo abre no **Mapa real** da cidade (OpenStreetMap). O botão **Quadras** mostra o tabuleiro do porta a porta.

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

- O jogo salva sozinho no navegador do aparelho (`localStorage`). Fechar a aba ou ficar sem internet não perde nada.
- Em **Menu → Exportar JSON** você baixa um arquivo com todo o progresso. Em **Importar JSON** você carrega esse arquivo em outro aparelho ou navegador.
- Limpar os dados do navegador apaga o progresso. Exporte o JSON antes, se quiser guardar uma cópia.

## Jogar sem internet e instalar como app

Depois da primeira visita com internet, o jogo fica guardado no aparelho e abre mesmo offline.

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
| `scripts/ibge_bairros.py` | Converte a malha de bairros do IBGE para o jogo |
| `.github/workflows/` | Botão no GitHub que roda o script |
| `vendor/leaflet/` | Biblioteca do mapa (Leaflet 1.9.4, licença BSD-2) |
| `.nojekyll` | Faz o GitHub Pages publicar os arquivos como estão |

## Créditos

- Mapas e dados de bairros: © colaboradores do [OpenStreetMap](https://www.openstreetmap.org/copyright), via Nominatim e Overpass.
- Bairros, moradores e domicílios: IBGE, Censo Demográfico 2022.
- Bairros por CEP: [ViaCEP](https://viacep.com.br/).
- Mapa interativo: [Leaflet](https://leafletjs.com).
