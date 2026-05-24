const AudioContext = window.AudioContext || window.webkitAudioContext;

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);

    oscillator.onended = () => ctx.close();
  } catch {
    // audio not available
  }
}

export function playCorrectSound() {
  try {
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(523, ctx.currentTime);
    osc1.frequency.setValueAtTime(659, ctx.currentTime + 0.15);

    osc2.frequency.setValueAtTime(659, ctx.currentTime);
    osc2.frequency.setValueAtTime(784, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.3);

    osc1.onended = () => ctx.close();
  } catch {
    // fallback: no sound
  }
}

export function playWrongSound() {
  playTone(200, 0.4, 'sawtooth', 0.2);
}
