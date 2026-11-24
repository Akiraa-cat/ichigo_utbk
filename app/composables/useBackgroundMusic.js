import { onBeforeUnmount } from 'vue'

let audioElement = null

export function useBackgroundMusic() {
  const isPlaying = useState('background-music-playing', () => false)

  function stopMusic() {
    if (audioElement) {
      audioElement.pause()
      audioElement = null
    }
    isPlaying.value = false
  }

  function createAudio() {
    if (audioElement) return audioElement

    audioElement = new Audio('/assets/music/japanese-music.mp3')
    audioElement.loop = true
    audioElement.preload = 'none'
    audioElement.volume = 0.35
    audioElement.addEventListener('play', () => {
      isPlaying.value = true
    })
    audioElement.addEventListener('pause', () => {
      isPlaying.value = false
    })
    audioElement.addEventListener('error', () => {
      isPlaying.value = false
    })

    return audioElement
  }

  async function toggleMusic() {
    if (!import.meta.client) return false

    if (audioElement && !audioElement.paused) {
      audioElement.pause()
      return true
    }

    try {
      await createAudio().play()
      isPlaying.value = true
      return true
    } catch {
      isPlaying.value = false
      return false
    }
  }

  onBeforeUnmount(stopMusic)

  return { isPlaying, toggleMusic }
}
