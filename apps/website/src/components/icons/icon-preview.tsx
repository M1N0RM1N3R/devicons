import {
  IconPreviewGrid,
  PreviewControls,
  useIconPreviewState,
} from './icon-preview-grid';

interface IconPreviewProps {
  icons: string[];
  name: string;
  badInDark?: boolean;
  badInLight?: boolean;
}

export function IconPreview({
  icons,
  name,
  badInDark,
  badInLight,
}: IconPreviewProps) {
  const { variant, setVariant, bg, setBg } = useIconPreviewState();

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
