<div align="center">

# 🌙 Luna Finance

**Planejador financeiro pessoal inteligente — mobile-first**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
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
Visão geral do patrimônio atual e projetado, sobra mensal e taxa de poupança. Gráficos de evolução patrimonial, composição da carteira e fluxo mensal de receitas e despesas.

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

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/luna-finance.git
cd luna-finance/frontend

# Instale as dependências
yarn install

# Inicie o servidor de desenvolvimento
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
| Formulários | React Hook Form + Zod |
| Ícones | Lucide React |
| Notificações | Sonner |
| Build | CRACO + react-scripts |
| Persistência | localStorage (via storageService) |

---

---

## 🧮 Como funciona o motor financeiro

O `financialEngine.js` é o núcleo do app. Ele:

- Converte taxas anuais em mensais com juros compostos reais (`(1 + taxa)^(1/12) - 1`)
- Aplica a **tabela regressiva de IR** brasileira (22,5% → 15%) sobre CDB e CDI por tempo de aplicação
- Isenta FII de IR para pessoa física (regra vigente no Brasil)
- Projeta o patrimônio mês a mês considerando aportes, rendimentos e custos fixos com data de encerramento
- Calcula o **impacto da inflação** sobre o valor real do patrimônio projetado

---

## 🗺 Roadmap

- [ ] Autenticação com Firebase (login com Google)
- [ ] Sincronização de dados na nuvem (Firestore)
- [ ] Suporte multi-perfil (ex: casal com finanças separadas)
- [ ] Notificações push (PWA)
- [ ] Exportação em PDF
- [ ] Integração com Open Finance / Pluggy para importar extratos automaticamente
- [ ] Score financeiro explicável com IA

---

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

---

<div align="center">
  <sub>Feito com 🌙 por Fred</sub>
</div>