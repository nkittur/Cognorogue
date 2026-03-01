// ============================================================
// LEVEL - Level generation, wave management, hazards, friendlies
// ============================================================
const Level = (() => {
    let state = {};

    // F = friendly NPC mixed in
    const WAVE_CONFIGS = [
        // Floor 1: Tutorial - single enemies, introduce friendlies
        [
            { enemies: [{ type: 'skeleton', count: 1 }], label: 'A Skeleton Approaches...' },
            { enemies: [{ type: 'skeleton', count: 1 }], friendlies: 1, label: 'Watch for allies!' },
            { enemies: [{ type: 'goblin', count: 1 }], label: 'A Goblin Lurks...' },
        ],
        // Floor 2: Mixed enemies + friendlies
        [
            { enemies: [{ type: 'goblin', count: 2 }], friendlies: 1, label: 'Protect the Villagers!' },
            { enemies: [{ type: 'skeleton', count: 1 }, { type: 'goblin', count: 1 }], label: 'Mixed Forces!' },
            { enemies: [{ type: 'orc', count: 1 }], friendlies: 1, label: 'An Orc Charges!', hazards: 1 },
        ],
        // Floor 3: More hazards + friendlies
        [
            { enemies: [{ type: 'orc', count: 1 }, { type: 'skeleton', count: 1 }], hazards: 2, label: 'Watch the Floor!' },
            { enemies: [{ type: 'mage', count: 1 }], friendlies: 2, label: 'Dark Magic Stirs...' },
            { enemies: [{ type: 'goblin', count: 2 }, { type: 'mage', count: 1 }], friendlies: 1, hazards: 1, label: 'Chaos Erupts!' },
        ],
        // Floor 4: Complex multi-enemy + discrimination
        [
            { enemies: [{ type: 'assassin', count: 1 }], friendlies: 2, label: 'Friend or Foe?' },
            { enemies: [{ type: 'mage', count: 1 }, { type: 'assassin', count: 1 }], friendlies: 1, hazards: 2, label: 'Dark Alliance!' },
            { enemies: [{ type: 'orc', count: 1 }, { type: 'goblin', count: 2 }], friendlies: 2, hazards: 1, label: 'War Party!' },
        ],
        // Floor 5: Boss
        [
            { enemies: [{ type: 'skeleton', count: 2 }, { type: 'mage', count: 1 }], friendlies: 1, hazards: 2, label: 'The Guardians!' },
            { enemies: [{ type: 'golem', count: 1 }], hazards: 3, label: 'STONE GOLEM AWAKENS!', isBoss: true },
        ],
    ];

    function reset() {
        state = {
            floor: 1,
            wave: 0,
            enemies: [],
            projectiles: [],
            hazards: [],
            waveComplete: false,
            floorComplete: false,
            waveDelay: 0,
            totalWaves: 0,
            bgOffset: 0,
            decorations: [],
            pendingAnnounce: null,
            // Memory sequence challenge
            memoryChallenge: null,
            memoryChallengeActive: false,
        };
        generateDecor();
    }

    function generateDecor() {
        state.decorations = [];
        for (let x = 0; x < Utils.GAME_WIDTH; x += Utils.TILE_SIZE) {
            if (Math.random() > 0.7) {
                state.decorations.push({
                    type: 'grass',
                    x: x + Utils.rand(-2, 2),
                    y: Utils.GROUND_Y - Utils.rand(1, 5),
                    size: Utils.rand(2, 5),
                    color: Utils.randChoice(['#334422', '#2a3a1a', '#3d4d2d'])
                });
            }
        }
        for (let i = 0; i < 3; i++) {
            state.decorations.push({
                type: 'pillar',
                x: Utils.rand(30, Utils.GAME_WIDTH - 30),
                y: Utils.GROUND_Y,
                w: Utils.rand(8, 14),
                h: Utils.rand(30, 70),
                color: `hsl(${210 + Utils.rand(-20, 20)}, 10%, ${15 + Utils.rand(0, 10)}%)`
            });
        }
    }

    function getFloorConfig(floor) {
        if (floor <= WAVE_CONFIGS.length) {
            return WAVE_CONFIGS[floor - 1];
        }
        return generateFloorConfig(floor);
    }

    function generateFloorConfig(floor) {
        const allTypes = ['skeleton', 'goblin', 'orc', 'mage', 'assassin'];
        const waves = [];
        const waveCount = Math.min(3 + Math.floor((floor - 5) / 2), 6);
        const labels = [
            'Enemies Approach!', 'The Horde Advances!', 'Dark Forces Gather!',
            'A Powerful Foe!', 'Overwhelming Numbers!', 'The Final Stand!'
        ];

        for (let i = 0; i < waveCount; i++) {
            const enemyGroups = [];
            const groupCount = Utils.randInt(1, Math.min(3, 1 + Math.floor(floor / 3)));
            for (let g = 0; g < groupCount; g++) {
                enemyGroups.push({
                    type: Utils.randChoice(allTypes),
                    count: Utils.randInt(1, Math.min(3, 1 + Math.floor(floor / 4)))
                });
            }
            waves.push({
                enemies: enemyGroups,
                label: labels[i] || 'More enemies!',
                friendlies: Math.random() > 0.4 ? Utils.randInt(1, 2) : 0,
                hazards: Math.random() > 0.5 ? Utils.randInt(1, 3) : 0,
            });
        }
        if (floor % 3 === 0) {
            waves.push({
                enemies: [{ type: 'golem', count: 1 }],
                label: 'THE GOLEM RETURNS!',
                isBoss: true,
                hazards: Utils.randInt(2, 4),
            });
        }
        return waves;
    }

    function startWave(floor, waveIdx) {
        const config = getFloorConfig(floor);
        if (waveIdx >= config.length) {
            state.floorComplete = true;
            return null;
        }

        const waveDef = config[waveIdx];
        state.wave = waveIdx;
        state.waveComplete = false;
        state.enemies = [];
        state.projectiles = [];
        state.hazards = [];

        const difficulty = floor;

        // Spawn enemies
        for (const group of waveDef.enemies) {
            for (let i = 0; i < group.count; i++) {
                const spawnX = Utils.rand(Utils.GAME_WIDTH * 0.45, Utils.GAME_WIDTH - 40);
                const enemy = Enemy.create(group.type, spawnX, 0, difficulty);
                if (enemy) state.enemies.push(enemy);
            }
        }

        // Spawn friendly NPCs
        const friendlyCount = waveDef.friendlies || 0;
        for (let i = 0; i < friendlyCount; i++) {
            const spawnX = Utils.rand(60, Utils.GAME_WIDTH - 60);
            const friendly = Enemy.create('friendly', spawnX, 0, 1);
            if (friendly) {
                Cognitive.recordFriendlyEncounter();
                state.enemies.push(friendly);
            }
        }

        // Spawn hazards (ground fires)
        const hazardCount = waveDef.hazards || 0;
        for (let i = 0; i < hazardCount; i++) {
            state.hazards.push({
                x: Utils.rand(60, Utils.GAME_WIDTH - 60),
                y: Utils.GROUND_Y - 12,
                w: 16,
                h: 12,
                damage: 5,
                cooldown: 0,
                animFrame: 0,
                animTimer: 0,
            });
        }

        return waveDef;
    }

    function startFloor(floor) {
        state.floor = floor;
        state.wave = 0;
        state.floorComplete = false;
        state.memoryChallengeActive = false;
        state.memoryChallenge = null;
        generateDecor();
        return startWave(floor, 0);
    }

    // --- Memory Sequence Challenge ---
    function startMemoryChallenge(floor) {
        const length = Math.min(3 + Math.floor(floor / 2), 7);
        const symbols = ['!', '@', '#', '^'];
        const sequence = [];
        for (let i = 0; i < length; i++) {
            sequence.push(Utils.randChoice(symbols));
        }
        state.memoryChallenge = {
            sequence,
            displayIdx: 0,
            displayTimer: 0,
            phase: 'show', // show, input, result
            playerInput: [],
            showDuration: 800,
            startTime: 0,
        };
        state.memoryChallengeActive = true;
    }

    function update(dt, playerState, gameTime) {
        const dtMs = dt * 1000;

        // Memory challenge between waves
        if (state.memoryChallengeActive && state.memoryChallenge) {
            updateMemoryChallenge(dt, dtMs, gameTime);
            return;
        }

        // Update enemies (includes friendlies)
        const activeEnemies = state.enemies.filter(e => e.alive);
        for (const enemy of activeEnemies) {
            if (enemy.def.isFriendly) {
                // Friendlies just wander
                updateFriendly(enemy, dt);
            } else {
                Enemy.update(enemy, dt, playerState, gameTime);
                while (enemy.pendingProjectiles.length > 0) {
                    state.projectiles.push(enemy.pendingProjectiles.pop());
                }
            }
        }

        // Update projectiles
        for (let i = state.projectiles.length - 1; i >= 0; i--) {
            const proj = state.projectiles[i];
            proj.x += proj.vx;
            if (Math.abs(proj.x - proj.startX) > proj.range ||
                proj.x < -20 || proj.x > Utils.GAME_WIDTH + 20) {
                state.projectiles.splice(i, 1);
                continue;
            }
            const playerBox = { x: playerState.x, y: playerState.y, w: playerState.w || 24, h: playerState.h || 32 };
            const projBox = { x: proj.x - proj.w / 2, y: proj.y - proj.h / 2, w: proj.w, h: proj.h };
            if (Utils.rectOverlap(projBox, playerBox)) {
                const knockDir = proj.vx > 0 ? 1 : -1;
                const result = Player.takeDamage(proj.damage, knockDir);
                if (result === 'parry') {
                    Cognitive.recordReaction(proj.telegraphTime, gameTime);
                    Cognitive.recordPatternEncounter(proj.patternId, true, gameTime);
                } else if (result === 'hit') {
                    Cognitive.recordReaction(proj.telegraphTime, gameTime);
                    Cognitive.recordPatternEncounter(proj.patternId, false, gameTime);
                }
                state.projectiles.splice(i, 1);
            }
        }

        // Update hazards
        for (const h of state.hazards) {
            h.animTimer += dtMs;
            if (h.animTimer > 200) { h.animTimer = 0; h.animFrame = (h.animFrame + 1) % 2; }
            if (h.cooldown > 0) { h.cooldown -= dtMs; continue; }
            const playerBox = { x: playerState.x, y: playerState.y, w: playerState.w || 24, h: playerState.h || 32 };
            const hazBox = { x: h.x, y: h.y, w: h.w, h: h.h };
            if (Utils.rectOverlap(playerBox, hazBox)) {
                Player.takeDamage(h.damage, playerState.facingRight ? -1 : 1);
                h.cooldown = 1000;
            }
        }

        // Check player attacks hitting enemies
        const attackBox = Player.getAttackHitbox();
        if (attackBox) {
            for (const enemy of activeEnemies) {
                if (enemy._playerHitThisSwing) continue;
                const enemyBox = Enemy.getHitbox(enemy);
                if (Utils.rectOverlap(attackBox, enemyBox)) {
                    enemy._playerHitThisSwing = true;

                    if (enemy.def.isFriendly) {
                        // Hit a friendly! Bad!
                        const ps = Player.getState();
                        const died = Enemy.takeDamage(enemy, ps.attackDamage, gameTime);
                        if (died) {
                            Cognitive.recordFriendlyKilled();
                            Cognitive.recordDecision('friendly_present', 'attack', 'bad', gameTime);
                            Player.addScore(-200);
                            Particles.spawnText(enemy.x, enemy.y - 10, '-200', '#ff4444', 14);
                            Particles.spawnText(enemy.x, enemy.y - 24, 'INNOCENT!', '#ff0000', 10);
                        }
                    } else {
                        const ps = Player.getState();
                        let damage = ps.attackDamage;
                        if (ps.comboCount > 1) {
                            damage = Math.round(damage * (1 + ps.comboCount * 0.15));
                        }
                        const died = Enemy.takeDamage(enemy, damage, gameTime);
                        if (died) {
                            Cognitive.recordEnemyCorrectlyKilled();
                            Particles.spawnText(enemy.x, enemy.y - 10, `+${enemy.def.score}`, '#ffcc00');
                        } else {
                            Particles.spawnText(enemy.x + enemy.w / 2, enemy.y - 10, `-${damage}`, '#ff4444', 12);
                        }
                        if (ps.comboCount > 1) {
                            Cognitive.recordDecision('combo_attack', 'attack', 'good', gameTime);
                        }
                    }
                }
            }
        } else {
            for (const enemy of activeEnemies) {
                enemy._playerHitThisSwing = false;
            }
        }

        // Multi-enemy cognitive tracking (exclude friendlies)
        const hostileActive = activeEnemies.filter(e => !e.def.isFriendly);
        if (hostileActive.length > 0) {
            Cognitive.recordMultiEnemySituation(hostileActive.length, 0);
        }

        // Check if wave is complete (all hostile enemies dead, friendlies can remain)
        const hostileAlive = state.enemies.filter(e => e.alive && !e.def.isFriendly);
        if (!state.waveComplete && hostileAlive.length === 0 && state.enemies.length > 0) {
            // Track spared friendlies
            const friendlyAlive = state.enemies.filter(e => e.alive && e.def.isFriendly);
            for (let i = 0; i < friendlyAlive.length; i++) {
                Cognitive.recordFriendlySpared();
            }
            state.waveComplete = true;
            // Start memory challenge between waves (from floor 2+)
            if (state.floor >= 2 && state.wave < getFloorConfig(state.floor).length - 1) {
                state.waveDelay = 500;
                state._startMemoryAfterDelay = true;
            } else {
                state.waveDelay = 1500;
            }
        }

        // Wave delay and progression
        if (state.waveComplete) {
            state.waveDelay -= dtMs;
            if (state.waveDelay <= 0) {
                if (state._startMemoryAfterDelay) {
                    state._startMemoryAfterDelay = false;
                    startMemoryChallenge(state.floor);
                    return;
                }
                const nextWave = startWave(state.floor, state.wave + 1);
                if (!nextWave) {
                    state.floorComplete = true;
                } else {
                    state.pendingAnnounce = nextWave.label;
                }
            }
        }

        state.bgOffset = (state.bgOffset + 0.2) % Utils.GAME_WIDTH;
    }

    function updateFriendly(f, dt) {
        // Wander randomly
        if (!f._wanderTimer) f._wanderTimer = 0;
        if (!f._wanderDir) f._wanderDir = 0;
        f._wanderTimer -= dt * 1000;
        if (f._wanderTimer <= 0) {
            f._wanderDir = Utils.randChoice([-1, 0, 0, 1]); // mostly idle
            f._wanderTimer = Utils.rand(800, 2000);
            if (f._wanderDir !== 0) f.facingRight = f._wanderDir > 0;
        }
        f.x += f._wanderDir * f.def.speed;
        f.x = Utils.clamp(f.x, 10, Utils.GAME_WIDTH - f.w - 10);

        // Animation
        f.animTimer += dt * 1000;
        if (f.animTimer >= 400) { f.animTimer = 0; f.animFrame++; }
        f.animAnim = 'idle';
    }

    function updateMemoryChallenge(dt, dtMs, gameTime) {
        const mc = state.memoryChallenge;
        if (mc.phase === 'show') {
            mc.displayTimer += dtMs;
            if (mc.displayTimer >= mc.showDuration) {
                mc.displayTimer = 0;
                mc.displayIdx++;
                if (mc.displayIdx >= mc.sequence.length) {
                    mc.phase = 'input';
                    mc.startTime = gameTime;
                    // Listen for input via key mapping
                }
            }
        } else if (mc.phase === 'input') {
            // Check keyboard for input: 1=!, 2=@, 3=#, 4=^
            const input = Engine.getInput();
            // We'll use attack/dodge/block/jump as the 4 inputs
            const keyToSymbol = { attackPressed: '!', dodgePressed: '@', block: '#', jumpPressed: '^' };
            for (const [key, sym] of Object.entries(keyToSymbol)) {
                if (input[key]) {
                    mc.playerInput.push(sym);
                    if (key !== 'block') input[key] = false;
                    // Check if done
                    if (mc.playerInput.length >= mc.sequence.length) {
                        const correct = mc.playerInput.every((s, i) => s === mc.sequence[i]);
                        Cognitive.recordMemorySequence(mc.sequence.length, correct, gameTime - mc.startTime);
                        mc.phase = 'result';
                        mc.resultCorrect = correct;
                        mc.displayTimer = 0;
                        if (correct) {
                            Player.addScore(mc.sequence.length * 30);
                            Audio.levelUp();
                        } else {
                            Audio.playerHit();
                        }
                    }
                    break;
                }
            }
        } else if (mc.phase === 'result') {
            mc.displayTimer += dtMs;
            if (mc.displayTimer >= 1500) {
                state.memoryChallengeActive = false;
                state.memoryChallenge = null;
                // Proceed to next wave
                const nextWave = startWave(state.floor, state.wave + 1);
                if (!nextWave) {
                    state.floorComplete = true;
                } else {
                    state.pendingAnnounce = nextWave.label;
                }
            }
        }
    }

    function getState() { return state; }

    function renderBackground(ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, Utils.GROUND_Y);
        const floorColors = [
            ['#0a0a1a', '#1a1a3a'],
            ['#0f0a1a', '#2a1a3a'],
            ['#1a0a0a', '#3a1a1a'],
            ['#0a0a0a', '#1a1a2a'],
            ['#1a0a0f', '#3a1a2a'],
        ];
        const colors = floorColors[Math.min(state.floor - 1, floorColors.length - 1)];
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, Utils.GAME_WIDTH, Utils.GROUND_Y);

        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 20; i++) {
            const sx = (i * 137 + state.bgOffset * 0.1) % Utils.GAME_WIDTH;
            const sy = (i * 97) % (Utils.GROUND_Y - 30) + 5;
            ctx.globalAlpha = 0.3 + (Math.sin(i + state.bgOffset * 0.005) * 0.3);
            ctx.fillRect(sx, sy, 1, 1);
        }
        ctx.globalAlpha = 1;

        // Background pillars
        for (const d of state.decorations) {
            if (d.type === 'pillar') {
                ctx.fillStyle = d.color;
                ctx.fillRect(d.x, d.y - d.h, d.w, d.h);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(d.x + d.w - 2, d.y - d.h, 2, d.h);
            }
        }

        // Ground
        ctx.fillStyle = '#2a2a1a';
        ctx.fillRect(0, Utils.GROUND_Y, Utils.GAME_WIDTH, Utils.GAME_HEIGHT - Utils.GROUND_Y);
        ctx.strokeStyle = '#444433';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, Utils.GROUND_Y);
        ctx.lineTo(Utils.GAME_WIDTH, Utils.GROUND_Y);
        ctx.stroke();

        // Ground details
        for (const d of state.decorations) {
            if (d.type === 'grass') {
                ctx.fillStyle = d.color;
                ctx.fillRect(d.x, d.y, 1, d.size);
                ctx.fillRect(d.x + 2, d.y + 1, 1, d.size - 1);
            }
        }
    }

    function renderEntities(ctx, gameTime) {
        // Render hazards
        for (const h of state.hazards) {
            const sprite = Sprites.get('hazard', 'idle', h.animFrame, true);
            if (sprite) {
                ctx.drawImage(sprite, h.x, h.y - sprite.height + h.h);
            } else {
                ctx.fillStyle = '#ff4400';
                ctx.fillRect(h.x, h.y, h.w, h.h);
            }
            // Warning glow
            ctx.globalAlpha = 0.15 + Math.sin((gameTime || 0) * 0.008) * 0.1;
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(h.x - 2, h.y - 2, h.w + 4, h.h + 4);
            ctx.globalAlpha = 1;
        }

        // Render enemies (friendlies get special treatment)
        for (const enemy of state.enemies) {
            if (enemy.def.isFriendly) {
                renderFriendly(ctx, enemy, gameTime);
            } else {
                Enemy.render(ctx, enemy);
            }
        }

        // Render projectiles
        for (const proj of state.projectiles) {
            const sprite = Sprites.get('projectile', 'idle', 0, proj.vx > 0);
            if (sprite) {
                ctx.drawImage(sprite, proj.x - sprite.width / 2, proj.y - sprite.height / 2);
            } else {
                ctx.fillStyle = '#ff44ff';
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff88ff';
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(proj.x - proj.vx * i * 2, proj.y, 2 - i * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        // Render memory challenge overlay
        if (state.memoryChallengeActive && state.memoryChallenge) {
            renderMemoryChallenge(ctx, gameTime);
        }
    }

    function renderFriendly(ctx, f, gameTime) {
        if (!f.alive) return;

        // Green glow aura
        ctx.globalAlpha = 0.2 + Math.sin((gameTime || 0) * 0.005) * 0.1;
        ctx.fillStyle = '#00ff44';
        ctx.beginPath();
        ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        const sprite = Sprites.get('friendly', f.animAnim || 'idle', f.animFrame || 0, f.facingRight);
        if (sprite) {
            const sx = f.x - (sprite.width - f.w) / 2;
            const sy = f.y - (sprite.height - f.h) + 2;
            ctx.drawImage(sprite, sx, sy);
        } else {
            ctx.fillStyle = '#44aa88';
            ctx.fillRect(f.x, f.y, f.w, f.h);
        }

        // "ALLY" label above
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 7px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('ALLY', f.x + f.w / 2, f.y - 4);
        ctx.textAlign = 'left';

        // HP bar if hurt
        if (f.hp < f.maxHp) {
            const barW = 20;
            const barX = f.x + f.w / 2 - barW / 2;
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, f.y - 10, barW, 2);
            ctx.fillStyle = '#00cc44';
            ctx.fillRect(barX, f.y - 10, barW * (f.hp / f.maxHp), 2);
        }
    }

    function renderMemoryChallenge(ctx, gameTime) {
        const mc = state.memoryChallenge;

        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, Utils.GAME_WIDTH, Utils.GAME_HEIGHT);

        ctx.textAlign = 'center';

        if (mc.phase === 'show') {
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 12px Courier New';
            ctx.fillText('REMEMBER THE SEQUENCE', Utils.GAME_WIDTH / 2, 60);

            // Show symbols
            const symbolMap = { '!': 'ATK', '@': 'DOD', '#': 'BLK', '^': 'JMP' };
            const colorMap = { '!': '#ff4444', '@': '#4488ff', '#': '#ffcc00', '^': '#44ff44' };
            const startX = Utils.GAME_WIDTH / 2 - (mc.sequence.length * 28) / 2;
            for (let i = 0; i < mc.sequence.length; i++) {
                const sym = mc.sequence[i];
                const x = startX + i * 28;
                const isActive = i === mc.displayIdx;
                const isPast = i < mc.displayIdx;

                ctx.globalAlpha = isActive ? 1 : (isPast ? 0.3 : 0.15);
                ctx.fillStyle = colorMap[sym];
                ctx.font = 'bold 16px Courier New';
                ctx.fillText(symbolMap[sym], x + 14, 100);

                if (isActive) {
                    ctx.strokeStyle = colorMap[sym];
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, 84, 28, 22);
                }
            }
            ctx.globalAlpha = 1;

        } else if (mc.phase === 'input') {
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 12px Courier New';
            ctx.fillText('REPEAT: ATK=! DOD=@ BLK=# JMP=^', Utils.GAME_WIDTH / 2, 60);

            const symbolMap = { '!': 'ATK', '@': 'DOD', '#': 'BLK', '^': 'JMP' };
            const colorMap = { '!': '#ff4444', '@': '#4488ff', '#': '#ffcc00', '^': '#44ff44' };
            const startX = Utils.GAME_WIDTH / 2 - (mc.sequence.length * 28) / 2;
            for (let i = 0; i < mc.sequence.length; i++) {
                const x = startX + i * 28;
                if (i < mc.playerInput.length) {
                    const sym = mc.playerInput[i];
                    const correct = sym === mc.sequence[i];
                    ctx.fillStyle = correct ? colorMap[sym] : '#ff0000';
                    ctx.font = 'bold 16px Courier New';
                    ctx.fillText(symbolMap[sym], x + 14, 100);
                } else if (i === mc.playerInput.length) {
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 2, 86, 24, 18);
                    ctx.fillStyle = '#444';
                    ctx.font = '10px Courier New';
                    ctx.fillText('?', x + 14, 99);
                } else {
                    ctx.fillStyle = '#333';
                    ctx.font = '10px Courier New';
                    ctx.fillText('_', x + 14, 99);
                }
            }

        } else if (mc.phase === 'result') {
            ctx.font = 'bold 18px Courier New';
            if (mc.resultCorrect) {
                ctx.fillStyle = '#00ff88';
                ctx.fillText('CORRECT!', Utils.GAME_WIDTH / 2, 90);
                ctx.font = '10px Courier New';
                ctx.fillStyle = '#88ffaa';
                ctx.fillText(`+${mc.sequence.length * 30} points`, Utils.GAME_WIDTH / 2, 110);
            } else {
                ctx.fillStyle = '#ff4444';
                ctx.fillText('WRONG', Utils.GAME_WIDTH / 2, 90);
                // Show correct sequence
                ctx.font = '9px Courier New';
                ctx.fillStyle = '#888';
                const symbolMap = { '!': 'ATK', '@': 'DOD', '#': 'BLK', '^': 'JMP' };
                ctx.fillText('Was: ' + mc.sequence.map(s => symbolMap[s]).join(' '), Utils.GAME_WIDTH / 2, 110);
            }
        }

        ctx.textAlign = 'left';
    }

    return {
        reset, startFloor, startWave, update,
        getState, renderBackground, renderEntities,
        getFloorConfig
    };
})();
