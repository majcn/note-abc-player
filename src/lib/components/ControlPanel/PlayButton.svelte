<script lang="ts">
  interface Props {
    isPlaying: boolean;
    onRequestPlay: (isPlaying: boolean) => void;
  }

  let { isPlaying, onRequestPlay }: Props = $props();
</script>

<button
  type="button"
  class={['play', isPlaying ? 'icon-stop' : 'icon-play']}
  aria-label={isPlaying ? 'Stop' : 'Play'}
  aria-pressed={isPlaying}
  onclick={() => onRequestPlay(!isPlaying)}
></button>

<style>
  .play {
    appearance: none;
    -webkit-appearance: none;
    border: none;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--color-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    transition:
      background 0.15s,
      transform 0.1s;
    flex-shrink: 0;
  }

  .play:hover {
    background: var(--color-accent-hover);
    transform: scale(1.06);
  }

  .play::before {
    content: '';
    display: block;
    width: 22px;
    height: 22px;
    background-color: white;
    mask-repeat: no-repeat;
    -webkit-mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-position: center;
    mask-size: 22px;
    -webkit-mask-size: 22px;
  }

  .play.icon-play::before {
    mask-image: url('@material-design-icons/svg/filled/play_arrow.svg');
    -webkit-mask-image: url('@material-design-icons/svg/filled/play_arrow.svg');
  }

  .play.icon-stop::before {
    mask-image: url('@material-design-icons/svg/filled/stop.svg');
    -webkit-mask-image: url('@material-design-icons/svg/filled/stop.svg');
  }

  @media (max-width: 768px) {
    .play {
      width: 44px;
      height: 44px;
    }

    .play::before {
      width: 26px;
      height: 26px;
      mask-size: 26px;
      -webkit-mask-size: 26px;
    }
  }
</style>
