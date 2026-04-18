// CheckoutBricks.jsx
import { useEffect, useRef, useState } from "react";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_BASE_URL ||
  "http://localhost:4000";

const BRICK_CUSTOM_VARIABLES = {
  textPrimaryColor:   "#f0faf6",
  textSecondaryColor: "#7ab89a",
  inputBackgroundColor: "#162620",
  formBackgroundColor:  "#0e1a16",
  baseColor:            "#1D9E75",
  baseColorFirstVariant:  "#188661",
  baseColorSecondVariant: "#0e4a35",
  errorColor:   "#e24b4a",
  successColor: "#1D9E75",
  warningColor: "#f59e0b",
  outlinePrimaryColor:   "#5DCAA5",
  outlineSecondaryColor: "rgba(93,202,165,0.3)",
  borderRadiusSmall:  "8px",
  borderRadiusMedium: "12px",
  borderRadiusLarge:  "14px",
  borderRadiusFull:   "100px",
  fontSizeExtraSmall: "11px",
  fontSizeSmall:      "13px",
  fontSizeMedium:     "14px",
  fontSizeLarge:      "16px",
  fontWeightNormal:   "400",
  fontWeightSemiBold: "600",
};

export default function CheckoutBricks({ uid, onClose }) {
  const wrapperRef    = useRef(null);
  const pixRef        = useRef(null); // ← ref pro bloco do QR code
  const controllerRef = useRef(null);
  const [status, setStatus]   = useState("loading");
  const [pixData, setPixData] = useState(null);
  const [copied, setCopied]   = useState(false); // ← estado do feedback de cópia

  // Scroll até o checkout quando abrir
  useEffect(() => {
    setTimeout(() => {
      wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  // Scroll até o QR code quando aparecer
  useEffect(() => {
    if (pixData) {
      setTimeout(() => {
        pixRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
    }
  }, [pixData]);

  function handleCopy() {
    navigator.clipboard.writeText(pixData.qrCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (!window.MercadoPago) await loadSDK();

        const resp = await fetch(`${BACKEND_URL}/checkout/mercadopago/preference`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });
        if (!resp.ok) throw new Error("Erro ao criar preferência");
        const { id: preferenceId } = await resp.json();
        if (!preferenceId) throw new Error("Preferência inválida");
        if (cancelled) return;

        const mp = new window.MercadoPago(process.env.REACT_APP_MP_PUBLIC_KEY, {
          locale: "pt-BR",
        });

        controllerRef.current = await mp.bricks().create(
          "payment",
          "checkout-bricks-container",
          {
            initialization: {
              amount: 19.99,
              preferenceId,
            },
            customization: {
              paymentMethods: {
                ticket:       "all",
                bankTransfer: "all",
                creditCard:   "all",
                debitCard:    "all",
                mercadoPago:  "all",
              },
              visual: {
                hideFormTitle: true,
                style: {
                  theme: "dark",
                  customVariables: BRICK_CUSTOM_VARIABLES,
                },
              },
            },
            callbacks: {
              onReady: () => {
                if (!cancelled) setStatus("ready");
              },
              onError: (error) => {
                console.error("[CheckoutBricks]", error);
                if (!cancelled) setStatus("error");
              },
              onSubmit: ({ formData }) =>
                new Promise((resolve, reject) => {
                  fetch(`${BACKEND_URL}/checkout/mercadopago/process`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ formData, uid }),
                  })
                    .then((r) => r.json())
                    .then((payment) => {
                      if (payment?.error) { reject(payment.error); return; }
                      const pix = payment?.point_of_interaction?.transaction_data;
                      if (pix?.qr_code) {
                        setPixData({
                          qrCode: pix.qr_code,
                          qrCodeBase64: pix.qr_code_base64,
                        });
                      }
                      resolve(payment);
                    })
                    .catch(reject);
                }),
            },
          }
        );

        if (cancelled) controllerRef.current?.unmount();
      } catch (err) {
        console.error("[CheckoutBricks] init:", err);
        if (!cancelled) setStatus("error");
      }
    }

    init();
    return () => {
      cancelled = true;
      controllerRef.current?.unmount?.();
    };
  }, [uid]);

  return (
    <div ref={wrapperRef} style={s.wrapper}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style={s.headerTitle}>Pagamento seguro · Mercado Pago</span>
        </div>
        <button onClick={onClose} style={s.closeBtn} aria-label="Fechar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Preço */}
      <div style={s.priceBar}>
        <span style={s.priceBarLabel}>Luna Finance — Acesso vitalício</span>
        <div style={s.priceBarRight}>
          <s style={s.priceOld}>R$119,99</s>
          <strong style={s.priceNew}>R$19,99</strong>
          <span style={s.priceBadge}>ÚNICO</span>
        </div>
      </div>

      {/* Brick */}
      <div style={s.brickWrap}>
        {status === "loading" && (
          <div style={s.centered}>
            <div style={s.spinner} />
            <p style={s.mutedText}>Carregando formas de pagamento...</p>
          </div>
        )}
        {status === "error" && (
          <div style={s.centered}>
            <p style={s.errorText}>Erro ao carregar o checkout.</p>
            <button onClick={() => window.location.reload()} style={s.retryBtn}>
              Tentar novamente
            </button>
          </div>
        )}
        <div
          id="checkout-bricks-container"
          style={{ display: status === "ready" ? "block" : "none" }}
        />
      </div>

      {/* QR Code Pix */}
      {pixData && (
        <div ref={pixRef} style={s.pixWrap}>
          <div style={s.pixHeader}>
            <span style={s.pixIcon}>✅</span>
            <div>
              <p style={s.pixTitle}>Pix gerado com sucesso!</p>
              <p style={s.pixSub}>Escaneie o QR Code ou copie o código abaixo</p>
            </div>
          </div>
          <img
            src={`data:image/png;base64,${pixData.qrCodeBase64}`}
            alt="QR Code Pix"
            style={s.pixQr}
          />
          <button onClick={handleCopy} style={{
            ...s.pixCopy,
            background: copied ? "rgba(29,158,117,0.3)" : "rgba(29,158,117,0.15)",
            borderColor: copied ? "rgba(93,202,165,0.5)" : "rgba(93,202,165,0.25)",
          }}>
            {copied ? "✓ Código copiado!" : "Copiar código Pix"}
          </button>
          <p style={s.pixNote}>
            Após o pagamento, seu acesso é liberado automaticamente.
          </p>
        </div>
      )}

      {/* Trust strip */}
      <div style={s.trustStrip}>
        <span style={s.trustItem}>🛡️ 7 dias de garantia</span>
        <span style={s.dot}>·</span>
        <span style={s.trustItem}>⚡ Acesso imediato</span>
        <span style={s.dot}>·</span>
        <span style={s.trustItem}>🔒 SSL 256 bits</span>
      </div>
    </div>
  );
}

