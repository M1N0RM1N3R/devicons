import {
  IconPreviewGrid,
  PreviewControls,
  type IconVariant,
  type IconBackground,
} from './icon-preview-grid';

interface IconPreviewProps {
  icons: string[];
  name: string;
  badInDark?: boolean;
  badInLight?: boolean;
  previewState: {
    variant: IconVariant;
    setVariant: (v: IconVariant) => void;
    bg: IconBackground;
    setBg: (b: IconBackground) => void;
  };
}

export function IconPreview({
  icons,
  name,
  badInDark,
  badInLight,
  previewState: { variant, setVariant, bg, setBg },
}: IconPreviewProps) {
  return (
    <div>
      <PreviewControls
        variant={variant}
        onVariantChange={setVariant}
        bg={bg}
        onBgChange={setBg}
      />
      <IconPreviewGrid
        icons={icons}
        name={name}
        variant={variant}
        bg={bg}
        badInDark={badInDark}
        badInLight={badInLight}
      />
    </div>
  );
}
