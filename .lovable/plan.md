## Diagnóstico (importante ler antes)

O service worker **já está totalmente configurado** neste projeto — não falta nada para ser gerado:

- `vite-plugin-pwa` está instalado e configurado em `vite.config.ts` com `filename: "sw.js"`, `registerType: "autoUpdate"`, estratégia `NetworkFirst` para navegação, `CacheFirst` para assets, e `NetworkOnly` para a API do Render.
- O manifest está correto (`name`, `start_url`, `display: standalone`, ícones 192/512/maskable).
- O registro do SW é feito por `src/lib/pwa.ts` (`registerServiceWorker()`), chamado em `src/routes/__root.tsx`.

**Por que o DevTools mostra "nenhum service worker" agora:** você está testando na URL do preview do Lovable (`id-preview--…lovable.app`). O wrapper `src/lib/pwa.ts` — seguindo a regra obrigatória da plataforma — **bloqueia o registro do SW em host de preview, iframe e dev**, e ainda desregistra qualquer SW antigo nesses contextos. Isso é intencional: um SW no preview servia HTML antigo depois de edições e travava o preview em telas brancas.

O SW só é registrado na URL **publicada** (`*.lovable.app` de produção ou domínio custom). Portanto o app **já é instalável** — só não no preview.

Não vou criar um `public/sw.js` manual: isso conflita com o `sw.js` gerado pelo `vite-plugin-pwa` (mesmo path) e a skill de PWA proíbe SW hand-written em cima do plugin. A configuração atual já faz exatamente o que você pediu (cache de assets + navegação network-first).

## Como validar que está ativado

1. Publicar o app (botão Publish) ou abrir a URL publicada existente.
2. Abrir a URL publicada em aba anônima → DevTools → Application → Service Workers.
3. Deve aparecer `sw.js` com status **"activated and is running"** e o ícone de "Install app" na barra do Chrome.

Se mesmo na URL publicada não aparecer, aí sim tem bug — me avise e eu investigo (provavelmente cache do navegador antigo; `?sw=off` limpa).

## Trocar o logo pelo `Olympus_Protocol_logo.png` enviado

O arquivo é quadrado, preto com o templo/louros dourados — perfeito para app icon. Ele substitui **os PNGs do PWA e o favicon**, todos gerados a partir do mesmo master.

Passos (modo build):

1. Copiar `user-uploads://Olympus_Protocol_logo.png` para `/tmp/logo-master.png`.
2. Gerar via `sharp`/ImageMagick (ou script Python com PIL) as versões:
   - `public/icon-192.png` (192×192, `purpose: any`) — sobrescreve.
   - `public/icon-512.png` (512×512, `purpose: any`) — sobrescreve.
   - `public/icon-512-maskable.png` (512×512, com safe-zone: logo reduzido a ~80% centralizado sobre fundo preto para o recorte maskable não cortar as colunas/louros) — sobrescreve.
   - `public/apple-touch-icon.png` (180×180) — sobrescreve.
   - `public/favicon.png` (32×32 nítido) — sobrescreve.
3. Remover o `public/favicon.ico` legado (`rm public/favicon.ico`) para o navegador parar de servir o ícone padrão da Lovable a crawlers que ignoram o `<link>`.
4. Confirmar em `src/routes/__root.tsx` que o `head().links` já referencia `/favicon.png` e `/apple-touch-icon.png` (ajustar se estiver apontando para `.ico`).
5. Nenhuma mudança no `vite.config.ts` é necessária — `includeAssets` já lista esses arquivos.

Depois de publicar, o ícone novo aparece:
- na aba do navegador (favicon),
- no prompt "Add to Home Screen" (icon-192/512),
- na home screen do celular (maskable).

## O que **não** vou fazer

- Criar `public/sw.js` manual (conflita com o gerado pelo plugin).
- Remover as guardas de preview em `src/lib/pwa.ts` (regra de plataforma — quebra o preview).
- Mexer em qualquer código de treinos/sessão/UI.

## Precisa de algo a mais de você?

Não. A imagem enviada basta. Confirme que posso prosseguir e eu:
1. gero todos os ícones a partir do PNG enviado,
2. removo o `favicon.ico` antigo,
3. deixo pronto para publicar. Aí você abre a URL publicada e o SW aparece "activated and running".
