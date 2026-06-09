<script lang="ts">
  let { error = $bindable<string | null>(null) }: { error: string | null } = $props();

  $effect(() => {
    const previous = window.alert;
    window.alert = (msg) => (error = String(msg ?? ''));
    return () => {
      window.alert = previous;
    };
  });
</script>

{#if error !== null}
  <div class="error-toast" role="alert">
    <span>{error}</span>
    <button type="button" class="error-close" aria-label="Dismiss" onclick={() => (error = null)}>✕</button>
  </div>
{/if}

<style>
  .error-toast {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: rgba(40, 14, 14, 0.92);
    backdrop-filter: var(--surface-blur);
    -webkit-backdrop-filter: var(--surface-blur);
    border: 1px solid rgba(255, 80, 80, 0.35);
    border-radius: 10px;
    box-shadow: var(--surface-shadow);
    color: #ffb3b3;
    font-size: 13px;
    max-width: 90vw;
  }

  .error-close {
    appearance: none;
    -webkit-appearance: none;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: rgba(255, 180, 180, 0.6);
    font-size: 14px;
    flex-shrink: 0;
    line-height: 1;
    user-select: none;
    transition: color 0.15s;
  }

  .error-close:hover {
    color: rgba(255, 180, 180, 1);
  }
</style>
