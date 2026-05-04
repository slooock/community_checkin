# Comunidade Check-in

Aplicacao mobile-first em Next.js para cadastrar membros de uma comunidade, marcar presenca por data e gerar um resumo em PDF do encontro. O projeto tambem esta preparado como PWA para instalacao em dispositivos.

## Funcionalidades

- Cadastro de membros com nome, telefone, descricao e etiqueta.
- Etiquetas disponiveis: `Adulto`, `Jovem` e `Convidado`.
- Marcacao de presenca por data.
- Resumo filtrado por data, com presentes, ausentes e distribuicao por grupo.
- Geracao de PDF com o resumo do encontro.
- PWA com manifest, icone e service worker basico.
- Persistencia em Neon Postgres via rotas API do Next.js.

## Stack

- Next.js 16 com App Router
- React 19
- TypeScript
- Neon Postgres com `@neondatabase/serverless`
- `jspdf` para exportacao de PDF
- `lucide-react` para icones

## Estrutura

```text
app/
  api/
    attendance/route.ts   # API de presencas por data
    members/route.ts      # API de cadastro/listagem de membros
  components/
    service-worker-registration.tsx
  globals.css             # Estilos da UI mobile
  layout.tsx              # Metadata e registro PWA
  manifest.ts             # Web App Manifest
  page.tsx                # Telas da aplicacao
db/
  schema.sql              # Tabelas PostgreSQL para Neon
lib/
  db.ts                   # Cliente Neon Postgres
public/
  icon.svg
  sw.js
```

## Configuracao Local

Instale as dependencias:

```bash
npm install
```

Crie o arquivo de ambiente:

```bash
cp .env.example .env.local
```

Configure as variaveis:

```env
DATABASE_URL=postgresql://USER:PASSWORD@EP-EXAMPLE-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Crie o banco no Neon e aplique o schema:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Rode o servidor:

```bash
npm run dev
```

Acesse:

```text
http://localhost:3000
```

## Banco de Dados

Para deploy no Vercel, use um banco Neon acessivel pela internet. A aplicacao agora usa uma unica variavel `DATABASE_URL`, exatamente no formato entregue pelo painel do Neon.

### Deploy no Vercel

1. Suba o repositório no GitHub.
2. Importe o projeto no Vercel.
3. No Neon, crie um projeto e copie a `DATABASE_URL`.
4. No Vercel, configure a variavel `DATABASE_URL`.
5. Execute o schema `db/schema.sql` no banco remoto antes de abrir a aplicacao.

Observacoes para producao:

- As rotas API usam runtime Node.js e o driver `@neondatabase/serverless`, recomendado para Neon em ambientes serverless.
- As mensagens da interface nao assumem mais um banco local especifico, entao ficam mais naturais em producao.

### `members`

Armazena os membros cadastrados.

Campos principais:

- `id`
- `name`
- `phone`
- `kind`: `Adulto`, `Jovem` ou `Convidado`
- `region`
- `description`
- `created_at`
- `updated_at`

### `attendance`

Armazena presencas por membro e data.

Campos principais:

- `id`
- `member_id`
- `attendance_date`
- `created_at`

A constraint `uniq_attendance_member_date` impede duplicar presenca do mesmo membro na mesma data.

## APIs

### `GET /api/members`

Retorna membros cadastrados.

Resposta:

```json
[
  {
    "id": 1,
    "name": "Ana Martins",
    "phone": "(11) 99999-9999",
    "kind": "Adulto",
    "region": "Comunidade",
    "description": "Participa do grupo de recepcao."
  }
]
```

### `POST /api/members`

Cadastra um membro.

Body:

```json
{
  "name": "Ana Martins",
  "phone": "(11) 99999-9999",
  "kind": "Adulto",
  "region": "Comunidade",
  "description": "Participa do grupo de recepcao."
}
```

### `GET /api/attendance?date=YYYY-MM-DD`

Retorna os IDs presentes em uma data.

Resposta:

```json
{
  "date": "2026-05-04",
  "presentIds": [1, 2]
}
```

### `PUT /api/attendance`

Marca ou remove presenca.

Body:

```json
{
  "date": "2026-05-04",
  "memberId": 1,
  "present": true
}
```

Use `present: false` para remover a presenca.

## Fluxo da Aplicacao

1. Cadastro carrega membros do Neon Postgres.
2. Ao salvar um membro, a app envia `POST /api/members`.
3. A aba Presenca carrega a lista de membros e as presencas da data selecionada.
4. Marcar/desmarcar presenca envia `PUT /api/attendance`.
5. O Resumo usa a data selecionada para calcular presentes, ausentes, percentual e distribuicao.
6. O botao `Salvar resumo em PDF` gera um arquivo local no navegador.

## PWA

O projeto inclui:

- `app/manifest.ts`
- `public/sw.js`
- `public/icon.svg`
- registro do service worker em `app/components/service-worker-registration.tsx`

Em navegadores compativeis, a aplicacao pode ser instalada no dispositivo. Para instalacao em producao, publique em HTTPS.

## Scripts

```bash
npm run dev      # servidor local
npm run build    # build de producao
npm run start    # roda build de producao
npm run lint     # lint
```

## Observacoes

- Sem `.env.local` configurado ou sem Neon acessivel, a UI mostra mensagens de erro de conexao.
- O service worker atual faz cache basico do app shell.
- A aplicacao ainda nao possui autenticacao.
- O Pencil em `app.pen` contem o prototipo visual sincronizado com as telas atuais.
