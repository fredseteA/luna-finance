import { useState, useEffect } from 'react';

const STORAGE_KEY = 'luna_app_installed';

function isRunningStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled]       = useState(false);
  const [platform, setPlatform]             = useState(null); // 'ios' | 'android' | 'other'
  const [canInstall, setCanInstall]         = useState(false);

  useEffect(() => {
    // Já instalado como standalone ou marcado no storage
    if (isRunningStandalone() || localStorage.getItem(STORAGE_KEY) === 'true') {
      setIsInstalled(true);
      return;
    }

    if (isIOS()) setPlatform('ios');
    else if (isAndroid()) setPlatform('android');
    else setPlatform('other');

    // Android/Desktop: captura o prompt nativo
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS não dispara beforeinstallprompt — mas pode instalar via Safari
    if (isIOS()) setCanInstall(true);

    // Detecta quando o usuário instalou
    const installedHandler = () => {
      setIsInstalled(true);
      setCanInstall(false);
      localStorage.setItem(STORAGE_KEY, 'true');
    };

    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  // Dispara o prompt nativo no Android
  async function triggerInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        localStorage.setItem(STORAGE_KEY, 'true');
      }
      setDeferredPrompt(null);
    }
  }

  // Marca como instalado manualmente (para iOS após o usuário confirmar)
  function markAsInstalled() {
    setIsInstalled(true);
    setCanInstall(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }

  return { canInstall, isInstalled, platform, triggerInstall, markAsInstalled };
}