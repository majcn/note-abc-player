<script lang="ts">
  import SongPlayer from '#lib/components/SongPlayer.svelte';
  import { transposeParam } from '#lib/transposeParam.svelte.js';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  // Read-only view: just the playback surface, no editor. The editable route
  // uses SongEditor instead.
  let { abc }: { abc: string } = $props();

  const transpose = transposeParam();
  let printHref = $derived(
    resolve('/[name]/pdf', { name: page.params.name! }) + (transpose.value ? `?t=${transpose.value}` : '')
  );
</script>

<div class="flex h-dvh w-full overflow-hidden">
  <SongPlayer {abc} bind:transpose={transpose.value} {printHref} />
</div>
