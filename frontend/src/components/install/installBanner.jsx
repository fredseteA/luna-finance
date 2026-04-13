import { useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { InstallModal } from './InstallModal';

/**
 * InstallBanner
 *
 * Banner discreto que aparece no topo da home quando
 * showInstallBanner=true.
 *
 * Props:
 *   platform        — 'ios' | 'android' | 'other'
 *   markInstalled() — do useInstallStatus
 *   dismissInstall()— do useInstallStatus
 */
export function InstallBanner({ platform, markInstalled, dismissInstall }) {
  const [showInstructions, setShowInstructions]   = useState(false);
  const [showAlreadyDialog, setShowAlreadyDialog] = useState(false);

  return (
    <>
      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <div className="
        w-full rounded-xl border border-luna-primary/20
        bg-luna-primary/5 backdrop-blur-sm
        px-4 py-3 mb-4
        flex items-center gap-3
        animate-in slide-in-from-top-2 duration-300
      ">
        {/* Ícone */}
        <div className="shrink-0 p-2 rounded-lg bg-luna-primary/10">
          <Smartphone className="h-4 w-4 text-luna-primary" />
        </div>

        {/* Texto + ações */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">
            Instale o Luna Finance
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
            Acesso rápido, funciona offline
          </p>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setShowInstructions(true)}
              className="
                text-xs font-semibold text-luna-primary
                bg-luna-primary/10 hover:bg-luna-primary/20
                px-3 py-1.5 rounded-lg transition-colors
              "
            >
              Instalar
            </button>
            <button
              onClick={() => setShowAlreadyDialog(true)}
              className="
                text-xs font-medium text-muted-foreground
                hover:text-foreground
                px-3 py-1.5 rounded-lg transition-colors
                border border-border/60 hover:border-border
              "
            >
              Já instalei
            </button>
          </div>
        </div>

        {/* Fechar (dismiss para sempre) */}
        <button
          onClick={dismissInstall}
          aria-label="Fechar"
          className="
            shrink-0 p-1.5 rounded-lg
            text-muted-foreground hover:text-foreground
            hover:bg-muted transition-colors
          "
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Modal de instruções ─────────────────────────────────────────── */}
      {showInstructions && (
        <InstallModal
          platform={platform}
          markInstalled={markInstalled}
          onClose={() => setShowInstructions(false)}
        />
      )}

      {/* ── Dialog "Já instalei" ────────────────────────────────────────── */}
      <AlertDialog open={showAlreadyDialog} onOpenChange={setShowAlreadyDialog}>
        <AlertDialogContent className="max-w-[90vw] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Tudo certo! 🎉</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja que o Luna Finance pare de mostrar essa sugestão de instalação?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Não, manter
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await markInstalled();
                setShowAlreadyDialog(false);
              }}
            >
              Sim, não mostrar mais
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default InstallBanner;