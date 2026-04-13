<script lang="ts">
  import Base from "../src/lib/Base.svelte";
  const { icons, ...rest } = $props();
</script>

<Base {icons} {...rest} />
