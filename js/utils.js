// ============================================================
// UTILS - Core utility functions
// ============================================================
const Utils = {
    // Canvas dimensions (will be set by engine)
    GAME_WIDTH: 960,
    GAME_HEIGHT: 540,
    TILE_SIZE: 32,
    GRAVITY: 0.6,
    GROUND_Y: 440,

    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    rand(min, max) {
        return Math.random() * (max - min) + min;
    },

    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    dist(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    },

    rectOverlap(a, b) {
        return a.x < b.x + b.w &&
               a.x + a.w > b.x &&
               a.y < b.y + b.h &&
               a.y + a.h > b.y;
    },

    // Easing functions
    easeOutQuad(t) { return t * (2 - t); },
    easeInQuad(t) { return t * t; },
    easeOutBack(t) { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },

    // Color helpers
    hsl(h, s, l, a = 1) {
        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
    },

    // Time formatting
    formatTime(ms) {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    },

    formatPercent(val) {
        return `${Math.round(val * 100)}%`;
    }
};
