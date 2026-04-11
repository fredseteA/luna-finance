import { useState } from 'react';
import { X, Smartphone, Share, Plus, MoreVertical, Download } from 'lucide-react';

/**
 * InstallModal
 *
 * Props:
 *   onClose()         — fecha sem instalar
 *   onInstall()       — dispara o prompt (Android) ou abre instruções (iOS)
 *   platform          — 'ios' | 'android' | 'other'
 *   triggerInstall()  — função do hook (Android nativo)
 *   markAsInstalled() — função do hook (confirmar após iOS)
 */
export function InstallModal({ onClose, platform, triggerInstall, markAsInstalled }) {
  const [step, setStep] = useState('welcome'); // 'welcome' | 'instructions'

  function handleInstallClick() {
    if (platform === 'android') {
      // Dispara o prompt nativo — se aceito, o hook já marca como instalado
      triggerInstall();
      onClose();
    } else {
      // iOS ou outro: mostra instruções manuais
      setStep('instructions');
    }
  }

  function handleConfirmInstalled() {
    markAsInstalled();
    onClose();
  }

  return (
    <div className="install-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="install-modal">

        {/* ── STEP 1: boas-vindas ── */}
        {step === 'welcome' && (
          <>
            <button className="install-close" onClick={onClose} aria-label="Fechar">
              <X size={18} />
            </button>

            <div className="install-icon">
              <Smartphone size={28} strokeWidth={1.5} />
            </div>

            <h2 className="install-title">Instale o Luna Finance</h2>
            <p className="install-desc">
              Acesse mais rápido, funciona offline e fica direto na sua tela inicial —
              sem precisar abrir o navegador.
            </p>

            <ul className="install-benefits">
              <li>⚡ Abre instantaneamente</li>
              <li>📵 Funciona sem internet</li>
              <li>🔔 Notificações em tempo real</li>
              <li>📱 Experiência de app nativo</li>
            </ul>

            <div className="install-actions">
              <button className="install-btn-primary" onClick={handleInstallClick}>
                <Download size={16} />
                Instalar agora
              </button>
              <button className="install-btn-ghost" onClick={onClose}>
                Agora não
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: instruções iOS / outro ── */}
        {step === 'instructions' && (
          <>
            <button className="install-close" onClick={onClose} aria-label="Fechar">
              <X size={18} />
            </button>

            <h2 className="install-title">Como instalar</h2>

            {platform === 'ios' ? (
              <>
                <p className="install-desc">
                  No iPhone ou iPad, abra esta página no <strong>Safari</strong> e siga os passos:
                </p>
                <ol className="install-steps">
                  <li>
                    <div className="step-icon">
                      <Share size={16} />
                    </div>
                    <div>
                      Toque no botão <strong>Compartilhar</strong>
                      <span> (ícone de caixa com seta para cima, na barra inferior)</span>
                    </div>
                  </li>
                  <li>
                    <div className="step-icon">
                      <Plus size={16} />
                    </div>
                    <div>
                      Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong>
                    </div>
                  </li>
                  <li>
                    <div className="step-icon">✓</div>
                    <div>
                      Toque em <strong>Adicionar</strong> no canto superior direito
                    </div>
                  </li>
                </ol>
                <p className="install-note">
                  ⚠️ Precisa estar no Safari. Chrome e outros navegadores no iOS não suportam instalação.
                </p>
              </>
            ) : (
              <>
                <p className="install-desc">
                  No seu navegador, siga os passos:
                </p>
                <ol className="install-steps">
                  <li>
                    <div className="step-icon">
                      <MoreVertical size={16} />
                    </div>
                    <div>
                      Toque no menu <strong>⋮</strong> (três pontos) no canto superior direito
                    </div>
                  </li>
                  <li>
                    <div className="step-icon">
                      <Download size={16} />
                    </div>
                    <div>
                      Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>
                    </div>
                  </li>
                  <li>
                    <div className="step-icon">✓</div>
                    <div>Confirme tocando em <strong>Instalar</strong></div>
                  </li>
                </ol>
              </>
            )}

            <div className="install-actions">
              <button className="install-btn-primary" onClick={handleConfirmInstalled}>
                Já instalei ✓
              </button>
              <button className="install-btn-ghost" onClick={() => setStep('welcome')}>
                Voltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default InstallModal;