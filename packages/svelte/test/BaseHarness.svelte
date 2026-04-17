<script lang="ts">
  import Base from "../src/lib/Base.svelte";
  const { content, ...rest } = $props();
</script>

<Base {content} {...rest} />
