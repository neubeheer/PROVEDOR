# Templates de e-mail do Supabase

Os e-mails usam o visual do jogo: fundo azul, mapa de Duartina com torres, janela creme e botão verde.

| Arquivo | Onde colar no Supabase | Assunto (Subject) |
|---|---|---|
| `confirmar-conta.html` | Authentication → Emails → Templates → **Confirm signup** | `Confirme sua conta no Provedor Tycoon` |
| `redefinir-senha.html` | Authentication → Emails → Templates → **Reset password** | `Redefinir sua senha do Provedor Tycoon` |

## Como colar
1. Abra o template no Supabase e apague o conteúdo do campo **Message body**.
2. Cole o arquivo inteiro e troque o **Subject** pelo assunto acima.
3. Salve.

## Imagens
- O fundo (`cidade.jpg`) e o ícone (`icons/icon-192.png`) vêm do próprio site do jogo, por `{{ .SiteURL }}`.
- Por isso a **Site URL** em Authentication → URL Configuration precisa ser o endereço do jogo (sem barra no final), e a pasta `templates email` precisa estar publicada no Render.
- Clientes de e-mail que não mostram imagem de fundo (alguns Outlook) ficam com o azul do jogo no lugar.
- O mapa é do OpenStreetMap (a atribuição está no rodapé do e-mail). Para trocar a cidade, gere outra imagem do mesmo tamanho (1200 × 600) e salve como `cidade.jpg`.

## Variáveis do Supabase usadas
`{{ .ConfirmationURL }}` (link do botão), `{{ .Email }}` (e-mail da pessoa) e `{{ .SiteURL }}` (endereço do jogo).
