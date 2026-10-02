<script lang="ts">
  import { ControlPanel } from '#lib/components/ControlPanel/index.js';
  import { MusicSheet } from '#lib/components/MusicSheet/index.js';
  import { ErrorToast } from '#lib/components/ErrorToast/index.js';
  import { LoadingSpinner } from '#lib/components/LoadingSpinner/index.js';

  // The shared playback surface: rendered sheet + transport controls + error
  // toast, plus the player state they exchange. Both the read-only SongView and
  // the editable SongEditor wrap this; the editor additionally drives `abc` from
  // its buffer and listens for note clicks.
  // onError reports the raw engine messages after each render ('' = clean),
  // independent of the toast — dismissing the toast doesn't clear them.
  type Props = {
    abc: string;
    onNoteClick?: (offset: number) => void;
    onNoteDblClick?: (offset: number, x: number, y: number) => void;
    onError?: (msg: string) => void;
    transpose?: number;
  };

  let { abc, onNoteClick, onNoteDblClick, onError, transpose = $bindable(0) }: Props = $props();

  let sheet = $state<{ highlightSource: (offset: number) => void }>();
  let errorMsg = $state<string | null>(null);

  let voices = $state<number[]>([]);
  let speed = $state(1);
  let bpm = $state(120);
  let isPlaying = $state(false);

  // Let the editor highlight the note matching its cursor without reaching into
  // MusicSheet directly.
  export function highlightSource(offset: number) {
    sheet?.highlightSource(offset);
  }
</script>

<!-- Rendered music sheet. -->
<div class="relative min-w-0 flex-1 overflow-hidden max-md:pb-14">
  <svelte:boundary>
    {#snippet pending()}
      <LoadingSpinner />
    {/snippet}
    {#snippet failed(error)}
      <p class="p-6 text-red-600">{error instanceof Error ? error.message : String(error)}</p>
    {/snippet}
    <MusicSheet
      bind:this={sheet}
      {abc}
      {transpose}
      {voices}
      {speed}
      {isPlaying}
      onLoad={(initial) => (voices = initial)}
      onBpmChange={(v) => (bpm = v)}
      onPlayingChange={(v) => (isPlaying = v)}
      onError={(msg) => {
        errorMsg = msg;
        onError?.(msg);
      }}
      onErrorClear={() => {
        errorMsg = null;
        onError?.('');
      }}
      {onNoteClick}
      {onNoteDblClick}
    />
  </svelte:boundary>
</div>

<div class="fixed top-4 right-4 z-100 max-md:inset-x-0 max-md:top-auto max-md:right-0 max-md:bottom-0">
  <ControlPanel
    {voices}
    {isPlaying}
    {bpm}
    {speed}
    {transpose}
    onVolumeChange={(i, v) => (voices[i] = v)}
    onSpeedChange={(v) => (speed = v)}
    onTransposeChange={(v) => (transpose = v)}
    onRequestPlay={(v) => (isPlaying = v)}
  />
</div>

<ErrorToast msg={errorMsg} onClose={() => (errorMsg = null)} />
