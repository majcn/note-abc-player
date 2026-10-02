<script lang="ts">
  import SongPlayer from '#lib/components/SongPlayer.svelte';
  import { transposeParam } from '#lib/transposeParam.svelte.js';

  // Read-only view: just the playback surface, no editor. The editable route
  // uses SongEditor instead.
  let { abc }: { abc: string } = $props();

  const transpose = transposeParam();
</script>

<div class="flex h-dvh w-full overflow-hidden">
  <SongPlayer {abc} bind:transpose={transpose.value} />
</div>
