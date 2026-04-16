import { useState } from "react";
import { createPortal } from "react-dom";
import { updateProfile } from "firebase/auth";
import { useAuth } from "../../contexts/AuthContext";
import { auth } from "../../lib/firebase";

const validatePassword = (password) => {
  const rules = [
    { test: /.{8,}/, label: "Mínimo 8 caracteres" },
    { test: /[A-Z]/, label: "1 letra maiúscula" },
    { test: /[a-z]/, label: "1 letra minúscula" },
    { test: /[0-9]/, label: "1 número" },
    { test: /[^A-Za-z0-9]/, label: "1 caractere especial" },
  ];
  return rules.map((r) => ({ label: r.label, valid: r.test.test(password) }));
};

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "Este email já está cadastrado.",
  "auth/invalid-email": "Email inválido.",
  "auth/wrong-password": "Senha incorreta.",
  "auth/invalid-credential": "Email ou senha incorretos.",
  "auth/user-not-found": "Usuário não encontrado.",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
  "auth/weak-password": "Senha muito fraca.",
};

const BENEFITS = [
  { icon: "♾️", label: "Acesso vitalício", sub: "Pague uma vez, use para sempre" },
  { icon: "🎯", label: "Controle total dos gastos", sub: "Saiba para onde vai cada real" },
  { icon: "⚡", label: "Interface simples", sub: "Sem planilhas, sem complicação" },
  { icon: "🚀", label: "Comece em menos de 2 minutos", sub: "Liberação imediata após pagamento" },
];

