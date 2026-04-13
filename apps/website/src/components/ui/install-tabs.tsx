import { useCallback, useState } from 'react';
import { clsx } from 'clsx';

type TabId = 'react' | 'vue' | 'svelte' | 'astro' | 'font';

interface InstallTabsProps {
  icons: string[];
  className?: string;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'svelte', label: 'Svelte' },
  { id: 'astro', label: 'Astro' },
  { id: 'font', label: 'Font' },
];

const RESERVED = new Set(['React', 'Vue', 'Svelte', 'Astro']);

function toComponentName(slug: string): string {
  const pascal = slug
    .split(/[-_]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return RESERVED.has(pascal) ? `_${pascal}` : pascal;
}

interface Snippet {
  label: string;
  code: string;
}

function snippetsFor(tab: TabId, icons: string[]): Snippet[] {
  const components = icons.map(toComponentName);
  const importList = components.join(', ');

  if (tab === 'react') {
    return [
      { label: 'Import', code: `import { ${importList} } from "@dev.icons/react";` },
      { label: 'Render', code: components.map(c => `<${c} size={32} />`).join('\n') },
    ];
  }

  if (tab === 'vue') {
    return [
      { label: 'Import', code: `import { ${importList} } from "@dev.icons/vue";` },
      { label: 'Render', code: components.map(c => `<${c} :size="32" />`).join('\n') },
    ];
  }

  if (tab === 'svelte') {
    return [
      { label: 'Import', code: `import { ${importList} } from "@dev.icons/svelte";` },
      { label: 'Render', code: components.map(c => `<${c} size={32} />`).join('\n') },
    ];
  }

  if (tab === 'astro') {
    return [
      { label: 'Import', code: `---\nimport { ${importList} } from "@dev.icons/react";\n---` },
      { label: 'Render', code: components.map(c => `<${c} size={32} client:load />`).join('\n') },
    ];
  }

  return [
    { label: 'CSS', code: `@import "devicons/css";` },
    { label: 'Render', code: icons.map(slug => `<i class="devicons devicons-${slug}"></i>`).join('\n') },
  ];
}

function Snippet({ snippet }: { snippet: Snippet }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [snippet.code]);

  return (
    <div className="install-snippet">
      <div className="install-snippet__head">
        <span className="install-snippet__label">{snippet.label}</span>
        <span className="install-snippet__rule" aria-hidden="true" />
      </div>
      <div className="install-snippet__block">
        <pre className="install-snippet__code">
          <code>{snippet.code}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${snippet.label.toLowerCase()} snippet`}
          data-state={copied ? 'copied' : undefined}
          className="install-snippet__copy"
        >
          {copied ? 'OK' : 'COPY'}
        </button>
      </div>
    </div>
  );
}

export function InstallTabs({ icons, className }: InstallTabsProps) {
  const [tab, setTab] = useState<TabId>('react');
  const snippets = snippetsFor(tab, icons);

  return (
    <div className={clsx('install-tabs', className)}>
      <div
        role="tablist"
        aria-label="Framework installation"
        className="install-tabs__bar"
      >
        <span className="install-tabs__eyebrow">Usage</span>
        <div className="install-tabs__list">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className="install-tabs__tab"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="install-tabs__body">
        {snippets.map(s => (
          <Snippet key={s.label} snippet={s} />
        ))}
      </div>
    </div>
  );
}
