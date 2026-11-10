export function createNarration() {
  let enabled = true;
  let volume = 0.85;
  const queue: string[] = [];
  let speaking = false;
  let audio: AudioContext | null = null;

  function context() {
    if (typeof AudioContext === 'undefined') return null;
    if (!audio) audio = new AudioContext();
    return audio;
  }

  function pump() {
    if (speaking || !enabled || typeof speechSynthesis === 'undefined') return;
    const line = queue.shift();
    if (!line) return;
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = 'tr-TR';
    utterance.volume = volume;
    utterance.rate = 1.04;
    speaking = true;
    utterance.onend = () => {
      speaking = false;
      pump();
    };
    utterance.onerror = () => {
      speaking = false;
      pump();
    };
    speechSynthesis.speak(utterance);
  }

  function tone(frequency: number, duration: number, type: OscillatorType, gain = 0.05) {
    const ctx = context();
    if (!ctx || !enabled) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    amp.gain.value = gain * volume;
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  }

  return {
    say(line: string) {
      if (!enabled) return;
      queue.push(line);
      if (queue.length > 6) queue.shift();
      pump();
    },
    effect(kind: 'join' | 'turbo' | 'win') {
      if (kind === 'join') tone(520, 0.12, 'triangle');
      if (kind === 'turbo') tone(180, 0.2, 'sawtooth', 0.04);
      if (kind === 'win') {
        tone(523, 0.16, 'square', 0.04);
        setTimeout(() => tone(659, 0.2, 'square', 0.04), 140);
      }
    },
    setEnabled(value: boolean) {
      enabled = value;
      if (!value) {
        queue.length = 0;
        speaking = false;
        if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
      }
    },
    setVolume(value: number) {
      volume = Math.min(1, Math.max(0, value));
    },
  };
}
