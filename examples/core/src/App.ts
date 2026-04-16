import { ICONS, type IconRecord } from "@dev.icons/core";

type RenderMode = "sprite" | "font";

interface State {
  query: string;
  mode: RenderMode;
}

const state: State = { query: "", mode: "sprite" };

let toastTimer: number | undefined;

const filteredIcons = (): readonly IconRecord[] => {
  const q = state.query.trim().toLowerCase();
  if (!q) return ICONS;
  return ICONS.filter((icon) => icon.name.toLowerCase().includes(q));
};

const showToast = (root: HTMLElement, name: string): void => {
  const existing = root.querySelector<HTMLDivElement>("[data-toast]");
  if (existing) existing.remove();
  if (toastTimer) window.clearTimeout(toastTimer);

  const toast = document.createElement("div");
  toast.dataset.toast = "1";
  toast.className =
    "fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50";
  toast.textContent = `Copied "${name}"`;
  root.appendChild(toast);

  toastTimer = window.setTimeout(() => toast.remove(), 1000);
};

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    c === "&"
      ? "&amp;"
      : c === "<"
        ? "&lt;"
        : c === ">"
          ? "&gt;"
          : c === '"'
            ? "&quot;"
            : "&#39;",
  );

const renderIconMarkup = (name: string, spriteUrl: string): string => {
  if (state.mode === "sprite") {
    return `<svg width="48" height="48" aria-hidden="true"><use href="${spriteUrl}#${name}"></use></svg>`;
  }
  return `<i class="devicons devicons-${name}" style="font-size: 48px"></i>`;
};

const renderGrid = (
  gridEl: HTMLElement,
  countEl: HTMLElement,
  spriteUrl: string,
): void => {
  const icons = filteredIcons();
  countEl.textContent = `${icons.length.toLocaleString()} of ${ICONS.length.toLocaleString()}`;

  if (icons.length === 0) {
    gridEl.innerHTML = `<div class="col-span-full py-16 text-center text-gray-500">No icons match "${escapeHtml(state.query)}"</div>`;
    return;
  }

  gridEl.innerHTML = icons
    .map(
      (icon) => `
        <button
          data-name="${escapeHtml(icon.name)}"
          class="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-sm bg-white transition-colors cursor-pointer"
          title="Click to copy"
        >
          ${renderIconMarkup(icon.name, spriteUrl)}
          <span class="text-xs text-gray-600 truncate w-full text-center">${icon.name}</span>
        </button>
      `,
    )
    .join("");
};

export const mountApp = (root: HTMLElement, spriteUrl: string): void => {
  root.innerHTML = `
    <header class="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-200 z-20 px-4 py-3">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
        <h1 class="text-base font-semibold mr-auto">Devicons — Core</h1>
        <input
          data-search
          type="search"
          placeholder="Filter by name..."
          class="px-3 py-2 border border-gray-300 rounded text-sm w-64"
        />
        <div class="flex items-center gap-1 text-sm border border-gray-300 rounded overflow-hidden">
          <button data-mode="sprite" class="px-3 py-1.5 hover:bg-gray-100">Sprite (colorful)</button>
          <button data-mode="font" class="px-3 py-1.5 hover:bg-gray-100 border-l border-gray-300">Font (monochrome)</button>
        </div>
        <span data-count class="text-xs text-gray-500 tabular-nums"></span>
      </div>
    </header>
    <main class="max-w-7xl mx-auto p-4">
      <div
        data-grid
        class="grid gap-3"
        style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))"
      ></div>
    </main>
  `;

  const search = root.querySelector<HTMLInputElement>("[data-search]")!;
  const grid = root.querySelector<HTMLElement>("[data-grid]")!;
  const count = root.querySelector<HTMLElement>("[data-count]")!;
  const modeBtns = root.querySelectorAll<HTMLButtonElement>("[data-mode]");

  const refreshModeButtons = (): void => {
    modeBtns.forEach((btn) => {
      const active = btn.dataset.mode === state.mode;
      btn.classList.toggle("bg-gray-900", active);
      btn.classList.toggle("text-white", active);
    });
  };

  search.addEventListener("input", () => {
    state.query = search.value;
    renderGrid(grid, count, spriteUrl);
  });

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = (btn.dataset.mode ?? "sprite") as RenderMode;
      refreshModeButtons();
      renderGrid(grid, count, spriteUrl);
    });
  });

  grid.addEventListener("click", (event) => {
    const card = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-name]");
    if (!card) return;
    const name = card.dataset.name!;
    void navigator.clipboard.writeText(name);
    showToast(document.body, name);
  });

  refreshModeButtons();
  renderGrid(grid, count, spriteUrl);
};
