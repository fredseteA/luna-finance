import React from 'react';
import { cn } from '../../lib/utils';
import { useFinancial } from '../../contexts/FinancialContext';

/**
 * Componente Logo Luna Finance
 * 
 * Variantes:
 * - horizontal: Logo completa com texto (para header)
 * - icon: Apenas o ícone (para favicon, sidebar colapsada, PWA)
 * 
 * O tema é detectado automaticamente, mas pode ser forçado via prop
 * 
 * Tamanhos:
 * - sm: 24px altura (icon) / 80px largura (horizontal)
 * - md: 32px altura (icon) / 120px largura (horizontal) - DEFAULT
 * - lg: 48px altura (icon) / 160px largura (horizontal)
 * - xl: 64px altura (icon) / 200px largura (horizontal)
 */

const sizeConfig = {
  sm: {
    icon: 'h-6 w-6',
    horizontal: 'h-6',
  },
  md: {
    icon: 'h-8 w-8',
    horizontal: 'h-7',
  },
  lg: {
    icon: 'h-12 w-12',
    horizontal: 'h-10',
  },
  xl: {
    icon: 'h-16 w-16',
    horizontal: 'h-14',
  },
};

export const Logo = ({
  variant = 'horizontal',
  size = 'md',
  forceTheme, // 'light' | 'dark' - força um tema específico
  className,
  showText = true, // Para variante horizontal, mostrar ou não o texto
  ...props
}) => {
  const { theme } = useFinancial();
  
  // Determina qual tema usar
  const currentTheme = forceTheme || theme;
  
  // Seleciona a imagem correta baseada na variante e tema
  const getImageSrc = () => {
    if (variant === 'icon') {
      return '/assets/logo/logo-icon.png';
    }
    return currentTheme === 'dark' 
      ? '/assets/logo/logo-horizontal-light.png'
      : '/assets/logo/logo-horizontal-dark.png';
  };

  const sizeClasses = sizeConfig[size] || sizeConfig.md;

  if (variant === 'icon') {
    return (
      <img
        src="/assets/logo/logo-icon.png"
        alt="Luna Finance"
        className={cn(
          sizeClasses.icon,
          'object-contain rounded-lg',
          className
        )}
        loading="lazy"
        {...props}
      />
    );
  }

  // Variante horizontal
  return (
    <img
      src={getImageSrc()}
      alt="Luna Finance"
      className={cn(
        sizeClasses.horizontal,
        'object-contain',
        className
      )}
      loading="lazy"
      {...props}
    />
  );
};

/**
 * Versão apenas do ícone para uso rápido
 */
export const LogoIcon = ({ size = 'md', className, ...props }) => (
  <Logo variant="icon" size={size} className={className} {...props} />
);

/**
 * Versão horizontal para header
 */
export const LogoHorizontal = ({ size = 'md', className, ...props }) => (
  <Logo variant="horizontal" size={size} className={className} {...props} />
);

export default Logo;
