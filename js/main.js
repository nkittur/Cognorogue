// ============================================================
// MAIN - Game state management and main loop
// ============================================================
const Game = (() => {
    let gameState = 'title'; // title, playing, gameover, transition
    let transitionTimer = 0;
    let currentFloor = 1;
    let waveAnnouncePending = null;
    let waveAnnounceTimer = 0;

    function init() {
        Engine.init();
        UI.init();
        UI.showScreen('title-screen');
    }

    function start() {
        gameState = 'playing';
        currentFloor = 1;

        // Reset all systems
        Player.reset();
        Level.reset();
        Cognitive.reset();
        Particles.clear();

        // Start first floor
        const waveDef = Level.startFloor(currentFloor);
        if (waveDef) {
            waveAnnouncePending = waveDef.label;
            waveAnnounceTimer = 500;
        }

        UI.showHUD();

        // Start game loop
        Engine.startLoop(update, render);
    }

    function update(dt, gameTime) {
        const input = Engine.getInput();

        switch (gameState) {
            case 'playing':
                updatePlaying(dt, gameTime, input);
                break;
            case 'transition':
                updateTransition(dt);
                break;
            case 'gameover':
                // Nothing to update
                break;
        }

        Engine.clearPressedInputs();
    }

    function updatePlaying(dt, gameTime, input) {
        // Update player
        Player.update(dt, input, gameTime);
        const playerState = Player.getState();

        // Update level (enemies, projectiles, waves)
        Level.update(dt, playerState, gameTime);
        const levelState = Level.getState();

        // Update particles
        Particles.update(dt);

        // Cognitive sampling
        Cognitive.samplePerformance(gameTime);
        Cognitive.setScore(playerState.score);

        // Combo tracking
        if (playerState.comboCount >= 3) {
            Cognitive.recordCombo(playerState.comboCount);
        }

        // Pick up new wave announcements from level
        if (levelState.pendingAnnounce) {
            waveAnnouncePending = levelState.pendingAnnounce;
            waveAnnounceTimer = 300;
            levelState.pendingAnnounce = null;
        }

        // Wave announcements
        if (waveAnnouncePending) {
            waveAnnounceTimer -= dt * 1000;
            if (waveAnnounceTimer <= 0) {
                UI.showWaveAnnounce(waveAnnouncePending);
                waveAnnouncePending = null;
            }
        }

        // Check floor complete
        if (levelState.floorComplete) {
            Cognitive.recordFloorCleared();
            currentFloor++;
            startTransition();
        }

        // Check player death
        if (!Player.isAlive()) {
            gameOver(false);
        }

        // Update HUD
        UI.updateHUD(playerState, levelState);

        // Decision tracking for dodge
        if (input.dodgePressed) {
            const enemies = levelState.enemies.filter(e => e.alive && e.currentPattern);
            if (enemies.length > 0) {
                const isTelegraphing = enemies.some(e => {
                    const phase = e.currentPattern.phases[e.patternPhaseIdx];
                    return phase.type === 'telegraph' || phase.type === 'attack';
                });
                if (isTelegraphing) {
                    Cognitive.recordDodge(true, 0);
                    Cognitive.recordDecision('enemy_attacking', 'dodge', 'good', gameTime);
                    Cognitive.incrementRecentDodge();
                }
            }
        }

        // Track pattern recall
        const enemies = levelState.enemies.filter(e => e.alive && e.currentPattern);
        for (const enemy of enemies) {
            if (enemy.currentPattern && !enemy._recallTracked) {
                const patternId = enemy.currentPattern.id;
                const encounters = Cognitive.getReport ? null : null; // Check if seen before
                Cognitive.recordPatternRecall(patternId, true);
                enemy._recallTracked = true;
            }
        }
    }

    function startTransition() {
        gameState = 'transition';
        transitionTimer = 2500;
        UI.showTransition(currentFloor - 1);
        Audio.levelUp();
    }

    function updateTransition(dt) {
        transitionTimer -= dt * 1000;
        if (transitionTimer <= 0) {
            gameState = 'playing';
            Player.reset();
            Particles.clear();
            const waveDef = Level.startFloor(currentFloor);
            if (waveDef) {
                waveAnnouncePending = waveDef.label;
                waveAnnounceTimer = 500;
            }
            UI.showHUD();
        }
    }

    function gameOver(won) {
        gameState = 'gameover';
        Cognitive.endSession();
        Audio.gameOver();

        const playerState = Player.getState();
        const levelState = Level.getState();

        if (won) {
            playerState.score += 1000; // Completion bonus
            document.getElementById('gameover-title').textContent = 'VICTORY!';
        } else {
            document.getElementById('gameover-title').textContent = 'DEFEATED';
        }

        UI.showGameOver(playerState, levelState);
        Engine.stopLoop();
    }

    function render(ctx, gameTime) {
        // Background
        Level.renderBackground(ctx);

        // Entities
        Level.renderEntities(ctx, gameTime);

        // Player
        Player.render(ctx);

        // Particles on top
        Particles.render(ctx);

        // Scanline effect (every other line for perf on low-res)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
        for (let y = 0; y < Utils.GAME_HEIGHT; y += 2) {
            ctx.fillRect(0, y, Utils.GAME_WIDTH, 1);
        }

        // Vignette
        const vgrad = ctx.createRadialGradient(
            Utils.GAME_WIDTH / 2, Utils.GAME_HEIGHT / 2, Utils.GAME_HEIGHT * 0.4,
            Utils.GAME_WIDTH / 2, Utils.GAME_HEIGHT / 2, Utils.GAME_HEIGHT * 0.9
        );
        vgrad.addColorStop(0, 'rgba(0,0,0,0)');
        vgrad.addColorStop(1, 'rgba(0,0,0,0.4)');
        ctx.fillStyle = vgrad;
        ctx.fillRect(0, 0, Utils.GAME_WIDTH, Utils.GAME_HEIGHT);

        // Low HP warning
        const ps = Player.getState();
        if (ps.hp <= 25 && ps.hp > 0) {
            const pulse = Math.sin(gameTime * 0.005) * 0.15 + 0.15;
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse})`;
            ctx.fillRect(0, 0, Utils.GAME_WIDTH, Utils.GAME_HEIGHT);
        }
    }

    // Initialize on load
    window.addEventListener('DOMContentLoaded', init);

    return { init, start };
})();
