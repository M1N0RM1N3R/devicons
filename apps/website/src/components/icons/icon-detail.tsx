import { IconPreview } from './icon-preview';
import { InstallTabs } from '../ui/install-tabs';
import { Badge } from '../ui/badge';
import { Tag } from '../ui/tag';

interface IconNav {
  slug: string;
  name: string;
}

interface IconDetailProps {
  name: string;
  description?: string;
  icons: string[];
  tags: string[];
  deprecated?: boolean;
  version?: string;
  website?: string;
  slug: string;
  prev?: IconNav | null;
  next?: IconNav | null;
}

export function IconDetail({
  name,
  description,
  icons,
  tags,
  deprecated,
  version,
  website,
  slug,
  prev,
  next,
}: IconDetailProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
      {/* Breadcrumb */}
      <nav className="mb-6 sm:mb-8">
        <a
          href="/search"
          className="font-mono text-xs font-semibold uppercase tracking-[0.18em] leading-none text-accent hover:text-accent-hover transition-colors shrink-0">
          &larr; Back to search
        </a>
      </nav>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="type-display-sm">{name}</h1>
        {description && <p className="type-body-lg mt-3">{description}</p>}

        <div className="flex items-center gap-2 mt-3 sm:mt-4 flex-wrap">
          {deprecated && <Badge variant="destructive">Deprecated</Badge>}
          {version && <Badge variant="neutral">v{version}</Badge>}
          <Badge variant="success">
            {icons.length} variant{icons.length > 1 ? 's' : ''}
          </Badge>
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs font-semibold uppercase tracking-[0.18em] leading-none text-accent hover:text-accent-hover transition-colors">
              Website &rarr;
            </a>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-2 mt-3 sm:mt-4 flex-wrap">
            {tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="mb-8 sm:mb-12">
        <IconPreview icons={icons} name={name} />
      </div>

      {/* Code blocks */}
      <InstallTabs icons={icons.length > 0 ? icons : [slug]} />

      {/* Prev / Next navigation */}
      {(prev || next) && (
        <nav
          aria-label="Icon navigation"
          className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border grid grid-cols-2 gap-3 sm:gap-4">
          {prev ? (
            <a
              href={`/icons/${prev.slug}`}
              data-astro-prefetch
              className="group flex flex-col gap-2 p-4 border border-border hover:border-accent/60 transition-colors">
              <span className="type-meta group-hover:text-accent transition-colors">
                &larr; Previous
              </span>
              <span className="type-h3 truncate">{prev.name}</span>
            </a>
          ) : (
            <span />
          )}
          {next ? (
            <a
              href={`/icons/${next.slug}`}
              data-astro-prefetch
              className="group flex flex-col gap-2 p-4 border border-border hover:border-accent/60 transition-colors text-right sm:col-start-2">
              <span className="type-meta group-hover:text-accent transition-colors">
                Next &rarr;
              </span>
              <span className="type-h3 truncate">{next.name}</span>
            </a>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
