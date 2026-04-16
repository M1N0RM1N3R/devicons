import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import * as Icons from "@dev.icons/react";
import { ICONS } from "@dev.icons/core";

interface IconProps {
  size?: string;
  mono?: boolean;
}

type IconNamespace = Record<string, ComponentType<IconProps> | unknown>;

const toPascal = (name: string): string =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const iconRegistry = (() => {
  const ns = Icons as IconNamespace;
  return ICONS.flatMap((record) => {
    const Component = ns[toPascal(record.name)];
    if (!Component || (typeof Component !== "function" && typeof Component !== "object")) return [];
    return [{ name: record.name, Component: Component as ComponentType<IconProps> }];
  });
})();

class IconErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.failed) {
      return <span className="text-red-500 text-xs">!</span>;
    }
    return this.props.children;
  }
}

export default function App() {
  const [query, setQuery] = useState("");
  const [mono, setMono] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return iconRegistry;
    return iconRegistry.filter((i) => i.name.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const copy = (name: string): void => {
    void navigator.clipboard.writeText(name);
    setToast(name);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1000);
  };

  return (
    <>
      <header className="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-200 z-20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
          <h1 className="text-base font-semibold mr-auto">Devicons — React</h1>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Filter by name..."
            className="px-3 py-2 border border-gray-300 rounded text-sm w-64"
          />
          <div className="flex items-center gap-1 text-sm border border-gray-300 rounded overflow-hidden">
            <button
              className={`px-3 py-1.5 hover:bg-gray-100 ${!mono ? "bg-gray-900 text-white" : ""}`}
              onClick={() => setMono(false)}
            >
              Colorful
            </button>
            <button
              className={`px-3 py-1.5 hover:bg-gray-100 border-l border-gray-300 ${mono ? "bg-gray-900 text-white" : ""}`}
              onClick={() => setMono(true)}
            >
              Mono
            </button>
          </div>
          <span className="text-xs text-gray-500 tabular-nums">
            {filtered.length.toLocaleString()} of {iconRegistry.length.toLocaleString()}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            No icons match &ldquo;{query}&rdquo;
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}
          >
            {filtered.map(({ name, Component: Icon }) => (
              <button
                key={name}
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-sm bg-white transition-colors cursor-pointer"
                title="Click to copy"
                onClick={() => copy(name)}
              >
                <IconErrorBoundary>
                  <Icon size="48px" mono={mono} />
                </IconErrorBoundary>
                <span className="text-xs text-gray-600 truncate w-full text-center">
                  {name}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          Copied &ldquo;{toast}&rdquo;
        </div>
      )}
    </>
  );
}
