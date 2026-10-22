# Validação

## Automatizada

- TypeScript: tipos da aplicação e handlers.
- Next production build: todas as rotas e empacotamento.
- Testes TS: ciclo de visita, fronteira de 300 segundos, reset após limpeza, proteção contra evento antigo e rejeição de origem simulada na produção.
- Testes Python sem dependências: ciclo do Edge, deduplicação do alerta, tolerância à oclusão, passagem breve de funcionário e polígono.

## Manual no navegador

Verificar navegação nas oito páginas, atualização de estados e alertas, simulador iniciar/pausar, exportação CSV identificada, desenho/exportação de zona e apresentação responsiva. Evidências finais devem registrar exatamente o que foi executado; testes de domínio não substituem validação de detecção em vídeo.

A página Câmeras oferece reprodução local de MP4, acesso à câmera do dispositivo mediante permissão do navegador e captura de frame em PNG. Essa prévia não executa visão computacional e não envia frames ao backend. A permissão e a imagem de câmera real não foram testadas sem equipamento/consentimento no dispositivo.

## Não validado sem infraestrutura real

Conexão Neon/Supabase e transação PostgreSQL; inferência YOLO em filmagem autorizada; compatibilidade RTSP/ONVIF de DVR específico; entrega n8n em canal real; Docker em host com daemon. Essas etapas exigem credenciais, filmagem e/ou equipamento que não são fornecidos no pedido. A demo funciona independentemente delas.
