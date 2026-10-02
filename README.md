# Provedor Tycoon

Jogo de navegador em que você monta um provedor de internet do zero: abre a empresa, compra a outorga da cidade, sobe torres de rádio, vende de porta em porta, configura os equipamentos, cuida da equipe e, mais tarde, leva fibra óptica para os bairros e expande para outras cidades.

Funciona no computador e no celular, salva o progresso no próprio aparelho e continua funcionando sem internet depois da primeira visita.

## Como jogar

1. Dê um nome ao provedor e informe sua cidade.
2. Escolha o bairro da sede. O térreo, com a recepção, é grátis.
3. Compre a outorga da cidade. Sem ela, todo o resto fica bloqueado.
4. Faça a documentação (contrato social, CNPJ e alvará).
5. Suba uma torre num terreno vazio e configure o rádio.
6. Toque nas casas com sinal e ofereça um plano.
7. Monte os setores do prédio, contrate a equipe e acompanhe o relatório do mês.

O botão **Ver níveis** mostra o que cada nível libera e quanto de bônus ele dá.

## Mapa real

O jogo abre no **Mapa real** da cidade (OpenStreetMap). O botão **Quadras** mostra o tabuleiro do porta a porta.

- **Cidade:** no começo, **Usar minha localização** pega a cidade pelo GPS. O jogo busca a cidade, identifica os bairros e estima os domicílios pela população.
- **Sede:** toque no ponto exato do prédio no mapa. O jogo descobre o bairro sozinho e declara a sede ali.
- **Consultar um lugar:** toque em qualquer ponto para ver o bairro, a rua e o preço do m² do terreno (mais caro perto do centro).
- **Torre:** toque em **Torre aqui** ou **+ Nova torre** e escolha:
  - o terreno: 150 m² (torre de 18 m), 300 m² (30 m) ou 600 m² (45 m); terreno maior permite torre mais alta e mais alcance;
  - a antena setorial: 60°, 90° ou 120°;
  - a direção da antena, arrastando a bolinha laranja ou usando **Melhor direção**.
- **Cobertura:** o leque mostra quantos domicílios a torre alcança e quantos ainda estão sem sinal, além das construções mapeadas no OpenStreetMap dentro do leque.
- O custo é o terreno (m² × preço) mais torre e rádio. Depois vem a configuração do rádio, como sempre.
- As casas com sinal no mapa são as mesmas das quadras, onde você faz o porta a porta.

O mapa real precisa de internet. Sem conexão, o jogo continua normalmente nas quadras.

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
| `vendor/leaflet/` | Biblioteca do mapa (Leaflet 1.9.4, licença BSD-2) |
| `.nojekyll` | Faz o GitHub Pages publicar os arquivos como estão |

## Créditos

- Mapas e dados de bairros: © colaboradores do [OpenStreetMap](https://www.openstreetmap.org/copyright), via Nominatim e Overpass.
- Mapa interativo: [Leaflet](https://leafletjs.com).
