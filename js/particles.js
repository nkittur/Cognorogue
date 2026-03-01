// ============================================================
// PARTICLES - Visual effects system
// ============================================================
const Particles = (() => {
    const particles = [];
    const texts = [];

    function spawn(x, y, count, opts = {}) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x, y,
                vx: Utils.rand(opts.vxMin || -3, opts.vxMax || 3),
                vy: Utils.rand(opts.vyMin || -5, opts.vyMax || -1),
                life: opts.life || Utils.rand(0.3, 0.8),
                maxLife: opts.life || 0.6,
                size: opts.size || Utils.rand(2, 5),
                color: opts.color || '#ff4444',
                gravity: opts.gravity !== undefined ? opts.gravity : 0.15,
                shrink: opts.shrink !== undefined ? opts.shrink : true,
                shape: opts.shape || 'square'
            });
        }
    }

    function spawnText(x, y, text, color = '#fff', size = 16) {
        texts.push({
            x, y, text, color, size,
            vy: -2,
            life: 1.0,
            maxLife: 1.0
        });
    }

    function bloodSplat(x, y) {
        spawn(x, y, 8, {
            color: '#cc0000',
            vxMin: -4, vxMax: 4,
            vyMin: -4, vyMax: 1,
            size: Utils.rand(2, 4),
            life: 0.5
        });
    }

    function sparkle(x, y, color = '#ffcc00') {
        spawn(x, y, 5, {
            color,
            vxMin: -2, vxMax: 2,
            vyMin: -3, vyMax: -1,
            size: Utils.rand(1, 3),
            life: 0.4,
            gravity: 0
        });
    }

    function dust(x, y) {
        spawn(x, y, 3, {
            color: '#886644',
            vxMin: -1, vxMax: 1,
            vyMin: -1, vyMax: 0,
            size: Utils.rand(2, 4),
            life: 0.3,
            gravity: 0.02
        });
    }

    function slashTrail(x, y, dir) {
        spawn(x, y, 4, {
            color: '#ffffff',
            vxMin: dir * 1, vxMax: dir * 4,
            vyMin: -2, vyMax: 2,
            size: Utils.rand(1, 3),
            life: 0.15,
            gravity: 0,
            shape: 'line'
        });
    }

    function parryFlash(x, y) {
        spawn(x, y, 12, {
            color: '#ffff00',
            vxMin: -5, vxMax: 5,
            vyMin: -5, vyMax: 5,
            size: Utils.rand(2, 5),
            life: 0.3,
            gravity: 0,
            shape: 'circle'
        });
    }

    function deathBurst(x, y, color = '#ff4444') {
        spawn(x, y, 20, {
            color,
            vxMin: -6, vxMax: 6,
            vyMin: -8, vyMax: 2,
            size: Utils.rand(3, 7),
            life: 0.8,
            gravity: 0.2
        });
    }

    function update(dt) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
        }
        for (let i = texts.length - 1; i >= 0; i--) {
            const t = texts[i];
            t.y += t.vy;
            t.life -= dt;
            if (t.life <= 0) texts.splice(i, 1);
        }
    }

    function render(ctx) {
        for (const p of particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            const size = p.shrink ? p.size * alpha : p.size;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
            }
        }
        ctx.globalAlpha = 1;

        for (const t of texts) {
            const alpha = Math.max(0, t.life / t.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = t.color;
            ctx.font = `bold ${t.size}px Courier New`;
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x, t.y);
        }
        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }

    function clear() {
        particles.length = 0;
        texts.length = 0;
    }

    return {
        spawn, spawnText, bloodSplat, sparkle, dust, slashTrail,
        parryFlash, deathBurst, update, render, clear
    };
})();
