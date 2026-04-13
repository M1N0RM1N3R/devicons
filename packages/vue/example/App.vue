<script setup lang="ts">
import { ref } from "vue";
import * as Icons from "../src/icons";

type IconType = "icon" | "font";

const type = ref<IconType>("icon");

const iconComponents = Object.entries(Icons)
  .filter(([, value]) => typeof value !== "string")
  .map(([name, Icon]) => ({ name, Icon }));
</script>

<template>
  <div class="p-4 container mx-auto">
    <div class="flex gap-4 mb-4 sticky top-0 bg-white p-4">
      <label>
        <input type="radio" name="type" value="icon" :checked="type === 'icon'" @change="type = 'icon'" />
        Icon
      </label>
      <label>
        <input type="radio" name="type" value="font" :checked="type === 'font'" @change="type = 'font'" />
        Font
      </label>
    </div>
    <div class="grid grid-cols-5 gap-4">
      <div
        v-for="{ name, Icon } in iconComponents"
        :key="name"
        class="flex flex-col items-center justify-center"
      >
        <component :is="Icon" size="100px" :type="type" />
        <div class="text-sm">{{ name }}</div>
      </div>
    </div>
  </div>
</template>
