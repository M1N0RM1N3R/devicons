import { useCallback, useMemo, useState } from 'react';
import { clsx } from 'clsx';

export type CdnProvider = 'unpkg' | 'jsdelivr' | 'npmmirror' | 'skypack';

interface CdnTabsProps {
  pkg: string;
  version?: string;
  path: string;
  providers?: CdnProvider[];
  template?: string;
  fragment?: string;
  label?: string;
  className?: string;
}

const PROVIDERS: Record<
  CdnProvider,
  { label: string; build: (pkg: string, version: string, path: string) => string }
> = {
  unpkg: {
    label: 'UNPKG',
    build: (pkg, version, path) => `https://unpkg.com/${pkg}@${version}/${path}`,
  },
  jsdelivr: {
    label: 'jsDelivr',
    build: (pkg, version, path) =>
      `https://cdn.jsdelivr.net/npm/${pkg}@${version}/${path}`,
  },
  npmmirror: {
    label: 'npmmirror',
    build: (pkg, version, path) =>
      `https://registry.npmmirror.com/${pkg}/${version}/files/${path}`,
  },
  skypack: {
    label: 'Skypack',
    build: (pkg, version) => `https://cdn.skypack.dev/${pkg}@${version}`,
  },
};

const DEFAULT_PROVIDERS: CdnProvider[] = [
  'unpkg',
  'jsdelivr',
  'npmmirror',
  'skypack',
];

export function CdnTabs({
  pkg,
  version = 'latest',
  path,
  providers = DEFAULT_PROVIDERS,
  template = '{url}',
  fragment = '',
  label = 'Provider',
  className,
}: CdnTabsProps) {
  const tabs = providers.length > 0 ? providers : DEFAULT_PROVIDERS;
  const [active, setActive] = useState<CdnProvider>(tabs[0]);
  const [copied, setCopied] = useState(false);

  const url = useMemo(
    () => `${PROVIDERS[active].build(pkg, version, path)}${fragment}`,
    [active, pkg, version, path, fragment],
  );

  const snippet = useMemo(() => template.replace(/\{url\}/g, url), [template, url]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [snippet]);

  return (
    <div className={clsx('install-tabs', 'cdn-tabs', className)}>
      <div
        role="tablist"
        aria-label={`${label} picker`}
        className="install-tabs__bar"
      >
        <span className="install-tabs__eyebrow">{label}</span>
        <div className="tab-group">
          {tabs.map(p => (
            <button
              key={p}
              role="tab"
              aria-selected={active === p}
              onClick={() => setActive(p)}
              className="tab-item"
            >
              {PROVIDERS[p].label}
            </button>
          ))}
        </div>
      </div>

      <div className="install-snippet">
        <div className="install-snippet__block">
          <pre className="install-snippet__code">
            <code>{snippet}</code>
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy CDN snippet"
            data-state={copied ? 'copied' : undefined}
            className="copy-btn"
          >
            {copied ? 'OK' : 'COPY'}
          </button>
        </div>
      </div>
    </div>
  );
}
