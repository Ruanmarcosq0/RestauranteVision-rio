# Operação real — preto e vermelho

O endereço público foi alterado para `APP_MODE=production`. Não usa fixtures nem restaura dados simulados da sessão antiga. Sem configuração, mostra instalação pendente; com banco conectado, exige login.

## Primeiro acesso

Use o convite privado entregue separadamente (`ativar-minha-unidade.html`, fora do repositório). Escolha nome, e-mail, senha e quantidade de mesas. O convite contém segredo de uso inicial: não compartilhe. A senha é definida pelo responsável e armazenada como hash bcrypt. O convite não cria outro responsável depois da primeira ativação.

A ativação prepara o schema inicial com SQL estático versionado, sob transação e advisory lock, e cria somente a unidade e mesas livres. Não cria visitas ou ocupações fictícias. Se já houver um schema anterior sem a versão de migração esperada, a inicialização automática recusa alterar os dados. O responsável deve migrar explicitamente esse banco existente.

## Usar antes de instalar câmera

Em Mesas, selecione uma mesa livre e registre a chegada de um grupo real; confirme atendimento, registre saída e conclua limpeza. A origem manual é registrada. Isso permite operação assistida sem afirmar detecção automática. Em Analytics, veja as visitas reais, o tempo médio de permanência e o dia/horário de maior fluxo.

## Conectar a câmera do estabelecimento

1. Confirme com o instalador a marca/modelo e acesso RTSP ou ONVIF. Use um computador ligado na mesma rede do DVR/câmeras; não exponha a porta RTSP diretamente na internet.
2. Cadastre as mesas reais. Em Câmeras, crie a câmera, selecione um frame real e desenhe uma área por mesa. A imagem usada para calibrar fica no navegador; somente as coordenadas são salvas.
3. Use **Baixar configuração Edge**. O arquivo contém chave privada da unidade: salve apenas no computador do estabelecimento e não envie ao GitHub.
4. Baixe o repositório nesse computador. Instale Python e as dependências descritas no README. No diretório `edge`, execute `python -m vision.configure`, informe o pacote baixado e a URL RTSP local. A URL é digitada com entrada oculta.
5. Execute `python -m vision.run --kind rtsp --zones zones.json --live`. O Edge envia eventos com UUID e um sinal de presença a cada ciclo de 5 segundos; o painel marca sinal recente se recebido nos últimos 30 segundos. Falhas/atrasos de rede podem ampliar esse intervalo.
6. Teste com a equipe: sente, conte pessoas, confira entrada, saída e cronômetros. Ajuste áreas e iluminação. O detector genérico identifica pessoas; diferenciar garçons exige modelo próprio ou confirmação manual no painel.

## Histórico e pico

Cada ocupação válida abre uma visita; primeiro atendimento grava seu horário; saída encerra a permanência. Limpeza libera a próxima visita. Eventos antigos ou transições inválidas não abrem visitas artificiais. Escrita de evento, visita e projeção usa uma transação com lock por mesa.

Analytics usa os últimos 7 dias, no fuso America/Sao_Paulo. Pico é a faixa horária com mais pessoas nas novas ocupações, não um contador de porta nem uma previsão garantida. A recomendação pede cobertura da equipe 30 minutos antes dessa faixa. Sem visitas, pico e médias ficam vazios. A consulta está limitada às 50.000 visitas mais recentes do período; o histórico visível e o CSV incluem as últimas 50.

## Recursos e acesso

Banco criado no Neon Free pela integração Vercel, vinculado apenas ao ambiente Production. Chaves de sessão, ingestão, cron e ativação são distintas e não estão no GitHub. Preview não recebe credenciais do banco real. Cinco tentativas de login inválidas bloqueiam o acesso por 15 minutos. Login de administrador único; não há organização multiusuário ou recuperação de senha nesta versão.

O agente continua sendo analítico por regras; responde com ocupação, espera, permanência e pico observado. Não há LLM nem envio de mensagens externo ativo. n8n é opcional e depende do webhook e do canal configurados.

A câmera e o computador local ainda não foram escolhidos pelo responsável; portanto não houve validação de imagem real, precisão de detecção ou instalação física.
