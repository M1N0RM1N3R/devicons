import { IconPreview } from './icon-preview';
import { useIconPreviewState } from './icon-preview-grid';
import { InstallTabs } from '../ui/install-tabs';

interface IconDetailProps {
  name: string;
  icons: string[];
  slug: string;
  badInDark?: boolean;
  badInLight?: boolean;
}

export function IconDetail({
  name,
  icons,
  slug,
  badInDark,
  badInLight,
}: IconDetailProps) {
  const previewState = useIconPreviewState();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-8 sm:mb-12">
        <IconPreview
          icons={icons}
          name={name}
          badInDark={badInDark}
          badInLight={badInLight}
          previewState={previewState}
        />
      </div>
      <InstallTabs
        icons={icons.length > 0 ? icons : [slug]}
        mono={previewState.variant === 'font'}
      />
    </div>
  );
}
