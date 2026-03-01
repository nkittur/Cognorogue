// ============================================================
// AUDIO - Web Audio API sound effects
// ============================================================
const Audio = (() => {
    let ctx = null;
    let masterGain = null;
    let muted = false;

    function init() {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(ctx.destination);
    }

    function ensureCtx() {
        if (!ctx) init();
        if (ctx.state === 'suspended') ctx.resume();
    }

    function playTone(freq, duration, type = 'square', volume = 0.3) {
        if (muted) return;
        ensureCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }

    function playNoise(duration, volume = 0.1) {
        if (muted) return;
        ensureCtx();
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        source.start(ctx.currentTime);
    }

    return {
        init,
        toggleMute() { muted = !muted; },

        hit() { playTone(200, 0.1, 'square', 0.2); playNoise(0.05, 0.15); },
        slash() { playNoise(0.08, 0.12); playTone(400, 0.06, 'sawtooth', 0.1); },
        parry() { playTone(800, 0.15, 'square', 0.25); playTone(1200, 0.1, 'square', 0.15); },
        dodge() { playTone(300, 0.08, 'sine', 0.1); },
        jump() { playTone(400, 0.08, 'square', 0.1); playTone(600, 0.06, 'square', 0.08); },
        enemyHit() { playTone(150, 0.12, 'square', 0.15); },
        enemyDie() { playTone(200, 0.2, 'sawtooth', 0.15); playTone(100, 0.3, 'square', 0.12); },
        playerHit() { playTone(100, 0.2, 'square', 0.2); playNoise(0.1, 0.2); },
        telegraph() { playTone(600, 0.15, 'sine', 0.08); },
        levelUp() {
            playTone(523, 0.15, 'square', 0.15);
            setTimeout(() => playTone(659, 0.15, 'square', 0.15), 100);
            setTimeout(() => playTone(784, 0.2, 'square', 0.15), 200);
        },
        gameOver() {
            playTone(400, 0.3, 'square', 0.2);
            setTimeout(() => playTone(300, 0.3, 'square', 0.2), 200);
            setTimeout(() => playTone(200, 0.5, 'square', 0.2), 400);
        },
        menuSelect() { playTone(700, 0.06, 'square', 0.1); }
    };
})();
