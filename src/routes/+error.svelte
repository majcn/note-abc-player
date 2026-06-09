<script lang="ts">
  import { page } from '$app/state';
</script>

<div class="p-6">
  <h1 class="mb-2 text-5xl">{page.status}</h1>
  <p class="text-neutral-500">{page.error?.message}</p>
</div>
