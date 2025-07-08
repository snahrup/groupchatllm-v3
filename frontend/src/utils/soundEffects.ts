// Simple sound utility for GroupChatLLM v3
// Provides subtle audio feedback for collaboration events

export class SoundEffects {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Only initialize if we're in the browser
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported:', error);
        this.enabled = false;
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(frequency: number, duration: number, volume: number = 0.1) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  // Subtle chime when a model starts responding
  modelStarted() {
    this.playTone(800, 0.15, 0.05);
  }

  // Gentle notification when a model completes
  modelCompleted() {
    this.playTone(600, 0.2, 0.04);
  }

  // Special sound for synapse detection (collaboration)
  synapseDetected() {
    // Play a brief chord to indicate collaboration
    setTimeout(() => this.playTone(440, 0.1, 0.03), 0);
    setTimeout(() => this.playTone(554, 0.1, 0.03), 50);
    setTimeout(() => this.playTone(659, 0.1, 0.03), 100);
  }

  // Soft notification for message sent
  messageSent() {
    this.playTone(1000, 0.1, 0.03);
  }

  // All models completed - gentle success sound
  allCompleted() {
    // Ascending triad
    setTimeout(() => this.playTone(523, 0.15, 0.04), 0);
    setTimeout(() => this.playTone(659, 0.15, 0.04), 100);
    setTimeout(() => this.playTone(784, 0.2, 0.04), 200);
  }
}

// Global instance
export const soundEffects = new SoundEffects();
