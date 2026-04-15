import { useCallback, useState, memo } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { clsx } from 'clsx';
import { SearchInput } from '../ui/search-input';
import { Badge } from '../ui/badge';

const ICON_GRID_CLASS =
  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';
import type { IconEntry } from '@/hooks/search';

type Background = 'dark' | 'light' | 'grid';

const bgStyles: Record<Background, string> = {
  dark: 'bg-surface',
  light: 'bg-white',
  grid: 'bg-[length:20px_20px] bg-surface',
};

const BACKDROP_COLORS: Record<'dark' | 'light', string> = {
  dark: '#f5f5f5',
  light: '#0a0a0a',
};

const PopularIcon = () => (
  <span aria-label="Popular icon" className="inline-block w-1 h-1 bg-accent" />
);

const IconCard = memo(
  ({
    icon,
    bg,
    onIconClick,
  }: {
    icon: IconEntry;
    bg: Background;
    onIconClick: (id: string) => void;
  }) => (
    <button
      onClick={() => onIconClick(icon.id)}
      className="group relative -ml-px -mt-px flex flex-col items-center gap-3 p-4 border border-border bg-bg hover:bg-surface transition-colors cursor-pointer text-left w-full hover:border-accent hover:z-10 focus:z-10 focus-visible:z-10 focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
      {icon.popular && (
        <span className="absolute top-0 right-2">
          <PopularIcon />
        </span>
      )}
      <div
        className={clsx(
          'w-12 h-12 flex items-center justify-center rounded p-1.5 relative overflow-hidden',
          bgStyles[bg],
          bg === 'grid' &&
            'bg-[repeating-conic-gradient(#262626_0%_25%,#1a1a1a_0%_50%)]',
        )}>
        {((bg === 'dark' && icon.badInDark) ||
          (bg === 'light' && icon.badInLight)) && (
          <span
            aria-hidden="true"
            className="absolute inset-[10%] rounded pointer-events-none"
            style={{
              background: BACKDROP_COLORS[bg as 'dark' | 'light'],
            }}
          />
        )}
        {icon.icons[0] && (
          <img
            src={`/devicons/icons/${icon.icons[0]}.svg`}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
            className="relative z-10 w-full h-full object-contain"
          />
        )}
      </div>
      <p className="type-card-title truncate w-full text-center">{icon.name}</p>
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {icon.icons.length > 1 && (
          <Badge variant="neutral">+{icon.icons.length - 1}</Badge>
        )}
        <Badge variant={icon.deprecated ? 'destructive' : 'success'}>
          {icon.deprecated ? 'Dead' : 'Active'}
        </Badge>
        {icon.version && <Badge variant="neutral">{icon.version}</Badge>}
      </div>
    </button>
  ),
);
IconCard.displayName = 'IconCard';

interface SearchSectionProps {
  results: IconEntry[];
  isLoading: boolean;
  isError: boolean;
  query: string | null;
  setQuery: (q: string | null) => void;
  maxResults?: number;
}

export function SearchSection({
  results,
  isLoading,
  isError,
  query,
  setQuery,
  maxResults,
}: SearchSectionProps) {
  const [, setIcon] = useQueryState('icon', parseAsString);
  const [bg, setBg] = useState<Background>('dark');

  const handleIconClick = useCallback((id: string) => setIcon(id), [setIcon]);

  return (
    <section id="icons" className="min-h-screen">
      {/* Sticky search bar */}
      <div className="sticky top-14 z-30 bg-bg border-b border-border">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-6">
          <h2 className="type-h2 shrink-0 hidden sm:block">Icons</h2>
          <div className="flex items-center gap-4 flex-1">
            <SearchInput
              defaultValue={query ?? ''}
              onValueChange={setQuery}
              placeholder="Search ..."
            />

            <p className="type-mono-sm shrink-0 hidden md:block">
              {isLoading ? '...' : `${results.length} results`}
            </p>
          </div>

          <div role="tablist" className="flex gap-1 shrink-0 tab-group">
            {(['dark', 'light', 'grid'] as const).map(b => (
              <button
                key={b}
                type="button"
                onClick={() => setBg(b)}
                aria-label={`${b} background`}
                aria-pressed={bg === b}
                className={clsx('tabs__swatch', `tabs__swatch--${b}`)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {isError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="type-body text-text-muted">
              Failed to load icons. Please refresh.
            </p>
          </div>
        ) : isLoading ? (
          <div className={ICON_GRID_CLASS}>
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="-ml-px -mt-px h-[140px] border border-border bg-bg"
              />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="type-body text-text-muted">No icons found</p>
            <p className="type-body-sm text-text-muted mt-2">
              Try a different search term
            </p>
          </div>
        ) : (
          <>
            <div className={ICON_GRID_CLASS}>
              {(maxResults ? results.slice(0, maxResults) : results).map(
                icon => (
                  <IconCard
                    key={icon.id}
                    icon={icon}
                    bg={bg}
                    onIconClick={handleIconClick}
                  />
                ),
              )}
            </div>
            {maxResults && results.length > maxResults && (
              <div className="flex items-center justify-center gap-3 py-8 border-t border-border">
                <p className="type-mono">
                  Showing {maxResults} of {results.length} results
                </p>
                <a
                  href={`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`}
                  className="font-mono text-xs font-semibold uppercase tracking-[0.18em] leading-none text-accent hover:text-accent-hover transition-colors shrink-0">
                  View all
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
