// ============================================================
// ENGINE - Core game engine (canvas, input, game loop)
// ============================================================
const Engine = (() => {
    let canvas, ctx;
    let lastTime = 0;
    let running = false;
    let gameTime = 0;
    let isMobile = false;

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

        isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', () => {
            setTimeout(resize, 100);
        });

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

        // Touch controls
        initTouchControls();

        // Prevent default touch behavior on the game area
        canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

        // Initialize sprites
        Sprites.init();
    }

    function initTouchControls() {
        const touchButtons = document.querySelectorAll('.touch-btn');
        const activeTouches = new Map(); // trackId -> action

        function handleTouchStart(e) {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                const btn = touch.target.closest('.touch-btn');
                if (!btn) continue;
                const action = btn.dataset.action;
                activeTouches.set(touch.identifier, action);
                btn.classList.add('pressed');
                applyTouchAction(action, true);
            }
        }

        function handleTouchEnd(e) {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                const action = activeTouches.get(touch.identifier);
                if (action) {
                    activeTouches.delete(touch.identifier);
                    // Find the button and unpress it
                    const btn = document.querySelector(`.touch-btn[data-action="${action}"]`);
                    if (btn) btn.classList.remove('pressed');
                    applyTouchAction(action, false);
                }
            }
        }

        function handleTouchMove(e) {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                const el = document.elementFromPoint(touch.clientX, touch.clientY);
                const btn = el ? el.closest('.touch-btn') : null;
                const prevAction = activeTouches.get(touch.identifier);
                const newAction = btn ? btn.dataset.action : null;

                if (prevAction !== newAction) {
                    // Left old button
                    if (prevAction) {
                        const oldBtn = document.querySelector(`.touch-btn[data-action="${prevAction}"]`);
                        if (oldBtn) oldBtn.classList.remove('pressed');
                        applyTouchAction(prevAction, false);
                    }
                    // Entered new button
                    if (newAction) {
                        activeTouches.set(touch.identifier, newAction);
                        btn.classList.add('pressed');
                        applyTouchAction(newAction, true);
                    } else {
                        activeTouches.delete(touch.identifier);
                    }
                }
            }
        }

        function applyTouchAction(action, pressed) {
            switch (action) {
                case 'left':
                    input.left = pressed;
                    break;
                case 'right':
                    input.right = pressed;
                    break;
                case 'jump':
                    input.up = pressed;
                    if (pressed) input.jumpPressed = true;
                    break;
                case 'attack':
                    if (pressed) input.attackPressed = true;
                    break;
                case 'dodge':
                    if (pressed) input.dodgePressed = true;
                    break;
                case 'block':
                    input.block = pressed;
                    break;
            }
        }

        const touchArea = document.getElementById('touch-controls');
        touchArea.addEventListener('touchstart', handleTouchStart, { passive: false });
        touchArea.addEventListener('touchend', handleTouchEnd, { passive: false });
        touchArea.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        touchArea.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    function resize() {
        const container = document.getElementById('game-container');
        const touchControls = document.getElementById('touch-controls');
        const showTouch = window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;

        const aspect = Utils.GAME_WIDTH / Utils.GAME_HEIGHT;
        let cw = container.clientWidth;
        let ch = container.clientHeight;

        // On mobile, reserve space for touch controls
        const touchHeight = showTouch ? touchControls.offsetHeight || 140 : 0;
        const availH = ch - touchHeight;

        let w = cw;
        let h = availH;

        if (w / h > aspect) {
            w = h * aspect;
        } else {
            h = w / aspect;
        }

        canvas.width = Utils.GAME_WIDTH;
        canvas.height = Utils.GAME_HEIGHT;
        canvas.style.width = Math.floor(w) + 'px';
        canvas.style.height = Math.floor(h) + 'px';

        // Position canvas at top when touch controls are showing
        if (showTouch) {
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = Math.floor((cw - w) / 2) + 'px';
        } else {
            canvas.style.position = '';
            canvas.style.top = '';
            canvas.style.left = '';
        }

        // Crisp rendering
        if (ctx) ctx.imageSmoothingEnabled = false;
    }

    function getCtx() { return ctx; }
    function getInput() { return input; }
    function getGameTime() { return gameTime; }
    function getIsMobile() { return isMobile; }

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
        init, resize, getCtx, getInput, getGameTime, getIsMobile,
        startLoop, stopLoop, clearPressedInputs
    };
})();