// ─── Step 1: Conviction screen ────────────────────────────────────────────────
function ConvictionStep({ onContinue, onClose }) {
  return (
    <div style={styles.stepWrap}>
      <button style={styles.closeBtn} onClick={onClose} aria-label="Fechar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div style={styles.stepBadge}>
        <span style={styles.stepDot} />
        Passo 1 de 2
      </div>

      <h2 style={styles.title}>
        Falta só <em style={styles.em}>1 passo</em><br />pra liberar seu acesso
      </h2>
      <p style={styles.subtitle}>
        Você está a segundos de ter controle total do seu dinheiro.
      </p>

      {/* Price highlight */}
      <div style={styles.priceBox}>
        <span style={styles.priceFrom}>De <s>R$ 119,99</s> por apenas</span>
        <div style={styles.priceMain}>
          <sup style={styles.priceSup}>R$</sup>
          <span style={styles.priceNum}>19</span>
          <span style={styles.priceCents}>,99</span>
        </div>
        <span style={styles.priceType}>PAGAMENTO ÚNICO · ACESSO VITALÍCIO</span>
      </div>

      {/* Benefits */}
      <div style={styles.benefitsList}>
        {BENEFITS.map((b) => (
          <div key={b.label} style={styles.benefitItem}>
            <span style={styles.benefitIcon}>{b.icon}</span>
            <div>
              <p style={styles.benefitLabel}>{b.label}</p>
              <p style={styles.benefitSub}>{b.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Trust strip */}
      <div style={styles.trustStrip}>
        <div style={styles.trustItem}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Pagamento 100% seguro via Mercado Pago
        </div>
        <div style={styles.trustItem}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Liberação imediata após pagamento
        </div>
      </div>

      {/* Guarantee */}
      <div style={styles.guaranteeBox}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5DCAA5" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        <span style={styles.guaranteeText}>
          Teste por 7 dias. Se não gostar, devolvemos 100% do seu dinheiro.
        </span>
      </div>

      <button onClick={onContinue} style={styles.submitBtn}>
        Continuar para criação de conta →
      </button>

      <p style={styles.progressText}>
        Próximo: crie seu acesso em 30 segundos
      </p>
    </div>
  );
}

// ─── Step 2: Auth form ────────────────────────────────────────────────────────
function AuthFormStep({ onSuccess, onClose, onBack }) {
  const { login, register, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  const passwordRules = validatePassword(password);
  const passwordValid = passwordRules.every((r) => r.valid);
  const isRegister = mode === "register";

  async function handleSubmit() {
    setError("");
    if (isRegister) {
      if (!name.trim()) { setError("Informe seu nome."); return; }
      if (!email.trim()) { setError("Informe seu email."); return; }
      if (!passwordValid) { setError("A senha não atende todos os requisitos."); return; }
      if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
        await updateProfile(auth.currentUser, { displayName: name.trim() });
      } else {
        await login(email, password);
      }
      onSuccess();
    } catch (e) {
      setError(ERROR_MESSAGES[e.code] || "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch {
      setError("Erro ao entrar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(isRegister ? "login" : "register");
    setError("");
    setName(""); setEmail(""); setPassword(""); setConfirmPassword("");
    setShowPasswordRules(false);
  }

  return (
    <div style={styles.stepWrap}>
      <button style={styles.closeBtn} onClick={onClose} aria-label="Fechar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Back button + badge row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {isRegister && (
          <button onClick={onBack} style={styles.backBtn} aria-label="Voltar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div style={styles.stepBadge}>
          <span style={styles.stepDot} />
          {isRegister ? "Passo 2 de 2" : "Entrar na conta"}
        </div>
      </div>

      <div style={styles.header}>
        <h2 style={styles.title}>
          {isRegister
            ? <>Quase lá! Falta só 1 passo para <em style={styles.em}>liberar seu acesso</em></>
            : <>Bem-vindo <em style={styles.em}>de volta</em></>}
        </h2>
        <p style={styles.subtitle}>
          {isRegister
            ? "Leva menos de 30 segundos — depois disso, é só finalizar o pagamento e começar."
            : "Entre e finalize sua compra."}
        </p>
      </div>

      <button onClick={handleGoogle} disabled={loading}
        style={{ ...styles.googleBtn, opacity: loading ? 0.6 : 1 }}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        Continuar com Google
      </button>

      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>ou preencha abaixo</span>
        <div style={styles.dividerLine} />
      </div>

      <div style={styles.fields}>
        {isRegister && (
          <input type="text" placeholder="Seu nome" value={name}
            onChange={(e) => setName(e.target.value)} style={styles.input} />
        )}
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()} style={styles.input} />
        <div>
          <input type="password" placeholder="Senha" value={password}
            onChange={(e) => { setPassword(e.target.value); if (isRegister) setShowPasswordRules(true); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{ ...styles.input, ...(isRegister && showPasswordRules && !passwordValid ? styles.inputError : {}) }} />
          {isRegister && showPasswordRules && (
            <div style={styles.rulesBox}>
              {passwordRules.map((rule) => (
                <div key={rule.label} style={styles.ruleRow}>
                  <span style={{ ...styles.ruleDot, color: rule.valid ? "#4ade80" : "#4b5563" }}>
                    {rule.valid ? "✓" : "○"}
                  </span>
                  <span style={{ ...styles.ruleText, color: rule.valid ? "#4ade80" : "#6b7280" }}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {isRegister && (
          <>
            <input type="password" placeholder="Confirmar senha" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{ ...styles.input, ...(confirmPassword && password !== confirmPassword ? styles.inputError : {}) }} />
            {confirmPassword && password !== confirmPassword && <p style={styles.matchError}>As senhas não coincidem.</p>}
            {confirmPassword && password === confirmPassword && <p style={styles.matchOk}>✓ Senhas coincidem.</p>}
          </>
        )}
      </div>

      {error && <p style={styles.errorMsg}>{error}</p>}

      <button onClick={handleSubmit} disabled={loading}
        style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
        {loading ? "Aguarde..." : isRegister ? "Liberar meu acesso agora →" : "Entrar e continuar →"}
      </button>

      {isRegister && (
        <div style={styles.progressHint}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: "80%" }} />
          </div>
          <span style={styles.progressText}>Próximo: pagamento seguro e liberação imediata</span>
        </div>
      )}

      <p style={styles.switchText}>
        {isRegister ? "Já tem conta? " : "Não tem conta? "}
        <span style={styles.switchLink} onClick={switchMode}>
          {isRegister ? "Entrar" : "Criar conta"}
        </span>
      </p>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function AuthModal({ onSuccess, onClose }) {
  const [step, setStep] = useState("conviction"); // "conviction" | "form"
  const [animating, setAnimating] = useState(false);

  function transition(nextStep) {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 200);
  }

  const modal = (
    <>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }               to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>

      <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div style={styles.sheet}>
          <div style={{
            ...styles.stepContainer,
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(8px)" : "translateY(0)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}>
            {step === "conviction"
              ? <ConvictionStep onContinue={() => transition("form")} onClose={onClose} />
              : <AuthFormStep onSuccess={onSuccess} onClose={onClose} onBack={() => transition("conviction")} />
            }
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.78)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    animation: "fadeIn 0.2s ease",
  },
  sheet: {
    width: "100%",
    maxWidth: "480px",
    backgroundColor: "#0e1a16",
    border: "1px solid rgba(93,202,165,0.2)",
    borderBottom: "none",
    borderRadius: "24px 24px 0 0",
    position: "relative",
    maxHeight: "94vh",
    overflowY: "auto",
    animation: "slideUp 0.32s cubic-bezier(0.32,0.72,0,1)",
  },
  stepContainer: {
    padding: "32px 24px 44px",
    display: "flex",
    flexDirection: "column",
  },
  stepWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  // ── Shared ──
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "rgba(93,202,165,0.08)",
    border: "1px solid rgba(93,202,165,0.15)",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#7ab89a",
    padding: 0,
  },
  backBtn: {
    background: "rgba(93,202,165,0.08)",
    border: "1px solid rgba(93,202,165,0.15)",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#7ab89a",
    padding: 0,
    flexShrink: 0,
  },
  stepBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(93,202,165,0.1)",
    border: "1px solid rgba(93,202,165,0.2)",
    borderRadius: "100px",
    padding: "4px 12px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#5DCAA5",
    letterSpacing: "0.04em",
    fontFamily: "'DM Sans', sans-serif",
    alignSelf: "flex-start",
  },
  stepDot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#1D9E75",
  },
  title: {
    fontFamily: "'Sora', sans-serif",
    fontSize: "24px",
    fontWeight: 800,
    color: "#fff",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    margin: 0,
  },
  em: {
    fontStyle: "normal",
    color: "#5DCAA5",
  },
  subtitle: {
    fontSize: "14px",
    color: "#7ab89a",
    lineHeight: 1.5,
    fontFamily: "'DM Sans', sans-serif",
    margin: 0,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  submitBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #1D9E75 0%, #16a085 100%)",
    color: "#fff",
    fontFamily: "'Sora', sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    padding: "17px 24px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    letterSpacing: "-0.01em",
    boxShadow: "0 4px 20px rgba(29,158,117,0.35)",
  },
  progressHint: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignItems: "center",
  },
  progressBar: {
    width: "100%",
    height: "3px",
    backgroundColor: "rgba(93,202,165,0.12)",
    borderRadius: "100px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#1D9E75",
    borderRadius: "100px",
  },
  progressText: {
    fontSize: "11px",
    color: "#7ab89a",
    textAlign: "center",
    fontFamily: "'DM Sans', sans-serif",
    margin: 0,
  },
  switchText: {
    textAlign: "center",
    fontSize: "13px",
    color: "#7ab89a",
    margin: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  switchLink: {
    color: "#5DCAA5",
    fontWeight: 600,
    cursor: "pointer",
  },

  // ── Conviction step ──
  priceBox: {
    background: "rgba(29,158,117,0.08)",
    border: "1px solid rgba(93,202,165,0.2)",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
  },
  priceFrom: {
    fontSize: "12px",
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
  },
  priceMain: {
    display: "flex",
    alignItems: "flex-start",
    lineHeight: 1,
  },
  priceSup: {
    fontSize: "16px",
    fontFamily: "'Sora', sans-serif",
    fontWeight: 700,
    color: "#5DCAA5",
    marginTop: "8px",
    marginRight: "2px",
  },
  priceNum: {
    fontSize: "52px",
    fontFamily: "'Sora', sans-serif",
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.03em",
    lineHeight: 1,
  },
  priceCents: {
    fontSize: "24px",
    fontFamily: "'Sora', sans-serif",
    fontWeight: 700,
    color: "#fff",
    marginTop: "10px",
  },
  priceType: {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#5DCAA5",
    fontFamily: "'DM Sans', sans-serif",
  },
  benefitsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  benefitItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "rgba(93,202,165,0.04)",
    border: "1px solid rgba(93,202,165,0.1)",
    borderRadius: "12px",
    padding: "11px 14px",
  },
  benefitIcon: {
    fontSize: "18px",
    flexShrink: 0,
    lineHeight: 1,
    marginTop: "2px",
  },
  benefitLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    color: "#f0faf6",
    margin: 0,
    lineHeight: 1.3,
  },
  benefitSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "11px",
    color: "#7ab89a",
    margin: "2px 0 0",
  },
  trustStrip: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  trustItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
  },
  guaranteeBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "rgba(93,202,165,0.06)",
    border: "1px solid rgba(93,202,165,0.15)",
    borderRadius: "12px",
    padding: "12px 14px",
  },
  guaranteeText: {
    fontSize: "12px",
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.5,
    margin: 0,
  },

  // ── Auth form step ──
  googleBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    backgroundColor: "#1a2e26",
    color: "#f0faf6",
    fontWeight: 500,
    fontSize: "14px",
    border: "1px solid rgba(93,202,165,0.2)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontFamily: "'DM Sans', sans-serif",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    backgroundColor: "rgba(93,202,165,0.12)",
  },
  dividerText: {
    fontSize: "11px",
    color: "#7ab89a",
    whiteSpace: "nowrap",
    fontFamily: "'DM Sans', sans-serif",
  },
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    backgroundColor: "#1a2e26",
    border: "1px solid rgba(93,202,165,0.15)",
    color: "#f0faf6",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif",
  },
  inputError: {
    border: "1px solid rgba(226,75,74,0.5)",
  },
  rulesBox: {
    marginTop: "8px",
    padding: "12px",
    backgroundColor: "#162620",
    borderRadius: "10px",
    border: "1px solid rgba(93,202,165,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  ruleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  ruleDot: {
    fontSize: "11px",
    fontWeight: 700,
    width: "14px",
    flexShrink: 0,
  },
  ruleText: {
    fontSize: "11px",
    fontFamily: "'DM Sans', sans-serif",
  },
  matchError: {
    color: "#f87171",
    fontSize: "11px",
    margin: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  matchOk: {
    color: "#4ade80",
    fontSize: "11px",
    margin: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  errorMsg: {
    color: "#f87171",
    fontSize: "13px",
    textAlign: "center",
    margin: 0,
    backgroundColor: "rgba(226,75,74,0.08)",
    border: "1px solid rgba(226,75,74,0.15)",
    borderRadius: "10px",
    padding: "10px 14px",
    fontFamily: "'DM Sans', sans-serif",
  },
};