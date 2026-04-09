/**
 * animationVariants.js — variantes Framer Motion compartilhadas entre páginas.
 *
 * Centraliza timing e motion para que ajustes globais (duração, easing,
 * prefers-reduced-motion) sejam feitos em um único lugar.
 *
 * Uso:
 *   import { usePageVariants } from '../lib/animationVariants';
 *   const { container, item } = usePageVariants();
 */

import { useReducedMotion } from 'framer-motion';

export function usePageVariants() {
  const reduced = useReducedMotion();

  const container = {
    hidden: { opacity: reduced ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: reduced ? {} : { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 },
    visible: { opacity: 1, y: 0 },
  };

  return { container, item };
}