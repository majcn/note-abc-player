<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<div class="p-6">
  <h1 class="mb-2 text-3xl">No song selected</h1>
  <p class="text-neutral-500">
    Open a song by visiting <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[0.9em]">/&lt;song-name&gt;</code>,
    e.g.
    <a href={resolve('/[name]', { name: 'do-re-mi' })}>/do-re-mi</a>.
  </p>
</div>
