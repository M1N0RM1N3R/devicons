<script setup lang="ts">
import { computed, ref } from "vue";
import * as Icons from "@dev.icons/vue";
import { ICONS } from "@dev.icons/core";

const toPascal = (name: string): string =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const iconRegistry = (() => {
  const ns = Icons as Record<string, unknown>;
  return ICONS.flatMap((record) => {
    const Icon = ns[toPascal(record.name)];
    if (typeof Icon !== "object" && typeof Icon !== "function") return [];
    return [{ name: record.name, Icon: Icon as object }];
  });
})();

const query = ref("");
const mono = ref(false);
const toast = ref<string | null>(null);
let toastTimer: number | undefined;

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return iconRegistry;
  return iconRegistry.filter((i) => i.name.toLowerCase().includes(q));
});

const copy = (name: string): void => {
  void navigator.clipboard.writeText(name);
  toast.value = name;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toast.value = null), 1000);
};
</script>

<template>
  <header class="sticky top-0 bg-white/90 backdrop-blur border-b border-gray-200 z-20 px-4 py-3">
    <div class="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
      <h1 class="text-base font-semibold mr-auto">Devicons — Vue</h1>
      <input
        v-model="query"
        type="search"
        placeholder="Filter by name..."
        class="px-3 py-2 border border-gray-300 rounded text-sm w-64"
      />
      <div class="flex items-center gap-1 text-sm border border-gray-300 rounded overflow-hidden">
        <button
          :class="['px-3 py-1.5 hover:bg-gray-100', !mono && 'bg-gray-900 text-white']"
          @click="mono = false"
        >
          Colorful
        </button>
        <button
          :class="['px-3 py-1.5 hover:bg-gray-100 border-l border-gray-300', mono && 'bg-gray-900 text-white']"
          @click="mono = true"
        >
          Mono
        </button>
      </div>
      <span class="text-xs text-gray-500 tabular-nums">
        {{ filtered.length.toLocaleString() }} of {{ iconRegistry.length.toLocaleString() }}
      </span>
    </div>
  </header>

  <main class="max-w-7xl mx-auto p-4">
    <div
      v-if="filtered.length === 0"
      class="py-16 text-center text-gray-500"
    >
      No icons match "{{ query }}"
    </div>
    <div
      v-else
      class="grid gap-3"
      style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))"
    >
      <button
        v-for="{ name, Icon } in filtered"
        :key="name"
        class="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-sm bg-white transition-colors cursor-pointer"
        title="Click to copy"
        @click="copy(name)"
      >
        <component :is="Icon" size="48px" :mono="mono" />
        <span class="text-xs text-gray-600 truncate w-full text-center">{{ name }}</span>
      </button>
    </div>
  </main>

  <div
    v-if="toast"
    class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50"
  >
    Copied "{{ toast }}"
  </div>
</template>
