// ============================================================
// UI - User interface management
// ============================================================
const UI = (() => {
    const screens = {};
    const elements = {};

    function init() {
        // Cache DOM elements
        const screenIds = ['title-screen', 'how-screen', 'hud', 'gameover-screen', 'report-screen', 'transition-screen'];
        for (const id of screenIds) {
            screens[id] = document.getElementById(id);
        }

        elements.healthBar = document.getElementById('health-bar');
        elements.healthText = document.getElementById('health-text');
        elements.staminaBar = document.getElementById('stamina-bar');
        elements.staminaText = document.getElementById('stamina-text');
        elements.scoreText = document.getElementById('score-text');
        elements.levelText = document.getElementById('level-text');
        elements.comboDisplay = document.getElementById('combo-display');
        elements.comboText = document.getElementById('combo-text');
        elements.patternHint = document.getElementById('pattern-hint');
        elements.patternText = document.getElementById('pattern-text');
        elements.waveAnnounce = document.getElementById('wave-announce');
        elements.waveText = document.getElementById('wave-text');
        elements.gameoverScore = document.getElementById('gameover-score');
        elements.gameoverFloor = document.getElementById('gameover-floor');
        elements.reportContent = document.getElementById('report-content');
        elements.transitionText = document.getElementById('transition-text');
        elements.transitionSub = document.getElementById('transition-sub');

        // Button handlers
        document.getElementById('btn-start').addEventListener('click', () => {
            Audio.menuSelect();
            Game.start();
        });
        document.getElementById('btn-how').addEventListener('click', () => {
            Audio.menuSelect();
            showScreen('how-screen');
        });
        document.getElementById('btn-back').addEventListener('click', () => {
            Audio.menuSelect();
            showScreen('title-screen');
        });
        document.getElementById('btn-retry').addEventListener('click', () => {
            Audio.menuSelect();
            Game.start();
        });
        document.getElementById('btn-report').addEventListener('click', () => {
            Audio.menuSelect();
            showReport();
        });
        document.getElementById('btn-report-back').addEventListener('click', () => {
            Audio.menuSelect();
            showScreen('gameover-screen');
        });
        document.getElementById('btn-report-menu').addEventListener('click', () => {
            Audio.menuSelect();
            showScreen('title-screen');
        });
    }

    function showScreen(id) {
        for (const screen of Object.values(screens)) {
            screen.classList.remove('active');
        }
        if (screens[id]) {
            screens[id].classList.add('active');
        }
    }

    function showHUD() {
        showScreen('hud');
    }

    function updateHUD(playerState, levelState) {
        // Health
        const hpPct = (playerState.hp / playerState.maxHp) * 100;
        elements.healthBar.style.width = hpPct + '%';
        if (hpPct <= 25) {
            elements.healthBar.style.background = 'linear-gradient(to right, #880000, #cc0000)';
        } else {
            elements.healthBar.style.background = 'linear-gradient(to right, #cc0000, #ff2222)';
        }
        elements.healthText.textContent = `${playerState.hp}/${playerState.maxHp}`;

        // Stamina
        const stPct = (playerState.stamina / playerState.maxStamina) * 100;
        elements.staminaBar.style.width = stPct + '%';
        elements.staminaText.textContent = `${Math.round(playerState.stamina)}`;

        // Score
        elements.scoreText.textContent = `Score: ${playerState.score}`;

        // Level
        elements.levelText.textContent = `Floor ${levelState.floor}`;

        // Combo
        if (playerState.comboCount > 1) {
            elements.comboDisplay.classList.remove('hidden');
            elements.comboText.textContent = `x${playerState.comboCount}`;
        } else {
            elements.comboDisplay.classList.add('hidden');
        }
    }

    function showWaveAnnounce(text) {
        elements.waveAnnounce.classList.remove('hidden');
        elements.waveText.textContent = text;
        // Reset animation
        elements.waveAnnounce.style.animation = 'none';
        elements.waveAnnounce.offsetHeight; // force reflow
        elements.waveAnnounce.style.animation = '';
        setTimeout(() => {
            elements.waveAnnounce.classList.add('hidden');
        }, 2000);
    }

    function showGameOver(playerState, levelState) {
        showScreen('gameover-screen');
        elements.gameoverScore.textContent = `Final Score: ${playerState.score}`;
        elements.gameoverFloor.textContent = `Reached Floor ${levelState.floor}`;
    }

    function showTransition(floor) {
        showScreen('transition-screen');
        elements.transitionText.textContent = `FLOOR ${floor} CLEARED`;
        elements.transitionSub.textContent = `Descending to Floor ${floor + 1}...`;
        // Reset animation
        const el = screens['transition-screen'];
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = '';
    }

    function showReport() {
        showScreen('report-screen');
        const report = Cognitive.getReport();
        renderReport(report);
    }

    function renderReport(report) {
        const container = elements.reportContent;
        container.innerHTML = '';

        // Overall summary
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'report-summary';
        summaryDiv.innerHTML = `
            <h3>Overall: ${report.overall.score}/100 (${report.overall.grade.replace('-', ' ')})</h3>
            <p>${report.overall.summary}</p>
        `;
        container.appendChild(summaryDiv);

        // Individual categories
        const categories = [
            'reactionTime', 'patternRecognition', 'workingMemory',
            'multitasking', 'decisionMaking', 'sustainedAttention',
            'inhibitoryControl', 'motorTiming', 'discrimination', 'sequenceMemory'
        ];

        for (const key of categories) {
            const cat = report[key];
            const div = document.createElement('div');
            div.className = 'report-category';

            const barColor = getBarColor(cat.score);

            div.innerHTML = `
                <h3>
                    ${cat.title}
                    <span class="report-score ${cat.grade}">${cat.score}/100</span>
                </h3>
                <div class="report-bar-container">
                    <div class="report-bar" style="width: 0%; background: ${barColor};"></div>
                </div>
                <div class="report-detail">${cat.description}</div>
                <div class="report-detail">${formatDetails(cat.details)}</div>
            `;

            container.appendChild(div);

            // Animate bar
            setTimeout(() => {
                const bar = div.querySelector('.report-bar');
                bar.style.width = cat.score + '%';
            }, 100);
        }

        // Game stats
        const statsDiv = document.createElement('div');
        statsDiv.className = 'report-category';
        statsDiv.innerHTML = `
            <h3>Game Statistics</h3>
            <div class="report-detail">
                ${formatDetails(report.overall.details)}
            </div>
        `;
        container.appendChild(statsDiv);
    }

    function getBarColor(score) {
        if (score >= 85) return 'linear-gradient(to right, #00cc66, #00ff88)';
        if (score >= 70) return 'linear-gradient(to right, #66cc00, #88ff00)';
        if (score >= 50) return 'linear-gradient(to right, #ccaa00, #ffcc00)';
        if (score >= 35) return 'linear-gradient(to right, #cc6600, #ff8800)';
        return 'linear-gradient(to right, #cc2200, #ff4444)';
    }

    function formatDetails(details) {
        return Object.entries(details)
            .map(([key, val]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                return `<strong>${label}:</strong> ${val}`;
            })
            .join(' &bull; ');
    }

    return {
        init, showScreen, showHUD, updateHUD,
        showWaveAnnounce, showGameOver, showTransition, showReport
    };
})();
