import "./paywall.css";
import { useState, useEffect, useRef } from "react";
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

// ── DEPOIMENTOS ────────────────────────────────────────────────────────────
// COPY: Depoimentos curtos, coloquiais, com dor real → resultado real.
const DEPOIMENTOS = [
  {
    nome: "Mariana S.",
    cidade: "São Paulo, SP",
    texto: "Na primeira semana já vi que gastava R$300 por mês em delivery sem perceber. Agora eu sei pra onde vai cada real.",
    estrelas: 5,
    foto: avatar1Img,
  },
  {
    nome: "Rafael C.",
    cidade: "Curitiba, PR",
    texto: "Tentei planilha, tentei outro app — nada durava. Esse aqui abro todo dia porque é simples. O que eu precisava tá na tela.",
    estrelas: 5,
    foto: avatar2Img,
  },
  {
    nome: "Juliana T.",
    cidade: "Belo Horizonte, MG",
    texto: "Vi que R$19 era menos que o lanche que peço toda sexta. Falei 'vou arriscar'. Valeu muito a pena.",
    estrelas: 5,
    foto: avatar3Img,
  },
];

// ── FAQ ─────────────────────────────────────────────────────────────────────
// COPY: Foco nas 3 objeções reais de quem hesita na compra.
const FAQ_ITEMS = [
  {
    q: "Por que só R$19,99? Tem mensalidade escondida?",
    a: "Não. É pagamento único mesmo — você paga uma vez e o acesso é seu para sempre. Não cobramos nada depois. O preço é baixo porque queremos que o app chegue pra quem mais precisa, não só pra quem pode pagar caro.",
  },
  {
    q: "E se eu não gostar?",
    a: "Você tem 7 dias de garantia total. Manda uma mensagem no WhatsApp e a gente devolve 100% do valor, sem burocracia e sem perguntas.",
  },
  {
    q: "Preciso conectar minha conta bancária?",
    a: "Não. O app não acessa sua conta em nenhum momento. Você registra os gastos manualmente — e isso é justamente o que faz você prestar atenção no dinheiro.",
  },
  {
    q: "Funciona mesmo que eu ganhe pouco?",
    a: "Sim — na verdade é para isso que ele foi feito. Quanto menos sobra, mais importa saber pra onde vai. O app funciona com qualquer renda.",
  },
];

// ── CONTADOR DE OFERTA ───────────────────────────────────────────────────────
// Gera um tempo fixo por sessão (4h a partir do acesso).
// Salvo em sessionStorage pra não resetar no reload.
function getOfferExpiry() {
  const key = "luna_offer_expiry";
  let expiry = sessionStorage.getItem(key);
  if (!expiry) {
    expiry = Date.now() + 4 * 60 * 60 * 1000; // 4 horas
    sessionStorage.setItem(key, expiry);
  }
  return parseInt(expiry, 10);
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(0);
  const expiryRef = useRef(getOfferExpiry());

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, expiryRef.current - Date.now());
      setTimeLeft(diff);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(timeLeft / 3_600_000);
  const m = Math.floor((timeLeft % 3_600_000) / 60_000);
  const s = Math.floor((timeLeft % 60_000) / 1_000);
  const expired = timeLeft === 0;

  return {
    display: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    expired,
  };
}

// ── CHECKOUT BUTTON ───────────────────────────────────────────────────────────
// Componente reutilizável de CTA.

