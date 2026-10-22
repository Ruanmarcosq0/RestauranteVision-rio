# Restaurant Vision AI

Aplicativo de operação para restaurantes e sorveterias, com identidade preta e vermelha. O ambiente publicado usa **produção**, sem métricas simuladas. Registra chegada, primeiro atendimento e saída por mesa; calcula permanência e identifica dia/horário de pico com visitas reais.

- Aplicativo: https://restaurante-vision-rio.vercel.app
- Guia de conexão: https://restaurante-vision-rio.vercel.app/instalacao
- Código: https://github.com/Ruanmarcosq0/RestauranteVision-rio

## Primeiro acesso do responsável

O convite privado de ativação é entregue fora deste repositório. Abra-o, verifique a conexão do banco e informe nome do estabelecimento, seu e-mail, senha de no mínimo 12 caracteres e quantidade de mesas. A ativação cria somente mesas livres, sem visitas fictícias. Depois disso, use `/login`. O convite não permite cadastrar outro responsável após a ativação.

O banco foi provisionado no **Neon Free**, vinculado à produção Vercel. Segredos estão no ambiente de produção, não no código. Preview não tem acesso ao banco real. O login usa bcrypt, sessão HttpOnly de 8 horas e bloqueio de 15 minutos após cinco tentativas inválidas. Esta versão tem um responsável por unidade; não possui recuperação de senha, cobrança ou equipes multiusuário.

## Operação manual e com câmeras

Antes da câmera, já é possível registrar visitas reais manualmente em **Mesas**: selecione a mesa, informe pessoas do grupo, registre chegada, atendimento, saída e limpeza. Eventos manuais são identificados. O horário de saída encerra a permanência; a limpeza libera a próxima visita.

Para automatizar:

1. Câmera/DVR precisa permitir RTSP ou ONVIF e mostrar as mesas. Um computador permanece ligado na mesma rede.
2. Cadastre a câmera em **Câmeras**, selecione uma imagem real do enquadramento e desenhe uma zona para cada mesa. A imagem fica no navegador; somente coordenadas são salvas.
3. Baixe a configuração Edge da câmera. O arquivo contém chave privada da unidade; guarde somente no equipamento local.
4. Instale Python 3.11+ e as dependências no computador do estabelecimento:

```sh
cd edge
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python -m vision.configure
python -m vision.run --kind rtsp --zones zones.json --live
```

O configurador pede o pacote Edge e a URL RTSP em entrada oculta. Credenciais são salvas somente em `.edge-config.json`, ignorado pelo Git. Para ONVIF, configure as variáveis locais `ONVIF_HOST`, `ONVIF_PORT`, `ONVIF_USER`, `ONVIF_PASSWORD`; veja a implementação em `vision/sources.py`. O adaptador ONVIF resolve o stream; alguns dispositivos requerem uma URL RTSP autenticada localmente.

O Edge usa OpenCV, YOLO/Ultralytics e ByteTrack (ou BoT-SORT). Confirma ocupação após 3 s, tolera 15 s de ausência e confirma presença de funcionário após 4 s **somente com modelo próprio que distinga funcionários**. O modelo genérico detecta pessoas e não reconhece garçons. Nesse caso, confirme atendimento manualmente. Limpeza permanece manual. Não há reconhecimento facial.

Use `--tracker botsort.yaml` para trocar o tracker; `--model modelo.pt --customer-class 0 --staff-class 1` exige um modelo treinado e calibrado. O processamento é local e envia metadados, nunca frames. Há fila SQLite com retry/idempotência, persistência local de estados, reconciliação com o painel e heartbeat da câmera. O sinal recente é mostrado quando recebido nos últimos 30 s.

Um MP4 autorizado pode ser testado com `python -m vision.run --kind mp4 --source video.mp4 --zones zones.json`. Esse teste é dry-run, marcado como simulado e não alimenta a produção. A prévia de câmera/MP4 no navegador não executa YOLO.

