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

export default function AuthModal({ onSuccess, onClose }) {
  const { login, register, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState("register"); // "register" | "login"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  const passwordRules = validatePassword(password);
  const passwordValid = passwordRules.every((r) => r.valid);

  async function handleSubmit() {
    setError("");

    if (mode === "register") {
      if (!name.trim()) { setError("Informe seu nome."); return; }
      if (!email.trim()) { setError("Informe seu email."); return; }
      if (!passwordValid) { setError("A senha não atende todos os requisitos."); return; }
      if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }
    }

    setLoading(true);
    try {
      if (mode === "register") {
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
    setMode(mode === "register" ? "login" : "register");
    setError("");
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPasswordRules(false);
  }

  const isRegister = mode === "register";

  const modal = (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.sheet}>
        {/* Close button */}
        <button style={styles.closeBtn} onClick={onClose} aria-label="Fechar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.stepBadge}>
            <span style={styles.stepDot} />
            {isRegister ? "Passo 1 de 2" : "Entrar na conta"}
          </div>
          <h2 style={styles.title}>
            {isRegister
              ? <>Primeiro, vamos <em style={styles.em}>criar sua conta</em></>
              : <>Bem-vindo <em style={styles.em}>de volta</em></>
            }
          </h2>
          <p style={styles.subtitle}>
            {isRegister
              ? "Só leva 30 segundos. Depois disso, direto pro pagamento."
              : "Entre e finalize sua compra."}
          </p>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{ ...styles.googleBtn, opacity: loading ? 0.6 : 1 }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar com Google
        </button>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>ou preencha abaixo</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Fields */}
        <div style={styles.fields}>
          {isRegister && (
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={styles.input}
          />

          <div>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (isRegister) setShowPasswordRules(true);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                ...styles.input,
                ...(isRegister && showPasswordRules && !passwordValid ? styles.inputError : {}),
              }}
            />

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
              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={{
                  ...styles.input,
                  ...(confirmPassword && password !== confirmPassword ? styles.inputError : {}),
                }}
              />
              {confirmPassword && password !== confirmPassword && (
                <p style={styles.matchError}>As senhas não coincidem.</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p style={styles.matchOk}>✓ Senhas coincidem.</p>
              )}
            </>
          )}
        </div>

        {error && <p style={styles.errorMsg}>{error}</p>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
        >
          {loading
            ? "Aguarde..."
            : isRegister
            ? "Criar conta e continuar →"
            : "Entrar e continuar →"}
        </button>

        {/* Progress hint — only on register */}
        {isRegister && (
          <div style={styles.progressHint}>
            <div style={styles.progressBar}>
              <div style={styles.progressFill} />
            </div>
            <span style={styles.progressText}>Próximo: pagamento seguro via Mercado Pago</span>
          </div>
        )}

        {/* Switch mode */}
        <p style={styles.switchText}>
          {isRegister ? "Já tem conta? " : "Não tem conta? "}
          <span style={styles.switchLink} onClick={switchMode}>
            {isRegister ? "Entrar" : "Criar conta"}
          </span>
        </p>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
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
    padding: "32px 24px 40px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    position: "relative",
    maxHeight: "92vh",
    overflowY: "auto",
    animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)",
  },
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
  header: {
    marginBottom: "4px",
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
    marginBottom: "14px",
    fontFamily: "'DM Sans', sans-serif",
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
    marginBottom: "8px",
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
  },
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
  submitBtn: {
    width: "100%",
    background: "#1D9E75",
    color: "#fff",
    fontFamily: "'Sora', sans-serif",
    fontSize: "15px",
    fontWeight: 700,
    padding: "17px 24px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    letterSpacing: "-0.01em",
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
    width: "50%",
    height: "100%",
    background: "#1D9E75",
    borderRadius: "100px",
  },
  progressText: {
    fontSize: "11px",
    color: "#7ab89a",
    textAlign: "center",
    fontFamily: "'DM Sans', sans-serif",
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
};