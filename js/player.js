// ============================================================
// PLAYER - Player character
// ============================================================
const Player = (() => {
    let state = {};

    const DEFAULTS = {
        x: 60,
        y: 0,
        vx: 0,
        vy: 0,
        w: 24,
        h: 32,
        hp: 100,
        maxHp: 100,
        stamina: 100,
        maxStamina: 100,
        facingRight: true,
        grounded: false,
        speed: 2.2,
        jumpForce: -8,
        // State machine
        action: 'idle', // idle, run, attack, dodge, block, hurt
        actionTimer: 0,
        // Attack
        attackDuration: 300,
        attackCooldown: 0,
        attackDamage: 15,
        attackRange: 35,
        attackHitFrame: false,
        comboCount: 0,
        comboTimer: 0,
        comboWindow: 600,
        maxCombo: 3,
        // Dodge
        dodgeDuration: 350,
        dodgeCooldown: 0,
        dodgeSpeed: 4.5,
        invincible: false,
        // Block / Parry
        blocking: false,
        blockDuration: 0,
        parryWindow: 150, // ms - perfect parry window
        parryTimer: 0,
        isParrying: false,
        blockDamageReduction: 0.7,
        // Hurt
        hurtDuration: 300,
        hurtCooldown: 0,
        iFrames: 0,
        // Visual
        animFrame: 0,
        animTimer: 0,
        animSpeed: 150,
        flashTimer: 0,
        // Score
        score: 0,
    };

    function reset() {
        state = { ...DEFAULTS };
        state.y = Utils.GROUND_Y - state.h;
    }

    function getState() { return state; }
    function getHitbox() {
        return { x: state.x, y: state.y, w: state.w, h: state.h };
    }

    function getAttackHitbox() {
        if (state.action !== 'attack' || !state.attackHitFrame) return null;
        const range = state.attackRange + (state.comboCount >= 2 ? 15 : 0);
        if (state.facingRight) {
            return { x: state.x + state.w, y: state.y, w: range, h: state.h };
        }
        return { x: state.x - range, y: state.y, w: range, h: state.h };
    }

    function update(dt, input, gameTime) {
        const dtMs = dt * 1000;

        // Timers
        if (state.attackCooldown > 0) state.attackCooldown -= dtMs;
        if (state.dodgeCooldown > 0) state.dodgeCooldown -= dtMs;
        if (state.hurtCooldown > 0) state.hurtCooldown -= dtMs;
        if (state.iFrames > 0) state.iFrames -= dtMs;
        if (state.flashTimer > 0) state.flashTimer -= dtMs;
        if (state.comboTimer > 0) {
            state.comboTimer -= dtMs;
            if (state.comboTimer <= 0) state.comboCount = 0;
        }

        // Stamina regen
        if (state.action !== 'dodge' && state.action !== 'attack') {
            state.stamina = Math.min(state.maxStamina, state.stamina + 15 * dt);
        }

        // Parry timer
        if (state.blocking) {
            state.parryTimer += dtMs;
            state.isParrying = state.parryTimer <= state.parryWindow;
        }

        // Action state machine
        if (state.action === 'hurt') {
            state.actionTimer -= dtMs;
            if (state.actionTimer <= 0) {
                state.action = 'idle';
            }
            // Knockback
            state.x += state.vx * dt * 60;
            state.vx *= 0.9;
        } else if (state.action === 'dodge') {
            state.actionTimer -= dtMs;
            state.invincible = true;
            const dir = state.facingRight ? 1 : -1;
            state.x += dir * state.dodgeSpeed;
            Particles.dust(state.x + state.w / 2, state.y + state.h);
            if (state.actionTimer <= 0) {
                state.action = 'idle';
                state.invincible = false;
                state.dodgeCooldown = 400;
            }
        } else if (state.action === 'attack') {
            state.actionTimer -= dtMs;
            // Hit frame at 40% through attack
            const progress = 1 - (state.actionTimer / state.attackDuration);
            state.attackHitFrame = progress >= 0.3 && progress <= 0.6;
            if (state.actionTimer <= 0) {
                state.action = 'idle';
                state.attackHitFrame = false;
                state.attackCooldown = 150;
            }
        } else {
            // Normal movement
            state.invincible = false;
            let moving = false;

            if (input.left) {
                state.vx = -state.speed;
                state.facingRight = false;
                moving = true;
            } else if (input.right) {
                state.vx = state.speed;
                state.facingRight = true;
                moving = true;
            } else {
                state.vx *= 0.7;
                if (Math.abs(state.vx) < 0.1) state.vx = 0;
            }

            state.action = moving ? 'run' : 'idle';

            // Jump
            if (input.jumpPressed && state.grounded) {
                state.vy = state.jumpForce;
                state.grounded = false;
                Audio.jump();
                input.jumpPressed = false;
            }

            // Attack
            if (input.attackPressed && state.attackCooldown <= 0) {
                startAttack(gameTime);
                input.attackPressed = false;
            }

            // Dodge
            if (input.dodgePressed && state.dodgeCooldown <= 0 && state.stamina >= 20) {
                startDodge();
                input.dodgePressed = false;
            }

            // Block
            if (input.block && state.action !== 'dodge') {
                if (!state.blocking) {
                    state.blocking = true;
                    state.parryTimer = 0;
                    state.isParrying = true;
                }
                state.action = 'block';
                state.vx *= 0.3;
            } else {
                state.blocking = false;
                state.isParrying = false;
            }

            state.x += state.vx;
        }

        // Gravity
        if (!state.grounded) {
            state.vy += Utils.GRAVITY;
            state.y += state.vy;
        }

        // Ground collision
        const groundY = Utils.GROUND_Y - state.h;
        if (state.y >= groundY) {
            state.y = groundY;
            state.vy = 0;
            state.grounded = true;
        }

        // Bounds
        state.x = Utils.clamp(state.x, 0, Utils.GAME_WIDTH - state.w);

        // Animation
        state.animTimer += dtMs;
        if (state.animTimer >= state.animSpeed) {
            state.animTimer = 0;
            state.animFrame++;
        }
    }

    function startAttack(gameTime) {
        state.action = 'attack';
        // Check combo
        if (state.comboTimer > 0 && state.comboCount < state.maxCombo) {
            state.comboCount++;
        } else {
            state.comboCount = 1;
        }
        state.comboTimer = state.comboWindow;
        state.attackDuration = 280 - (state.comboCount - 1) * 30; // Faster combo hits
        state.actionTimer = state.attackDuration;
        state.attackHitFrame = false;
        state.stamina -= 8;
        Audio.slash();
        Cognitive.recordAttack();

        const dir = state.facingRight ? 1 : -1;
        Particles.slashTrail(
            state.x + state.w / 2 + dir * 20,
            state.y + state.h / 2,
            dir
        );
    }

    function startDodge() {
        state.action = 'dodge';
        state.actionTimer = state.dodgeDuration;
        state.stamina -= 20;
        Audio.dodge();
    }

    function takeDamage(amount, knockbackDir) {
        if (state.invincible || state.iFrames > 0) return false;

        if (state.blocking) {
            if (state.isParrying) {
                // Perfect parry!
                Audio.parry();
                Particles.parryFlash(state.x + state.w / 2, state.y + state.h / 3);
                Cognitive.recordParry(true, state.parryTimer);
                Cognitive.incrementRecentParry();
                state.score += 50;
                return 'parry';
            }
            // Normal block
            const reduced = Math.round(amount * (1 - state.blockDamageReduction));
            state.hp -= reduced;
            state.stamina -= 15;
            Cognitive.recordParry(false, state.parryTimer);
            state.flashTimer = 100;
            Audio.hit();
            return 'block';
        }

        state.hp -= amount;
        state.action = 'hurt';
        state.actionTimer = state.hurtDuration;
        state.iFrames = 500;
        state.vx = knockbackDir * 2.5;
        state.flashTimer = 300;
        state.comboCount = 0;
        state.comboTimer = 0;

        Audio.playerHit();
        Particles.bloodSplat(state.x + state.w / 2, state.y + state.h / 3);
        Cognitive.recordDamageTaken(amount);
        Cognitive.incrementRecentHit();

        return 'hit';
    }

    function addScore(amount) {
        state.score += amount;
    }

    function render(ctx) {
        // Flash effect
        if (state.flashTimer > 0 && Math.floor(state.flashTimer / 50) % 2) return;

        // Dodge transparency
        if (state.action === 'dodge') {
            ctx.globalAlpha = 0.5;
        }

        // Get sprite
        let anim = state.action;
        if (anim === 'block') anim = 'block';
        if (anim === 'run') anim = 'run';

        const sprite = Sprites.get('player', anim, state.animFrame, state.facingRight);
        if (sprite) {
            const drawX = state.x - (sprite.width - state.w) / 2;
            const drawY = state.y - (sprite.height - state.h) + 4;
            ctx.drawImage(sprite, drawX, drawY);
        } else {
            // Fallback rectangle
            ctx.fillStyle = state.action === 'hurt' ? '#ff4444' : '#4488ff';
            ctx.fillRect(state.x, state.y, state.w, state.h);
        }

        ctx.globalAlpha = 1;

        // Block/Parry indicator
        if (state.blocking) {
            ctx.strokeStyle = state.isParrying ? '#ffff00' : '#888888';
            ctx.lineWidth = 2;
            const shieldX = state.facingRight ? state.x + state.w + 2 : state.x - 10;
            ctx.strokeRect(shieldX, state.y + 5, 8, state.h - 10);
        }
    }

    function isAlive() { return state.hp > 0; }

    return {
        reset, getState, getHitbox, getAttackHitbox,
        update, takeDamage, addScore, render, isAlive
    };
})();
