// ============================================================
// SPRITES - Procedural pixel art sprite system
// ============================================================
const Sprites = (() => {
    const cache = {};

    // Draw pixel art from a grid definition
    // Each row is a string where each char maps to a color
    function createSprite(grid, palette, scale = 1) {
        const key = JSON.stringify({ grid, palette, scale });
        if (cache[key]) return cache[key];

        const h = grid.length;
        const w = grid[0].length;
        const canvas = document.createElement('canvas');
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext('2d');

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const ch = grid[y][x];
                if (ch === '.' || ch === ' ') continue;
                ctx.fillStyle = palette[ch] || '#ff00ff';
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
        cache[key] = canvas;
        return canvas;
    }

    // Mirror a sprite horizontally
    function mirror(sprite) {
        const canvas = document.createElement('canvas');
        canvas.width = sprite.width;
        canvas.height = sprite.height;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, 0, 0);
        return canvas;
    }

    // ---- PLAYER SPRITES ----
    const playerPalette = {
        'H': '#ffcc88', // skin
        'h': '#dd9966', // skin shadow
        'E': '#44aaff', // eyes
        'A': '#444466', // armor
        'a': '#333355', // armor shadow
        'C': '#cc3333', // cape
        'c': '#992222', // cape shadow
        'B': '#665544', // boots
        'b': '#554433', // boots shadow
        'S': '#ccccdd', // sword
        's': '#9999aa', // sword shadow
        'W': '#ffffff', // white highlight
        'P': '#886644', // pants
        'p': '#775533', // pants shadow
    };

    const playerFrames = {
        idle: [
            [
                '....HHH...',
                '...HhHHH..',
                '...EHHEH..',
                '...hHHHh..',
                '....AaA...',
                '..CaAAAaC.',
                '..CcAAAcC.',
                '..C.AAA.C.',
                '....PAP...',
                '....PpP...',
                '....P.P...',
                '...Bb.bB..',
            ],
            [
                '....HHH...',
                '...HhHHH..',
                '...EHHEH..',
                '...hHHHh..',
                '....AaA...',
                '..CaAAAaC.',
                '..CcAAAcC.',
                '..C.AAA.C.',
                '....PAP...',
                '....PpP...',
                '....P.P...',
                '...BB.BB..',
            ]
        ],
        run: [
            [
                '....HHH...',
                '...HhHHH..',
                '...EHHEH..',
                '...hHHHh..',
                '....AaA...',
                '..CaAAAa..',
                '..CcAAAc..',
                '..CC.AAA...',
                '...P..P...',
                '..Bb...B..',
                '.B......b.',
            ],
            [
                '....HHH...',
                '...HhHHH..',
                '...EHHEH..',
                '...hHHHh..',
                '....AaA...',
                '..CaAAAa..',
                '..CcAAAc..',
                '..CC.AAA...',
                '....PP....',
                '...BbbB...',
                '...B..B...',
            ],
            [
                '....HHH...',
                '...HhHHH..',
                '...EHHEH..',
                '...hHHHh..',
                '....AaA...',
                '..CaAAAa..',
                '..CcAAAc..',
                '..CC.AAA...',
                '...P..P...',
                '..B...bB..',
                '.b......B.',
            ],
            [
                '....HHH...',
                '...HhHHH..',
                '...EHHEH..',
                '...hHHHh..',
                '....AaA...',
                '..CaAAAa..',
                '..CcAAAc..',
                '..CC.AAA...',
                '....PP....',
                '...BbbB...',
                '...B..B...',
            ],
        ],
        attack: [
            [
                '....HHH...........',
                '...HhHHH..........',
                '...EHHEH..........',
                '...hHHHh..........',
                '....AaA...........',
                '..CaAAAaSSSSSSS...',
                '..CcAAAcsssssss...',
                '..C.AAA...........',
                '....PAP...........',
                '....PpP...........',
                '....P.P...........',
                '...Bb.bB..........',
            ],
            [
                '....HHH...........',
                '...HhHHH..........',
                '...EHHEH..........',
                '...hHHHh...SWWWS..',
                '....AaA...Ssssss..',
                '..CaAAAaSSS.......',
                '..CcAAAc..........',
                '..C.AAA...........',
                '....PAP...........',
                '....PpP...........',
                '....P.P...........',
                '...Bb.bB..........',
            ],
        ],
        dodge: [
            [
                '...........',
                '...........',
                '...........',
                '...........',
                '...........',
                '...HHHAaA..',
                '..HhHAAAc..',
                '..EHEAAAcC.',
                '..hHhPAPCC.',
                '...PPpP....',
                '..BBbbBB...',
            ]
        ],
        block: [
            [
                '....HHH...',
                '...HhHHH..',
                '...EHHEH..',
                '...hHHHh..',
                '....AaAS..',
                '..CaAAASSS',
                '..CcAAAsss',
                '..C.AAAS..',
                '....PAP...',
                '....PpP...',
                '....P.P...',
                '...Bb.bB..',
            ]
        ],
        hurt: [
            [
                '....HHH...',
                '...HhHHH..',
                '...hHHhh..',
                '...hHHHh..',
                '....AaA...',
                '.CaAAAaC..',
                '.CcAAAcC..',
                '.CC.AAA...',
                '....PAP...',
                '....PpP...',
                '...P...P..',
                '..Bb...bB.',
            ]
        ]
    };

    // ---- ENEMY SPRITES ----
    // Skeleton
    const skelPalette = {
        'B': '#e0ddd0', // bone
        'b': '#c0bdb0', // bone shadow
        'E': '#ff2200', // eyes
        'D': '#444444', // dark
        'd': '#333333',
        'S': '#888899', // sword
        's': '#666677',
        'H': '#aaaaaa', // helmet
        'h': '#888888',
    };

    const skelFrames = {
        idle: [[
            '...HHH...',
            '..HhBhH..',
            '..EBBEB..',
            '..bBBBb..',
            '...bBb...',
            '..bBBBb..',
            '...BBB...',
            '...BBB...',
            '...B.B...',
            '..Bb.bB..',
        ]],
        attack: [
            [
                '...HHH...........',
                '..HhBhH..........',
                '..EBBEB..........',
                '..bBBBb..........',
                '...bBb............',
                '..bBBBbSSSSSS....',
                '...BBB.ssssss....',
                '...BBB...........',
                '...B.B...........',
                '..Bb.bB..........',
            ],
            [
                '...HHH......',
                '..HhBhH.....',
                '..EBBEB.....',
                '..bBBBb.SSS.',
                '...bBb.Ssss.',
                '..bBBBbS....',
                '...BBB......',
                '...BBB......',
                '...B.B......',
                '..Bb.bB.....',
            ]
        ],
        hurt: [[
            '...HHH...',
            '..HhBhH..',
            '..EBBEB..',
            '..bBBBb..',
            '...bBb...',
            '.bBBBb...',
            '..BBB....',
            '..BBB....',
            '..B..B...',
            '.Bb...bB.',
        ]],
        telegraph: [[
            '...HHH........',
            '..HhBhH.......',
            '..EBBEB.......',
            '..bBBBb.......',
            '...bBbSSSSSSS.',
            '..bBBBbsssssss',
            '...BBB........',
            '...BBB........',
            '...B.B........',
            '..Bb.bB.......',
        ]]
    };

    // Goblin
    const gobPalette = {
        'G': '#44aa44', // green skin
        'g': '#338833', // green shadow
        'E': '#ffff00', // eyes
        'M': '#553311', // mouth
        'C': '#884400', // cloth
        'c': '#663300',
        'D': '#663333', // dagger
        'd': '#552222',
        'N': '#226622', // nose
    };

    const gobFrames = {
        idle: [[
            '..GGG..',
            '.GgGGG.',
            '.EGGEG.',
            '.gNGNg.',
            '..gMg..',
            '.cCCCc.',
            '..CCC..',
            '..CCC..',
            '..G.G..',
            '.Gg.gG.',
        ]],
        attack: [
            [
                '..GGG........',
                '.GgGGG.......',
                '.EGGEG.......',
                '.gNGNg.......',
                '..gMg........',
                '.cCCCcDDDDD..',
                '..CCC.ddddd..',
                '..CCC........',
                '..G.G........',
                '.Gg.gG.......',
            ],
            [
                '..GGG......',
                '.GgGGG.....',
                '.EGGEG.....',
                '.gNGNg.DDD.',
                '..gMg.Dddd.',
                '.cCCCcD....',
                '..CCC......',
                '..CCC......',
                '..G.G......',
                '.Gg.gG.....',
            ]
        ],
        hurt: [[
            '..GGG..',
            '.GgGGG.',
            '.gGGgg.',
            '.gNGNg.',
            '..gMg..',
            'cCCCc..',
            '.CCC...',
            '.CCC...',
            '.G..G..',
            'Gg...G.',
        ]],
        telegraph: [[
            '..GGG.......',
            '.GgGGG......',
            '.EGGEG......',
            '.gNGNg......',
            '..gMgDDDDD..',
            '.cCCCcddddd.',
            '..CCC.......',
            '..CCC.......',
            '..G.G.......',
            '.Gg.gG......',
        ]]
    };

    // Orc
    const orcPalette = {
        'O': '#668844', // orc skin
        'o': '#557733', // skin shadow
        'E': '#ff4400', // eyes
        'T': '#cccc99', // tusks
        'A': '#554433', // armor
        'a': '#443322',
        'M': '#776655', // mace
        'm': '#665544',
        'W': '#998877', // weapon head
    };

    const orcFrames = {
        idle: [[
            '..OOOOO..',
            '.OoOOOoO.',
            '.EOOOOE..',
            '.oTOOTo..',
            '..oOOOo..',
            '.aAAAAa..',
            '.aAAAAa..',
            '..AAAA...',
            '..OO.OO..',
            '.Oo...oO.',
        ]],
        attack: [
            [
                '..OOOOO...',
                '.OoOOOoO..',
                '.EOOOOE...',
                '.oTOOTo...',
                '..oOOOo.WW',
                '.aAAAAaMWW',
                '.aAAAAamww',
                '..AAAA.M..',
                '..OO.OO...',
                '.Oo...oO..',
            ],
            [
                '.....WW...',
                '..OOOOWww.',
                '.OoOOMoO..',
                '.EOOmOE...',
                '.oTOOTo...',
                '..oOOOo...',
                '.aAAAAa...',
                '.aAAAAa...',
                '..AAAA....',
                '..OO.OO...',
                '.Oo...oO..',
            ]
        ],
        hurt: [[
            '..OOOOO..',
            '.OoOOOoO.',
            '.oOOOOo..',
            '.oTOOTo..',
            '..oOOOo..',
            'aAAAAa...',
            'aAAAAa...',
            '.AAAA....',
            '.OO..OO..',
            'Oo....oO.',
        ]],
        telegraph: [[
            '......WW.',
            '..OOOOWww',
            '.OoOOMoO.',
            '.EOOmOE..',
            '.oTOOTo..',
            '..oOOOo..',
            '.aAAAAa..',
            '.aAAAAa..',
            '..AAAA...',
            '..OO.OO..',
            '.Oo...oO.',
        ]]
    };

    // Dark Mage
    const magePalette = {
        'R': '#6633aa', // robe
        'r': '#552288', // robe shadow
        'F': '#ffcc88', // face
        'f': '#dd9966',
        'E': '#aa00ff', // eyes
        'H': '#443366', // hood
        'h': '#332255',
        'O': '#ff44ff', // orb
        'o': '#cc22cc',
        'S': '#aaaacc', // staff
    };

    const mageFrames = {
        idle: [[
            '..HHH...',
            '.HhFhH..',
            '.HEFFH..',
            '..fFf...',
            '..RRR.S.',
            '.rRRRrS.',
            '.rRRRrS.',
            '.RRRRRS.',
            '.RRRRRSO',
            '.RR.RRso',
            '.Rr.rR..',
        ]],
        attack: [[
            '..HHH........',
            '.HhFhH.......',
            '.HEFFH.......',
            '..fFf........',
            '..RRR.S......',
            '.rRRRrS......',
            '.rRRRrS......',
            '.RRRRRS......',
            '.RRRRRSOOO...',
            '.RR.RRsooo...',
            '.Rr.rR.......',
        ]],
        hurt: [[
            '..HHH...',
            '.HhFhH..',
            '.HfFFH..',
            '..fFf...',
            '.RRR..S.',
            'rRRRr.S.',
            'rRRRr.S.',
            'RRRRR.S.',
            'RRRRRSO.',
            'RR.RRso.',
            'Rr.rR...',
        ]],
        telegraph: [[
            '..HHH........',
            '.HhFhH.......',
            '.HEFFH.......',
            '..fFf........',
            '..RRR.S......',
            '.rRRRrS......',
            '.rRRRrS......',
            '.RRRRRS......',
            '.RRRRRSOoOoO.',
            '.RR.RRsoOoOo.',
            '.Rr.rR.......',
        ]]
    };

    // Shadow Assassin
    const assassinPalette = {
        'D': '#222233', // dark cloth
        'd': '#111122',
        'E': '#ff0044', // eyes
        'F': '#443355', // face wrap
        'B': '#333344', // blade
        'b': '#222233',
        'G': '#444455', // gloves
    };

    const assassinFrames = {
        idle: [[
            '..DDD..',
            '.DdFdD.',
            '.DFFED.',
            '..dFd..',
            '..DDD..',
            '.dDDDd.',
            '..DDD..',
            '..DDD..',
            '..D.D..',
            '.Dd.dD.',
        ]],
        attack: [
            [
                '..DDD........',
                '.DdFdD.......',
                '.DFFED.......',
                '..dFd........',
                '..DDDGBBBBBB.',
                '.dDDDdgbbbbbb',
                '..DDD........',
                '..DDD........',
                '..D.D........',
                '.Dd.dD.......',
            ],
            [
                '..DDD..........',
                '.DdFdD.........',
                '.DFFED.........',
                '..dFd.GBBBBBB..',
                '..DDD.gbbbbbb..',
                '.dDDDd.........',
                '..DDD..........',
                '..DDD..........',
                '..D.D..........',
                '.Dd.dD.........',
            ]
        ],
        hurt: [[
            '..DDD..',
            '.DdFdD.',
            '.DFFdD.',
            '..dFd..',
            '..DDD..',
            'dDDDd..',
            '.DDD...',
            '.DDD...',
            '.D..D..',
            'Dd...D.',
        ]],
        telegraph: [[
            '..DDD..........',
            '.DdFdD.........',
            '.DFFED.........',
            '..dFd..........',
            '..DDD.GBBBBBB..',
            '.dDDDdgbbbbbb..',
            '..DDD..........',
            '..DDD..........',
            '..D.D..........',
            '.Dd.dD.........',
        ]]
    };

    // Golem (Boss)
    const golemPalette = {
        'R': '#887766', // rock
        'r': '#776655', // rock shadow
        'G': '#55cc55', // glow
        'g': '#339933',
        'E': '#00ff66', // eyes
        'D': '#665544', // dark rock
        'd': '#554433',
        'C': '#998877', // cracks
    };

    const golemFrames = {
        idle: [[
            '...RRRR...',
            '..RrRRrR..',
            '..ERRCRE..',
            '..rRRRRr..',
            '..RRRRRR..',
            '.DRRRRRD..',
            'DdRRRRdD..',
            '.DRRRRRD..',
            '..RRRRRR..',
            '..RR.RR...',
            '.RRr.rRR..',
            '.RR...RR..',
        ]],
        attack: [
            [
                '...RRRR....',
                '..RrRRrR...',
                '..ERRCRE...',
                '..rRRRRr...',
                '..RRRRRR...',
                '.DRRRRRDDDD',
                'DdRRRRddddd',
                '.DRRRRRD...',
                '..RRRRRR...',
                '..RR.RR....',
                '.RRr.rRR...',
                '.RR...RR...',
            ],
            [
                '...RRRR....',
                '..RrRRrR...',
                '..ERRCRE...',
                '..rRRRRr...',
                '..RRRRRRDDD',
                '.DRRRRRDddd',
                'DdRRRRdD...',
                '.DRRRRRD...',
                '..RRRRRR...',
                '..RR.RR....',
                '.RRr.rRR...',
                '.RR...RR...',
            ]
        ],
        stomp: [[
            '...RRRR...',
            '..RrRRrR..',
            '..ERRCRE..',
            '..rRRRRr..',
            '..RRRRRR..',
            '.DRRRRRD..',
            'DdRRRRdD..',
            '.DRRRRRD..',
            '..RRRRRR..',
            '..RRRRRR..',
            '..RRRRRR..',
            'GGGGGGGGG.',
        ]],
        hurt: [[
            '...RRRR...',
            '..RrRRrR..',
            '..gRRCRg..',
            '..rRRRRr..',
            '..RRRRRR..',
            'DRRRRRD...',
            'dRRRRdD...',
            'DRRRRRD...',
            '.RRRRRR...',
            '.RR..RR...',
            'RRr...rRR.',
            'RR.....RR.',
        ]],
        telegraph: [[
            '...RRRR...',
            '..RrRRrR..',
            '..GRRCEG..',
            '..rRRRRr..',
            '..RRRRRR..',
            '.DRRRRRD..',
            'DdRRRRdD..',
            '.DRRRRRD..',
            '..RRRRRR..',
            '..RR.RR...',
            '.RRr.rRR..',
            '.RR...RR..',
        ]]
    };

    // Projectile
    const projPalette = {
        'O': '#ff44ff',
        'o': '#cc22cc',
        'C': '#ffaaff',
    };
    const projFrames = {
        idle: [[
            '.oOo.',
            'oOCOo',
            'OCCCo',
            'oOCOo',
            '.oOo.',
        ]]
    };

    // Precompiled sprite caches per entity type
    const compiledSprites = {};

    function compileEntitySprites(name, frames, palette, scale = 3) {
        compiledSprites[name] = {};
        for (const [anim, frameList] of Object.entries(frames)) {
            compiledSprites[name][anim] = frameList.map(grid => {
                const right = createSprite(grid, palette, scale);
                const left = mirror(right);
                return { right, left };
            });
        }
    }

    function init() {
        compileEntitySprites('player', playerFrames, playerPalette, 3);
        compileEntitySprites('skeleton', skelFrames, skelPalette, 3);
        compileEntitySprites('goblin', gobFrames, gobPalette, 3);
        compileEntitySprites('orc', orcFrames, orcPalette, 3);
        compileEntitySprites('mage', mageFrames, magePalette, 3);
        compileEntitySprites('assassin', assassinFrames, assassinPalette, 3);
        compileEntitySprites('golem', golemFrames, golemPalette, 3);
        compileEntitySprites('projectile', projFrames, projPalette, 2);
    }

    function get(entity, anim, frame, facingRight) {
        const sprites = compiledSprites[entity];
        if (!sprites || !sprites[anim]) return null;
        const frames = sprites[anim];
        const idx = frame % frames.length;
        return facingRight ? frames[idx].right : frames[idx].left;
    }

    return { init, get, createSprite, mirror };
})();