## Permanência, pico e relatórios

**Analytics** usa visitas reais dos últimos 7 dias, no fuso de São Paulo. Mostra entrada, atendimento, saída, permanência, média das visitas encerradas, dia de maior movimento e faixa horária com mais pessoas nas novas ocupações. O pico orienta preparar a equipe 30 min antes da faixa observada; não é previsão garantida nem contagem da porta. Sem dados reais, médias e pico ficam vazios.

A consulta tem limite de 50.000 visitas do período; histórico visível e CSV incluem as últimas 50. O agente é analítico por regras, identificado na interface: resume ocupação, espera, permanência e pico observado. Não há LLM conectado nem faturamento estimado.

## Arquitetura

```text
RTSP/ONVIF → OpenCV + YOLO + tracking → zonas e estados → outbox SQLite
  → API Next.js autenticada → PostgreSQL/Prisma → dashboard e histórico
  → outbox de alertas → webhook n8n opcional
```

`apps/web` contém dashboard/API; `edge` contém visão local; `automations` contém workflow n8n; `docs` descreve contratos e implantação. Uma unidade por implantação, com identificação no servidor. Eventos/transições válidos atualizam mesa e visita na mesma transação com lock de linha.

## Desenvolvimento e implantação

Node 22+, pnpm 11.25.0. Instale com `pnpm install --frozen-lockfile`. Copie os exemplos de ambiente sem versionar segredos. Para uma unidade local vazia, configure PostgreSQL, `RESTAURANT_ID`, `SESSION_SECRET` de 32+ caracteres e `SETUP_TOKEN` aleatório. A rota de ativação inicializa o schema versionado somente com convite válido e recusa sobrescrever schema anterior desconhecido. Depois, o responsável cria o próprio acesso.

```sh
pnpm --filter @vision/web dev
pnpm --filter @vision/web check
pnpm --filter @vision/web test
pnpm --filter @vision/web build
cd edge
python -m unittest discover -s tests -v
```

`APP_MODE=production` é o padrão. Uma simulação explícita ainda pode ser habilitada para desenvolvimento com `APP_MODE=demo`; não faz parte do ambiente de produção publicado. `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` são campos legados dos exemplos anteriores: o acesso atual fica no modelo `Owner` do banco.

Docker: configure os segredos na cópia local de `.env`, depois `docker compose up --build web db`. n8n é opcional via `docker compose --profile automation up -d n8n`.

Vercel: projeto `restaurante-vision-rio`, Root Directory `apps/web`, branch `main`, Next.js. Push para `main` publica automaticamente. Somente Production recebe banco e chaves. Python não roda como processo de câmera na Vercel.

## Alertas externos opcionais

Importe `automations/n8n-alerts.json`, configure Header Auth `x-vision-secret`, URL do webhook e canal de entrega. Agende `/api/cron` com bearer `CRON_SECRET` para calcular alertas/drain da outbox. O template prepara a mensagem; envio por WhatsApp/e-mail requer canal próprio. Nenhum canal está ativo automaticamente. O receptor deve deduplicar por ID.

## Limites de validação

Testes de domínio cobrem estados, limite de espera, oclusão, polígono, fuso e cálculo de pico/permanência. A instalação física, inferência em filmagem real e precisão dependem da câmera e hardware que o responsável ainda não escolheu. Não houve validação de imagens reais no estabelecimento.

Consulte [operação real](docs/operacao-real.md), [arquitetura](docs/architecture.md), [eventos](docs/events.md) e [deploy](docs/deploy.md). Documentos de entrega anteriores descrevem a primeira versão demo e são históricos; este README e `operacao-real.md` descrevem a versão atual.

O Ultralytics possui licença AGPL/Enterprise própria; avalie a licença adequada antes de distribuir um produto fechado. Hardware e serviços externos não estão incluídos neste código.
