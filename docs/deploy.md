# Deploy Vercel + GitHub

Dashboard e API rodam na Vercel; Python/YOLO roda no local do cliente. Vercel não executa streams RTSP contínuos nem o detector como processo persistente.

1. Repositório GitHub com o monorepo completo.
2. Novo projeto Vercel conectado a esse repositório, branch `main`.
3. Framework **Next.js**, Root Directory **apps/web**. A instalação deve partir da raiz do workspace: `cd ../.. && pnpm install --frozen-lockfile`. Build: `pnpm build` no diretório apps/web (não o script raiz). Node **22.x**.
4. Para a apresentação: `APP_MODE=demo` em Production e Preview. Não adicionar credenciais de câmera ou dados reais. Deploy público contém só dados simulados claramente identificados.
5. Para uma unidade real: crie uma implantação separada, configure variáveis do `.env.example` no ambiente Vercel e PostgreSQL remoto. `DATABASE_URL` deve usar a conexão adequada ao provedor com SSL e pool. Execute schema/provisionamento fora do build; o build não deve criar métricas nem alterar dados.
6. Ative `APP_MODE=production` e verifique login, banco vazio, criação de evento real e cron. Não use dados de teste na unidade real.

O Git integration publica mudanças futuras automaticamente. CI executa testes e build sem segredos. Não configura deploy por token em Actions.

Não habilitamos cron Vercel automaticamente por diferenças de plano. Use agendamento n8n a cada minuto com a credencial dedicada. O estado atual do recurso publicado, IDs e evidências ficam em `docs/delivery.md` quando a publicação tiver sido concluída.

Antes de piloto: limite tentativas de login, configure monitoramento, backup do PostgreSQL, retenção/exclusão de eventos, processo de provisionamento e calibração das zonas. Nenhum contrato ou adequação legal é garantido pelo software; o responsável deve definir o uso e a comunicação do tratamento de dados.
