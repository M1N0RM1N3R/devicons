interface MobileMenuOptions {
  key: string;
  breakpoint: string;
  closeOnPanelLinkClick?: boolean;
}

/**
 * Wire up a mobile-menu overlay. Expects these data-attributes in the DOM:
 *   [data-{key}]                — root (toggles data-state="open|closed")
 *   [data-{key}-trigger]        — open button
 *   [data-{key}-panel]          — panel (focus target, link container)
 *   [data-{key}-overlay]        — backdrop (closes on click)
 *   [data-{key}-close]          — close button(s)
 */
export function setupMobileMenu({
  key,
  breakpoint,
  closeOnPanelLinkClick = false,
}: MobileMenuOptions) {
  const root = document.querySelector<HTMLElement>(`[data-${key}]`);
  const trigger = document.querySelector<HTMLButtonElement>(
    `[data-${key}-trigger]`,
  );
  const panel = document.querySelector<HTMLElement>(`[data-${key}-panel]`);
  const closers = document.querySelectorAll<HTMLElement>(
    `[data-${key}-close], [data-${key}-overlay]`,
  );

  if (!root || !trigger) return;

  function open() {
    root!.dataset.state = "open";
    root!.setAttribute("aria-hidden", "false");
    trigger!.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function close() {
    root!.dataset.state = "closed";
    root!.setAttribute("aria-hidden", "true");
    trigger!.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  trigger.addEventListener("click", open);
  closers.forEach((el) => el.addEventListener("click", close));
  if (closeOnPanelLinkClick) {
    panel?.querySelectorAll("a[href]").forEach((link) => {
      link.addEventListener("click", close);
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.getAttribute("aria-hidden") === "false") {
      close();
    }
  });
  const mq = window.matchMedia(breakpoint);
  mq.addEventListener("change", (e) => {
    if (e.matches) close();
  });
}
