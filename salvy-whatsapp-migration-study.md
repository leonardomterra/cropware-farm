# Estudo: migração WhatsApp Business → Salvy

**Data:** 2026-05-26
**Contexto:** análise pra trocar números WhatsApp (leads-bot + services-bot) de chips de operadora por números virtuais Salvy. Documento preparado pra servir de base no projeto **Cropware Farm** (e referência futura no Cropware Field).

---

## TL;DR

Faz sentido migrar, principalmente por gestão única, preço e ausência de chip físico. Tem 3 ressalvas (lock-in, portabilidade, single point of failure). Recomendação: migração escalonada em 3 fases, começando por um terceiro número de teste.

---

## O que a Salvy é (importante pra Meta aprovar)

Salvy **não** é VoIP genérico (Twilio/Plivo) — é **MVNO oficial** (Mobile Virtual Network Operator) registrada no Brasil:

- Investida pelo Y Combinator
- Ganhou MVNO Nation Global Award 2024
- Números brasileiros móveis reais (prefixo de celular)

Isso é crucial porque:

- Meta **historicamente baniu Twilio/Plivo** pra WhatsApp Business API (eram VoIP)
- Números MVNO passam batido — Meta trata como linha móvel comum
- Salvy posiciona o produto explicitamente como **"WhatsApp Business via API"**
- Tem fluxo nativo pra capturar o SMS de verificação do Meta via webhook

---

## Dados-chave do produto

| Item | Valor |
|---|---|
| **Preço/número** | R$ 29,90/mês |
| **Fidelidade** | Não tem |
| **Chip físico** | Não precisa |
| **Ativação** | Segundos (sem aprovação manual) |
| **Voz/dados** | Não tem — número é exclusivo pra WhatsApp Business |
| **SMS via webhook** | Sim (entrega o código de verificação em real-time) |
| **API** | Sim, com endpoints pra criar/listar/deletar números e listar DDDs disponíveis |

---

## Vantagens (concretas pro caso Cropware)

| Item | Hoje (chip operadora) | Com Salvy |
|---|---|---|
| **Custo mensal/número** | ~R$ 50-100 (plano básico) | R$ 29,90 |
| **Gestão dos bots** | N chips, N contas operadora | 1 dashboard único + API |
| **Re-verificação SMS** | Ler o SMS no chip e digitar | Webhook → backend captura automático |
| **Ativação novo número** | Comprar chip, esperar, ativar | Endpoint API, segundos |
| **Bot down por SIM perdido** | Possível | Não acontece (sem chip) |
| **Multi-tenant futuro** | Inviável (1 chip por tenant) | Cada cliente pode ter número próprio via API |

**Ponto estratégico — multi-tenant:** com Salvy + API, cada organização cliente pode ter o próprio número de WhatsApp Business. Vira diferencial de produto, principalmente pro Cropware Farm.

---

## Desvantagens e riscos

### 1. Single point of failure
Hoje os 2 números provavelmente estão em operadoras diferentes. Se Salvy tiver outage, **os bots caem juntos**.

**Mitigação:** monitorar uptime histórico da Salvy antes de migrar tudo. Considerar manter pelo menos 1 número de "fallback" em operadora tradicional.

### 2. Portabilidade pra fora não documentada
Não foi confirmado se dá pra portar o número Salvy pra outra operadora ao sair. Se não der = **vendor lock-in**: cancelar = perder o número = clientes que salvaram o contato ficam órfãos.

**Pergunta-chave antes de assinar:** _"se eu cancelar, o número me pertence portável ou volta pro pool de vocês?"_

### 3. Risco de banimento de conta na Salvy
Se a Salvy detectar uso fora da política (spam, broadcast em massa), pode suspender. Resultado: perde o número + o WhatsApp Business registrado nele.

**Mitigação:** ter o **PIN do 2FA do WhatsApp Business** guardado fora do escopo Salvy (vault próprio, password manager).

### 4. DDDs disponíveis não listados
Página não detalha quais DDDs oferecem. Se clientes conhecem os bots por DDD específico (11, 62, etc) e Salvy não tiver = muda o número = aviso pros clientes.

**Pergunta-chave antes de assinar:** _"quais DDDs estão disponíveis pra ativação imediata?"_

### 5. Migração = downtime curto
Pra "mudar" o número de um WhatsApp Business já em uso:

