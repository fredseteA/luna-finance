# Luna Finance Backend

Backend Node.js simples (Express) para receber webhooks.

## Requisitos

- Node.js 18+

## Como rodar

```bash
cd backend
npm install
npm run dev
```

Servidor em `http://localhost:4000`.

## Endpoints

- `GET /health`
- `POST /webhook/mercadopago`
- `POST /admin/users/:uid/premium` (protegido por `x-admin-key`)

## Variáveis de ambiente

- `PORT`: porta do servidor (default `4000`)
- `ADMIN_API_KEY`: chave para chamar endpoints administrativos
- `MERCADOPAGO_ACCESS_TOKEN`: token privado para consultar pagamentos via API (usado no webhook)
- `GOOGLE_APPLICATION_CREDENTIALS`: caminho para o JSON de service account (recomendado)
- `FIREBASE_SERVICE_ACCOUNT_JSON`: alternativa ao `GOOGLE_APPLICATION_CREDENTIALS` (JSON completo em uma string)

