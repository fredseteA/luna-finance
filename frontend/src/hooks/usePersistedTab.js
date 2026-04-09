import { useState, useCallback } from 'react';

/**
 * usePersistedTab — mantém a aba ativa do Dashboard entre navegações.
 *
 * Sem isso, trocar de página e voltar sempre resetava para "evolution".
 * O localStorage garante persistência mesmo após fechar e reabrir o app.
 */
export function usePersistedTab(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ?? defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback((newValue) => {
    setValue(newValue);
    try {
      localStorage.setItem(key, newValue);
    } catch {
      // localStorage pode falhar em modo privado — silencia sem quebrar
    }
  }, [key]);

  return [value, set];
}