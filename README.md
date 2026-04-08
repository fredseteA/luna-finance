<div align="center">

# 🌙 Luna Finance

**Planejador financeiro pessoal inteligente — mobile-first**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

[Funcionalidades](#-funcionalidades) · [Como usar](#-como-usar) · [Tecnologias](#-tecnologias) · [Roadmap](#-roadmap)

</div>

---

## O que é o Luna Finance?

Luna Finance é um app de planejamento financeiro pessoal focado em mobile, construído com React. A ideia é simples: você informa sua renda e seus gastos, e o app te ajuda a entender onde seu dinheiro está indo, simular o crescimento dos seus investimentos ao longo do tempo e definir metas financeiras reais.

Não é um app de banco. Não rastreia transações automaticamente. É uma ferramenta de **simulação e consciência financeira** — para quem quer planejar antes de agir.

> Desenvolvido originalmente para uso pessoal, mas aberto para quem quiser usar ou contribuir.

---

## ✨ Funcionalidades

### 📊 Dashboard
Visão geral do patrimônio atual e projetado, sobra mensal e taxa de poupança. Gráficos de evolução patrimonial, composição da carteira e fluxo mensal de receitas e despesas. Saudação personalizada com o nome do usuário logado.

### 📅 Planejamento
Cadastro de renda mensal, custos fixos (com data de encerramento por item) e despesas variáveis. Cálculo automático da sobra disponível para investir.

### 📈 Investimentos
Configuração da carteira com alocação entre CDI, Selic, CDB e FII. Cálculo de retornos com IR regressivo real (tabela progressiva brasileira). FII com opção de reinvestimento ou dividendos. Ajuste por inflação para ver o patrimônio em valor real.

### 🎯 Metas
Definição de objetivos financeiros com valor-alvo e prazo. Cálculo automático de quanto tempo leva para atingir cada meta com a configuração atual. Acompanhamento de progresso mês a mês. 

### 🔮 Simulações
- **Auto Simulation** — gera cenários automaticamente com base nos seus dados
- **Aporte extra** — simula o impacto de investir um valor adicional por mês
- **Perda de renda** — testa a resiliência financeira em caso de redução de salário

### 🧪 Cenários
Salve e compare diferentes configurações financeiras lado a lado. Útil para comparar estratégias de alocação ou simular mudanças de vida (novo emprego, compra de imóvel, etc.).

### 🔔 Alertas inteligentes
Sistema de alertas que identifica automaticamente situações de risco ou oportunidades com base nos seus dados (taxa de poupança baixa, carteira desbalanceada, etc.).

### 👤 Autenticação e perfil
Login com email/senha ou Google. Cadastro com validação de senha forte (maiúscula, minúscula, número e caractere especial). Perfil do usuário acessível pelo menu lateral com foto, nome e email. Opções de trocar senha e excluir conta com reautenticação.

### ⚙️ Configurações
Suporte a múltiplas moedas (BRL, USD, EUR), modo claro/escuro, taxas de mercado configuráveis (CDI, Selic, CDB, FII) e exportação de dados.

---

## 🖼️ Screenshots

> _Em breve_

---

## 🚀 Como usar

### Pré-requisitos

- Node.js 18+
- Yarn
- Conta no [Firebase](https://console.firebase.google.com) com projeto criado

### Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative o **Authentication** com os provedores **Email/senha** e **Google**
3. Ative o **Firestore Database** em modo de produção
4. Em **Configurações do projeto → Seus aplicativos**, registre um app Web e copie as credenciais
5. Configure as **Regras do Firestore**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/data/{document} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/luna-finance.git
cd luna-finance/frontend

# Instale as dependências
yarn install
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do `frontend/` com as credenciais do seu projeto Firebase:

```env
REACT_APP_FIREBASE_API_KEY=sua_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu_projeto_id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
REACT_APP_FIREBASE_APP_ID=seu_app_id
```

> ⚠️ Nunca suba o `.env` para o repositório. Ele já está no `.gitignore`.

### Iniciar

```bash
yarn start
```

O app abre em `http://localhost:3000`.

### Build de produção

```bash
yarn build
```

Os arquivos ficam em `frontend/build/` — prontos para deploy.

---

## 📱 Instalar como app no celular (PWA)

O Luna Finance é um **Progressive Web App** — pode ser instalado no celular sem precisar de loja de apps.

**Android (Chrome):**
1. Abra o app no Chrome
2. Menu (⋮) → "Adicionar à tela inicial"
3. Confirme — o app aparece na home como qualquer outro app nativo

**iOS (Safari):**
1. Abra o app no Safari
2. Botão compartilhar → "Adicionar à Tela de Início"

---

## 🛠 Tecnologias

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | React 19 |
| Roteamento | React Router 7 |
| Estilização | Tailwind CSS 3 |
| Componentes | shadcn/ui + Radix UI |
| Gráficos | Recharts |
| Animações | Framer Motion |
| Ícones | Lucide React |
| Notificações | Sonner |
| Autenticação | Firebase Auth |
| Banco de dados | Firebase Firestore |
| Build | CRACO + react-scripts |

---

## 🧮 Como funciona o motor financeiro

O `financialEngine.js` é o núcleo do app. Ele:

- Converte taxas anuais em mensais com juros compostos reais (`(1 + taxa)^(1/12) - 1`)
- Aplica a **tabela regressiva de IR** brasileira (22,5% → 15%) sobre CDB e CDI por tempo de aplicação
- Isenta FII de IR para pessoa física (regra vigente no Brasil)
- Projeta o patrimônio mês a mês considerando aportes, rendimentos e custos fixos com data de encerramento
- Calcula o **impacto da inflação** sobre o valor real do patrimônio projetado

---

## 🗄️ Estrutura de dados (Firestore)

Cada usuário tem seus dados isolados por `uid`:

```
users/
  {uid}/
    data/
      settings        ← moeda, tema, taxas (CDI/Selic/CDB/FII), inflação, impostos
      financialData   ← renda, patrimônio inicial, custos fixos, despesas, alocação
      scenarios       ← cenários salvos
      lifeObjectives  ← objetivos de vida
      dismissedAlerts ← alertas dispensados
```

---

## 🗺 Roadmap

- [x] Autenticação com Firebase (email/senha e Google)
- [x] Sincronização de dados na nuvem (Firestore)
- [x] Perfil do usuário com foto, nome e email
- [x] Trocar senha e excluir conta
- [x] Validação de senha forte no cadastro
- [ ] Suporte multi-perfil (ex: casal com finanças separadas)
- [ ] Notificações push (PWA)
- [ ] Exportação em PDF
- [ ] Integração com Open Finance / Pluggy para importar extratos automaticamente
- [ ] Score financeiro explicável com IA

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

<div align="center">
  <sub>Feito com 🌙 por Fred</sub>
</div>