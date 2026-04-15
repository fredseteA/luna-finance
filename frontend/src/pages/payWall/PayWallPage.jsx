import "./paywall.css";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AuthModal from "../../components/auth/AuthModal";
import { pixelInitiateCheckout } from '@/lib/metaPixel';

import homeImg       from "@/assets/home.png";
import investirImg   from "@/assets/investir.png";
import simulacoesImg from "@/assets/simulacoes.png";
import analisesImg   from "@/assets/analises.png";
import relatorioImg  from "@/assets/relatorio.png";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_BASE_URL ||
  "http://localhost:4000";

export default function PayWallPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function startCheckout() {
    const currentUser = user ?? (await waitForUser());
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${BACKEND_URL}/checkout/mercadopago/preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid }),
      });
      if (!resp.ok) throw new Error("Não foi possível iniciar o pagamento. Tente novamente.");
      const data = await resp.json();
      const checkoutUrl =
        process.env.NODE_ENV === "production"
          ? data.init_point
          : data.sandbox_init_point;
      if (!checkoutUrl) throw new Error("URL de checkout não encontrada.");
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err.message || "Erro inesperado. Tente novamente.");
      setLoading(false);
    }
  }

  async function waitForUser() {
    const { auth } = await import("../../lib/firebase");
    for (let i = 0; i < 15; i++) {
      if (auth.currentUser) return auth.currentUser;
      await new Promise((r) => setTimeout(r, 200));
    }
    return null;
  }

  function handleCTAClick(e) {
    e.preventDefault();
    pixelInitiateCheckout(); 
    if (user) {
      startCheckout();
    } else {
      setShowModal(true);
    }
  }

  function handleAuthSuccess() {
    pixelLead(); 
    setShowModal(false);
    startCheckout();
  }

  const CheckoutButton = ({ label }) => (
    <div className="cta-block">
      {error && <p className="error-msg">{error}</p>}
      <a
        href="#cta"
        className="btn-primary"
        onClick={handleCTAClick}
        aria-disabled={loading}
        style={{ opacity: loading ? 0.7 : 1, pointerEvents: loading ? "none" : "auto" }}
      >
        {loading ? "Aguarde..." : label || "Liberar acesso agora →"}
      </a>
      <div className="mp-trust">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Pagamento 100% seguro via Mercado Pago
      </div>
      <p className="btn-guarantee">7 dias de garantia · acesso liberado na hora</p>
    </div>
  );

  return (
    <>
      {/* Auth modal — rendered via React Portal, floats above everything */}
      {showModal && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* ══════════════════════════════════════════
          HERO
      ═════════════════════════════════════════════ */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge fade-up fade-up-1">
            🔥 Oferta especial — De R$39,99 por R$19,99
          </div>

          <h1 className="fade-up fade-up-2">
            Pare de adivinhar.<br />
            <em>Saiba exatamente</em><br />
            onde vai seu dinheiro.
          </h1>

          <p className="fade-up fade-up-3">
            Luna Finance transforma a bagunça financeira em clareza total —
            em minutos, não em planilhas.
          </p>

          <div className="hero-phone fade-up fade-up-3">
            <div className="hero-phone-glow" />
            <img src={homeImg} alt="Luna Finance — tela inicial" className="hero-phone-img" />
          </div>

          <div className="price-badge fade-up fade-up-3">
            <div className="price-de">De <s>R$ 39,99</s></div>
            <div className="price-main"><span>R$</span>19<span className="price-cents">,99</span></div>
            <div className="price-sub">PAGAMENTO ÚNICO · ACESSO VITALÍCIO</div>
          </div>

          <CheckoutButton label="Liberar acesso agora →" />
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          PROBLEMA
      ═════════════════════════════════════════════ */}
      <section className="problema">
        <div className="container">
          <p className="section-label">Você se reconhece nisso?</p>
          <h2>Fim do mês chegou.<br />O dinheiro sumiu.</h2>
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

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          COMO FUNCIONA
      ═════════════════════════════════════════════ */}
      <section className="como-funciona">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>Como funciona</p>
          <h2 style={{ textAlign: "center", fontSize: 24, marginBottom: 32 }}>
            Do pagamento ao acesso<br />em menos de 1 minuto.
          </h2>
          <div className="fluxo">
            <div className="fluxo-step">
              <div className="fluxo-num">1</div>
              <div className="fluxo-text">
                <strong>Clique em "Liberar acesso"</strong>
                <span>Criamos sua conta rapidinho — 30 segundos, sem complicação.</span>
              </div>
            </div>
            <div className="fluxo-line" />
            <div className="fluxo-step">
              <div className="fluxo-num">2</div>
              <div className="fluxo-text">
                <strong>Pague com cartão ou Pix</strong>
                <span>R$19,99 uma única vez. Sem assinar nada, sem dados bancários expostos.</span>
              </div>
            </div>
            <div className="fluxo-line" />
            <div className="fluxo-step">
              <div className="fluxo-num fluxo-num--accent">3</div>
              <div className="fluxo-text">
                <strong>Acesso liberado na hora ✓</strong>
                <span>Assim que o pagamento for confirmado, seu acesso vitalício é ativado automaticamente.</span>
              </div>
            </div>
          </div>
          <div className="mp-badge-large">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
            <span>Pagamento processado com segurança pelo <strong>Mercado Pago</strong> — a maior plataforma de pagamentos da América Latina</span>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* 1. Controle financeiro */}
      <section className="feature-showcase">
        <div className="container">
          <div className="showcase-text">
            <p className="section-label">Controle financeiro</p>
            <h2>Seu dinheiro,<br />numa só tela.</h2>
            <p>
              Veja patrimônio, sobra mensal, gastos e crescimento assim que abrir
              o app. Sem navegar, sem procurar — tudo no dashboard.
            </p>
            <ul className="showcase-checks">
              <li>Patrimônio projetado em tempo real</li>
              <li>Sobra mensal calculada automaticamente</li>
              <li>Gastos fixos e variáveis separados</li>
            </ul>
          </div>
          <div className="showcase-phone">
            <div className="showcase-glow showcase-glow--green" />
            <img src={homeImg} alt="Tela de controle financeiro" className="showcase-img" />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* 2. Investimentos */}
      <section className="feature-showcase feature-showcase--reverse">
        <div className="container">
          <div className="showcase-text">
            <p className="section-label">Investimentos</p>
            <h2>Veja sua carteira<br />crescer de verdade.</h2>
            <p>
              Monte sua carteira com CDI, Selic, CDB e FII. O app calcula o
              rendimento real com IR regressivo incluso — sem enganação.
            </p>
            <ul className="showcase-checks">
              <li>Composição da carteira por tipo</li>
              <li>Projeção de patrimônio mês a mês</li>
              <li>Cálculo de IR regressivo automático</li>
            </ul>
          </div>
          <div className="showcase-phone">
            <div className="showcase-glow showcase-glow--blue" />
            <img src={investirImg} alt="Tela de investimentos" className="showcase-img" />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* 3. Simulações */}
      <section className="feature-showcase">
        <div className="container">
          <div className="showcase-text">
            <p className="section-label">Simulações</p>
            <h2>E se eu guardar<br />R$200 a mais?</h2>
            <p>
              Simule diferentes cenários e veja o impacto no seu patrimônio.
              Decida com dados, não com achismo.
            </p>
            <ul className="showcase-checks">
              <li>Simulação de aportes mensais</li>
              <li>Comparação entre investimentos</li>
              <li>Projeção de metas financeiras</li>
            </ul>
          </div>
          <div className="showcase-phone">
            <div className="showcase-glow showcase-glow--purple" />
            <img src={simulacoesImg} alt="Tela de simulações" className="showcase-img" />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* 4. Análises */}
      <section className="feature-showcase feature-showcase--reverse">
        <div className="container">
          <div className="showcase-text">
            <p className="section-label">Análises</p>
            <h2>Entenda onde<br />o dinheiro foi.</h2>
            <p>
              Gráficos claros que mostram seus padrões de gasto, evolução do
              patrimônio e onde você pode melhorar.
            </p>
            <ul className="showcase-checks">
              <li>Gráficos de evolução mensal</li>
              <li>Análise de padrões de gasto</li>
              <li>Score de comportamento financeiro</li>
            </ul>
          </div>
          <div className="showcase-phone">
            <div className="showcase-glow showcase-glow--teal" />
            <img src={analisesImg} alt="Tela de análises" className="showcase-img" />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* 5. Relatório */}
      <section className="feature-showcase">
        <div className="container">
          <div className="showcase-text">
            <p className="section-label">Relatórios</p>
            <h2>Tudo registrado,<br />nada esquecido.</h2>
            <p>
              Exporte o resumo do mês em PDF com todos os lançamentos,
              metas e projeções. Perfeito para acompanhar a evolução.
            </p>
            <ul className="showcase-checks">
              <li>Exportação em PDF completa</li>
              <li>Histórico de lançamentos</li>
              <li>Resumo mensal detalhado</li>
            </ul>
          </div>
          <div className="showcase-phone">
            <div className="showcase-glow showcase-glow--orange" />
            <img src={relatorioImg} alt="Tela de relatório" className="showcase-img" />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          BENEFÍCIOS
      ═════════════════════════════════════════════ */}
      <section className="beneficios">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>O que você tem acesso</p>
          <h2>Tudo que você precisa.<br />Nada que você não precisa.</h2>
          <div className="benefit-grid">
            {[
              { icon: "📊", title: "Dashboard inteligente", desc: "Patrimônio, sobra e crescimento numa só tela." },
              { icon: "💳", title: "Fontes de pagamento",   desc: "Separe gastos por cartão, conta ou benefício." },
              { icon: "🎯", title: "Metas financeiras",     desc: "Define objetivos e acompanha o progresso mês a mês." },
              { icon: "📈", title: "Projeção de investimentos", desc: "CDI, Selic, CDB e FII com IR real calculado." },
              { icon: "🔔", title: "Alertas inteligentes",  desc: "Avisa antes do limite do cartão estourar." },
              { icon: "📄", title: "Relatório em PDF",      desc: "Exporta o mês completo para compartilhar." },
            ].map((b) => (
              <div key={b.title} className="benefit-item">
                <span className="b-icon">{b.icon}</span>
                <h4>{b.title}</h4>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          RESULTADO
      ═════════════════════════════════════════════ */}
      <section className="resultado">
        <div className="container">
          <p className="section-label">O que muda na prática</p>
          <h2>Em poucos dias você já sente a diferença.</h2>
          <p>Não é promessa — é o que acontece quando você para de adivinhar e começa a enxergar.</p>
          <div className="resultado-cards">
            {[
              { when: "No primeiro dia:", what: "você vê pela primeira vez para onde vai cada real que entra na sua conta." },
              { when: "Na primeira semana:", what: "você identifica os gastos que somem sem deixar rastro." },
              { when: "No final do mês:", what: "você chega com sobra — e sabe exatamente quanto pode investir." },
              { when: "Em 3 meses:", what: "você começa a ver seu patrimônio crescer de acordo com a projeção." },
            ].map((r) => (
              <div key={r.when} className="resultado-card">
                <div className="resultado-dot" />
                <p><strong>{r.when}</strong> {r.what}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          PREÇO
      ═════════════════════════════════════════════ */}
      <section className="preco">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center", marginBottom: 20 }}>Investimento único</p>
          <div className="preco-card">
            <div className="preco-desconto-badge">52% OFF — Oferta por tempo limitado</div>
            <div className="preco-tag">Acesso vitalício</div>
            <div className="preco-de-label">De <s>R$ 39,99</s> por apenas</div>
            <div className="preco-numero"><sup>R$</sup>19<span className="preco-cents">,99</span></div>
            <p className="preco-tipo">PAGAMENTO ÚNICO · SEM MENSALIDADE</p>
            <div className="preco-comparacoes">
              <div className="preco-comp">menos que um lanche no iFood</div>
              <div className="preco-comp">menos de R$0,06 por dia pelo acesso</div>
              <div className="preco-comp">menos que qualquer assinatura mensal de app</div>
            </div>
            <CheckoutButton label="Liberar acesso agora →" />
            <div className="selos">
              <div className="selo">🔒 Pagamento seguro</div>
              <div className="selo">⚡ Acesso imediato</div>
              <div className="selo">↩ 7 dias de garantia</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
      ═════════════════════════════════════════════ */}
      <section className="cta-final" id="cta">
        <div className="container">
          <h2>Chega de mês<br />terminando no <em>vermelho.</em></h2>
          <p>De R$39,99 por apenas R$19,99 — pagamento único, acesso para sempre.</p>
          <CheckoutButton label="Liberar acesso agora →" />
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          GARANTIA
      ═════════════════════════════════════════════ */}
      <section className="garantia">
        <div className="container">
          <div className="garantia-inner">
            <div className="garantia-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </div>
            <div className="garantia-text">
              <h3>Garantia de 7 dias</h3>
              <p>Não gostou? Devolvemos 100% do seu dinheiro sem burocracia, sem perguntas. Risco zero do seu lado.</p>
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