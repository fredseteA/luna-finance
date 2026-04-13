import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storageService';

/**
 * useInstallStatus
 *
 * Substitui useInstallPrompt. Toda persistência vai ao Firestore.
 * Detecta plataforma para instruções corretas no modal.
 *
 * Retorna:
 *   showInstallBanner  — boolean: exibir banner de instalação
 *   platform           — 'ios' | 'android' | 'other'
 *   isLoading          — boolean: enquanto lê Firestore
 *   markInstalled()    — seta isInstalled=true no Firestore
 *   dismissInstall()   — seta installDismissed=true no Firestore
 */
export function useInstallStatus() {
  const { user } = useAuth();

  const [isInstalled, setIsInstalled]       = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [platform, setPlatform]             = useState('other');
  const [isLoading, setIsLoading]           = useState(true);

  // ── Detecta plataforma uma única vez ────────────────────────────────────
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua)) setPlatform('ios');
    else if (/android/i.test(ua))      setPlatform('android');
    else                                setPlatform('other');
  }, []);

  // ── Lê status do Firestore quando o usuário loga ─────────────────────────
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        // Se já está rodando como PWA instalado, marca automaticamente
        const isStandalone =
          window.matchMedia('(display-mode: standalone)').matches ||
          window.navigator.standalone === true;

        if (isStandalone) {
          await storageService.saveInstallStatus(user.uid, {
            isInstalled: true,
            installDismissed: true,
          });
          if (!cancelled) {
            setIsInstalled(true);
            setInstallDismissed(true);
          }
          return;
        }

        const status = await storageService.getInstallStatus(user.uid);
        if (!cancelled) {
          setIsInstalled(status.isInstalled);
          setInstallDismissed(status.installDismissed);
        }
      } catch (err) {
        console.error('[useInstallStatus] erro ao carregar:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.uid]);

  // ── Ações ────────────────────────────────────────────────────────────────
  const markInstalled = useCallback(async () => {
    setIsInstalled(true);
    if (user?.uid) {
      await storageService.saveInstallStatus(user.uid, {
        isInstalled: true,
        installDismissed,
      });
    }
  }, [user?.uid, installDismissed]);

  const dismissInstall = useCallback(async () => {
    setInstallDismissed(true);
    if (user?.uid) {
      await storageService.saveInstallStatus(user.uid, {
        isInstalled,
        installDismissed: true,
      });
    }
  }, [user?.uid, isInstalled]);

  const showInstallBanner = !isLoading && !isInstalled && !installDismissed;

  return {
    showInstallBanner,
    platform,
    isLoading,
    markInstalled,
    dismissInstall,
  };
}