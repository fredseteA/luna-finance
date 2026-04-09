import { useMemo } from 'react';

/**
 * useGreeting — retorna saudação e subtítulo dinâmicos.
 *
 * Saudação varia por período do dia.
 * Subtítulo rotaciona entre dicas/status para evitar mensagem estática
 * que perde significado após os primeiros usos.
 */

const SUBTITLES = [
  'Vamos alavancar seu patrimônio!',
  'Seu futuro financeiro começa hoje.',
  'Consistência é o segredo do crescimento.',
  'Pequenos aportes, grandes resultados.',
  'Planejamento hoje, liberdade amanhã.',
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getDailySubtitle() {
  // Rotaciona pelo dia do mês para ser consistente dentro do mesmo dia
  const dayOfMonth = new Date().getDate();
  return SUBTITLES[dayOfMonth % SUBTITLES.length];
}

export function useGreeting(displayName) {
  return useMemo(() => {
    const firstName = displayName?.split(' ')[0] || 'bem-vindo';
    const greeting = getGreeting();
    const subtitle = getDailySubtitle();

    return {
      greeting: `${greeting}, ${firstName}!`,
      subtitle,
    };
  }, [displayName]);
}