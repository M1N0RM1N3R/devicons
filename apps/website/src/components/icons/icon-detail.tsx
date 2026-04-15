import { IconPreview } from './icon-preview';
import { InstallTabs } from '../ui/install-tabs';

interface IconDetailProps {
  name: string;
  icons: string[];
  slug: string;
}

export function IconDetail({ name, icons, slug }: IconDetailProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-8 sm:mb-12">
        <IconPreview icons={icons} name={name} />
      </div>
      <InstallTabs icons={icons.length > 0 ? icons : [slug]} />
    </div>
  );
}
