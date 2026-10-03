<script lang="ts">
  import type { PageProps } from './$types';
  import SongView from './SongView.svelte';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta property="og:title" content={data.title} />
  <meta property="og:type" content="website" />
</svelte:head>

<!--
  Key on the song name so navigating between songs recreates SongView, giving it
  a fresh editable buffer (and player state) instead of carrying the old one over.
-->
{#key data.name}
  <SongView abc={data.abc} />
{/key}
