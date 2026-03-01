// ============================================================
// LEVEL - Level generation and wave management
// ============================================================
const Level = (() => {
    let state = {};

    const WAVE_CONFIGS = [
        // Floor 1: Tutorial - single enemies
        [
            { enemies: [{ type: 'skeleton', count: 1 }], label: 'A Skeleton Approaches...' },
            { enemies: [{ type: 'skeleton', count: 2 }], label: 'More Bones Rattle...' },
            { enemies: [{ type: 'goblin', count: 1 }], label: 'A Goblin Lurks...' },
        ],
        // Floor 2: Mixed enemies
        [
            { enemies: [{ type: 'goblin', count: 2 }], label: 'Goblins Attack!' },
            { enemies: [{ type: 'skeleton', count: 1 }, { type: 'goblin', count: 1 }], label: 'Mixed Forces!' },
            { enemies: [{ type: 'orc', count: 1 }], label: 'An Orc Charges!' },
        ],
        // Floor 3: Harder mixes
        [
            { enemies: [{ type: 'orc', count: 1 }, { type: 'skeleton', count: 1 }], label: 'Heavy Assault!' },
            { enemies: [{ type: 'mage', count: 1 }], label: 'Dark Magic Stirs...' },
            { enemies: [{ type: 'goblin', count: 2 }, { type: 'mage', count: 1 }], label: 'Coordinated Attack!' },
        ],
        // Floor 4: Assassin introduction + multi-enemy
        [
            { enemies: [{ type: 'assassin', count: 1 }], label: 'Shadows Move...' },
            { enemies: [{ type: 'mage', count: 1 }, { type: 'assassin', count: 1 }], label: 'Dark Alliance!' },
            { enemies: [{ type: 'orc', count: 1 }, { type: 'goblin', count: 2 }], label: 'War Party!' },
        ],
        // Floor 5: Boss
        [
            { enemies: [{ type: 'skeleton', count: 2 }, { type: 'mage', count: 1 }], label: 'The Guardians!' },
            { enemies: [{ type: 'golem', count: 1 }], label: 'STONE GOLEM AWAKENS!', isBoss: true },
        ],
    ];

    function reset() {
        state = {
            floor: 1,
            wave: 0,
            enemies: [],
            projectiles: [],
            waveComplete: false,
            floorComplete: false,
            waveDelay: 0,
            totalWaves: 0,
            bgOffset: 0,
            platforms: [],
            decorations: [],
            pendingAnnounce: null,
        };
        generateDecor();
    }

    function generateDecor() {
        state.decorations = [];
        // Ground tiles variation
        for (let x = 0; x < Utils.GAME_WIDTH; x += Utils.TILE_SIZE) {
            if (Math.random() > 0.7) {
                state.decorations.push({
                    type: 'grass',
                    x: x + Utils.rand(-4, 4),
                    y: Utils.GROUND_Y - Utils.rand(2, 8),
                    size: Utils.rand(3, 8),
                    color: Utils.randChoice(['#334422', '#2a3a1a', '#3d4d2d'])
                });
            }
            if (Math.random() > 0.9) {
                state.decorations.push({
                    type: 'rock',
                    x: x + Utils.rand(0, Utils.TILE_SIZE),
                    y: Utils.GROUND_Y - Utils.rand(0, 4),
                    size: Utils.rand(4, 10),
                    color: Utils.randChoice(['#444', '#555', '#3a3a3a'])
                });
            }
        }
        // Background elements
        for (let i = 0; i < 5; i++) {
            state.decorations.push({
                type: 'pillar',
                x: Utils.rand(50, Utils.GAME_WIDTH - 50),
                y: Utils.GROUND_Y,
                w: Utils.rand(15, 25),
                h: Utils.rand(60, 120),
                color: `hsl(${210 + Utils.rand(-20, 20)}, 10%, ${15 + Utils.rand(0, 10)}%)`
            });
        }
    }

    function getFloorConfig(floor) {
        if (floor <= WAVE_CONFIGS.length) {
            return WAVE_CONFIGS[floor - 1];
        }
        // Procedurally generate floors beyond 5
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
            waves.push({ enemies: enemyGroups, label: labels[i] || 'More enemies!' });
        }
        // Every 3 floors after 5, add a golem boss
        if (floor % 3 === 0) {
            waves.push({
                enemies: [{ type: 'golem', count: 1 }],
                label: 'THE GOLEM RETURNS!',
                isBoss: true
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

        const difficulty = floor;

        for (const group of waveDef.enemies) {
            for (let i = 0; i < group.count; i++) {
                const spawnX = Utils.rand(
                    Utils.GAME_WIDTH * 0.5,
                    Utils.GAME_WIDTH - 60
                );
                const enemy = Enemy.create(group.type, spawnX, 0, difficulty);
                if (enemy) {
                    state.enemies.push(enemy);
                }
            }
        }

        return waveDef;
    }

    function startFloor(floor) {
        state.floor = floor;
        state.wave = 0;
        state.floorComplete = false;
        generateDecor();
        return startWave(floor, 0);
    }

    function update(dt, playerState, gameTime) {
        const dtMs = dt * 1000;

        // Update enemies
        const activeEnemies = state.enemies.filter(e => e.alive);
        for (const enemy of activeEnemies) {
            Enemy.update(enemy, dt, playerState, gameTime);

            // Collect projectiles
            while (enemy.pendingProjectiles.length > 0) {
                state.projectiles.push(enemy.pendingProjectiles.pop());
            }
        }

        // Update projectiles
        for (let i = state.projectiles.length - 1; i >= 0; i--) {
            const proj = state.projectiles[i];
            proj.x += proj.vx;

            // Check bounds
            if (Math.abs(proj.x - proj.startX) > proj.range ||
                proj.x < -20 || proj.x > Utils.GAME_WIDTH + 20) {
                state.projectiles.splice(i, 1);
                continue;
            }

            // Check player collision
            const playerBox = { x: playerState.x, y: playerState.y, w: playerState.w || 30, h: playerState.h || 36 };
            const projBox = { x: proj.x - proj.w / 2, y: proj.y - proj.h / 2, w: proj.w, h: proj.h };

            if (Utils.rectOverlap(projBox, playerBox)) {
                const knockDir = proj.vx > 0 ? 1 : -1;
                const result = Player.takeDamage(proj.damage, knockDir);
                if (result) {
                    if (result === 'parry') {
                        Cognitive.recordReaction(proj.telegraphTime, gameTime);
                        Cognitive.recordPatternEncounter(proj.patternId, true, gameTime);
                    } else if (result === 'hit') {
                        Cognitive.recordReaction(proj.telegraphTime, gameTime);
                        Cognitive.recordPatternEncounter(proj.patternId, false, gameTime);
                    }
                }
                state.projectiles.splice(i, 1);
                continue;
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
                    const ps = Player.getState();
                    let damage = ps.attackDamage;
                    // Combo bonus
                    if (ps.comboCount > 1) {
                        damage = Math.round(damage * (1 + ps.comboCount * 0.15));
                    }
                    const died = Enemy.takeDamage(enemy, damage, gameTime);
                    if (died) {
                        Particles.spawnText(enemy.x, enemy.y - 10, `+${enemy.def.score}`, '#ffcc00');
                    } else {
                        Particles.spawnText(enemy.x + enemy.w / 2, enemy.y - 10, `-${damage}`, '#ff4444', 14);
                    }

                    if (ps.comboCount > 1) {
                        Cognitive.recordDecision('combo_attack', 'attack', 'good', gameTime);
                    }
                }
            }
        } else {
            // Reset hit flags when not attacking
            for (const enemy of activeEnemies) {
                enemy._playerHitThisSwing = false;
            }
        }

        // Multi-enemy cognitive tracking
        if (activeEnemies.length > 0) {
            Cognitive.recordMultiEnemySituation(activeEnemies.length, 0);
        }

        // Check if wave is complete
        if (!state.waveComplete && activeEnemies.length === 0 && state.enemies.length > 0) {
            state.waveComplete = true;
            state.waveDelay = 2000;
        }

        // Wave delay and progression
        if (state.waveComplete) {
            state.waveDelay -= dtMs;
            if (state.waveDelay <= 0) {
                const nextWave = startWave(state.floor, state.wave + 1);
                if (!nextWave) {
                    state.floorComplete = true;
                } else {
                    state.pendingAnnounce = nextWave.label;
                }
            }
        }

        // Scroll background
        state.bgOffset = (state.bgOffset + 0.2) % Utils.GAME_WIDTH;
    }

    function getState() { return state; }

    function renderBackground(ctx) {
        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, Utils.GROUND_Y);
        const floorColors = [
            ['#0a0a1a', '#1a1a3a'], // Floor 1
            ['#0f0a1a', '#2a1a3a'], // Floor 2
            ['#1a0a0a', '#3a1a1a'], // Floor 3
            ['#0a0a0a', '#1a1a2a'], // Floor 4
            ['#1a0a0f', '#3a1a2a'], // Floor 5
        ];
        const colors = floorColors[Math.min(state.floor - 1, floorColors.length - 1)];
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, Utils.GAME_WIDTH, Utils.GROUND_Y);

        // Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 30; i++) {
            const sx = (i * 137 + state.bgOffset * 0.1) % Utils.GAME_WIDTH;
            const sy = (i * 97) % (Utils.GROUND_Y - 50) + 10;
            const ss = (i % 3) + 1;
            ctx.globalAlpha = 0.3 + (Math.sin(i + state.bgOffset * 0.005) * 0.3);
            ctx.fillRect(sx, sy, ss, ss);
        }
        ctx.globalAlpha = 1;

        // Background pillars
        for (const d of state.decorations) {
            if (d.type === 'pillar') {
                ctx.fillStyle = d.color;
                ctx.fillRect(d.x, d.y - d.h, d.w, d.h);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(d.x + d.w - 3, d.y - d.h, 3, d.h);
            }
        }

        // Ground
        ctx.fillStyle = '#2a2a1a';
        ctx.fillRect(0, Utils.GROUND_Y, Utils.GAME_WIDTH, Utils.GAME_HEIGHT - Utils.GROUND_Y);

        // Ground line
        ctx.strokeStyle = '#444433';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, Utils.GROUND_Y);
        ctx.lineTo(Utils.GAME_WIDTH, Utils.GROUND_Y);
        ctx.stroke();

        // Ground details
        for (const d of state.decorations) {
            if (d.type === 'grass') {
                ctx.fillStyle = d.color;
                ctx.fillRect(d.x, d.y, 2, d.size);
                ctx.fillRect(d.x + 3, d.y + 2, 2, d.size - 2);
            } else if (d.type === 'rock') {
                ctx.fillStyle = d.color;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.size / 2, 0, Math.PI, true);
                ctx.fill();
            }
        }

        // Ground tile lines
        ctx.strokeStyle = 'rgba(60, 60, 40, 0.3)';
        ctx.lineWidth = 1;
        for (let x = 0; x < Utils.GAME_WIDTH; x += Utils.TILE_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, Utils.GROUND_Y);
            ctx.lineTo(x, Utils.GAME_HEIGHT);
            ctx.stroke();
        }
    }

    function renderEntities(ctx) {
        // Render enemies
        for (const enemy of state.enemies) {
            Enemy.render(ctx, enemy);
        }

        // Render projectiles
        for (const proj of state.projectiles) {
            const sprite = Sprites.get('projectile', 'idle', 0, proj.vx > 0);
            if (sprite) {
                ctx.drawImage(sprite, proj.x - sprite.width / 2, proj.y - sprite.height / 2);
            } else {
                ctx.fillStyle = '#ff44ff';
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Projectile trail
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff88ff';
            for (let i = 1; i <= 3; i++) {
                const trailX = proj.x - proj.vx * i * 3;
                ctx.beginPath();
                ctx.arc(trailX, proj.y, 3 - i, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    }

    return {
        reset, startFloor, startWave, update,
        getState, renderBackground, renderEntities,
        getFloorConfig
    };
})();
