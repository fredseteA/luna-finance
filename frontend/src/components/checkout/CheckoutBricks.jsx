// CheckoutBricks.jsx
// Renderiza o checkout do Mercado Pago Bricks diretamente na paywall.
// O usuário não sai da página — o brick abre como um accordion abaixo do botão.

import { useEffect, useRef, useState } from "react";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_BACKEND_BASE_URL ||
  "http://localhost:4000";

export default function CheckoutBricks({ uid, onClose }) {
  const brickRef = useRef(null);
  const controllerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1. Garante que o SDK do MP está carregado
        if (!window.MercadoPago) {
          await loadSDK();
        }

        // 2. Cria preferência no backend
        const resp = await fetch(`${BACKEND_URL}/checkout/mercadopago/preference`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });
        if (!resp.ok) throw new Error("Erro ao criar preferência");
        const { id: preferenceId } = await resp.json();
        if (!preferenceId) throw new Error("Preferência inválida");
        if (cancelled) return;

        // 3. Inicializa o MP e monta o brick
        const mp = new window.MercadoPago(process.env.REACT_APP_MP_PUBLIC_KEY, {
          locale: "pt-BR",
        });

        const bricksBuilder = mp.bricks();

        controllerRef.current = await bricksBuilder.create(
          "payment",
          "checkout-bricks-container",
          {
            initialization: {
              amount: 19.99,
              preferenceId,
            },
            customization: {
              paymentMethods: {
                ticket: "all",         // boleto
                bankTransfer: "all",   // pix
                creditCard: "all",
                debitCard: "all",
                mercadoPago: "all",    // carteira MP
              },
              visual: {
                style: {
                  theme: "dark",
                  customVariables: {
                    // Fundo e containers
                    formBackgroundColor:        "#1a2e26",
                    baseColor:                  "#1D9E75",
                    inputBackgroundColor:        "#162620",
                    inputBorderColor:            "rgba(93,202,165,0.2)",
                    inputFocusedBorderColor:     "#5DCAA5",
                    inputTextColor:              "#f0faf6",
                    inputPlaceholderColor:       "#7ab89a",
                    labelTextColor:              "#7ab89a",
                    textPrimaryColor:            "#f0faf6",
                    textSecondaryColor:          "#7ab89a",
                    // Botão de pagamento
                    buttonTextColor:             "#ffffff",
                    buttonBackground:            "#1D9E75",
                    buttonHoverBackground:       "#188661",
                    buttonDisabledBackground:    "#0e4a35",
                    buttonDisabledTextColor:     "rgba(255,255,255,0.4)",
                    // Bordas e raios
                    borderRadiusSmall:           "8px",
                    borderRadiusMedium:          "12px",
                    borderRadiusLarge:           "14px",
                    borderRadiusFull:            "100px",
                    // Outline e erros
                    outlinePrimaryColor:         "#5DCAA5",
                    outlineSecondaryColor:       "rgba(93,202,165,0.3)",
                    errorColor:                  "#e24b4a",
                    warningColor:                "#f59e0b",
                    successColor:                "#1D9E75",
                  },
                },
              },
            },
            callbacks: {
              onReady: () => {
                if (!cancelled) setStatus("ready");
              },
              onError: (error) => {
                console.error("[CheckoutBricks] error:", error);
                if (!cancelled) setStatus("error");
              },
              onSubmit: ({ selectedPaymentMethod, formData }) => {
                // O Bricks envia o pagamento direto para o MP
                // O webhook cuida do resto (setUserPremium)
                return new Promise((resolve, reject) => {
                  fetch(`${BACKEND_URL}/checkout/mercadopago/process`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ formData, uid }),
                  })
                    .then((r) => r.json())
                    .then((data) => {
                      if (data?.error) reject(data.error);
                      else resolve(data);
                    })
                    .catch(reject);
                });
              },
            },
          }
        );

        if (cancelled) controllerRef.current?.unmount();
      } catch (err) {
        console.error("[CheckoutBricks] init error:", err);
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
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.lockIcon}>🔒</span>
          <div>
            <p style={styles.headerTitle}>Pagamento seguro</p>
            <p style={styles.headerSub}>Processado pelo Mercado Pago · SSL 256 bits</p>
          </div>
        </div>
        <button onClick={onClose} style={styles.closeBtn} aria-label="Fechar checkout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Price reminder */}
      <div style={styles.priceReminder}>
        <span style={styles.priceLabel}>Luna Finance — Acesso vitalício</span>
        <div style={styles.priceValue}>
          <span style={styles.priceFrom}>De <s style={{ color: "#e24b4a" }}>R$119,99</s></span>
          <span style={styles.priceMain}>R$19,99</span>
          <span style={styles.priceBadge}>ÚNICO</span>
        </div>
      </div>

      {/* Brick container */}
      <div style={styles.brickContainer}>
        {status === "loading" && (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Carregando formas de pagamento...</p>
          </div>
        )}

        {status === "error" && (
          <div style={styles.errorWrap}>
            <p style={styles.errorText}>Erro ao carregar o checkout. Tente novamente.</p>
            <button onClick={() => window.location.reload()} style={styles.retryBtn}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* O brick do MP é montado aqui */}
        <div
          id="checkout-bricks-container"
          ref={brickRef}
          style={{ display: status === "ready" ? "block" : "none" }}
        />
      </div>

      {/* Trust strip */}
      <div style={styles.trustStrip}>
        <span style={styles.trustItem}>🛡️ 7 dias de garantia</span>
        <span style={styles.trustDot}>·</span>
        <span style={styles.trustItem}>⚡ Acesso imediato</span>
        <span style={styles.trustDot}>·</span>
        <span style={styles.trustItem}>🔒 Pagamento seguro</span>
      </div>
    </div>
  );
}

