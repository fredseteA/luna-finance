import "./paywall.css";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AuthModal from "../../components/auth/AuthModal";
import { pixelInitiateCheckout } from '@/lib/metaPixel';
import videoDemoSrc from "@/assets/videoDemo.mp4";

import avatar1Img from "@/assets/avatar1.png";
import avatar2Img from "@/assets/avatar2.png";
import avatar3Img from "@/assets/avatar3.png";

import homeImg       from "@/assets/home.png";
import investirImg   from "@/assets/investir.png";
import simulacoesImg from "@/assets/simulacoes.png";
import analisesImg   from "@/assets/analises.png";
import relatorioImg  from "@/assets/relatorio.png";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_BASE_URL ||
  "http://localhost:4000";

const SUPPORT_PHONE = "5522992080811";
const SUPPORT_MESSAGE = "Olá! Preciso de suporte com o Luna Finance.";

const DEPOIMENTOS = [
  {
    nome: "Mariana S.",
    cidade: "São Paulo, SP",
    texto: "comecei a usar sem acreditar muito não, achei que ia ser igual aos outros app que nunca usei de verdade. mas na primeira semana já vi que tava gastando quase R$300 por mês em delivery sem perceber. agora pelo menos eu sei pra onde tá indo",
    estrelas: 5,
    foto: avatar1Img,
  },
  {
    nome: "Rafael C.",
    cidade: "Curitiba, PR",
    texto: "po esse app é mão na roda demais. tentei planilha, tentei outro app, nada durava. esse aqui abro todo dia porque é simples, não tem aquela enrolação. o que eu precisava tá na tela, sem ficar procurando",
    estrelas: 5,
    foto: avatar2Img,
  },
  {
    nome: "Juliana T.",
    cidade: "Belo Horizonte, MG",
    texto: "o que me convenceu foi o cálculo do IR nos investimentos, nunca tinha visto isso em app nenhum gratuito. aí vi que R$19 era menos que o lanche que peço toda sexta, falei 'vou arriscar'. valeu a pena",
    estrelas: 5,
    foto: avatar3Img,
  },
];
// ── FAQ anti-objeção ──────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "É realmente pagamento único? Sem mensalidade?",
    a: "Sim. Você paga R$19,99 uma vez e o acesso é seu para sempre — mesmo que você troque de celular ou reinstale o app. Sem cobrança recorrente, sem surpresa no cartão.",
  },
  {
    q: "Como funciona a garantia de 7 dias?",
    a: "Se por qualquer motivo você não gostar, basta mandar uma mensagem no WhatsApp em até 7 dias após a compra. Devolvemos 100% do valor sem burocracia e sem perguntas.",
  },
  {
    q: "Preciso conectar minha conta bancária?",
    a: "Não. O Luna Finance não acessa sua conta bancária em nenhum momento. Você registra os lançamentos manualmente, o que dá muito mais consciência sobre seus gastos.",
  },
  {
    q: "Funciona para quem tem pouco dinheiro para investir?",
    a: "Sim — na verdade é exatamente para isso. O app mostra quanto você pode separar para investir e simula o crescimento mesmo com aportes pequenos, como R$50 ou R$100 por mês.",
  },
];

