<script lang="ts">
  import { ControlPanel } from '$lib/components/ControlPanel';
  import { MusicSheet } from '$lib/components/MusicSheet';
  import { ErrorToast } from '$lib/components/ErrorToast';

  // The shared playback surface: rendered sheet + transport controls + error
  // toast, plus the player state they exchange. Both the read-only SongView and
  // the editable SongEditor wrap this; the editor additionally drives `abc` from
  // its buffer and listens for note clicks.
  type Props = { abc: string; onNoteClick?: (offset: number) => void };

  let { abc, onNoteClick }: Props = $props();

  let sheet = $state<{ highlightSource: (offset: number) => void }>();
  let toast = $state<{ show: (msg: unknown) => void }>();

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
  <MusicSheet
    bind:this={sheet}
    {abc}
    {voices}
    {speed}
    {isPlaying}
    onLoad={(initial) => (voices = initial)}
    onBpmChange={(v) => (bpm = v)}
    onPlayingChange={(v) => (isPlaying = v)}
    onError={(msg) => toast?.show(msg)}
    {onNoteClick}
  />
</div>

<div class="fixed top-4 right-4 z-100 max-md:inset-x-0 max-md:top-auto max-md:right-0 max-md:bottom-0">
  <ControlPanel
    {voices}
    {isPlaying}
    {bpm}
    {speed}
    onVolumeChange={(i, v) => (voices[i] = v)}
    onSpeedChange={(v) => (speed = v)}
    onRequestPlay={(v) => (isPlaying = v)}
  />
</div>

<ErrorToast bind:this={toast} />
