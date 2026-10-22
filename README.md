# Restaurant Vision AI

MVP de inteligência operacional para restaurantes e sorveterias. Dashboard Next.js/TypeScript, API autenticada, PostgreSQL/Prisma e módulo Edge Python com OpenCV/Ultralytics e ByteTrack ou BoT-SORT.

## Apresentação em 3 minutos

1. Abra `/dashboard`. A faixa **DEMO — DADOS SIMULADOS** identifica todo o cenário.
2. Selecione uma mesa: confirme atendimento, registre saída e conclua limpeza.
3. Em **Alertas**, use **Simular espera de 5 min** e confirme o atendimento. O alerta desaparece.
4. Use **Simular movimento** para gerar eventos a cada 6,5 segundos; pause antes de explicar os números.
5. Em **Câmeras**, cadastre uma câmera, desenhe um polígono e exporte suas zonas.
6. Veja **Analytics**, exporte o CSV em **Relatórios** e consulte o **Agente IA**.

O agente deste MVP é um **motor analítico por regras**, identificado na tela. Não há LLM conectado nem previsão de receita. As prévias das câmeras são ilustrações, não filmagens reais. A demo não envia notificações externas e suas mudanças são temporárias.

## Rodar a demo

Requisitos: Node 22+, pnpm 11.25.0, Python 3.11+ (Edge). Docker é opcional.

```sh
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm --filter @vision/web dev
```

Abra `http://127.0.0.1:3000`. Sem `APP_MODE=production`, o sistema usa a demo pública e não depende de banco. Para testar a compilação:

```sh
pnpm --filter @vision/web test
pnpm --filter @vision/web build
pnpm --filter @vision/web start
cd edge
python -m unittest discover -s tests -v
python -m vision.simulator
```

## Estrutura

```text
apps/web/app          páginas e API Next.js
apps/web/components   interface responsiva
apps/web/lib          estados, autenticação, banco, validação e outbox
apps/web/prisma       schema PostgreSQL
apps/web/scripts      provisionamento sem métricas simuladas
edge/vision           captura, tracking, zonas, estados e transporte
edge/tests            testes do domínio independente de vídeo
automations           workflow n8n importável
docs                  arquitetura, implantação, contratos e validação
```

## Produção com dados reais

Este MVP isola **uma unidade por implantação**. Não oferece cadastro público ou cobrança SaaS. O mesmo banco pode armazenar várias unidades, mas a sessão só acessa a unidade definida por `RESTAURANT_ID`; deploys separados são necessários no modelo atual.

1. Crie PostgreSQL no Neon/Supabase ou rode `docker compose up -d db`.
2. Copie `apps/web/.env.example` para `apps/web/.env`. Configure `DATABASE_URL` com SSL no serviço remoto e credenciais próprias; nunca versione esse arquivo.
3. Defina `RESTAURANT_ID`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` bcrypt, `SESSION_SECRET` aleatório com pelo menos 32 caracteres, `EDGE_API_KEY` e `CRON_SECRET` aleatórios e diferentes.
4. Execute `pnpm --filter @vision/web db:push`, depois `pnpm --filter @vision/web exec tsx scripts/provision.ts`. São criadas 12 mesas **livres**, nenhum histórico ou ocupação fictícia. Ajuste as mesas/áreas com Prisma Studio (`pnpm --filter @vision/web exec prisma studio`) antes do uso real.
5. Configure `APP_MODE=production`. Sem banco/credenciais, o aplicativo falha com erro explícito; não substitui dados reais por métricas simuladas.
6. As zonas do Edge precisam usar os IDs reais (`<RESTAURANT_ID>-table-1` etc.). A exportação do cadastro de câmera usa esses IDs automaticamente.
7. Configure limitação de tentativas de login na camada de hospedagem/WAF antes de disponibilizar o login para clientes. A autenticação atual é intencionalmente simples: administrador único, bcrypt e cookie HttpOnly de 8h, sem recuperação de senha/MFA.

Para gerar um hash sem pôr senha em argumentos, execute no diretório `apps/web`:

```sh
node scripts/hash-password.mjs
```

O prompt lê a senha localmente sem ecoá-la. Configure o hash diretamente no ambiente de hospedagem. Não envie segredos pelo chat.

## Edge AI

```sh
cd edge
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m vision.run --kind mp4 --source /caminho/demo.mp4 --zones zones.example.json
```

Forneça um MP4 autorizado. Pesos `yolo11n.pt` são baixados pelo Ultralytics no primeiro uso. MP4 sempre funciona como demonstração/dry-run e imprime eventos `source=demo`; não contamina a produção. O simulador sem câmera e sem dependências externas está em `python -m vision.simulator`; o dashboard possui seu próprio simulador interativo.

Para câmera real, configure localmente `RTSP_URL`, `PLATFORM_URL=https://seu-dominio` e `EDGE_API_KEY`, depois:

```sh
python -m vision.run --kind rtsp --zones zones.json --live
# ONVIF: configure ONVIF_HOST, ONVIF_PORT, ONVIF_USER, ONVIF_PASSWORD
python -m vision.run --kind onvif --zones zones.json --live
```

O detector genérico identifica **pessoas**, não distingue garçons. Primeiro atendimento exige confirmação manual no painel ou modelo próprio: `--model seu-modelo.pt --customer-class 0 --staff-class 1`. A presença do funcionário por 4 segundos é apenas evidência operacional; calibre no estabelecimento. Limpeza é confirmada manualmente. Não existe reconhecimento facial.

O Edge usa centróide do bounding box e polígonos normalizados. Aguarda 3 s para confirmar ocupação, tolera 15 s de ausência e gera alerta local após 300 s. Credenciais e frames não são enviados à nuvem. A outbox SQLite retém eventos durante falhas e o servidor deduplica UUIDs. Estado de mesas é persistido localmente. Alterações manuais no painel são reconciliadas a cada 5 segundos depois que a fila local estiver vazia; veja [arquitetura](docs/architecture.md).

`--show` exige OpenCV com GUI. O pacote padrão é headless; para preview local use uma instalação separada com `opencv-python` em vez de `opencv-python-headless`.

## Docker e n8n

```sh
docker compose up --build web db
docker compose --profile automation up -d n8n
```

Modo padrão é demo. Em produção, provisione o schema e as mesas antes de iniciar o uso real. O n8n local fica em `http://localhost:5678`; configure a conta pelo próprio n8n. Importe `automations/n8n-alerts.json`, configure uma credencial Header Auth com nome `x-vision-secret` e valor igual a `N8N_WEBHOOK_SECRET`, copie a URL de produção para `N8N_WEBHOOK_URL` e ative o workflow. O template **prepara** a mensagem; conecte seu canal de e-mail/WhatsApp/Telegram para envio efetivo. Nenhum canal é contratado ou disparado automaticamente.

Agende no n8n uma chamada GET a `/api/cron` a cada minuto com `Authorization: Bearer <CRON_SECRET>`. Esse endpoint calcula alertas e drena a outbox (20 por chamada, até 10 tentativas). O cron não é configurado automaticamente na Vercel: planos possuem limites diferentes. Deduplicação é por visita; o receptor deve usar `body.id` como chave idempotente, pois entrega pode se repetir. Para relatórios diários, agende GET `/api/report` usando uma sessão válida ou implemente um consumidor com credencial própria antes de automatizar; não exponha o CSV publicamente.

## Publicação e limitações

Veja [deploy](docs/deploy.md), [arquitetura](docs/architecture.md), [contrato de eventos](docs/events.md) e [validação](docs/validation.md).

O módulo de visão é uma implementação inicial para calibração; inferência real em MP4/RTSP, ONVIF, Docker e envio por um canal n8n precisam ser validados no hardware e nas contas do cliente. Não há promessa de precisão, previsão de liberação ou faturamento. Contagem é por mesa/câmera, sem deduplicação entre câmeras. Fluxo por horário representa pessoas em novas ocupações, não um contador físico de porta. O painel mostra até 1.000 eventos recentes. Hardware Edge, banco gerenciado e provedores de mensagens são serviços separados.

Referências: [Ultralytics tracking](https://docs.ultralytics.com/modes/track/), [Next.js](https://nextjs.org/docs/app), [Prisma 6](https://www.prisma.io/docs/orm/v6).

Licenciamento: o código deste projeto não recebe licença comercial implícita. O Ultralytics possui condições próprias (AGPL/Enterprise); avalie a licença adequada antes de distribuir um produto fechado.