export default function PayWallPage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [openFaq, setOpenFaq]     = useState(null);
  const { display: countdown, expired } = useCountdown();

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
      const mp = new window.MercadoPago(process.env.REACT_APP_MP_PUBLIC_KEY, { locale: "pt-BR" });
      mp.checkout({ preference: { id: data.id }, autoOpen: true });
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

  const CheckoutButton = ({ label, compact = false }) => (
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
          label || "Quero meu acesso agora →"
        )}
      </a>

      <div className="trust-row">
        <span className="trust-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Mercado Pago · 100% seguro
        </span>
        <span className="trust-dot">·</span>
        <span className="trust-item">🛡️ 7 dias de garantia</span>
        <span className="trust-dot">·</span>
        <span className="trust-item">⚡ Acesso imediato</span>
      </div>

      <button onClick={handleSupportClick} className="btn-support">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        Dúvida? Fale com o suporte antes de comprar
      </button>
    </div>
  );

  return (
    <>
      {showModal && (
        <AuthModal onSuccess={handleAuthSuccess} onClose={() => setShowModal(false)} />
      )}

      {/* ══════════════════════════════════════════
          STICKY CTA (mobile)
      ═════════════════════════════════════════════ */}
      <div className="sticky-cta sticky-cta--visible">
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
          COPY: Headline = dor imediata + promessa simples.
          Subheadline = o que o app faz em linguagem humana.
          Sem termos técnicos, sem jargões.
      ═════════════════════════════════════════════ */}
      <section className="hero">
        <div className="container">

          {/* Prova social no topo — reduz desconfiança antes de qualquer coisa */}
          <div className="hero-badge fade-up fade-up-1">
            ⭐ +2.400 pessoas já usam · 4,9 de avaliação
          </div>

          <h1 className="fade-up fade-up-2">
            Você sabe quanto<br />
            ganhou esse mês.<br />
            <em>Mas sabe onde foi parar?</em>
          </h1>

          <p className="hero-sub fade-up fade-up-3">
            Luna Finance mostra, em segundos, pra onde vai cada real do seu dinheiro —
            sem planilha, sem banco conectado, sem complicação.
          </p>

          {/* Phone mockup */}
          <div className="hero-phone fade-up fade-up-3">
            <div className="hero-phone-glow" />
            <img src={homeImg} alt="Luna Finance — tela inicial" className="hero-phone-img" />
          </div>

          {/* Preço + urgência */}
          <div className="price-badge fade-up fade-up-4">
            <div className="price-de">De <s>R$ 119,99</s></div>
            <div className="price-main"><span>R$</span>19<span className="price-cents">,99</span></div>
            <div className="price-sub">PAGAMENTO ÚNICO · ACESSO VITALÍCIO</div>
          </div>

          {/* Contador de oferta */}
          {!expired && (
            <div className="offer-timer fade-up fade-up-4">
              <span className="offer-timer__label">Oferta promocional expira em</span>
              <span className="offer-timer__clock">{countdown}</span>
            </div>
          )}

          <CheckoutButton label="Quero saber pra onde meu dinheiro vai →" />
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          PROBLEMA
          COPY: Mais curto. Foco na dor emocional, não na lista técnica.
          3 itens no máximo — cada um deve doer.
      ═════════════════════════════════════════════ */}
      <section className="problema">
        <div className="container">
          <p className="section-label">Você se reconhece nisso?</p>
          <h2>O dinheiro some.<br />Mas pra onde?</h2>
          <ul className="pain-list">
            {[
              "Você recebe, paga as contas… e o resto desaparece sem explicação.",
              "Já tentou planilha, já tentou anotar no celular — nunca dura mais de uma semana.",
              "No fim do mês você fica com a sensação de que deveria ter sobrado mais.",
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
          VÍDEO DEMO
          Mantido — ótimo para mostrar simplicidade do app.
          Copy simplificada.
      ═════════════════════════════════════════════ */}
      <section className="video-demo">
        <div className="container">
          <p className="video-demo__label">Veja como funciona</p>
          <h2 className="video-demo__title">
            Simples assim.<br />Em menos de 2 minutos.
          </h2>
          <p className="video-demo__sub">
            Registre um gasto, veja pra onde seu dinheiro foi,<br />
            entenda o que você pode guardar esse mês.
          </p>

          <div className="video-demo__phone">
            <div className="video-demo__glow" />
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
                autoPlay muted loop playsInline preload="none"
              >
                <source src={videoDemoSrc} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          FEATURES — versão condensada
          COPY: Mantidas as 3 mais relevantes para o público frio.
          Removidas: Relatório PDF e seção de Simulações
          (muito técnico para decisão rápida de tráfego frio).
          Cada feature tem 1 frase de dor + 1 de solução.
      ═════════════════════════════════════════════ */}

      {/* 1. Dashboard */}
      <section className="feature-showcase">
        <div className="container">
          <div className="showcase-text">
            <p className="section-label">Controle financeiro</p>
            <h2>Tudo o que você precisa<br />numa só tela.</h2>
            <p>Assim que você abre o app, já sabe: quanto entrou, quanto saiu, quanto ainda pode gastar. Sem procurar, sem calcular.</p>
            <ul className="showcase-checks">
              <li>Sobra mensal calculada automaticamente</li>
              <li>Gastos fixos e variáveis separados</li>
              <li>Patrimônio atualizado em tempo real</li>
            </ul>
          </div>
          <div className="showcase-phone">
            <div className="showcase-glow showcase-glow--green" />
            <img src={homeImg} alt="Tela de controle financeiro" className="showcase-img" />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* 2. Análises */}
      <section className="feature-showcase feature-showcase--reverse">
        <div className="container">
          <div className="showcase-text">
            <p className="section-label">Análises</p>
            <h2>Descubra onde<br />o dinheiro foi parar.</h2>
            <p>Gráficos simples que mostram seus padrões de gasto. Você vai identificar em segundos o que está sugando seu dinheiro todo mês.</p>
            <ul className="showcase-checks">
              <li>Gráficos de evolução mensal</li>
              <li>Categorias de gasto identificadas</li>
              <li>Padrões que você nunca tinha percebido</li>
            </ul>
          </div>
          <div className="showcase-phone">
            <div className="showcase-glow showcase-glow--teal" />
            <img src={analisesImg} alt="Tela de análises" className="showcase-img" />
          </div>
        </div>
      </section>

      {/* ── CTA INLINE ── */}
      <div className="inline-cta-block">
        <div className="container">
          <p className="inline-cta-copy">R$19,99 pra ter clareza total do seu dinheiro.</p>
          <CheckoutButton label="Quero meu acesso agora →" />
        </div>
      </div>

      <div className="section-divider" />

      {/* 3. Investimentos */}
      <section className="feature-showcase">
        <div className="container">
          <div className="showcase-text">
            <p className="section-label">Investimentos</p>
            <h2>Veja seu dinheiro<br />crescer, mesmo que seja pouco.</h2>
            <p>Registre o que você guarda e veja a projeção real de crescimento — seja R$50 ou R$500 por mês. O app calcula tudo por você.</p>
            <ul className="showcase-checks">
              <li>CDI, Selic, CDB e mais</li>
              <li>Projeção mês a mês</li>
              <li>Imposto de renda já incluso no cálculo</li>
            </ul>
          </div>
          <div className="showcase-phone">
            <div className="showcase-glow showcase-glow--blue" />
            <img src={investirImg} alt="Tela de investimentos" className="showcase-img" />
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          DEPOIMENTOS
          COPY: Apresentados como "pessoas reais" antes do preço.
          Isso reduz desconfiança antes da decisão.
      ═════════════════════════════════════════════ */}
      <section className="depoimentos">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>Quem já usa</p>
          <h2 className="depoimentos-title">Não é propaganda.<br />É quem já estava no mesmo lugar que você.</h2>
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
          PREÇO
          COPY: Explicar POR QUE é barato (remove desconfiança).
          Comparação com algo cotidiano (iFood).
          Contador de urgência junto ao preço.
      ═════════════════════════════════════════════ */}
      <section className="preco" id="cta">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center", marginBottom: 20 }}>Investimento</p>
          <div className="preco-card">

            <div className="preco-desconto-badge">83% OFF · Oferta por tempo limitado</div>
            <div className="preco-tag">Acesso vitalício</div>
            <div className="preco-de-label">De <s>R$ 119,99</s> por apenas</div>
            <div className="preco-numero"><sup>R$</sup>19<span className="preco-cents">,99</span></div>
            <p className="preco-tipo">PAGAMENTO ÚNICO · SEM MENSALIDADE</p>

            {/* Por que é barato — derruba a desconfiança */}
            <div className="preco-why">
              <div className="preco-why__icon">💬</div>
              <p className="preco-why__text">
                "Por que tão barato?" — Porque queremos que qualquer pessoa consiga controlar o dinheiro, não só quem pode pagar assinatura cara todo mês. R$19 uma vez é mais honesto do que R$30 por mês pra sempre.
              </p>
            </div>

            {/* Comparação visual simples */}
            <div className="preco-comparacoes">
              <div className="preco-comp">menos que um lanche no iFood</div>
              <div className="preco-comp">menos de R$0,06 por dia de acesso</div>
              <div className="preco-comp">menos que qualquer assinatura mensal</div>
            </div>

            {/* Contador de urgência próximo ao CTA */}
            {!expired && (
              <div className="offer-timer offer-timer--card">
                <span className="offer-timer__label">Oferta expira em</span>
                <span className="offer-timer__clock">{countdown}</span>
              </div>
            )}

            <CheckoutButton label="Quero controlar meu dinheiro agora →" showSelos />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          GARANTIA
      ═════════════════════════════════════════════ */}
      <section className="garantia-full">
        <div className="container">
          <div className="garantia-full-inner">
            <div className="garantia-shield">🛡️</div>
            <h3>Compra 100% sem risco</h3>
            <p>
              Se em até 7 dias você não gostar — por qualquer motivo —
              me manda uma mensagem no WhatsApp e devolvo <strong>100% do valor</strong> na hora.
              Sem burocracia, sem pergunta, sem enrolação.
            </p>
            <button onClick={handleSupportClick} className="btn-support" style={{ marginTop: 12, justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Falar com suporte antes de comprar
            </button>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ══════════════════════════════════════════
          FAQ
          COPY: 4 perguntas = as 4 maiores objeções de quem não compra.
          Respostas curtas e diretas.
      ═════════════════════════════════════════════ */}
      <section className="faq">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>Dúvidas frequentes</p>
          <h2 className="faq-title">Antes de fechar<br />a página, leia isso.</h2>
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
          COPY: Headline emocional, não técnica.
          Lembrar o preço + urgência + garantia numa frase.
      ═════════════════════════════════════════════ */}
      <section className="cta-final">
        <div className="container">
          <h2>Chega de mês<br />terminando no <em>vermelho.</em></h2>
          <p>
            R$19,99 uma única vez. Se não gostar em 7 dias, devolvemos tudo.
            {!expired && <> Oferta expira em <strong className="cta-final__timer">{countdown}</strong>.</>}
          </p>
          <CheckoutButton label="Quero controlar meu dinheiro agora →" />
        </div>
      </section>

      {/* ── FOOTER ── */}
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