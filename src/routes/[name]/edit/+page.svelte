<script lang="ts">
  import type { PageProps } from './$types';
  import SongView from '../SongView.svelte';

  let { data }: PageProps = $props();
</script>

<!--
  Editable view. Key on the song name so navigating between songs recreates
  SongView, giving it a fresh editable buffer (and player state).
-->
{#key data.name}
  <SongView abc={data.abc} editable />
{/key}
