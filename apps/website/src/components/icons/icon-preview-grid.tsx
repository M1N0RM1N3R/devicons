import { useState } from 'react';
import { clsx } from 'clsx';
import { SvgActions } from '../ui/svg-actions';

export type IconVariant = 'icon' | 'font';
export type IconBackground = 'dark' | 'light' | 'grid';

const bgStyles: Record<IconBackground, string> = {
  dark: 'bg-surface',
  light: 'bg-white',
  grid: 'bg-[length:20px_20px] bg-surface',
};

interface PreviewControlsProps {
  variant: IconVariant;
  onVariantChange: (v: IconVariant) => void;
  bg: IconBackground;
  onBgChange: (b: IconBackground) => void;
}

export function PreviewControls({
  variant,
  onVariantChange,
  bg,
  onBgChange,
}: PreviewControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div role="tablist" aria-label="Icon variant" className="tab-group">
        <button
          role="tab"
          onClick={() => onVariantChange('icon')}
          aria-selected={variant === 'icon'}
          className="tab-item">
          Color
        </button>
        <button
          role="tab"
          onClick={() => onVariantChange('font')}
          aria-selected={variant === 'font'}
          className="tab-item">
          Monochrome
        </button>
      </div>
      <div role="tablist" aria-label="Preview background" className="tab-group">
        {(['dark', 'light', 'grid'] as const).map(b => (
          <button
            key={b}
            role="tab"
            type="button"
            onClick={() => onBgChange(b)}
            aria-label={`${b} background`}
            aria-selected={bg === b}
            className={clsx('tabs__swatch', `tabs__swatch--${b}`)}
          />
        ))}
      </div>
    </div>
  );
}

interface IconPreviewGridProps {
  icons: string[];
  name: string;
  variant: IconVariant;
  bg: IconBackground;
  gridClassName?: string;
  tilePaddingClassName?: string;
  iconMaxClassName?: string;
}

export function IconPreviewGrid({
  icons,
  name,
  variant,
  bg,
  gridClassName = 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4',
  tilePaddingClassName = 'p-6 sm:p-8',
  iconMaxClassName = 'max-w-[120px] max-h-[120px]',
}: IconPreviewGridProps) {
  return (
    <div className={gridClassName}>
      {icons.map(iconFile => (
        <div key={iconFile} className="flex flex-col">
          <div
            className={clsx(
              'aspect-square flex items-center justify-center rounded-xl border border-border',
              tilePaddingClassName,
              bgStyles[bg],
              bg === 'grid' &&
                'bg-[repeating-conic-gradient(#262626_0%_25%,#1a1a1a_0%_50%)]',
            )}>
            {variant === 'font' ? (
              <div
                role="img"
                aria-label={`${name} logo (${iconFile})`}
                className={clsx('w-full h-full bg-accent', iconMaxClassName)}
                style={{
                  maskImage: `url(/devicons/font/${iconFile}.svg)`,
                  WebkitMaskImage: `url(/devicons/font/${iconFile}.svg)`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              />
            ) : (
              <img
                src={`/devicons/icons/${iconFile}.svg`}
                alt={`${name} logo (${iconFile})`}
                className={clsx(
                  'w-full h-full object-contain',
                  iconMaxClassName,
                )}
              />
            )}
          </div>
          <div className="flex items-center justify-center pt-2">
            <SvgActions iconFile={iconFile} variant={variant} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function useIconPreviewState(
  initialVariant: IconVariant = 'icon',
  initialBg: IconBackground = 'dark',
) {
  const [variant, setVariant] = useState<IconVariant>(initialVariant);
  const [bg, setBg] = useState<IconBackground>(initialBg);
  return { variant, setVariant, bg, setBg };
}
