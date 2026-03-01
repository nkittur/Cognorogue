// ============================================================
// COGNITIVE - Assessment tracking and reporting system
// ============================================================
const Cognitive = (() => {
    let sessionData = {};

    function reset() {
        sessionData = {
            startTime: Date.now(),
            endTime: null,

            // Reaction time measurements
            reactionTimes: [],           // ms from telegraph to player response
            parryAttempts: [],           // { success, timing (ms from perfect window) }
            dodgeAttempts: [],           // { success, reactionTime }

            // Pattern recognition
            patternEncounters: {},       // patternId -> [{ recognized, time, attempt# }]
            patternFirstSuccess: {},     // patternId -> attempt number of first success
            enemyFirstKillTime: {},      // enemyType -> time to first kill (ms)

            // Multitasking
            simultaneousEnemies: [],     // [{ count, performance (hits taken / enemies) }]
            multiEnemyDamage: [],        // damage taken when >1 enemy active

            // Working memory
            patternRecallAccuracy: [],   // after seeing pattern, accuracy on next encounter
            sequenceLength: 0,          // longest attack sequence correctly responded to

            // Decision making
            decisions: [],               // { situation, choice, outcome, time }
            attackVsDefendRatio: { attacks: 0, blocks: 0, dodges: 0 },

            // Sustained attention
            performanceOverTime: [],     // [{ timestamp, metric }] sampled every 15s
            earlyPerformance: [],        // first 60s metrics
            latePerformance: [],         // last 60s metrics
            hitsOverTime: [],            // timestamps of hits taken

            // Inhibitory control (feint responses)
            feintResponses: [],          // { wasFeint, playerReacted, reactionTime }

            // Friend/foe discrimination
            friendlyEncounters: 0,
            friendliesKilled: 0,
            friendliesSpared: 0,
            enemiesCorrectlyKilled: 0,

            // Memory sequence challenges
            memorySequences: [],         // { length, correct, time }

            // General gameplay
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            enemiesDefeated: 0,
            floorsCleared: 0,
            score: 0,
            combosAchieved: [],
            perfectDodges: 0,
            perfectParries: 0,

            // Frame-by-frame tracking
            _lastSampleTime: 0,
            _recentHits: 0,
            _recentDodges: 0,
            _recentParries: 0,
        };
    }

    // ---- Recording Functions ----

    function recordReaction(telegraphTime, responseTime) {
        const rt = responseTime - telegraphTime;
        if (rt > 0 && rt < 5000) {
            sessionData.reactionTimes.push(rt);
        }
    }

    function recordParry(success, timingOffset) {
        sessionData.parryAttempts.push({ success, timing: timingOffset });
        if (success) sessionData.perfectParries++;
        sessionData.attackVsDefendRatio.blocks++;
    }

    function recordDodge(success, reactionTime) {
        sessionData.dodgeAttempts.push({ success, reactionTime });
        if (success) sessionData.perfectDodges++;
        sessionData.attackVsDefendRatio.dodges++;
    }

    function recordAttack() {
        sessionData.attackVsDefendRatio.attacks++;
    }

    function recordPatternEncounter(patternId, recognized, attemptTime) {
        if (!sessionData.patternEncounters[patternId]) {
            sessionData.patternEncounters[patternId] = [];
        }
        const attempts = sessionData.patternEncounters[patternId];
        attempts.push({
            recognized,
            time: attemptTime,
            attempt: attempts.length + 1
        });
        if (recognized && !sessionData.patternFirstSuccess[patternId]) {
            sessionData.patternFirstSuccess[patternId] = attempts.length;
        }
    }

    function recordMultiEnemySituation(enemyCount, hitsTaken) {
        sessionData.simultaneousEnemies.push({
            count: enemyCount,
            performance: enemyCount > 0 ? hitsTaken / enemyCount : 0
        });
    }

    function recordDecision(situation, choice, outcome, decisionTime) {
        sessionData.decisions.push({ situation, choice, outcome, time: decisionTime });
    }

    function recordFeintResponse(wasFeint, playerReacted, reactionTime) {
        sessionData.feintResponses.push({ wasFeint, playerReacted, reactionTime });
    }

    function recordFriendlyEncounter() { sessionData.friendlyEncounters++; }
    function recordFriendlyKilled() { sessionData.friendliesKilled++; }
    function recordFriendlySpared() { sessionData.friendliesSpared++; }
    function recordEnemyCorrectlyKilled() { sessionData.enemiesCorrectlyKilled++; }
    function recordMemorySequence(length, correct, time) {
        sessionData.memorySequences.push({ length, correct, time });
    }

    function recordDamageDealt(amount) { sessionData.totalDamageDealt += amount; }
    function recordDamageTaken(amount) {
        sessionData.totalDamageTaken += amount;
        sessionData.hitsOverTime.push(Date.now() - sessionData.startTime);
    }
    function recordEnemyDefeated(type) {
        sessionData.enemiesDefeated++;
        if (!sessionData.enemyFirstKillTime[type]) {
            sessionData.enemyFirstKillTime[type] = Date.now() - sessionData.startTime;
        }
    }
    function recordFloorCleared() { sessionData.floorsCleared++; }
    function recordCombo(count) { sessionData.combosAchieved.push(count); }
    function setScore(score) { sessionData.score = score; }

    function recordPatternRecall(patternId, accurate) {
        sessionData.patternRecallAccuracy.push({ patternId, accurate });
    }

    // Sample performance periodically
    function samplePerformance(timestamp) {
        const elapsed = timestamp - sessionData._lastSampleTime;
        if (elapsed < 15000) return;
        sessionData._lastSampleTime = timestamp;

        const sample = {
            timestamp: Date.now() - sessionData.startTime,
            recentHits: sessionData._recentHits,
            recentDodges: sessionData._recentDodges,
            recentParries: sessionData._recentParries,
        };
        sessionData.performanceOverTime.push(sample);

        const gameTime = Date.now() - sessionData.startTime;
        if (gameTime < 60000) {
            sessionData.earlyPerformance.push(sample);
        }
        sessionData.latePerformance.push(sample);
        if (sessionData.latePerformance.length > 4) {
            sessionData.latePerformance.shift();
        }

        sessionData._recentHits = 0;
        sessionData._recentDodges = 0;
        sessionData._recentParries = 0;
    }

    function incrementRecentHit() { sessionData._recentHits++; }
    function incrementRecentDodge() { sessionData._recentDodges++; }
    function incrementRecentParry() { sessionData._recentParries++; }

    // ---- Analysis Functions ----

    function endSession() {
        sessionData.endTime = Date.now();
    }

    function getReport() {
        const report = {};

        // 1. Reaction Time
        const rts = sessionData.reactionTimes;
        const avgRT = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
        const medianRT = rts.length > 0 ? [...rts].sort((a, b) => a - b)[Math.floor(rts.length / 2)] : 0;
        const bestRT = rts.length > 0 ? Math.min(...rts) : 0;

        report.reactionTime = {
            title: 'Reaction Time',
            score: scoreReactionTime(avgRT),
            grade: gradeScore(scoreReactionTime(avgRT)),
            details: {
                average: Math.round(avgRT),
                median: Math.round(medianRT),
                best: Math.round(bestRT),
                samples: rts.length
            },
            description: getReactionTimeDesc(avgRT)
        };

        // 2. Pattern Recognition
        const patterns = sessionData.patternEncounters;
        const patternIds = Object.keys(patterns);
        let totalPatternScore = 0;
        let patternCount = 0;
        for (const id of patternIds) {
            const encounters = patterns[id];
            const successRate = encounters.filter(e => e.recognized).length / encounters.length;
            const firstSuccess = sessionData.patternFirstSuccess[id] || encounters.length + 1;
            const learnSpeed = Math.max(0, 1 - (firstSuccess - 1) / 5);
            totalPatternScore += (successRate * 0.6 + learnSpeed * 0.4);
            patternCount++;
        }
        const patternScore = patternCount > 0 ? totalPatternScore / patternCount : 0.5;

        report.patternRecognition = {
            title: 'Pattern Recognition',
            score: Math.round(patternScore * 100),
            grade: gradeScore(Math.round(patternScore * 100)),
            details: {
                patternsEncountered: patternIds.length,
                avgLearningSpeed: Object.keys(sessionData.patternFirstSuccess).length > 0 ?
                    (Object.values(sessionData.patternFirstSuccess).reduce((a, b) => a + b, 0) /
                    Object.keys(sessionData.patternFirstSuccess).length).toFixed(1) : 'N/A'
            },
            description: getPatternDesc(patternScore)
        };

        // 3. Working Memory
        const recallData = sessionData.patternRecallAccuracy;
        const recallAccuracy = recallData.length > 0 ?
            recallData.filter(r => r.accurate).length / recallData.length : 0.5;
        const memoryScore = Math.round(recallAccuracy * 100);

        report.workingMemory = {
            title: 'Working Memory',
            score: memoryScore,
            grade: gradeScore(memoryScore),
            details: {
                recallAccuracy: Utils.formatPercent(recallAccuracy),
                patternsRemembered: new Set(recallData.filter(r => r.accurate).map(r => r.patternId)).size,
                totalRecalls: recallData.length
            },
            description: getMemoryDesc(recallAccuracy)
        };

        // 4. Multitasking
        const multiData = sessionData.simultaneousEnemies.filter(s => s.count > 1);
        const singleData = sessionData.simultaneousEnemies.filter(s => s.count === 1);
        const multiPerf = multiData.length > 0 ?
            multiData.reduce((a, b) => a + b.performance, 0) / multiData.length : 0;
        const singlePerf = singleData.length > 0 ?
            singleData.reduce((a, b) => a + b.performance, 0) / singleData.length : 0;
        const multitaskDegradation = singlePerf > 0 ? (multiPerf - singlePerf) / singlePerf : 0;
        const multiScore = Math.round(Utils.clamp(1 - multitaskDegradation, 0, 1) * 100);

        report.multitasking = {
            title: 'Multitasking Ability',
            score: Math.min(100, multiData.length > 0 ? multiScore : 50),
            grade: gradeScore(multiData.length > 0 ? multiScore : 50),
            details: {
                maxSimultaneous: multiData.length > 0 ? Math.max(...multiData.map(d => d.count)) : 1,
                performanceDrop: Utils.formatPercent(multitaskDegradation),
                encounters: multiData.length
            },
            description: getMultitaskDesc(multitaskDegradation)
        };

        // 5. Decision Making
        const decisions = sessionData.decisions;
        const goodDecisions = decisions.filter(d => d.outcome === 'good').length;
        const decisionScore = decisions.length > 0 ?
            Math.round((goodDecisions / decisions.length) * 100) : 50;
        const ratio = sessionData.attackVsDefendRatio;
        const totalActions = ratio.attacks + ratio.blocks + ratio.dodges;

        report.decisionMaking = {
            title: 'Decision Making',
            score: decisionScore,
            grade: gradeScore(decisionScore),
            details: {
                goodDecisions: goodDecisions,
                totalDecisions: decisions.length,
                attackRatio: totalActions > 0 ? Utils.formatPercent(ratio.attacks / totalActions) : 'N/A',
                defendRatio: totalActions > 0 ? Utils.formatPercent((ratio.blocks + ratio.dodges) / totalActions) : 'N/A'
            },
            description: getDecisionDesc(decisionScore, ratio)
        };

        // 6. Sustained Attention (Vigilance)
        const perfSamples = sessionData.performanceOverTime;
        let vigilanceScore = 50;
        if (perfSamples.length >= 4) {
            const firstHalf = perfSamples.slice(0, Math.floor(perfSamples.length / 2));
            const secondHalf = perfSamples.slice(Math.floor(perfSamples.length / 2));
            const firstAvg = firstHalf.reduce((a, s) => a + s.recentHits, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, s) => a + s.recentHits, 0) / secondHalf.length;
            // Lower hits in second half = better sustained attention
            const improvement = firstAvg > 0 ? (firstAvg - secondAvg) / firstAvg : 0;
            vigilanceScore = Math.round(Utils.clamp(0.5 + improvement * 0.5, 0, 1) * 100);
        }

        report.sustainedAttention = {
            title: 'Sustained Attention',
            score: vigilanceScore,
            grade: gradeScore(vigilanceScore),
            details: {
                sessionDuration: sessionData.endTime ?
                    Utils.formatTime(sessionData.endTime - sessionData.startTime) : 'N/A',
                performanceSamples: perfSamples.length
            },
            description: getVigilanceDesc(vigilanceScore)
        };

        // 7. Inhibitory Control
        const feints = sessionData.feintResponses;
        const feintTrials = feints.filter(f => f.wasFeint);
        const falseAlarms = feintTrials.filter(f => f.playerReacted).length;
        const feintTotal = feintTrials.length;
        const inhibScore = feintTotal > 0 ?
            Math.round((1 - falseAlarms / feintTotal) * 100) : 50;

        report.inhibitoryControl = {
            title: 'Inhibitory Control',
            score: inhibScore,
            grade: gradeScore(inhibScore),
            details: {
                feintEncounters: feintTotal,
                falseAlarms: falseAlarms,
                correctInhibitions: feintTotal - falseAlarms
            },
            description: getInhibitoryDesc(inhibScore)
        };

        // 8. Motor Timing (Parry precision)
        const parries = sessionData.parryAttempts;
        const successParries = parries.filter(p => p.success);
        const parryRate = parries.length > 0 ? successParries.length / parries.length : 0;
        const avgTiming = successParries.length > 0 ?
            successParries.reduce((a, p) => a + Math.abs(p.timing), 0) / successParries.length : 999;
        const timingScore = Math.round(Utils.clamp(parryRate * 0.6 + (1 - avgTiming / 200) * 0.4, 0, 1) * 100);

        report.motorTiming = {
            title: 'Motor Timing Precision',
            score: timingScore,
            grade: gradeScore(timingScore),
            details: {
                parrySuccessRate: Utils.formatPercent(parryRate),
                avgTimingOffset: Math.round(avgTiming) + 'ms',
                totalAttempts: parries.length,
                perfectParries: sessionData.perfectParries
            },
            description: getTimingDesc(timingScore)
        };

        // 9. Friend/Foe Discrimination
        const totalDisc = sessionData.friendlyEncounters;
        const killed = sessionData.friendliesKilled;
        const spared = sessionData.friendliesSpared;
        const correctKills = sessionData.enemiesCorrectlyKilled;
        let discScore = 50;
        if (totalDisc > 0) {
            const spareRate = spared / totalDisc;
            discScore = Math.round(spareRate * 100);
        }
        report.discrimination = {
            title: 'Friend/Foe Discrimination',
            score: discScore,
            grade: gradeScore(discScore),
            details: {
                friendliesEncountered: totalDisc,
                friendliesSpared: spared,
                friendliesKilled: killed,
                enemiesCorrectlyDefeated: correctKills
            },
            description: getDiscriminationDesc(discScore, totalDisc)
        };

        // 10. Sequence Memory
        const seqs = sessionData.memorySequences;
        const seqCorrect = seqs.filter(s => s.correct).length;
        const seqScore = seqs.length > 0 ? Math.round((seqCorrect / seqs.length) * 100) : 50;
        const longestCorrect = seqs.filter(s => s.correct).reduce((max, s) => Math.max(max, s.length), 0);

        report.sequenceMemory = {
            title: 'Sequence Memory',
            score: seqScore,
            grade: gradeScore(seqScore),
            details: {
                sequencesAttempted: seqs.length,
                sequencesCorrect: seqCorrect,
                longestSequence: longestCorrect || 'N/A'
            },
            description: getSequenceDesc(seqScore)
        };

        // Overall composite
        const allScores = [
            report.reactionTime.score,
            report.patternRecognition.score,
            report.workingMemory.score,
            report.multitasking.score,
            report.decisionMaking.score,
            report.sustainedAttention.score,
            report.inhibitoryControl.score,
            report.motorTiming.score,
            report.discrimination.score,
            report.sequenceMemory.score
        ];
        const overallScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);

        const overallDetails = {
            floorsCleared: sessionData.floorsCleared,
            enemiesDefeated: sessionData.enemiesDefeated,
            finalScore: sessionData.score,
            sessionDuration: sessionData.endTime ?
                Utils.formatTime(sessionData.endTime - sessionData.startTime) : 'N/A'
        };

        report.overall = {
            title: 'Overall Cognitive Performance',
            score: overallScore,
            grade: gradeScore(overallScore),
            details: overallDetails,
            summary: getOverallSummary(report, overallDetails)
        };

        return report;
    }

    // ---- Scoring helpers ----
    function scoreReactionTime(avgMs) {
        if (avgMs <= 0) return 50;
        if (avgMs <= 200) return 95;
        if (avgMs <= 300) return 85;
        if (avgMs <= 400) return 70;
        if (avgMs <= 500) return 55;
        if (avgMs <= 700) return 40;
        return 25;
    }

    function gradeScore(score) {
        if (score >= 85) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 50) return 'average';
        if (score >= 35) return 'below-average';
        return 'poor';
    }

    // ---- Description generators ----
    function getReactionTimeDesc(avgMs) {
        if (avgMs <= 250) return 'Exceptional reaction speed. You respond to threats significantly faster than average.';
        if (avgMs <= 350) return 'Good reaction time. You can effectively respond to most threats in time.';
        if (avgMs <= 500) return 'Average reaction time. With practice, you can improve your response speed.';
        return 'Your reactions could benefit from more practice. Try to anticipate threats using pattern cues.';
    }

    function getPatternDesc(score) {
        if (score >= 0.8) return 'Excellent pattern recognition. You quickly identify and adapt to enemy attack sequences.';
        if (score >= 0.6) return 'Good pattern recognition. You learn most enemy patterns within a few encounters.';
        if (score >= 0.4) return 'Average pattern recognition. Some patterns take longer to identify.';
        return 'Pattern recognition needs work. Try watching enemy telegraphs more carefully before reacting.';
    }

    function getMemoryDesc(accuracy) {
        if (accuracy >= 0.8) return 'Strong working memory. You retain and apply previously learned patterns effectively.';
        if (accuracy >= 0.6) return 'Good memory recall. Most patterns are retained between encounters.';
        if (accuracy >= 0.4) return 'Average memory performance. Some patterns are forgotten between encounters.';
        return 'Working memory could be improved. Try to create mental associations for each enemy pattern.';
    }

    function getMultitaskDesc(degradation) {
        if (degradation <= 0.1) return 'Excellent multitasking. Performance barely drops with multiple simultaneous threats.';
        if (degradation <= 0.3) return 'Good multitasking. Manageable performance decrease under multiple threats.';
        if (degradation <= 0.5) return 'Average multitasking. Notable performance drop with multiple enemies.';
        return 'Multitasking is challenging. Try to prioritize threats and manage them one at a time.';
    }

    function getDecisionDesc(score, ratio) {
        const total = ratio.attacks + ratio.blocks + ratio.dodges;
        const attackPct = total > 0 ? ratio.attacks / total : 0;
        let style = '';
        if (attackPct > 0.7) style = ' Your style is highly aggressive.';
        else if (attackPct < 0.3) style = ' Your style is highly defensive.';
        else style = ' You maintain a balanced combat approach.';

        if (score >= 80) return 'Excellent tactical decision making. You consistently choose optimal responses.' + style;
        if (score >= 60) return 'Good decision making with mostly appropriate combat choices.' + style;
        if (score >= 40) return 'Average decision making. Some situations lead to suboptimal choices.' + style;
        return 'Decision making needs improvement. Try to read enemy telegraphs before committing to action.' + style;
    }

    function getVigilanceDesc(score) {
        if (score >= 75) return 'Strong sustained attention. Performance remains consistent throughout the session.';
        if (score >= 55) return 'Good sustained attention with minor performance fluctuations over time.';
        if (score >= 40) return 'Average sustained attention. Performance degrades somewhat in longer sessions.';
        return 'Attention wanes over time. Consider taking breaks to maintain peak performance.';
    }

    function getInhibitoryDesc(score) {
        if (score >= 80) return 'Excellent impulse control. You rarely react to feint attacks or false cues.';
        if (score >= 60) return 'Good inhibitory control. Occasional false responses to feints.';
        if (score >= 40) return 'Average impulse control. Feint attacks frequently trigger premature reactions.';
        return 'Impulse control needs work. Try to wait for confirmed attack animations before reacting.';
    }

    function getTimingDesc(score) {
        if (score >= 80) return 'Exceptional timing precision. Your parries are consistently well-timed.';
        if (score >= 60) return 'Good motor timing. Most parry attempts fall within the success window.';
        if (score >= 40) return 'Average timing. Parry success is inconsistent - try tightening your timing.';
        return 'Timing precision needs improvement. Practice the parry timing against slower enemies first.';
    }

    function getDiscriminationDesc(score, total) {
        if (total === 0) return 'No friendly NPCs were encountered this session.';
        if (score >= 85) return 'Excellent target discrimination. You consistently spare allies and eliminate threats.';
        if (score >= 65) return 'Good discrimination between friend and foe with occasional mistakes.';
        if (score >= 40) return 'Moderate discrimination. Take time to identify targets before attacking.';
        return 'Poor discrimination. Watch for green/friendly indicators before striking.';
    }

    function getSequenceDesc(score) {
        if (score >= 80) return 'Strong sequential memory. You recall and reproduce patterns accurately.';
        if (score >= 60) return 'Good sequence recall with some errors on longer sequences.';
        if (score >= 40) return 'Average sequence memory. Longer patterns are challenging.';
        return 'Sequence memory needs work. Try chunking patterns into smaller groups.';
    }

    function getOverallSummary(report, details) {
        const strengths = [];
        const weaknesses = [];

        const categories = [
            'reactionTime', 'patternRecognition', 'workingMemory',
            'multitasking', 'decisionMaking', 'sustainedAttention',
            'inhibitoryControl', 'motorTiming', 'discrimination', 'sequenceMemory'
        ];

        for (const cat of categories) {
            if (report[cat] && report[cat].score >= 75) strengths.push(report[cat].title);
            else if (report[cat] && report[cat].score < 45) weaknesses.push(report[cat].title);
        }

        let summary = '';
        if (strengths.length > 0) {
            summary += `Strengths: ${strengths.join(', ')}. `;
        }
        if (weaknesses.length > 0) {
            summary += `Areas for improvement: ${weaknesses.join(', ')}. `;
        }
        if (strengths.length === 0 && weaknesses.length === 0) {
            summary += 'Overall balanced cognitive performance across all measured dimensions. ';
        }
        summary += `You cleared ${details.floorsCleared} floors and defeated ${details.enemiesDefeated} enemies.`;
        return summary;
    }

    return {
        reset,
        endSession,
        getReport,
        recordReaction,
        recordParry,
        recordDodge,
        recordAttack,
        recordPatternEncounter,
        recordMultiEnemySituation,
        recordDecision,
        recordFeintResponse,
        recordFriendlyEncounter,
        recordFriendlyKilled,
        recordFriendlySpared,
        recordEnemyCorrectlyKilled,
        recordMemorySequence,
        recordDamageDealt,
        recordDamageTaken,
        recordEnemyDefeated,
        recordFloorCleared,
        recordCombo,
        setScore,
        recordPatternRecall,
        samplePerformance,
        incrementRecentHit,
        incrementRecentDodge,
        incrementRecentParry,
    };
})();
