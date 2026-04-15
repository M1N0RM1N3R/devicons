import {
  IconPreviewGrid,
  PreviewControls,
  useIconPreviewState,
} from './icon-preview-grid';

interface IconPreviewProps {
  icons: string[];
  name: string;
}

export function IconPreview({ icons, name }: IconPreviewProps) {
  const { variant, setVariant, bg, setBg } = useIconPreviewState();

  return (
    <div>
      <PreviewControls
        variant={variant}
        onVariantChange={setVariant}
        bg={bg}
        onBgChange={setBg}
      />
      <IconPreviewGrid icons={icons} name={name} variant={variant} bg={bg} />
    </div>
  );
}
