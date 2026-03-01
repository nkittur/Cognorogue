// ============================================================
// PATTERNS - Enemy attack pattern definitions
// ============================================================
const Patterns = (() => {
    // Pattern phases: telegraph -> attack -> recovery
    // Telegraph: visual cue that an attack is coming
    // Attack: damage window
    // Recovery: vulnerable window after attack

    const definitions = {
        // ---- SKELETON PATTERNS ----
        skeleton_slash: {
            id: 'skeleton_slash',
            name: 'Slash',
            phases: [
                { type: 'telegraph', duration: 600, anim: 'telegraph' },
                { type: 'attack', duration: 200, anim: 'attack', frame: 0, damage: 10, range: 55 },
                { type: 'recovery', duration: 400, anim: 'idle' }
            ],
            difficulty: 1
        },
        skeleton_double: {
            id: 'skeleton_double',
            name: 'Double Slash',
            phases: [
                { type: 'telegraph', duration: 500, anim: 'telegraph' },
                { type: 'attack', duration: 150, anim: 'attack', frame: 0, damage: 8, range: 55 },
                { type: 'pause', duration: 250, anim: 'idle' },
                { type: 'attack', duration: 150, anim: 'attack', frame: 1, damage: 12, range: 60 },
                { type: 'recovery', duration: 500, anim: 'idle' }
            ],
            difficulty: 2
        },
        skeleton_feint: {
            id: 'skeleton_feint',
            name: 'Feint Slash',
            phases: [
                { type: 'telegraph', duration: 400, anim: 'telegraph' },
                { type: 'feint', duration: 300, anim: 'idle' }, // fake-out
                { type: 'telegraph', duration: 300, anim: 'telegraph' },
                { type: 'attack', duration: 200, anim: 'attack', frame: 0, damage: 15, range: 55 },
                { type: 'recovery', duration: 500, anim: 'idle' }
            ],
            difficulty: 3
        },

        // ---- GOBLIN PATTERNS ----
        goblin_stab: {
            id: 'goblin_stab',
            name: 'Quick Stab',
            phases: [
                { type: 'telegraph', duration: 350, anim: 'telegraph' },
                { type: 'attack', duration: 120, anim: 'attack', frame: 0, damage: 8, range: 45 },
                { type: 'recovery', duration: 300, anim: 'idle' }
            ],
            difficulty: 1
        },
        goblin_flurry: {
            id: 'goblin_flurry',
            name: 'Dagger Flurry',
            phases: [
                { type: 'telegraph', duration: 400, anim: 'telegraph' },
                { type: 'attack', duration: 100, anim: 'attack', frame: 0, damage: 5, range: 45 },
                { type: 'pause', duration: 120, anim: 'idle' },
                { type: 'attack', duration: 100, anim: 'attack', frame: 1, damage: 5, range: 45 },
                { type: 'pause', duration: 120, anim: 'idle' },
                { type: 'attack', duration: 100, anim: 'attack', frame: 0, damage: 7, range: 50 },
                { type: 'recovery', duration: 500, anim: 'idle' }
            ],
            difficulty: 3
        },
        goblin_leap: {
            id: 'goblin_leap',
            name: 'Leap Attack',
            phases: [
                { type: 'telegraph', duration: 500, anim: 'telegraph' },
                { type: 'movement', duration: 300, anim: 'attack', moveX: 80 },
                { type: 'attack', duration: 150, anim: 'attack', frame: 1, damage: 12, range: 50 },
                { type: 'recovery', duration: 600, anim: 'idle' }
            ],
            difficulty: 2
        },

        // ---- ORC PATTERNS ----
        orc_smash: {
            id: 'orc_smash',
            name: 'Overhead Smash',
            phases: [
                { type: 'telegraph', duration: 800, anim: 'telegraph' },
                { type: 'attack', duration: 250, anim: 'attack', frame: 0, damage: 20, range: 65 },
                { type: 'recovery', duration: 700, anim: 'idle' }
            ],
            difficulty: 1
        },
        orc_sweep: {
            id: 'orc_sweep',
            name: 'Mace Sweep',
            phases: [
                { type: 'telegraph', duration: 600, anim: 'telegraph' },
                { type: 'attack', duration: 300, anim: 'attack', frame: 1, damage: 15, range: 70 },
                { type: 'recovery', duration: 500, anim: 'idle' }
            ],
            difficulty: 2
        },
        orc_combo: {
            id: 'orc_combo',
            name: 'Smash Combo',
            phases: [
                { type: 'telegraph', duration: 700, anim: 'telegraph' },
                { type: 'attack', duration: 250, anim: 'attack', frame: 0, damage: 15, range: 65 },
                { type: 'pause', duration: 400, anim: 'idle' },
                { type: 'telegraph', duration: 400, anim: 'telegraph' },
                { type: 'attack', duration: 300, anim: 'attack', frame: 1, damage: 20, range: 70 },
                { type: 'recovery', duration: 600, anim: 'idle' }
            ],
            difficulty: 3
        },

        // ---- MAGE PATTERNS ----
        mage_bolt: {
            id: 'mage_bolt',
            name: 'Magic Bolt',
            phases: [
                { type: 'telegraph', duration: 600, anim: 'telegraph' },
                { type: 'projectile', duration: 200, anim: 'attack', damage: 12, speed: 5, range: 300 },
                { type: 'recovery', duration: 500, anim: 'idle' }
            ],
            difficulty: 2
        },
        mage_barrage: {
            id: 'mage_barrage',
            name: 'Arcane Barrage',
            phases: [
                { type: 'telegraph', duration: 700, anim: 'telegraph' },
                { type: 'projectile', duration: 150, anim: 'attack', damage: 8, speed: 4, range: 300 },
                { type: 'pause', duration: 300, anim: 'idle' },
                { type: 'projectile', duration: 150, anim: 'attack', damage: 8, speed: 5, range: 300 },
                { type: 'pause', duration: 300, anim: 'idle' },
                { type: 'projectile', duration: 150, anim: 'attack', damage: 10, speed: 6, range: 300 },
                { type: 'recovery', duration: 600, anim: 'idle' }
            ],
            difficulty: 3
        },
        mage_feint_bolt: {
            id: 'mage_feint_bolt',
            name: 'Feint Bolt',
            phases: [
                { type: 'telegraph', duration: 500, anim: 'telegraph' },
                { type: 'feint', duration: 400, anim: 'idle' },
                { type: 'telegraph', duration: 350, anim: 'telegraph' },
                { type: 'projectile', duration: 150, anim: 'attack', damage: 15, speed: 6, range: 300 },
                { type: 'recovery', duration: 500, anim: 'idle' }
            ],
            difficulty: 4
        },

        // ---- ASSASSIN PATTERNS ----
        assassin_strike: {
            id: 'assassin_strike',
            name: 'Shadow Strike',
            phases: [
                { type: 'telegraph', duration: 300, anim: 'telegraph' },
                { type: 'attack', duration: 100, anim: 'attack', frame: 0, damage: 14, range: 50 },
                { type: 'recovery', duration: 350, anim: 'idle' }
            ],
            difficulty: 2
        },
        assassin_double: {
            id: 'assassin_double',
            name: 'Twin Blades',
            phases: [
                { type: 'telegraph', duration: 350, anim: 'telegraph' },
                { type: 'attack', duration: 100, anim: 'attack', frame: 0, damage: 10, range: 50 },
                { type: 'pause', duration: 150, anim: 'idle' },
                { type: 'attack', duration: 100, anim: 'attack', frame: 1, damage: 12, range: 55 },
                { type: 'recovery', duration: 400, anim: 'idle' }
            ],
            difficulty: 3
        },
        assassin_vanish: {
            id: 'assassin_vanish',
            name: 'Vanish Strike',
            phases: [
                { type: 'telegraph', duration: 400, anim: 'telegraph' },
                { type: 'vanish', duration: 500, anim: 'idle' },
                { type: 'teleport', duration: 100, anim: 'idle', behindPlayer: true },
                { type: 'attack', duration: 120, anim: 'attack', frame: 0, damage: 18, range: 50 },
                { type: 'recovery', duration: 600, anim: 'idle' }
            ],
            difficulty: 4
        },

        // ---- GOLEM PATTERNS (BOSS) ----
        golem_slam: {
            id: 'golem_slam',
            name: 'Ground Slam',
            phases: [
                { type: 'telegraph', duration: 900, anim: 'telegraph' },
                { type: 'attack', duration: 300, anim: 'stomp', frame: 0, damage: 25, range: 80 },
                { type: 'recovery', duration: 800, anim: 'idle' }
            ],
            difficulty: 2
        },
        golem_sweep: {
            id: 'golem_sweep',
            name: 'Boulder Sweep',
            phases: [
                { type: 'telegraph', duration: 700, anim: 'telegraph' },
                { type: 'attack', duration: 350, anim: 'attack', frame: 0, damage: 18, range: 90 },
                { type: 'recovery', duration: 600, anim: 'idle' }
            ],
            difficulty: 2
        },
        golem_combo: {
            id: 'golem_combo',
            name: 'Devastation',
            phases: [
                { type: 'telegraph', duration: 800, anim: 'telegraph' },
                { type: 'attack', duration: 300, anim: 'stomp', frame: 0, damage: 20, range: 80 },
                { type: 'pause', duration: 300, anim: 'idle' },
                { type: 'attack', duration: 300, anim: 'attack', frame: 0, damage: 15, range: 90 },
                { type: 'pause', duration: 400, anim: 'idle' },
                { type: 'telegraph', duration: 500, anim: 'telegraph' },
                { type: 'attack', duration: 250, anim: 'attack', frame: 1, damage: 30, range: 100 },
                { type: 'recovery', duration: 1000, anim: 'idle' }
            ],
            difficulty: 5
        }
    };

    // Enemy pattern sets (which patterns each enemy type can use)
    const enemyPatterns = {
        skeleton: {
            easy: ['skeleton_slash'],
            medium: ['skeleton_slash', 'skeleton_double'],
            hard: ['skeleton_double', 'skeleton_feint']
        },
        goblin: {
            easy: ['goblin_stab'],
            medium: ['goblin_stab', 'goblin_leap'],
            hard: ['goblin_flurry', 'goblin_leap']
        },
        orc: {
            easy: ['orc_smash'],
            medium: ['orc_smash', 'orc_sweep'],
            hard: ['orc_sweep', 'orc_combo']
        },
        mage: {
            easy: ['mage_bolt'],
            medium: ['mage_bolt', 'mage_barrage'],
            hard: ['mage_barrage', 'mage_feint_bolt']
        },
        assassin: {
            easy: ['assassin_strike'],
            medium: ['assassin_strike', 'assassin_double'],
            hard: ['assassin_double', 'assassin_vanish']
        },
        golem: {
            easy: ['golem_slam', 'golem_sweep'],
            medium: ['golem_slam', 'golem_sweep', 'golem_combo'],
            hard: ['golem_sweep', 'golem_combo']
        }
    };

    function getPattern(id) {
        return definitions[id];
    }

    function getEnemyPatterns(type, difficulty) {
        const set = enemyPatterns[type];
        if (!set) return [];
        if (difficulty <= 2) return set.easy;
        if (difficulty <= 4) return set.medium;
        return set.hard;
    }

    function getRandomPattern(type, difficulty) {
        const patterns = getEnemyPatterns(type, difficulty);
        if (patterns.length === 0) return null;
        const id = Utils.randChoice(patterns);
        return definitions[id];
    }

    return { getPattern, getEnemyPatterns, getRandomPattern, definitions };
})();
