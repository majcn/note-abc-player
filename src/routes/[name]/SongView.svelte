<script lang="ts">
  import SongPlayer from '$lib/components/SongPlayer.svelte';

  // Read-only view: just the playback surface, no editor. The editable route
  // uses SongEditor instead.
  let { abc }: { abc: string } = $props();
</script>

<div class="flex h-dvh w-full overflow-hidden">
  <SongPlayer {abc} />
</div>
