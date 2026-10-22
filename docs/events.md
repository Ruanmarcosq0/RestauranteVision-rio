# Contrato HTTP de eventos

Produção: `POST /api/events`, `Authorization: Bearer EDGE_API_KEY`, `Content-Type: application/json`.

```json
{"id":"68c183ac-a0ca-42c2-bf9c-e960ee17cd32","tableId":"my-restaurant-table-1","type":"occupied","people":3,"occurredAt":1792641000000,"source":"edge"}
```

`occurredAt` é Unix epoch em milissegundos; use o relógio atual, o exemplo não deve ser reenviado literalmente. `type`: `occupied`, `heartbeat`, `served`, `vacated`, `cleaned`. O servidor limita `people` à capacidade da mesa. A chave do Edge determina a unidade e o servidor ignora qualquer tentativa de escolher outro tenant.

Resposta 200 `{ "duplicate": false }`; retries com mesmo UUID recebem `duplicate: true`. 400 dados inválidos; 401 chave/sessão inválida; 409 ingestão desativada no modo demo; 422 mesa/configuração inválida. Não envie `source=demo` à produção. O dashboard simula apenas na memória do navegador.

`GET /api/snapshot` retorna mesas, até 1.000 eventos recentes, câmeras, limite e modo. `PATCH /api/settings` salva nome/limite. `POST /api/cameras` salva nome, tipo e polígonos; não recebe senhas de câmera. `GET /api/report` retorna CSV. Todos exigem sessão em produção. Mutações do navegador verificam Origin.

`GET /api/cron` exige `Authorization: Bearer CRON_SECRET`. Enfileira condições de espera e tenta entregar até 20 alertas. n8n recebe POST HTTPS com `x-vision-secret`, JSON com `id`, `type=wait_alert`, `tableId`, `title`, `seconds`, `zone` e `mode=production`. O segredo é configurado no servidor, nunca na interface pública.
