import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";

/**
 * PaymentSuccessPage
 *
 * Cartão: auto_return redireciona aqui automaticamente após aprovação.
 * PIX: usuário volta manualmente — pode demorar mais para o webhook processar.
 *
 * A verificação roda em loop enquanto o usuário estiver na página.
 * O botão "Verificar novamente" reinicia o loop sem recarregar.
 */
export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "pending"
  const [attempt, setAttempt] = useState(0);

  const checkPremium = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return false;
    }

    try {
      // Força refresh do token para buscar claims atualizadas
      await user.getIdToken(true);
      const { claims } = await user.getIdTokenResult();

      if (claims?.isPremium) {
        setStatus("success");
        setTimeout(() => navigate("/"), 2000);
        return true;
      }
    } catch (err) {
      console.warn("[PaymentSuccess] token refresh error:", err);
    }

    return false;
  }, [navigate]);

  // Verificação automática ao entrar na página
  useEffect(() => {
    const MAX_ATTEMPTS = 8;
    const INTERVAL_MS = 2000;
    let count = 0;
    let stopped = false;

    async function loop() {
      // Espera inicial para dar tempo ao webhook
      await new Promise(r => setTimeout(r, 1500));

      while (count < MAX_ATTEMPTS && !stopped) {
        const approved = await checkPremium();
        if (approved) return;
        count++;
        if (count < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, INTERVAL_MS));
        }
      }

      if (!stopped) setStatus("pending");
    }

    loop();
    return () => { stopped = true; };
  }, [checkPremium]);

  // Reinicia a verificação manualmente (sem recarregar a página)
  async function handleRetry() {
    setStatus("verifying");
    setAttempt(a => a + 1);

    let count = 0;
    const MAX_ATTEMPTS = 5;
    const INTERVAL_MS = 2000;

    while (count < MAX_ATTEMPTS) {
      const approved = await checkPremium();
      if (approved) return;
      count++;
      if (count < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, INTERVAL_MS));
      }
    }

    setStatus("pending");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">

        {status === "verifying" && (
          <>
            <div className="text-4xl mb-4 animate-pulse">⏳</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmando seu pagamento...
            </h2>
            <p className="text-sm text-gray-500">
              Aguarde alguns instantes enquanto ativamos seu acesso.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Acesso liberado!
            </h2>
            <p className="text-sm text-gray-500">
              Bem-vindo ao Luna Finance. Redirecionando...
            </p>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="text-4xl mb-4">📱</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Pagamento recebido!
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Seu pagamento foi identificado. Se pagou via PIX, a confirmação
              pode levar até 1 minuto.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Clique em "Verificar acesso" quando o pagamento for confirmado.
            </p>
            <button
              onClick={handleRetry}
              className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors mb-3"
            >
              Verificar acesso
            </button>
            <button
              onClick={() => navigate("/paywall")}
              className="w-full text-gray-400 text-sm py-2"
            >
              Voltar
            </button>
          </>
        )}

      </div>
    </div>
  );
}