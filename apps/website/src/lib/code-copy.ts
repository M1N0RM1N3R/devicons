/**
 * Attach a copy-to-clipboard button to every `<pre>` inside `.prose`.
 * Idempotent — safe to call more than once.
 */
export function setupCodeCopy() {
  const blocks = document.querySelectorAll<HTMLPreElement>(".prose pre");
  blocks.forEach((pre) => {
    if (pre.querySelector(".copy-btn")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    btn.textContent = "COPY";
    pre.appendChild(btn);

    let resetId: number | undefined;
    btn.addEventListener("click", async () => {
      const text =
        pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
      try {
        await navigator.clipboard.writeText(text);
        btn.dataset.state = "copied";
        btn.textContent = "OK";
        if (resetId) window.clearTimeout(resetId);
        resetId = window.setTimeout(() => {
          delete btn.dataset.state;
          btn.textContent = "COPY";
        }, 1500);
      } catch {
        btn.textContent = "ERR";
        if (resetId) window.clearTimeout(resetId);
        resetId = window.setTimeout(() => {
          btn.textContent = "COPY";
        }, 1500);
      }
    });
  });
}
