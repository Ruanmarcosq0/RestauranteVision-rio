# Entrega — 22/10/2026

- Aplicação: https://restaurante-vision-rio.vercel.app/dashboard
- Câmeras/prévia local: https://restaurante-vision-rio.vercel.app/cameras
- GitHub: https://github.com/Ruanmarcosq0/RestauranteVision-rio
- Vercel: https://vercel.com/ruanmarcos931-7603/restaurante-vision-rio
- Workspace Vercel: `team_9VkhlxMNMZ5LheMSuzKx7Yk2`.
- Projeto: `restaurante-vision-rio`, Git integration na branch `main`, Root Directory `apps/web`.
- Ambiente publicado: `APP_MODE=demo`, dados simulados identificados em todas as páginas.
- Primeiro deploy confirmado: `dpl_3cHhEUaPh3Ab1JbkLXeJSChKb7EP`, commit `65d718c6da503999c0c1659b2209e223b0fbcf99`. Ajustes posteriores de documentação e responsividade disparam novos deploys via Git.

## Verificado

- Compilação de produção Next.js 16.4.2 com TypeScript concluída.
- 3 testes TypeScript e 3 testes Python aprovados.
- API e dashboard locais responderam HTTP 200.
- Endereço público abriu e carregou dados pela API.
- Confirmação de atendimento removeu alerta e atualizou mesa.
- Estado da demo preservado ao navegar para outra página.
- Simulação de espera acima de 5 minutos criou alerta visível.
- Editor salvou câmera com polígono de 3 pontos em modo demo.
- Copiloto gerou análise por regras usando os alertas atualizados.
- Layout conferido em desktop e em tela de celular; ajuste aplicado ao mapa para evitar cortar mesas.

## O que ainda precisa de conexão real

Nenhuma câmera ou filmagem foi fornecida. Não foi afirmada análise de câmera real. A página Câmeras permite que o usuário abra a câmera do dispositivo mediante permissão ou um vídeo local; a prévia não executa YOLO. O Edge contém a implementação de detecção/tracking, mas sua inferência depende de vídeo, pesos e hardware e ainda precisa de validação no local.

PostgreSQL/Prisma, autenticação de administrador único e outbox n8n foram implementados para ativação em implantação separada de produção. Não foi provisionado banco gerenciado nem canal de mensagens. A demo é utilizável sem esses serviços. Não há LLM generativo conectado; o agente é analítico por regras e está identificado dessa forma.

## Como apresentar

Abra o dashboard, ative o movimento simulado, mostre mesas e cronômetros, abra Alertas e simule espera, confirme atendimento, exporte um CSV e peça ao agente o panorama do salão. Em Câmeras, mostre como abrir a câmera local e desenhar zonas. Explique que imagens e precisão exigem calibração por estabelecimento.
