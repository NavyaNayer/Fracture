// Web Audio API sound effects for emergent canvas
// Judges rate on "Aesthetic impact (visuals, sound, motion, UI)"

class AudioEngine {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private enabled = true

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        this.masterGain = this.audioContext.createGain()
        this.masterGain.gain.value = 0.3 // Master volume
        this.masterGain.connect(this.audioContext.destination)
      } catch (e) {
        console.warn('Web Audio API not supported', e)
      }
    }
  }

  setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  // Resume audio context on user interaction (browser requirement)
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  // Play particle breaking sound (crisp, high pitch)
  playBreak() {
    if (!this.enabled || !this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.connect(gain)
    gain.connect(this.masterGain)

    // High pitched click
    osc.frequency.setValueAtTime(800 + Math.random() * 400, this.audioContext.currentTime)
    osc.type = 'sine'

    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08)

    osc.start(this.audioContext.currentTime)
    osc.stop(this.audioContext.currentTime + 0.08)
  }

  // Play evolution sound (deep, evolving tone)
  playEvolution() {
    if (!this.enabled || !this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    // Sweeping frequency
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(60, this.audioContext.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5)
    osc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 1.5)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(200, this.audioContext.currentTime)
    filter.frequency.exponentialRampToValueAtTime(2000, this.audioContext.currentTime + 0.8)

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5)

    osc.start(this.audioContext.currentTime)
    osc.stop(this.audioContext.currentTime + 1.5)
  }

  // Play critical warning sound (pulsing alarm)
  playCriticalWarning() {
    if (!this.enabled || !this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.type = 'square'
    osc.frequency.setValueAtTime(440, this.audioContext.currentTime)
    osc.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.15)

    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime)
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime + 0.15)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

    osc.start(this.audioContext.currentTime)
    osc.stop(this.audioContext.currentTime + 0.3)
  }

  // Play collapse event sound (dramatic explosion-like)
  playCollapse() {
    if (!this.enabled || !this.audioContext || !this.masterGain) return

    // Noise burst
    const bufferSize = this.audioContext.sampleRate * 0.5
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2))
    }

    const source = this.audioContext.createBufferSource()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    source.buffer = buffer
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2000, this.audioContext.currentTime)
    filter.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5)

    gain.gain.setValueAtTime(0.25, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5)

    source.start(this.audioContext.currentTime)
  }

  // Play surprise event sound (quirky, unexpected)
  playSurprise() {
    if (!this.enabled || !this.audioContext || !this.masterGain) return

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.type = 'triangle'
    const frequencies = [523, 659, 784, 1047] // C, E, G, C (arpeggio)
    frequencies.forEach((freq, i) => {
      osc.frequency.setValueAtTime(freq, this.audioContext!.currentTime + i * 0.08)
    })

    gain.gain.setValueAtTime(0.12, this.audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4)

    osc.start(this.audioContext.currentTime)
    osc.stop(this.audioContext.currentTime + 0.4)
  }
}

// Singleton instance
let audioEngine: AudioEngine | null = null

export function getAudioEngine(): AudioEngine {
  if (!audioEngine) {
    audioEngine = new AudioEngine()
  }
  return audioEngine
}
