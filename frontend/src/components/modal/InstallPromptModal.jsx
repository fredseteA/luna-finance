import { useEffect, useState } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export const InstallPromptModal = () => {
  const { canInstall, install } = useInstallPrompt();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('install-dismissed');

    if (canInstall && !dismissed) {
      setTimeout(() => setOpen(true), 1000);
    }
  }, [canInstall]);

  const handleClose = () => {
    localStorage.setItem('install-dismissed', 'true');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card p-5 rounded-xl w-[90%] max-w-sm text-center">
        <h2 className="font-bold text-lg mb-2">📲 Instale o app</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Tenha acesso mais rápido direto da sua tela inicial.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 p-2 rounded-lg border"
          >
            Agora não
          </button>

          <button
            onClick={async () => {
              await install();
              setOpen(false);
            }}
            className="flex-1 p-2 rounded-lg bg-primary text-white"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
};