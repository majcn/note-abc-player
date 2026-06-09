<script lang="ts">
  interface Props {
    playbackBpm: number;
    canDecrement?: boolean;
    canIncrement?: boolean;
    onSpeedStep: (direction: 'up' | 'down') => void;
    onBpmCommit: (bpm: number) => void;
  }

  let { playbackBpm, canDecrement = true, canIncrement = true, onSpeedStep, onBpmCommit }: Props = $props();

  let editing = $state(false);
  let editValue = $state('');

  function startEdit() {
    editValue = String(playbackBpm);
    editing = true;
  }

  function commit() {
    if (!editing) return;
    editing = false;
    const n = Number(editValue);
    if (Number.isFinite(n) && n > 0) onBpmCommit(Math.round(n));
  }

  function cancel() {
    editing = false;
  }

  // Small round +/- buttons flanking the BPM display.
  //   size-[22px] rounded-full border bg-*    small pill button
  //   leading-none                            kill default line-height so +/− sit centered
  //   text-panel-text/85                      85% opacity text color
  //   select-none                             don't let the +/− glyphs be text-selected
  //   not-disabled:hover:*                    only show hover bg when not disabled
  //   disabled:opacity-40                     fade out when at the speed min/max
  //   disabled:cursor-not-allowed             show "no" cursor when disabled
  //   max-md:hidden                           hide on mobile (use the slider in the panel)
  const bumpBtn =
    'flex size-[22px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-panel-control-border bg-panel-control-bg leading-none text-panel-text/85 transition select-none not-disabled:hover:bg-panel-control-bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-panel-accent disabled:cursor-not-allowed disabled:opacity-40 max-md:hidden';

  // Shared style for both the readonly "120 BPM" label AND the editable input,
  // so they have identical size + alignment and the swap doesn't jump the layout.
  //   min-w-14         fixed minimum 56px width keeps neighbors from jumping
  //   cursor-text      show text-edit cursor (hint that it's clickable to edit)
  const display =
    'min-w-14 cursor-text rounded-sm text-center text-xs text-panel-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-panel-accent';
</script>

<!-- gap-[5px] is a custom value (Tailwind's gap-1 = 4px, gap-1.5 = 6px) -->
<div class="flex shrink-0 items-center gap-[5px]">
  <button
    type="button"
    class={bumpBtn}
    aria-label="Slow down"
    disabled={!canDecrement}
    onclick={() => onSpeedStep('down')}
  >
    −
  </button>
  {#if editing}
    <!--
      Editable input. Extra classes on top of `display`:
        border-b border-panel-accent       green underline = "editing now"
        bg-transparent outline-none         strip browser's default input chrome
        [-moz-appearance:textfield]         Firefox: hide number spinner
        [&::-webkit-inner-spin-button]:appearance-none   Chrome/Safari: hide spinner
        [&::-webkit-outer-spin-button]:appearance-none   ditto, outer
      (The `[&::...]` syntax is Tailwind's arbitrary-variant escape hatch for
      targeting pseudo-elements that don't have a built-in variant.)
    -->
    <input
      {@attach (node: HTMLInputElement) => {
        node.focus();
        node.select();
      }}
      bind:value={editValue}
      type="number"
      min="1"
      class="{display} border-b border-panel-accent bg-transparent outline-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      aria-label="Playback BPM"
      onblur={commit}
      onkeydown={(e) => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') cancel();
      }}
    />
  {:else}
    <button type="button" class={display} aria-label="Edit BPM" onclick={startEdit}>
      {playbackBpm} BPM
    </button>
  {/if}
  <button
    type="button"
    class={bumpBtn}
    aria-label="Speed up"
    disabled={!canIncrement}
    onclick={() => onSpeedStep('up')}
  >
    +
  </button>
</div>
