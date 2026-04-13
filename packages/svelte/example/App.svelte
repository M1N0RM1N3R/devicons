<script lang="ts">
  import * as Icons from "../src/icons";

  let type: "icon" | "font" = $state("icon");

  const iconComponents = Object.entries(Icons)
    .filter(([, value]) => typeof value !== "string")
    .map(([name, Icon]) => ({ name, Icon }));
</script>

<div class="p-4 container mx-auto">
  <div class="flex gap-4 mb-4 sticky top-0 bg-white p-4">
    <label>
      <input type="radio" name="type" value="icon" checked={type === "icon"} onchange={() => (type = "icon")} />
      Icon
    </label>
    <label>
      <input type="radio" name="type" value="font" checked={type === "font"} onchange={() => (type = "font")} />
      Font
    </label>
  </div>
  <div class="grid grid-cols-5 gap-4">
    {#each iconComponents as { name, Icon } (name)}
      <div class="flex flex-col items-center justify-center">
        <Icon size="100px" {type} />
        <div class="text-sm">{name}</div>
      </div>
    {/each}
  </div>
</div>
