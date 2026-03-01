// ============================================================
// ENEMY - Enemy entities and AI
// ============================================================
const Enemy = (() => {
    const ENEMY_DEFS = {
        skeleton: {
            name: 'Skeleton',
            spriteKey: 'skeleton',
            hp: 40, w: 22, h: 28,
            speed: 0.8, aggroRange: 140, attackRange: 35,
            score: 100, color: '#d0d0c0'
        },
        goblin: {
            name: 'Goblin',
            spriteKey: 'goblin',
            hp: 30, w: 18, h: 28,
            speed: 1.3, aggroRange: 120, attackRange: 30,
            score: 120, color: '#44aa44'
        },
        orc: {
            name: 'Orc',
            spriteKey: 'orc',
            hp: 70, w: 22, h: 28,
            speed: 0.6, aggroRange: 110, attackRange: 40,
            score: 180, color: '#668844'
        },
        mage: {
            name: 'Dark Mage',
            spriteKey: 'mage',
            hp: 35, w: 20, h: 30,
            speed: 0.5, aggroRange: 180, attackRange: 160,
            score: 200, color: '#6633aa'
        },
        assassin: {
            name: 'Shadow Assassin',
            spriteKey: 'assassin',
            hp: 35, w: 18, h: 28,
            speed: 1.6, aggroRange: 150, attackRange: 32,
            score: 220, color: '#333344'
        },
        golem: {
            name: 'Stone Golem',
            spriteKey: 'golem',
            hp: 200, w: 26, h: 34,
            speed: 0.4, aggroRange: 170, attackRange: 50,
            score: 500, color: '#887766',
            isBoss: true
        },
        friendly: {
            name: 'Villager',
            spriteKey: 'friendly',
            hp: 20, w: 18, h: 28,
            speed: 0.5, aggroRange: 0, attackRange: 0,
            score: -200, color: '#44aa88',
            isFriendly: true
        }
    };

    function create(type, x, y, difficulty) {
        const def = ENEMY_DEFS[type];
        if (!def) return null;

        const hpScale = 1 + (difficulty - 1) * 0.15;

        return {
            type,
            def,
            x, y: Utils.GROUND_Y - def.h,
            vx: 0, vy: 0,
            w: def.w, h: def.h,
            hp: Math.round(def.hp * hpScale),
            maxHp: Math.round(def.hp * hpScale),
            facingRight: false,
            grounded: true,
            alive: true,
            active: true,
            stunnedTimer: 0,
            // AI
            aiState: 'idle', // idle, chase, attack, retreat, stunned
            aiTimer: Utils.rand(500, 1500),
            // Pattern execution
            currentPattern: null,
            patternPhaseIdx: 0,
            patternTimer: 0,
            telegraphStartTime: 0,
            // Visual
            animFrame: 0,
            animTimer: 0,
            animAnim: 'idle',
            flashTimer: 0,
            opacity: 1,
            shakeX: 0,
            // Cognitive tracking
            seenByPlayer: false,
            difficulty,
            // Projectiles spawned by this enemy
            pendingProjectiles: [],
        };
    }

    function update(enemy, dt, playerState, gameTime) {
        if (!enemy.alive) return;

        const dtMs = dt * 1000;

        // Timers
        if (enemy.flashTimer > 0) enemy.flashTimer -= dtMs;
        if (enemy.stunnedTimer > 0) {
            enemy.stunnedTimer -= dtMs;
            enemy.shakeX = Math.sin(gameTime * 0.05) * 2;
            if (enemy.stunnedTimer <= 0) {
                enemy.shakeX = 0;
                enemy.aiState = 'idle';
            }
            return;
        }

        // Face player
        enemy.facingRight = playerState.x > enemy.x;

        const distToPlayer = Math.abs(playerState.x - enemy.x);
        const inAggroRange = distToPlayer < enemy.def.aggroRange;
        const inAttackRange = distToPlayer < enemy.def.attackRange;

        // Pattern execution
        if (enemy.currentPattern) {
            updatePattern(enemy, dt, dtMs, playerState, gameTime);
            return;
        }

        // AI state machine
        enemy.aiTimer -= dtMs;

        switch (enemy.aiState) {
            case 'idle':
                enemy.animAnim = 'idle';
                if (inAggroRange && enemy.aiTimer <= 0) {
                    enemy.aiState = 'chase';
                    enemy.aiTimer = 0;
                }
                break;

            case 'chase':
                enemy.animAnim = 'idle';
                if (inAttackRange) {
                    // Start attack pattern
                    const pattern = Patterns.getRandomPattern(enemy.type, enemy.difficulty);
                    if (pattern) {
                        startPattern(enemy, pattern, gameTime);
                    }
                    enemy.aiTimer = Utils.rand(800, 2000);
                } else if (inAggroRange) {
                    // Move toward player
                    const dir = enemy.facingRight ? 1 : -1;
                    enemy.x += dir * enemy.def.speed;
                } else {
                    enemy.aiState = 'idle';
                    enemy.aiTimer = Utils.rand(500, 1500);
                }
                break;

            case 'retreat':
                enemy.animAnim = 'idle';
                const retreatDir = enemy.facingRight ? -1 : 1;
                enemy.x += retreatDir * enemy.def.speed * 0.7;
                if (enemy.aiTimer <= 0) {
                    enemy.aiState = 'chase';
                    enemy.aiTimer = 0;
                }
                break;
        }

        // Keep in bounds
        enemy.x = Utils.clamp(enemy.x, 20, Utils.GAME_WIDTH - enemy.w - 20);

        // Animation
        enemy.animTimer += dtMs;
        if (enemy.animTimer >= 180) {
            enemy.animTimer = 0;
            enemy.animFrame++;
        }
    }

    function startPattern(enemy, pattern, gameTime) {
        enemy.currentPattern = pattern;
        enemy.patternPhaseIdx = 0;
        enemy.patternTimer = pattern.phases[0].duration;
        enemy.telegraphStartTime = gameTime;
        enemy.animAnim = pattern.phases[0].anim;
        enemy._phaseHit = false;
        enemy._recallTracked = false;
    }

    function updatePattern(enemy, dt, dtMs, playerState, gameTime) {
        const pattern = enemy.currentPattern;
        const phase = pattern.phases[enemy.patternPhaseIdx];

        enemy.patternTimer -= dtMs;
        enemy.animAnim = phase.anim;

        // Phase-specific behavior
        switch (phase.type) {
            case 'telegraph':
                // Visual telegraph - enemy glows/flashes
                enemy.shakeX = Math.sin(gameTime * 0.01) * 1;
                // Record when telegraph starts for reaction time
                if (enemy.patternTimer >= phase.duration - 20) {
                    enemy.telegraphStartTime = gameTime;
                    Audio.telegraph();
                }
                break;

            case 'attack': {
                if (enemy._phaseHit) break; // Only hit once per attack phase
                const range = phase.range || enemy.def.attackRange;

                const attackBox = {
                    x: enemy.facingRight ? enemy.x + enemy.w : enemy.x - range,
                    y: enemy.y,
                    w: range,
                    h: enemy.h
                };
                const playerBox = { x: playerState.x, y: playerState.y, w: playerState.w || 30, h: playerState.h || 36 };

                if (Utils.rectOverlap(attackBox, playerBox)) {
                    const knockDir = enemy.facingRight ? 1 : -1;
                    const result = Player.takeDamage(phase.damage, knockDir);
                    enemy._phaseHit = true;
                    if (result === 'parry') {
                        enemy.stunnedTimer = 1000;
                        enemy.currentPattern = null;
                        enemy.aiState = 'stunned';
                        Cognitive.recordReaction(enemy.telegraphStartTime, gameTime);
                        Cognitive.recordPatternEncounter(pattern.id, true, gameTime);
                        return;
                    }
                    if (result === 'hit') {
                        Cognitive.recordReaction(enemy.telegraphStartTime, gameTime);
                        Cognitive.recordPatternEncounter(pattern.id, false, gameTime);
                    }
                    if (result === 'block') {
                        Cognitive.recordReaction(enemy.telegraphStartTime, gameTime);
                        Cognitive.recordPatternEncounter(pattern.id, true, gameTime);
                    }
                }
                break;
            }

            case 'projectile':
                if (enemy.patternTimer >= phase.duration - 20) {
                    // Spawn projectile
                    const dir = enemy.facingRight ? 1 : -1;
                    enemy.pendingProjectiles.push({
                        x: enemy.x + (enemy.facingRight ? enemy.w : 0),
                        y: enemy.y + enemy.h / 2 - 5,
                        vx: dir * (phase.speed || 4),
                        damage: phase.damage,
                        range: phase.range || 300,
                        startX: enemy.x,
                        w: 10, h: 10,
                        alive: true,
                        patternId: pattern.id,
                        telegraphTime: enemy.telegraphStartTime
                    });
                }
                break;

            case 'feint':
                enemy.shakeX = 0;
                // Record feint for inhibitory control measurement
                if (enemy.patternTimer >= phase.duration - 20) {
                    Cognitive.recordFeintResponse(true, false, 0); // Will be updated by player actions
                }
                break;

            case 'movement':
                if (phase.moveX) {
                    const dir = enemy.facingRight ? 1 : -1;
                    enemy.x += dir * (phase.moveX / (phase.duration / dtMs));
                }
                break;

            case 'vanish':
                enemy.opacity = Math.max(0, enemy.patternTimer / phase.duration);
                break;

            case 'teleport':
                if (phase.behindPlayer) {
                    const behind = enemy.facingRight ? playerState.x - 50 : playerState.x + 50;
                    enemy.x = Utils.clamp(behind, 20, Utils.GAME_WIDTH - enemy.w - 20);
                    enemy.facingRight = playerState.x > enemy.x;
                }
                enemy.opacity = 1;
                break;

            case 'pause':
                enemy.shakeX = 0;
                break;

            case 'recovery':
                enemy.shakeX = 0;
                break;
        }

        // Advance phase
        if (enemy.patternTimer <= 0) {
            enemy.patternPhaseIdx++;
            enemy._phaseHit = false;
            if (enemy.patternPhaseIdx >= pattern.phases.length) {
                // Pattern complete
                enemy.currentPattern = null;
                enemy.shakeX = 0;
                enemy.aiState = Math.random() > 0.5 ? 'retreat' : 'chase';
                enemy.aiTimer = Utils.rand(500, 1500);
            } else {
                const nextPhase = pattern.phases[enemy.patternPhaseIdx];
                enemy.patternTimer = nextPhase.duration;
                enemy.animAnim = nextPhase.anim;
            }
        }
    }

    function takeDamage(enemy, amount, gameTime) {
        if (!enemy.alive) return;

        enemy.hp -= amount;
        enemy.flashTimer = 150;
        enemy.shakeX = Utils.rand(-3, 3);

        Cognitive.recordDamageDealt(amount);

        Particles.bloodSplat(enemy.x + enemy.w / 2, enemy.y + enemy.h / 3);
        Audio.enemyHit();

        if (enemy.hp <= 0) {
            enemy.alive = false;
            enemy.active = false;
            Audio.enemyDie();
            Particles.deathBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.def.color);
            Cognitive.recordEnemyDefeated(enemy.type);
            Player.addScore(enemy.def.score);
            return true; // died
        }

        // Interrupt pattern on heavy hit
        if (amount >= 12 && enemy.currentPattern) {
            const phase = enemy.currentPattern.phases[enemy.patternPhaseIdx];
            if (phase.type === 'telegraph' || phase.type === 'recovery') {
                enemy.currentPattern = null;
                enemy.aiState = 'retreat';
                enemy.aiTimer = 500;
            }
        }

        return false;
    }

    function render(ctx, enemy) {
        if (!enemy.alive || !enemy.active) return;

        // Flash effect
        if (enemy.flashTimer > 0 && Math.floor(enemy.flashTimer / 40) % 2) return;

        ctx.globalAlpha = enemy.opacity;

        const drawX = enemy.x + enemy.shakeX;
        const sprite = Sprites.get(enemy.def.spriteKey, enemy.animAnim, enemy.animFrame, enemy.facingRight);

        if (sprite) {
            const sx = drawX - (sprite.width - enemy.w) / 2;
            const sy = enemy.y - (sprite.height - enemy.h) + 4;
            ctx.drawImage(sprite, sx, sy);
        } else {
            ctx.fillStyle = enemy.def.color;
            ctx.fillRect(drawX, enemy.y, enemy.w, enemy.h);
        }

        ctx.globalAlpha = 1;

        // HP bar
        if (enemy.hp < enemy.maxHp) {
            const barW = 20;
            const barH = 2;
            const barX = enemy.x + enemy.w / 2 - barW / 2;
            const barY = enemy.y - 6;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barW, barH);
            const hpPct = enemy.hp / enemy.maxHp;
            ctx.fillStyle = hpPct > 0.5 ? '#00cc00' : hpPct > 0.25 ? '#cccc00' : '#cc0000';
            ctx.fillRect(barX, barY, barW * hpPct, barH);
        }

        // Boss name
        if (enemy.def.isBoss) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 7px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.def.name, enemy.x + enemy.w / 2, enemy.y - 10);
            ctx.textAlign = 'left';
        }

        // Telegraph indicator
        if (enemy.currentPattern) {
            const phase = enemy.currentPattern.phases[enemy.patternPhaseIdx];
            if (phase.type === 'telegraph') {
                const progress = 1 - (enemy.patternTimer / phase.duration);
                // Exclamation mark that fills up
                ctx.fillStyle = `rgba(255, ${Math.floor(255 * (1 - progress))}, 0, ${0.5 + progress * 0.5})`;
                ctx.font = `bold ${10 + progress * 4}px Courier New`;
                ctx.textAlign = 'center';
                ctx.fillText('!', enemy.x + enemy.w / 2, enemy.y - 14);
                ctx.textAlign = 'left';

                // Range indicator
                const range = getNextAttackRange(enemy);
                if (range > 0) {
                    ctx.strokeStyle = `rgba(255, 0, 0, ${0.15 + progress * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 4]);
                    const rx = enemy.facingRight ? enemy.x + enemy.w : enemy.x - range;
                    ctx.strokeRect(rx, enemy.y, range, enemy.h);
                    ctx.setLineDash([]);
                }
            }
        }
    }

    function getNextAttackRange(enemy) {
        if (!enemy.currentPattern) return 0;
        for (let i = enemy.patternPhaseIdx; i < enemy.currentPattern.phases.length; i++) {
            const p = enemy.currentPattern.phases[i];
            if (p.type === 'attack') return p.range || enemy.def.attackRange;
        }
        return 0;
    }

    function getHitbox(enemy) {
        return { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
    }

    return { ENEMY_DEFS, create, update, takeDamage, render, getHitbox };
})();
