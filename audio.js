let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

let focusNode = null;
let focusNoiseNode = null;

export const audio = {
  playClick() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Audio playClick error", e);
    }
  },

  playSuccess() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.frequency.setValueAtTime(523.25, now); // C5
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.start(now);
      osc1.stop(now + 0.25);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn("Audio playSuccess error", e);
    }
  },

  playLevelUp() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.06);
        
        gain.gain.setValueAtTime(0.06, now + index * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.4);
        
        osc.start(now + index * 0.06);
        osc.stop(now + index * 0.06 + 0.4);
      });
    } catch (e) {
      console.warn("Audio playLevelUp error", e);
    }
  },

  playCoins() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now + i * 0.05); // B5
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + i * 0.05 + 0.08); // E6
        gain.gain.setValueAtTime(0.04, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.12);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.12);
      }
    } catch (e) {
      console.warn("Audio playCoins error", e);
    }
  },

  playScanner(durationSeconds = 2.5) {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const gain = ctx.createGain();
      
      lfo.frequency.value = 12; // 12Hz pitch modulation
      lfoGain.gain.value = 35; 
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(360, now + durationSeconds);
      
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.02, now + durationSeconds - 0.3);
      gain.gain.linearRampToValueAtTime(0.001, now + durationSeconds);
      
      lfo.start(now);
      osc.start(now);
      
      lfo.stop(now + durationSeconds);
      osc.stop(now + durationSeconds);
    } catch (e) {
      console.warn("Audio playScanner error", e);
    }
  },

  /* NEW HIGH-DOPAMINE SYNTHESIZED SOUNDS */
  playCoinFloat() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6
      osc.frequency.exponentialRampToValueAtTime(1567.98, ctx.currentTime + 0.07); // G6
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio playCoinFloat error", e);
    }
  },

  playStoryPop() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(250, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio playStoryPop error", e);
    }
  },

  playNudge() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.setValueAtTime(120, ctx.currentTime + 0.06);
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime + 0.06);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio playNudge error", e);
    }
  },

  playSprintMilestone() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99]; // C5, E5, G5
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.07, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.25);
      });
    } catch (e) {
      console.warn("Audio playSprintMilestone error", e);
    }
  },

  startFocusHum() {
    try {
      const ctx = getAudioContext();
      if (focusNode) return; // already playing
      
      const now = ctx.currentTime;
      
      // Binaural beats (L: 110Hz, R: 114Hz)
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const merger = ctx.createChannelMerger(2);
      const gain = ctx.createGain();
      
      oscL.frequency.value = 110;
      oscR.frequency.value = 114;
      
      oscL.connect(merger, 0, 0);
      oscR.connect(merger, 0, 1);
      
      merger.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0.04, now);
      
      oscL.start();
      oscR.start();
      
      focusNode = { oscL, oscR, merger, gain };
      
      // Brown noise (using procedural random buffer)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      // Simple brown noise filter accumulator
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain compensation
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.02, now);
      
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noise.start();
      focusNoiseNode = { noise, noiseGain };
      
    } catch (e) {
      console.warn("Audio startFocusHum error", e);
    }
  },

  stopFocusHum() {
    try {
      if (focusNode) {
        focusNode.oscL.stop();
        focusNode.oscR.stop();
        focusNode = null;
      }
      if (focusNoiseNode) {
        focusNoiseNode.noise.stop();
        focusNoiseNode = null;
      }
    } catch (e) {
      console.warn("Audio stopFocusHum error", e);
    }
  }
};