// Carrega o SDK do MP dinamicamente se ainda não estiver na página
function loadSDK() {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="mercadopago"]')) {
      const interval = setInterval(() => {
        if (window.MercadoPago) { clearInterval(interval); resolve(); }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

const styles = {
  wrapper: {
    background: "#1a2e26",
    border: "1px solid rgba(93,202,165,0.25)",
    borderRadius: "20px",
    overflow: "hidden",
    marginTop: "16px",
    animation: "fadeUp 0.3s ease both",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(93,202,165,0.12)",
    background: "rgba(29,158,117,0.06)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  lockIcon: {
    fontSize: "18px",
  },
  headerTitle: {
    fontFamily: "'Sora', sans-serif",
    fontSize: "13px",
    fontWeight: 700,
    color: "#f0faf6",
    margin: 0,
    lineHeight: 1.3,
  },
  headerSub: {
    fontSize: "11px",
    color: "#7ab89a",
    margin: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  closeBtn: {
    background: "rgba(93,202,165,0.08)",
    border: "1px solid rgba(93,202,165,0.15)",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#7ab89a",
    padding: 0,
    flexShrink: 0,
  },
  priceReminder: {
    padding: "14px 20px",
    borderBottom: "1px solid rgba(93,202,165,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  priceLabel: {
    fontSize: "13px",
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
  },
  priceValue: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  priceFrom: {
    fontSize: "11px",
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
  },
  priceMain: {
    fontFamily: "'Sora', sans-serif",
    fontSize: "18px",
    fontWeight: 800,
    color: "#fff",
  },
  priceBadge: {
    background: "rgba(29,158,117,0.15)",
    border: "1px solid rgba(93,202,165,0.25)",
    borderRadius: "100px",
    padding: "2px 8px",
    fontSize: "10px",
    fontWeight: 700,
    color: "#5DCAA5",
    letterSpacing: "0.06em",
    fontFamily: "'DM Sans', sans-serif",
  },
  brickContainer: {
    padding: "20px",
    minHeight: "120px",
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "32px 0",
  },
  spinner: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "3px solid rgba(93,202,165,0.2)",
    borderTop: "3px solid #1D9E75",
    animation: "spin 0.7s linear infinite",
  },
  loadingText: {
    fontSize: "13px",
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
    margin: 0,
  },
  errorWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "24px 0",
  },
  errorText: {
    fontSize: "13px",
    color: "#e24b4a",
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "center",
    margin: 0,
  },
  retryBtn: {
    background: "rgba(29,158,117,0.15)",
    border: "1px solid rgba(93,202,165,0.25)",
    borderRadius: "10px",
    padding: "10px 20px",
    color: "#5DCAA5",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  trustStrip: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flexWrap: "wrap",
    padding: "12px 20px 16px",
    borderTop: "1px solid rgba(93,202,165,0.1)",
  },
  trustItem: {
    fontSize: "11px",
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
  },
  trustDot: {
    fontSize: "11px",
    color: "rgba(93,202,165,0.2)",
  },
};