function loadSDK() {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="mercadopago"]')) {
      const t = setInterval(() => {
        if (window.MercadoPago) { clearInterval(t); resolve(); }
      }, 100);
      return;
    }
    const sc = document.createElement("script");
    sc.src = "https://sdk.mercadopago.com/js/v2";
    sc.async = true;
    sc.onload = resolve;
    sc.onerror = reject;
    document.body.appendChild(sc);
  });
}

const s = {
  wrapper: {
    background: "#0e1a16",
    border: "1px solid rgba(93,202,165,0.2)",
    borderRadius: "16px",
    overflow: "hidden",
    marginTop: "12px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    background: "rgba(29,158,117,0.06)",
    borderBottom: "1px solid rgba(93,202,165,0.1)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },
  headerTitle: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: "0.02em",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#7ab89a",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    borderRadius: "6px",
    opacity: 0.7,
  },
  priceBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderBottom: "1px solid rgba(93,202,165,0.08)",
    gap: "8px",
    flexWrap: "wrap",
  },
  priceBarLabel: {
    fontSize: "12px",
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
  },
  priceBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
  },
  priceOld: {
    fontSize: "11px",
    color: "rgba(226,75,74,0.7)",
    textDecoration: "line-through",
    fontFamily: "'DM Sans', sans-serif",
  },
  priceNew: {
    fontFamily: "'Sora', sans-serif",
    fontSize: "16px",
    fontWeight: 800,
    color: "#fff",
  },
  priceBadge: {
    background: "rgba(29,158,117,0.15)",
    border: "1px solid rgba(93,202,165,0.2)",
    borderRadius: "100px",
    padding: "2px 7px",
    fontSize: "9px",
    fontWeight: 700,
    color: "#5DCAA5",
    letterSpacing: "0.06em",
    fontFamily: "'DM Sans', sans-serif",
  },
  brickWrap: {
    padding: "16px",
    minHeight: "100px",
  },
  centered: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    padding: "24px 0",
  },
  spinner: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "2.5px solid rgba(93,202,165,0.15)",
    borderTop: "2.5px solid #1D9E75",
    animation: "spin 0.7s linear infinite",
  },
  mutedText: {
    fontSize: "12px",
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
    margin: 0,
  },
  errorText: {
    fontSize: "12px",
    color: "#e24b4a",
    fontFamily: "'DM Sans', sans-serif",
    margin: 0,
    textAlign: "center",
  },
  retryBtn: {
    background: "rgba(29,158,117,0.12)",
    border: "1px solid rgba(93,202,165,0.2)",
    borderRadius: "8px",
    padding: "8px 16px",
    color: "#5DCAA5",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  // QR Code Pix
  pixWrap: {
    padding: "20px 16px",
    borderTop: "1px solid rgba(93,202,165,0.15)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
    background: "rgba(29,158,117,0.04)",
  },
  pixHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    alignSelf: "flex-start",
  },
  pixIcon: {
    fontSize: "20px",
    flexShrink: 0,
  },
  pixTitle: {
    fontFamily: "'Sora', sans-serif",
    fontSize: "14px",
    fontWeight: 700,
    color: "#fff",
    margin: 0,
    lineHeight: 1.3,
  },
  pixSub: {
    fontSize: "12px",
    color: "#7ab89a",
    margin: 0,
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.4,
  },
  pixQr: {
    width: "200px",
    height: "200px",
    borderRadius: "12px",
    border: "2px solid rgba(93,202,165,0.2)",
    background: "#fff",
    padding: "8px",
  },
  pixCopy: {
    borderRadius: "10px",
    padding: "12px 20px",
    color: "#5DCAA5",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    transition: "background 0.2s, border-color 0.2s",
    letterSpacing: "0.01em",
  },
  pixNote: {
    fontSize: "11px",
    color: "#7ab89a",
    margin: 0,
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "center",
    opacity: 0.8,
  },
  // Trust strip
  trustStrip: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    flexWrap: "wrap",
    padding: "10px 16px 12px",
    borderTop: "1px solid rgba(93,202,165,0.08)",
  },
  trustItem: {
    fontSize: "10px",
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
  },
  dot: {
    fontSize: "10px",
    color: "rgba(93,202,165,0.2)",
  },
};