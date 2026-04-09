import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export const InstallButton = () => {
  const { canInstall, install } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <button
      onClick={install}
      className="p-2 rounded-lg bg-primary text-white"
    >
      📲 Instalar app
    </button>
  );
};