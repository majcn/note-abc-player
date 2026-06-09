<script lang="ts">
  import type { LayoutProps } from './$types';
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';

  let { children }: LayoutProps = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
