import { useState } from 'react';
import { X, Smartphone, Share, Plus, MoreVertical, Download } from 'lucide-react';
import './InstallModal.css';

/**
 * InstallModal — versão redesenhada
 *
 * Sem dependência de beforeinstallprompt / deferredPrompt.
 * Apenas instruções visuais por plataforma + confirmação de instalação.
 *
 * Props:
 *   platform        — 'ios' | 'android' | 'other'
 *   markInstalled() — do useInstallStatus (Firestore)
 *   onClose()       — fecha o modal
 */
export function InstallModal({ platform, markInstalled, onClose }) {
  const [step, setStep] = useState('welcome'); // 'welcome' | 'instructions'

  function handleInstallClick() {
    setStep('instructions');
  }

  async function handleConfirmInstalled() {
    await markInstalled();
    onClose();
  }

  return (
    <div
      className="install-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="install-modal">

        {/* ── STEP 1: boas-vindas ────────────────────────────────────────── */}
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
              Acesse mais rápido, funciona offline e fica direto na sua tela
              inicial — sem precisar abrir o navegador.
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
                Ver como instalar
              </button>
              <button className="install-btn-ghost" onClick={onClose}>
                Agora não
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: instruções por plataforma ─────────────────────────── */}
        {step === 'instructions' && (
          <>
            <button className="install-close" onClick={onClose} aria-label="Fechar">
              <X size={18} />
            </button>

            <h2 className="install-title">Como instalar</h2>

            {platform === 'ios' ? (
              <>
                <p className="install-desc">
                  No iPhone ou iPad, abra esta página no{' '}
                  <strong>Safari</strong> e siga os passos:
                </p>
                <ol className="install-steps">
                  <li>
                    <div className="step-icon">
                      <Share size={16} />
                    </div>
                    <div>
                      Toque no botão <strong>Compartilhar</strong>
                      <span> (ícone de caixa com seta, na barra inferior)</span>
                    </div>
                  </li>
                  <li>
                    <div className="step-icon">
                      <Plus size={16} />
                    </div>
                    <div>
                      Role a lista e toque em{' '}
                      <strong>"Adicionar à Tela de Início"</strong>
                    </div>
                  </li>
                  <li>
                    <div className="step-icon">✓</div>
                    <div>
                      Toque em <strong>Adicionar</strong> no canto superior
                      direito
                    </div>
                  </li>
                </ol>
                <p className="install-note">
                  ⚠️ Requer Safari. Chrome e outros navegadores no iOS não
                  suportam instalação.
                </p>
              </>
            ) : platform === 'android' ? (
              <>
                <p className="install-desc">No Chrome para Android:</p>
                <ol className="install-steps">
                  <li>
                    <div className="step-icon">
                      <MoreVertical size={16} />
                    </div>
                    <div>
                      Toque no menu <strong>⋮</strong> (três pontos) no canto
                      superior direito
                    </div>
                  </li>
                  <li>
                    <div className="step-icon">
                      <Download size={16} />
                    </div>
                    <div>
                      Toque em{' '}
                      <strong>"Instalar aplicativo"</strong> ou{' '}
                      <strong>"Adicionar à tela inicial"</strong>
                    </div>
                  </li>
                  <li>
                    <div className="step-icon">✓</div>
                    <div>
                      Confirme tocando em <strong>Instalar</strong>
                    </div>
                  </li>
                </ol>
              </>
            ) : (
              <>
                <p className="install-desc">No seu navegador:</p>
                <ol className="install-steps">
                  <li>
                    <div className="step-icon">
                      <MoreVertical size={16} />
                    </div>
                    <div>
                      Abra o menu do navegador (geralmente no canto superior
                      direito)
                    </div>
                  </li>
                  <li>
                    <div className="step-icon">
                      <Download size={16} />
                    </div>
                    <div>
                      Procure por{' '}
                      <strong>"Instalar aplicativo"</strong> ou{' '}
                      <strong>"Adicionar à tela inicial"</strong>
                    </div>
                  </li>
                  <li>
                    <div className="step-icon">✓</div>
                    <div>Confirme a instalação</div>
                  </li>
                </ol>
              </>
            )}

            <div className="install-actions">
              <button
                className="install-btn-primary"
                onClick={handleConfirmInstalled}
              >
                Já instalei ✓
              </button>
              <button
                className="install-btn-ghost"
                onClick={() => setStep('welcome')}
              >
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