1. Desregistra o número antigo do WhatsApp Business
2. Registra o número novo (Salvy) — recebe SMS via webhook
3. Atualiza `WHATSAPP_PHONE_NUMBER_ID` nos secrets do edge function
4. Reapaga e reconfigura webhooks da Meta

São ~15-30 min de bot offline por número. Pro leads-bot é tolerável, pro services-bot fazer fora de horário.

### 6. Histórico de conversas
Não dá pra transferir histórico entre números do WhatsApp Business. Conversas antigas ficam "presas" no número antigo. Se importa, manter número antigo ativo por X meses de transição.

---

## Trabalho de integração estimado

Arquitetura atual:
- Meta Cloud API → webhook do edge function (`make-server-875c00b5` no Cropware Field; equivalente no Farm)
- `WHATSAPP_PHONE_NUMBER_ID` em secret

Precisa adicionar:

- **Novo webhook**: receber SMS da Salvy → guardar código no KV → expor endpoint admin pra você usar manualmente OU automatizar o re-register no Meta (mais complexo)
- **Variável de ambiente nova**: `SALVY_API_KEY` (no vault Supabase)
- **Endpoint admin pequeno**: pra listar/criar números via UI do app

**Estimativa: 2-4h de código** pra integração inicial (webhook SMS + key na vault + endpoint de "ver código mais recente").

Pro Cropware Farm que é multi-tenant por design, vale planejar a UI desde o início pra cada organização poder provisionar/desativar próprio número via dashboard.

---

## Estratégia recomendada (3 fases, baixo risco)

### Fase 1 — Cobaia (essa semana)
- Cria conta Salvy
- Ativa **1 número novo de teste** (R$ 29,90, sem fidelidade)
- Registra num WhatsApp Business novo (não vincula a bot existente)
- Valida fluxo SMS-via-webhook funcionando
- Manda mensagens de teste

**Objetivo:** entender o produto sem risco. Não tocar nos bots existentes.

### Fase 2 — Leads-bot (2-4 semanas depois, se Fase 1 ok)
- Migra o leads-bot (menor risco — lead perdido na transição não machuca)
- Mantém número antigo ativo em paralelo por 30 dias pra capturar conversas residuais

### Fase 3 — Services-bot (depois da Fase 2 estabilizada)
- Migra o services-bot numa janela de baixa atividade (sábado de noite, por exemplo)

---

## Perguntas pendentes pra Salvy (antes de assinar)

1. **Portabilidade pra fora:** se eu cancelar, o número me pertence portável ou volta pro pool de vocês?
2. **DDDs disponíveis:** quais DDDs estão disponíveis pra ativação imediata?
3. **SLA / uptime histórico:** qual o SLA de disponibilidade? Tem status page público com histórico?
4. **Política de uso:** quais usos são proibidos (broadcast, frequência de envio, conteúdo)?
5. **Recuperação de conta:** se a conta Salvy for suspensa por engano, qual o processo de recuperação e quanto tempo leva?
6. **Volume de SMS:** tem limite mensal de SMS recebidos via webhook? Custo extra acima desse limite?
7. **Plano enterprise:** desconto a partir de quantos números?

---

## Pontos de atenção técnica

- **PIN 2FA do WhatsApp Business** deve ser guardado em vault próprio (Bitwarden/1Password), **não** apenas na conta Salvy. Sem ele, se perder acesso à Salvy, não recupera o número no Meta.
- **Logs do webhook SMS** devem ser monitorados — se Salvy mudar formato sem aviso, perde código de re-verificação.
- **Backup do `WHATSAPP_PHONE_NUMBER_ID`** + `WHATSAPP_ACCESS_TOKEN` documentados antes de migrar (evita ficar perdido durante a transição).
- **Webhook do Meta** precisa ser revalidado após mudar o número (a Meta exige re-confirmação do callback URL).

---

## Sources

- [Salvy — Operadora MVNO + números virtuais](https://salvy.com.br/)
- [Salvy — Número Virtual Móvel pra WhatsApp Business](https://release.salvy.com.br/numerovirtualmovel)
- [Salvy API — Introdução a números virtuais](https://docs.salvy.com.br/api-reference/virtual-phone-accounts/introduction)
- [Salvy API — Documentação geral](https://docs.salvy.com.br/api-reference/introduction)
- [Salvy — Winter Release 2025 (WhatsApp + infra TI)](https://release.salvy.com.br/)
