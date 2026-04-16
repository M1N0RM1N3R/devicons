import { ICONS, type IconRecord } from "@dev.icons/core";

type VariantFilter = "all" | "regular" | "variants";

interface State {
  query: string;
  filter: VariantFilter;
}

const state: State = { query: "", filter: "all" };

let toastTimer: number | undefined;

const filteredIcons = (): readonly IconRecord[] => {
  const q = state.query.trim().toLowerCase();
  return ICONS.filter((icon) => {
    if (state.filter === "regular" && icon.isVariant) return false;
    if (state.filter === "variants" && !icon.isVariant) return false;
    if (q && !icon.name.toLowerCase().includes(q)) return false;
    return true;
  });
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

const renderGrid = (gridEl: HTMLElement, countEl: HTMLElement): void => {
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
          <i class="devicons devicons-${icon.name}" style="font-size: 48px"></i>
          <span class="text-xs text-gray-600 truncate w-full text-center">${icon.name}</span>
        </button>
      `,
    )
    .join("");
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

export const mountApp = (root: HTMLElement): void => {
  root.innerHTML = `
    <header class="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-200 z-20 px-4 py-3">
      <div class="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
        <h1 class="text-base font-semibold mr-auto">Devicons — Font</h1>
        <input
          data-search
          type="search"
          placeholder="Filter by name..."
          class="px-3 py-2 border border-gray-300 rounded text-sm w-64"
        />
        <div class="flex items-center gap-1 text-sm border border-gray-300 rounded overflow-hidden">
          <button data-filter="all" class="px-3 py-1.5 hover:bg-gray-100">All</button>
          <button data-filter="regular" class="px-3 py-1.5 hover:bg-gray-100 border-l border-gray-300">Regular</button>
          <button data-filter="variants" class="px-3 py-1.5 hover:bg-gray-100 border-l border-gray-300">-icon variants</button>
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
  const filterBtns = root.querySelectorAll<HTMLButtonElement>("[data-filter]");

  const refreshFilterButtons = (): void => {
    filterBtns.forEach((btn) => {
      const active = btn.dataset.filter === state.filter;
      btn.classList.toggle("bg-gray-900", active);
      btn.classList.toggle("text-white", active);
    });
  };

  search.addEventListener("input", () => {
    state.query = search.value;
    renderGrid(grid, count);
  });

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filter = (btn.dataset.filter ?? "all") as VariantFilter;
      refreshFilterButtons();
      renderGrid(grid, count);
    });
  });

  grid.addEventListener("click", (event) => {
    const card = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-name]");
    if (!card) return;
    const name = card.dataset.name!;
    void navigator.clipboard.writeText(name);
    showToast(document.body, name);
  });

  refreshFilterButtons();
  renderGrid(grid, count);
};
