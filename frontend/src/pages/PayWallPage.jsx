import "./paywall.css";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_BASE_URL ||
  "http://localhost:4000";

export default function PayWallPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCheckout(e) {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resp = await fetch(`${BACKEND_URL}/checkout/mercadopago/preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (!resp.ok) {
        throw new Error("Não foi possível iniciar o pagamento. Tente novamente.");
      }

      const data = await resp.json();

      // Em produção usa init_point; em sandbox usa sandbox_init_point
      const checkoutUrl =
        process.env.NODE_ENV === "production"
          ? data.init_point
          : data.sandbox_init_point;

      if (!checkoutUrl) throw new Error("URL de checkout não encontrada.");

      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err.message || "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ═══════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge fade-up fade-up-1">
            Acesso vitalício por R$15
          </div>

          <h1 className="fade-up fade-up-2">
            Pare de adivinhar.<br />
            <em>Saiba exatamente</em>
            <br />
            onde vai seu dinheiro.
          </h1>

          <p className="fade-up fade-up-3">
            Luna Finance transforma a bagunça financeira em clareza total — em
            minutos, não em planilhas.
          </p>

          {/* IMAGEM DO APP AQUI */}
          <div className="app-preview fade-up fade-up-3">
            <div className="app-preview-inner">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="9" y1="7" x2="15" y2="7" />
                <line x1="9" y1="11" x2="15" y2="11" />
                <line x1="9" y1="15" x2="12" y2="15" />
              </svg>
              <span className="img-placeholder-label">
                screenshot do app aqui
              </span>
            </div>
          </div>

          <div className="price-badge fade-up fade-up-3">
            <div className="price-main">
              <span>R$</span>15
            </div>
            <div className="price-sub">PAGAMENTO ÚNICO · ACESSO VITALÍCIO</div>
          </div>

          {error && (
            <p className="fade-up fade-up-4" style={{ color: "#e55", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              {error}
            </p>
          )}

          <a
            href="#cta"
            className="btn-primary fade-up fade-up-4"
            onClick={handleCheckout}
            aria-disabled={loading}
          >
            {loading ? "Aguarde..." : "Liberar acesso agora →"}
          </a>
          <p className="btn-guarantee fade-up fade-up-4">
            7 dias de garantia · sem perguntas
          </p>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* ═══════════════════════════════════════════
          PROBLEMA
      ════════════════════════════════════════════ */}
      <section className="problema">
        <div className="container">
          <p className="section-label">Você se reconhece nisso?</p>
          <h2>
            Fim do mês chegou.<br />
            O dinheiro sumiu.
          </h2>

          <ul className="pain-list">
            <li className="pain-item">
              <div className="pain-icon">✕</div>
              Você ganha, paga as contas, e o que sobra some — sem saber para onde foi.
            </li>
            <li className="pain-item">
              <div className="pain-icon">✕</div>
              Você tenta controlar pelo extrato bancário, mas é impossível entender o padrão.
            </li>
            <li className="pain-item">
              <div className="pain-icon">✕</div>
              Já tentou planilha, já tentou app complicado — nada grudou por mais de uma semana.
            </li>
            <li className="pain-item">
              <div className="pain-icon">✕</div>
              Você sente que deveria estar guardando mais, mas não sabe exatamente quanto nem como.
            </li>
          </ul>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* ═══════════════════════════════════════════
          SOLUÇÃO
      ════════════════════════════════════════════ */}
      <section className="solucao">
        <div className="container">
          <div className="solucao-header">
            <p className="section-label">A solução</p>
            <h2>
              Controle real.<br />
              Sem complicação.
            </h2>
          </div>

          <p>
            Luna Finance foi feito para quem quer clareza — não para quem quer
            mais uma coisa para gerenciar.
          </p>

          {/* IMAGEM DO DASHBOARD AQUI */}
          <div className="img-placeholder">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.3"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="img-placeholder-label">imagem do dashboard</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="1.8">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="feature-text">
              <h3>Visão do seu dinheiro em segundos</h3>
              <p>
                Dashboard que mostra patrimônio atual, sobra mensal e projeção de
                crescimento — tudo na primeira tela.
              </p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="1.8">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div className="feature-text">
              <h3>Controle de fontes de pagamento</h3>
              <p>
                Separe gastos por conta, cartão ou qualquer fonte que você usar —
                veja exatamente de onde sai cada real.
              </p>
            </div>
          </div>

          {/* IMAGEM DE TRANSAÇÕES AQUI */}
          <div className="img-placeholder">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.3"
            >
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="img-placeholder-label">imagem de transações</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="1.8">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="feature-text">
              <h3>Projeção de patrimônio real</h3>
              <p>
                Veja até onde seu dinheiro vai chegar com seus aportes atuais — com
                cálculo de IR regressivo incluso.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* ═══════════════════════════════════════════
          BENEFÍCIOS
      ════════════════════════════════════════════ */}
      <section className="beneficios">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>
            O que você tem acesso
          </p>
          <h2>
            Tudo que você precisa.<br />
            Nada que você não precisa.
          </h2>

          <div className="benefit-grid">
            <div className="benefit-item">
              <span className="b-icon">📊</span>
              <h4>Dashboard inteligente</h4>
              <p>Patrimônio, sobra e crescimento numa só tela.</p>
            </div>
            <div className="benefit-item">
              <span className="b-icon">💳</span>
              <h4>Fontes de pagamento</h4>
              <p>Separe gastos por cartão, conta ou benefício.</p>
            </div>
            <div className="benefit-item">
              <span className="b-icon">🎯</span>
              <h4>Metas financeiras</h4>
              <p>Define objetivos e acompanha o progresso mês a mês.</p>
            </div>
            <div className="benefit-item">
              <span className="b-icon">📈</span>
              <h4>Projeção de investimentos</h4>
              <p>CDI, Selic, CDB e FII com IR real calculado.</p>
            </div>
            <div className="benefit-item">
              <span className="b-icon">🔔</span>
              <h4>Alertas inteligentes</h4>
              <p>Avisa antes do limite do cartão estourar.</p>
            </div>
            <div className="benefit-item">
              <span className="b-icon">📄</span>
              <h4>Relatório em PDF</h4>
              <p>Exporta o mês completo para compartilhar.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* ═══════════════════════════════════════════
          RESULTADO
      ════════════════════════════════════════════ */}
      <section className="resultado">
        <div className="container">
          <p className="section-label">O que muda na prática</p>
          <h2>Em poucos dias você já sente a diferença.</h2>
          <p>
            Não é promessa — é o que acontece quando você para de adivinhar e começa
            a enxergar.
          </p>

          <div className="resultado-cards">
            <div className="resultado-card">
              <div className="resultado-dot"></div>
              <p>
                <strong>No primeiro dia:</strong> você vê pela primeira vez para
                onde vai cada real que entra na sua conta.
              </p>
            </div>
            <div className="resultado-card">
              <div className="resultado-dot"></div>
              <p>
                <strong>Na primeira semana:</strong> você identifica os gastos que
                somem sem deixar rastro.
              </p>
            </div>
            <div className="resultado-card">
              <div className="resultado-dot"></div>
              <p>
                <strong>No final do mês:</strong> você chega com sobra — e sabe
                exatamente quanto pode investir.
              </p>
            </div>
            <div className="resultado-card">
              <div className="resultado-dot"></div>
              <p>
                <strong>Em 3 meses:</strong> você começa a ver seu patrimônio crescer
                de acordo com a projeção.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* ═══════════════════════════════════════════
          PREÇO
      ════════════════════════════════════════════ */}
      <section className="preco">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center", marginBottom: 20 }}>
            Investimento único
          </p>

          <div className="preco-card">
            <div className="preco-tag">Acesso vitalício</div>

            <div className="preco-numero">
              <sup>R$</sup>15
            </div>
            <p className="preco-tipo">PAGAMENTO ÚNICO · SEM MENSALIDADE</p>

            <div className="preco-comparacoes">
              <div className="preco-comp">menos que um lanche no iFood</div>
              <div className="preco-comp">menos de R$0,05 por dia pelo acesso</div>
              <div className="preco-comp">
                menos que qualquer assinatura mensal de app
              </div>
            </div>

            {error && (
              <p style={{ color: "#e55", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                {error}
              </p>
            )}

            <a
              href="#"
              className="btn-primary"
              onClick={handleCheckout}
              aria-disabled={loading}
            >
              {loading ? "Aguarde..." : "Liberar acesso agora →"}
            </a>
            <p className="btn-guarantee" style={{ marginTop: 12 }}>
              7 dias de garantia · devolução sem burocracia
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA FINAL
      ════════════════════════════════════════════ */}
      <section className="cta-final" id="cta">
        <div className="container">
          <h2>
            Chega de mês<br />
            terminando no <em>vermelho.</em>
          </h2>
          <p>
            R$15 é o que separa você de ter controle total sobre o seu dinheiro.
            Para sempre.
          </p>

          {error && (
            <p style={{ color: "#e55", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {error}
            </p>
          )}

          <a
            href="#"
            className="btn-primary"
            onClick={handleCheckout}
            aria-disabled={loading}
          >
            {loading ? "Aguarde..." : "Liberar acesso agora →"}
          </a>
          <p className="btn-guarantee" style={{ marginTop: 12 }}>
            7 dias de garantia · sem perguntas · risco zero
          </p>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* ═══════════════════════════════════════════
          GARANTIA
      ════════════════════════════════════════════ */}
      <section className="garantia">
        <div className="container">
          <div className="garantia-inner">
            <div className="garantia-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5DCAA5"
                strokeWidth="1.8"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div className="garantia-text">
              <h3>Garantia de 7 dias</h3>
              <p>
                Não gostou? Devolvemos 100% do seu dinheiro sem burocracia, sem
                perguntas. Risco zero do seu lado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">Luna Finance · Todos os direitos reservados</div>
      </footer>
    </>
  );
}