<script lang="ts">
  // Self-contained: the toast owns the currently displayed error. Callers push
  // errors via the exported show(); the ✕ button clears it. null = hidden.
  let error = $state<string | null>(null);

  /** Display an error message (string-ified; null/undefined shows an empty toast). */
  export function show(msg: unknown) {
    error = msg == null ? '' : String(msg);
  }

  // The vendor engine reports some failures via window.alert(); route those into
  // the toast while mounted, restoring the original handler on teardown.
  $effect(() => {
    const previous = window.alert;
    window.alert = show;
    return () => {
      window.alert = previous;
    };
  });
</script>

{#if error !== null}
  <!--
    Toast pinned to the top center of the viewport.
      fixed                positioned relative to viewport, not the page flow
      top-4                16px from top
      left-1/2 + -translate-x-1/2     classic centering trick: anchor the LEFT
                                       edge at 50% width, then shift the element
                                       back by half its OWN width
      z-[200]              float above everything else
      max-w-[90vw]         never wider than 90% of the viewport (mobile safety)
      flex items-center gap-3   horizontal layout: message + dismiss button
      rounded-[10px]       slightly tighter than the panel's 12px
      border/bg/text       red color scheme for "this is bad"
      shadow + backdrop-blur   match the control panel's glass look
  -->
  <div
    class="fixed top-4 left-1/2 z-[200] flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-[10px] border border-error-border bg-error-bg px-3.5 py-2.5 text-[13px] text-error-text shadow-panel backdrop-blur-panel"
    role="alert"
  >
    <span>{error}</span>
    <!--
      Dismiss ✕ button.
        shrink-0             don't get squeezed by long error messages
        leading-none         no extra line-height around the glyph
        opacity-60           subtle until hovered
        transition-opacity   smooth fade on hover
        hover:opacity-100    full brightness on hover
    -->
    <button
      type="button"
      class="shrink-0 cursor-pointer text-sm leading-none opacity-60 transition-opacity select-none hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-accent"
      aria-label="Dismiss"
      onclick={() => (error = null)}>✕</button
    >
  </div>
{/if}
