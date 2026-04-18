import { useState } from "react";
import { createPortal } from "react-dom";
import {
  EmailAuthProvider,
  linkWithCredential,
  GoogleAuthProvider,
  linkWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function LinkAccountModal({ onDone }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await linkWithPopup(auth.currentUser, provider);
      setDone(true);
      setTimeout(onDone, 1800);
    } catch (e) {
      if (e.code === "auth/credential-already-in-use") {
        setError("Essa conta Google já está vinculada a outro acesso.");
      } else {
        setError("Erro ao vincular com Google. Tente com e-mail.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim()) { setError("Informe seu nome."); return; }
    if (!email.trim()) { setError("Informe seu e-mail."); return; }
    if (password.length < 6) { setError("Senha precisa ter pelo menos 6 caracteres."); return; }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(auth.currentUser, credential);
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      setDone(true);
      setTimeout(onDone, 1800);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso. Tente outro ou use o Google.");
      } else {
        setError("Erro ao salvar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  const modal = (
    <>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
      <div style={styles.overlay}>
        <div style={styles.sheet}>
          {done ? (
            <div style={styles.doneWrap}>
              <div style={styles.doneIcon}>✓</div>
              <h3 style={styles.doneTitle}>Acesso garantido!</h3>
              <p style={styles.doneSub}>Seu acesso vitalício está salvo com segurança.</p>
            </div>
          ) : (
            <div style={styles.stepWrap}>
              {/* Header */}
              <div style={styles.badge}>🔒 Garanta seu acesso</div>
              <h2 style={styles.title}>
                Salve seu acesso<br />
                <em style={styles.em}>para não perder</em>
              </h2>
              <p style={styles.subtitle}>
                Você já tem acesso vitalício. Crie uma senha pra entrar em qualquer dispositivo — leva 20 segundos.
              </p>

              {/* Google */}
              <button onClick={handleGoogle} disabled={loading} style={{ ...styles.googleBtn, opacity: loading ? 0.6 : 1 }}>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Salvar com Google
              </button>

              <div style={styles.divider}>
                <div style={styles.dividerLine} />
                <span style={styles.dividerText}>ou com e-mail</span>
                <div style={styles.dividerLine} />
              </div>

              {/* Form */}
              <div style={styles.fields}>
                <input
                  type="text" placeholder="Seu nome" value={name}
                  onChange={(e) => setName(e.target.value)} style={styles.input}
                />
                <input
                  type="email" placeholder="E-mail" value={email}
                  onChange={(e) => setEmail(e.target.value)} style={styles.input}
                />
                <input
                  type="password" placeholder="Crie uma senha (mín. 6 caracteres)" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  style={styles.input}
                />
              </div>

              {error && <p style={styles.errorMsg}>{error}</p>}

              <button onClick={handleSubmit} disabled={loading}
                style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? "Salvando..." : "Salvar meu acesso →"}
              </button>

              {/* Skip */}
              <button onClick={onDone} style={styles.skipBtn}>
                Agora não (posso perder o acesso se desinstalar)
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}

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
    maxHeight: "94vh",
    overflowY: "auto",
    animation: "slideUp 0.32s cubic-bezier(0.32,0.72,0,1)",
  },
  stepWrap: {
    padding: "32px 24px 44px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  badge: {
    display: "inline-flex",
    alignSelf: "flex-start",
    background: "rgba(93,202,165,0.1)",
    border: "1px solid rgba(93,202,165,0.2)",
    borderRadius: "100px",
    padding: "4px 12px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#5DCAA5",
    fontFamily: "'DM Sans', sans-serif",
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
  em: { fontStyle: "normal", color: "#5DCAA5" },
  subtitle: {
    fontSize: "14px",
    color: "#7ab89a",
    lineHeight: 1.5,
    fontFamily: "'DM Sans', sans-serif",
    margin: 0,
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
  divider: { display: "flex", alignItems: "center", gap: "10px" },
  dividerLine: { flex: 1, height: "1px", backgroundColor: "rgba(93,202,165,0.12)" },
  dividerText: { fontSize: "11px", color: "#7ab89a", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" },
  fields: { display: "flex", flexDirection: "column", gap: "10px" },
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
  skipBtn: {
    background: "none",
    border: "none",
    color: "#4b6e5e",
    fontSize: "11px",
    cursor: "pointer",
    textAlign: "center",
    fontFamily: "'DM Sans', sans-serif",
    textDecoration: "underline",
    padding: 0,
  },
  doneWrap: {
    padding: "48px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  doneIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "rgba(29,158,117,0.15)",
    border: "2px solid #1D9E75",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    color: "#1D9E75",
  },
  doneTitle: {
    fontFamily: "'Sora', sans-serif",
    fontSize: "22px",
    fontWeight: 800,
    color: "#fff",
    margin: 0,
  },
  doneSub: {
    fontSize: "14px",
    color: "#7ab89a",
    fontFamily: "'DM Sans', sans-serif",
    textAlign: "center",
    margin: 0,
  },
};