// ============================================================
// ENGINE - Core game engine (canvas, input, game loop)
// ============================================================
const Engine = (() => {
    let canvas, ctx;
    let lastTime = 0;
    let running = false;
    let gameTime = 0;

    // Input state
    const input = {
        left: false,
        right: false,
        up: false,
        down: false,
        jumpPressed: false,
        attackPressed: false,
        dodgePressed: false,
        block: false,
    };

    const keyMap = {
        'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
        'ArrowRight': 'right', 'd': 'right', 'D': 'right',
        'ArrowUp': 'up', 'w': 'up', 'W': 'up',
        'ArrowDown': 'down', 's': 'down', 'S': 'down',
    };

    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');

        resize();
        window.addEventListener('resize', resize);

        // Keyboard input
        window.addEventListener('keydown', (e) => {
            if (keyMap[e.key]) {
                input[keyMap[e.key]] = true;
                if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                    input.jumpPressed = true;
                }
                e.preventDefault();
            }
            if (e.key === ' ' || e.key === 'Space') {
                input.attackPressed = true;
                e.preventDefault();
            }
            if (e.key === 'Shift') {
                input.dodgePressed = true;
                e.preventDefault();
            }
            if (e.key === 'f' || e.key === 'F') {
                input.block = true;
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (keyMap[e.key]) {
                input[keyMap[e.key]] = false;
            }
            if (e.key === 'f' || e.key === 'F') {
                input.block = false;
            }
        });

        // Initialize sprites
        Sprites.init();
    }

    function resize() {
        const container = document.getElementById('game-container');
        const aspect = Utils.GAME_WIDTH / Utils.GAME_HEIGHT;
        let w = container.clientWidth;
        let h = container.clientHeight;

        if (w / h > aspect) {
            w = h * aspect;
        } else {
            h = w / aspect;
        }

        canvas.width = Utils.GAME_WIDTH;
        canvas.height = Utils.GAME_HEIGHT;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        // Crisp rendering
        ctx.imageSmoothingEnabled = false;
    }

    function getCtx() { return ctx; }
    function getInput() { return input; }
    function getGameTime() { return gameTime; }

    function startLoop(updateFn, renderFn) {
        running = true;
        lastTime = performance.now();
        gameTime = 0;

        function loop(timestamp) {
            if (!running) return;

            const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap at 50ms
            lastTime = timestamp;
            gameTime += dt * 1000;

            updateFn(dt, gameTime);

            // Clear
            ctx.clearRect(0, 0, Utils.GAME_WIDTH, Utils.GAME_HEIGHT);

            renderFn(ctx, gameTime);

            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }

    function stopLoop() {
        running = false;
    }

    function clearPressedInputs() {
        input.jumpPressed = false;
        input.attackPressed = false;
        input.dodgePressed = false;
    }

    return {
        init, resize, getCtx, getInput, getGameTime,
        startLoop, stopLoop, clearPressedInputs
    };
})();