export default function PayWallPage() {
  const { user } = useAuth();
  const [showModal, setShowModal]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [openFaq, setOpenFaq]       = useState(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

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
      if (!data.id) throw new Error("Preferência de pagamento não encontrada.");

      const mp = new window.MercadoPago(process.env.REACT_APP_MP_PUBLIC_KEY, {
        locale: "pt-BR",
      });

      mp.checkout({
        preference: { id: data.id },
        autoOpen: true,
      });

    } catch (err) {
      setError(err.message || "Erro inesperado. Tente novamente.");
    } finally {
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
    if (user) startCheckout();
    else setShowModal(true);
  }

  function handleAuthSuccess() {
    setShowModal(false);
    startCheckout();
  }

  function handleSupportClick() {
    window.open(
      `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`,
      "_blank"
    );
  }

  // ── Botão de checkout reutilizável ─────────────────────────────────────
  const CheckoutButton = ({ label, showSelos = false, compact = false }) => (
    <div className="cta-block">
      {error && <p className="error-msg">{error}</p>}
      <a
        href="#cta"
        className={`btn-primary${compact ? " btn-primary--compact" : ""}`}
        onClick={handleCTAClick}
        aria-disabled={loading}
        style={{ opacity: loading ? 0.7 : 1, pointerEvents: loading ? "none" : "auto" }}
      >
        {loading ? (
          <span className="btn-loading">
            <span className="btn-spinner" />
            Aguarde...
          </span>
        ) : (
          label || "Liberar acesso agora →"
        )}
      </a>

      <div className="trust-row">
        <span className="trust-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          100% seguro · Mercado Pago
        </span>
        <span className="trust-dot">·</span>
        <span className="trust-item">↩ 7 dias de garantia</span>
        <span className="trust-dot">·</span>
        <span className="trust-item">⚡ Acesso imediato</span>
      </div>

      <button onClick={handleSupportClick} className="btn-support">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        Dúvidas? Fale com o suporte
      </button>
    </div>
  );

  return (
    <>
      {showModal && (
        <AuthModal onSuccess={handleAuthSuccess} onClose={() => setShowModal(false)} />
      )}

      {/* ── STICKY CTA (mobile) ────────────────────────────────────────── */}
      <div className={`sticky-cta${showSticky ? " sticky-cta--visible" : ""}`}>
        <div className="sticky-cta-inner">
          <div className="sticky-cta-price">
            <span className="sticky-de">R$119,99</span>
            <strong>R$19,99</strong>
            <span className="sticky-label">único</span>
          </div>
          <a
            href="#cta"
            className="btn-primary btn-primary--compact"
            onClick={handleCTAClick}
            style={{ opacity: loading ? 0.7 : 1, pointerEvents: loading ? "none" : "auto" }}
          >
            {loading ? "Aguarde..." : "Liberar acesso →"}
          </a>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          HERO
      ═════════════════════════════════════════════ */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge fade-up fade-up-1">
            🔥 Oferta especial — De R$119,99 por R$19,99
          </div>

          <h1 className="fade-up fade-up-2">
            Pare de chegar no<br />
            fim do mês sem<br />
            <em>saber o que aconteceu.</em>
          </h1>

          <p className="hero-sub fade-up fade-up-3">
            Luna Finance transforma a bagunça financeira em clareza total —
            em minutos, não em planilhas.
          </p>

          <div className="hero-phone fade-up fade-up-3">
            <div className="hero-phone-glow" />
            <img src={homeImg} alt="Luna Finance — tela inicial" className="hero-phone-img" />
          </div>

          {/* Social proof rápida acima do preço */}
          <div className="hero-social-proof fade-up fade-up-3">
            <div className="star-row">★★★★★</div>
            <span>+2.400 pessoas já controlam as finanças com o Luna</span>
          </div>

          <div className="price-badge fade-up fade-up-4">
            <div className="price-de">De <s>R$ 119,99</s></div>
            <div className="price-main"><span>R$</span>19<span className="price-cents">,99</span></div>
            <div className="price-sub">PAGAMENTO ÚNICO · ACESSO VITALÍCIO</div>
          </div>

          <CheckoutButton label="Quero controlar meu dinheiro agora →" />
        </div>
      </section>

      <div className="section-divider" />
      
      {/* ══════════════════════════════════════════
          VÍDEO DEMO
      ═════════════════════════════════════════════ */}
      <section className="video-demo">
        <div className="container">
          <p className="video-demo__label">Veja ao vivo</p>
          <h2 className="video-demo__title">
            Do zero ao controle<br />em menos de 2 minutos.
          </h2>
          <p className="video-demo__sub">
            Veja como é simples registrar gastos,<br />acompanhar investimentos e entender seu dinheiro.
          </p>
      
          <div className="video-demo__phone">
            <div className="video-demo__glow" />
      
            {/* Badge flutuante esquerda */}
            <div className="video-demo__badges">
              <div className="video-demo__badge video-demo__badge--left">
                <div className="video-demo__badge-dot" />
                Gastos em tempo real
              </div>
              <div className="video-demo__badge video-demo__badge--right">
                <div className="video-demo__badge-dot" />
                Análise automática
              </div>
            </div>
      
            <div className="video-demo__frame">
              <div className="video-demo__notch" />
              <video
                className="video-demo__video"
                autoPlay
                muted
                loop
                playsInline
                preload="none"
              >
                <source src={videoDemoSrc} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>
      

      {/* ══════════════════════════════════════════
          PROBLEMA
      ═════════════════════════════════════════════ */}
      <section className="problema">
        <div className="container">
          <p className="section-label">Você se reconhece nisso?</p>
          <h2>Fim do mês chegou.<br />O dinheiro sumiu.</h2>
          <ul className="pain-list">
            {[
              "Você ganha, paga as contas, e o que sobra some — sem saber para onde foi.",
              "Você tenta controlar pelo extrato bancário, mas é impossível entender o padrão.",
              "Já tentou planilha, já tentou app complicado — nada grudou por mais de uma semana.",
              "Você sente que deveria estar guardando mais, mas não sabe exatamente quanto nem como.",
            ].map((txt, i) => (
              <li key={i} className="pain-item">
                <div className="pain-icon">✕</div>
                {txt}
              </li>
            ))}
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
            {[
              { n: "1", title: "Clique em \"Liberar acesso\"", desc: "Criamos sua conta rapidinho — 30 segundos, sem complicação." },
              { n: "2", title: "Pague com cartão ou Pix", desc: "R$19,99 uma única vez. Sem assinar nada, sem dados bancários expostos." },
              { n: "3", title: "Acesso liberado na hora ✓", desc: "Assim que o pagamento for confirmado, seu acesso vitalício é ativado automaticamente.", accent: true },
            ].map((step, i) => (
              <div key={i}>
                <div className="fluxo-step">
                  <div className={`fluxo-num${step.accent ? " fluxo-num--accent" : ""}`}>{step.n}</div>
                  <div className="fluxo-text">
                    <strong>{step.title}</strong>
                    <span>{step.desc}</span>
                  </div>
                </div>
                {i < 2 && <div className="fluxo-line" />}
              </div>
            ))}
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

      {/* ══════════════════════════════════════════
          FEATURES (com CTA inline após cada 2)
      ═════════════════════════════════════════════ */}

      {/* 1. Controle financeiro */}
      <section className="feature-showcase">
        <div className="container">
          <div className="showcase-text">
            <p className="section-label">Controle financeiro</p>
            <h2>Seu dinheiro,<br />numa só tela.</h2>
            <p>Veja patrimônio, sobra mensal, gastos e crescimento assim que abrir o app. Sem navegar, sem procurar — tudo no dashboard.</p>
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
            <p>Monte sua carteira com CDI, Selic, CDB e FII. O app calcula o rendimento real com IR regressivo incluso — sem enganação.</p>
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

      {/* ── CTA INLINE #1 ── */}
      <div className="inline-cta-block">
        <div className="container">
          <p className="inline-cta-copy">Pronto para sair do achismo?</p>
          <CheckoutButton label="Quero começar agora →" />
        </div>
      </div>

      <div className="section-divider" />

      {/* 3. Simulações */}
      <section className="feature-showcase">
        <div className="container">
          <div className="showcase-text">
            <p className="section-label">Simulações</p>
            <h2>E se eu guardar<br />R$200 a mais?</h2>
            <p>Simule diferentes cenários e veja o impacto no seu patrimônio. Decida com dados, não com achismo.</p>
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
            <p>Gráficos claros que mostram seus padrões de gasto, evolução do patrimônio e onde você pode melhorar.</p>
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
            <p>Exporte o resumo do mês em PDF com todos os lançamentos, metas e projeções. Perfeito para acompanhar a evolução.</p>
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
          DEPOIMENTOS — seção mais importante nova
      ═════════════════════════════════════════════ */}
      <section className="depoimentos">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>O que dizem quem já usa</p>
          <h2 className="depoimentos-title">Pessoas reais.<br />Resultado real.</h2>
          <div className="depoimentos-list">
            {DEPOIMENTOS.map((d, i) => (
              <div key={i} className="depoimento-card">
                <div className="depoimento-header">
                  <img
                    src={d.foto}
                    alt={d.nome}
                    className="depoimento-avatar"
                    style={{ objectFit: "cover", borderRadius: "50%" }}
                  />
                  <div>
                    <div className="depoimento-nome">{d.nome}</div>
                    <div className="depoimento-cidade">{d.cidade}</div>
                  </div>
                  <div className="depoimento-stars">{"★".repeat(d.estrelas)}</div>
                </div>
                <p className="depoimento-texto">"{d.texto}"</p>
              </div>
            ))}
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
              { icon: "📊", title: "Dashboard inteligente",      desc: "Patrimônio, sobra e crescimento numa só tela." },
              { icon: "💳", title: "Fontes de pagamento",         desc: "Separe gastos por cartão, conta ou benefício." },
              { icon: "🎯", title: "Metas financeiras",           desc: "Define objetivos e acompanha o progresso mês a mês." },
              { icon: "📈", title: "Projeção de investimentos",   desc: "CDI, Selic, CDB e FII com IR real calculado." },
              { icon: "🔔", title: "Alertas inteligentes",        desc: "Avisa antes do limite do cartão estourar." },
              { icon: "📄", title: "Relatório em PDF",            desc: "Exporta o mês completo para compartilhar." },
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
              { when: "No primeiro dia:",    what: "você vê pela primeira vez para onde vai cada real que entra na sua conta." },
              { when: "Na primeira semana:", what: "você identifica os gastos que somem sem deixar rastro." },
              { when: "No final do mês:",    what: "você chega com sobra — e sabe exatamente quanto pode investir." },
              { when: "Em 3 meses:",         what: "você começa a ver seu patrimônio crescer de acordo com a projeção." },
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
      <section className="preco" id="cta">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center", marginBottom: 20 }}>Investimento único</p>
          <div className="preco-card">
            <div className="preco-desconto-badge">83% OFF — Oferta por tempo limitado</div>
            <div className="preco-tag">Acesso vitalício</div>
            <div className="preco-de-label">De <s>R$ 119,99</s> por apenas</div>
            <div className="preco-numero"><sup>R$</sup>19<span className="preco-cents">,99</span></div>
            <p className="preco-tipo">PAGAMENTO ÚNICO · SEM MENSALIDADE</p>

            {/* Comparação visual */}
            <div className="preco-comparacoes">
              <div className="preco-comp">menos que um lanche no iFood</div>
              <div className="preco-comp">menos de R$0,06 por dia pelo acesso</div>
              <div className="preco-comp">menos que qualquer assinatura mensal de app</div>
            </div>

            {/* Comparação com concorrentes */}
            <div className="vs-table">
              <div className="vs-row vs-header">
                <span>Recurso</span>
                <span className="vs-luna">Luna</span>
                <span className="vs-outros">Apps grátis</span>
              </div>
              {[
                ["IR regressivo automático", true, false],
                ["Projeção de patrimônio", true, false],
                ["Sem anúncios", true, false],
                ["Pagamento único", true, false],
                ["Dashboard completo", true, "parcial"],
              ].map(([feat, luna, outros]) => (
                <div key={feat} className="vs-row">
                  <span>{feat}</span>
                  <span className="vs-luna">{luna === true ? "✓" : luna}</span>
                  <span className="vs-outros">{outros === false ? "✕" : outros}</span>
                </div>
              ))}
            </div>

            <CheckoutButton label="Quero controlar meu dinheiro agora →" showSelos={true} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          GARANTIA — seção dedicada
      ═════════════════════════════════════════════ */}
      <section className="garantia-full">
        <div className="container">
          <div className="garantia-full-inner">
            <div className="garantia-shield">🛡️</div>
            <h3>Garantia incondicional de 7 dias</h3>
            <p>
              Compre hoje com total segurança. Se por qualquer motivo você não gostar —
              ou simplesmente mudar de ideia — basta me mandar uma mensagem no WhatsApp
              em até 7 dias após a compra. Devolvo <strong>100% do seu dinheiro</strong>,
              sem burocracia, sem perguntas. O risco é zero do seu lado.
            </p>
            <button onClick={handleSupportClick} className="btn-support" style={{ marginTop: 12 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Falar com suporte via WhatsApp
            </button>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          FAQ — elimina objeções
      ═════════════════════════════════════════════ */}
      <section className="faq">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>Dúvidas frequentes</p>
          <h2 className="faq-title">Antes de ir embora,<br />leia isso.</h2>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={`faq-item${openFaq === i ? " faq-item--open" : ""}`}>
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{item.q}</span>
                  <span className="faq-chevron">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && <p className="faq-answer">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          CTA FINAL
      ═════════════════════════════════════════════ */}
      <section className="cta-final">
        <div className="container">
          <h2>Chega de mês<br />terminando no <em>vermelho.</em></h2>
          <p>De R$119,99 por apenas R$19,99 — pagamento único, acesso para sempre.</p>
          <CheckoutButton label="Quero controlar meu dinheiro agora →" showSelos={true} />
        </div>
      </section>

      <footer className="footer">
        <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <span>Luna Finance · Todos os direitos reservados</span>
          <button onClick={handleSupportClick} className="footer-support-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Suporte via WhatsApp
          </button>
        </div>
      </footer>
    </>
  );
}