<script lang="ts">
  import PlayButton from './PlayButton.svelte';
  import VoiceButtons from './VoiceButtons.svelte';
  import TempoCompact from './TempoCompact.svelte';
  import ExpandedPanel from './ExpandedPanel.svelte';

  interface Props {
    voices: number[];
    isPlaying: boolean;
    bpm: number;
    speed: number;
    speedMin?: number;
    speedMax?: number;
    speedStep?: number;
    onVolumeChange: (i: number, v: number) => void;
    onSpeedChange: (v: number) => void;
    onRequestPlay: (isPlaying: boolean) => void;
  }

  let {
    voices,
    isPlaying,
    bpm,
    speed,
    speedMin = 0.1,
    speedMax = 3,
    speedStep = 0.1,
    onVolumeChange,
    onSpeedChange,
    onRequestPlay
  }: Props = $props();

  let open = $state(false);
  let playbackBpm = $derived(Math.round(bpm * speed));

  function clampSpeed(v: number) {
    // Math.round needed: IEEE 754 float imprecision, e.g. 1.12 * 100 = 112.99999999999999
    return Math.min(speedMax, Math.max(speedMin, Math.round(v * 100) / 100));
  }

  function handleSpeedStep(direction: 'up' | 'down') {
    const delta = direction === 'up' ? speedStep : -speedStep;
    onSpeedChange(clampSpeed(speed + delta));
  }

  function handleBpmCommit(newBpm: number) {
    if (bpm <= 0) return;
    onSpeedChange(clampSpeed(newBpm / bpm));
  }
</script>

<!--
  Outer wrapper holds ALL the visual chrome (border, background, rounded corners, shadow).
  Header + ExpandedPanel inside are plain content. This is what avoids the expand glitch:
  the wrapper's corners never change, only its height grows.
    inline-block        shrink to fit content width on desktop (not full row width)
    overflow-hidden     clip expanding content so it stays inside the rounded corners
    rounded-panel       custom 12px radius token (see app.css --radius-panel)
    border/bg/shadow/   the "glass card" look
      backdrop-blur
    max-md:w-full       on mobile (<768px) stretch full width
    max-md:rounded-none drop corners on mobile (looks better edge-to-edge)
-->
<div
  class="inline-block overflow-hidden rounded-panel border border-panel-border bg-panel-bg shadow-panel backdrop-blur-panel max-md:w-full max-md:rounded-none"
>
  <!--
    Header row: play / voices / tempo / expand button.
      flex items-center      lay children horizontally, vertically centered
      cursor-default         keep arrow cursor over gaps (cursor is inherited; without
                             this, the wrapper's default would let text-cursor leak in)
      gap-2                  8px between children
      px-3 py-2              12px horizontal, 8px vertical padding
      max-md:flex-wrap       on mobile let buttons wrap to a second line if needed
      max-md:gap-1.5         tighter gap when wrapping
  -->
  <div class="flex cursor-default items-center gap-2 px-3 py-2 max-md:flex-wrap max-md:gap-1.5">
    <PlayButton {isPlaying} {onRequestPlay} />
    <VoiceButtons {voices} {onVolumeChange} />
    <!--
      Right-side group: tempo + expand chevron.
        ml-auto     eats the remaining space, pushing this group to the far right
        flex/gap-2  keep tempo and chevron together (and on the same line when wrapping)
    -->
    <div class="ml-auto flex items-center gap-2">
      <TempoCompact
        {playbackBpm}
        canDecrement={speed > speedMin}
        canIncrement={speed < speedMax}
        onSpeedStep={handleSpeedStep}
        onBpmCommit={handleBpmCommit}
      />
      <!--
        Expand/collapse chevron (inline SVG, recolored via `text-*` + fill="currentColor").
          flex items-center justify-center   center the svg inside
          size-[22px]              22x22px box (max-md:size-11 -> 44x44 tap target on mobile)
          shrink-0                 never compress when row gets tight
          text-panel-icon          icon color, brighter on hover
          transition               smooth color/transform changes (default 150ms in v4)
          focus-visible:outline-*  keyboard-only focus ring (ignored for mouse clicks)
          rotate-180 (when open)   flip chevron upside down when expanded
        The svg is 22px (26px on mobile) to match the old mask-size.
      -->
      <button
        type="button"
        class={[
          'flex size-[22px] shrink-0 cursor-pointer items-center justify-center text-panel-icon transition hover:text-panel-icon-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-panel-accent max-md:size-11',
          open && 'rotate-180'
        ]}
        aria-label={open ? 'Collapse' : 'Expand'}
        aria-expanded={open}
        onclick={() => (open = !open)}
      >
        <!-- @material-design-icons/svg/filled/expand_more.svg, inlined -->
        <svg viewBox="0 0 24 24" class="size-[22px] max-md:size-[26px]" fill="currentColor" aria-hidden="true">
          <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" />
        </svg>
      </button>
    </div>
  </div>
  <ExpandedPanel {open} {voices} {speed} {speedMin} {speedMax} {onSpeedChange} {onVolumeChange} />
</div>
