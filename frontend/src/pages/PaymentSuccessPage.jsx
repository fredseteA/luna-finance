import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";

/**
 * PaymentSuccessPage
 *
 * O Mercado Pago redireciona aqui quando auto_return = "approved".
 * O webhook já deve ter rodado e setado isPremium=true no Firebase.
 * Forçamos o refresh do ID token para que as custom claims atualizem
 * e o AuthContext detecte isPremium=true sem precisar o usuário fazer logout.
 */
export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "pending"

  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 8;
    const INTERVAL_MS = 2000; // tenta a cada 2s por até 16s

    async function checkPremium() {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        // Força refresh do token (busca claims atualizadas do Firebase)
        const tokenResult = await user.getIdToken(true);
        const claims = (await user.getIdTokenResult()).claims;

        if (claims?.isPremium) {
          setStatus("success");
          setTimeout(() => navigate("/"), 2000);
          return;
        }
      } catch (err) {
        console.warn("[PaymentSuccess] token refresh error:", err);
      }

      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        // Webhook pode ter atrasado — mostra mensagem de pendente
        setStatus("pending");
      } else {
        setTimeout(checkPremium, INTERVAL_MS);
      }
    }

    // Pequena espera inicial para dar tempo do webhook processar
    setTimeout(checkPremium, 1500);
  }, [navigate]);

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
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Pagamento em processamento
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Seu pagamento foi recebido mas ainda está sendo processado.
              Assim que confirmado, seu acesso será liberado automaticamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Verificar novamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}
