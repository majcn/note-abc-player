<script lang="ts">
  import type { PageProps } from './$types';
  import SongEditor from './SongEditor.svelte';

  let { data }: PageProps = $props();
</script>

<!--
  Editable view. Key on the song name so navigating between songs recreates
  SongEditor, giving it a fresh editable buffer (and player state).
-->
{#key data.name}
  <SongEditor abc={data.abc} />
{/key}
