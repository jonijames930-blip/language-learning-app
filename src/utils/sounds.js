function getAudioContext() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) return new AC();
  } catch {
    // AudioContext not available
  }
  return null;
}

export function playCorrectSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

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

    osc1.onended = () => {
      try { ctx.close(); } catch { /* ignore */ }
    };
  } catch {
    // no sound available
  }
}

export function playWrongSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);

    oscillator.onended = () => {
      try { ctx.close(); } catch { /* ignore */ }
    };
  } catch {
    // no sound available
  }
}
