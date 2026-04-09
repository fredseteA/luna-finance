import { useEffect, useState, useCallback } from 'react';

const isRunningStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true ||
  document.referrer.includes('android-app://');

export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [promptAvailable, setPromptAvailable] = useState(false);

  useEffect(() => {
    // Se já está instalado, para tudo
    if (isRunningStandalone()) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPromptAvailable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detecta instalação via appinstalled
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setPromptAvailable(false);
    };
    window.addEventListener('appinstalled', onInstalled);

    // Fallback: se o evento não disparar em 3s, ainda mostra opção manual
    const fallbackTimer = setTimeout(() => {
      if (!isRunningStandalone()) {
        setPromptAvailable(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const install = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setPromptAvailable(false);
      }
    } else {
      // Fallback manual: instrução via alert nativo
      // Substitua por modal customizado se preferir
      alert(
        'Para instalar:\n• Chrome Android: toque no menu ⋮ → "Adicionar à tela inicial"\n• Safari iOS: toque em compartilhar → "Adicionar à Tela de Início"'
      );
    }
  }, [deferredPrompt]);

  return {
    canInstall: promptAvailable && !isInstalled,
    hasNativePrompt: !!deferredPrompt,
    install,
  };
};