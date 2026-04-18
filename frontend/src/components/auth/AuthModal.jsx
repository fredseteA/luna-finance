import { useEffect } from "react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function AuthModal({ onSuccess, onClose }) {
  useEffect(() => {
    async function createAnonAndProceed() {
      try {
        await signInAnonymously(auth);
        onSuccess(); // dispara startCheckout() no paywall
      } catch {
        onClose(); // se falhar, fecha e mostra erro no paywall
      }
    }
    createAnonAndProceed();
  }, [onSuccess, onClose]);

  // Mostra loading enquanto cria a conta anônima (< 1 segundo normalmente)
  return (
    <div style={styles.overlay}>
      <div style={styles.spinner} />
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "3px solid rgba(93,202,165,0.2)",
    borderTop: "3px solid #1D9E75",
    animation: "spin 0.7s linear infinite",
  },
};