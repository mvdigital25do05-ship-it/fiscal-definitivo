const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const filterRouteMatch = `  app.get('/api/questions/filters', (req, res) => {
    const activeQuestions = Array.from(questionsMap.values()).filter((q) => q.status !== 'desativada');`;

const filterRouteReplacement = `  app.get('/api/questions/filters', (req, res) => {
    const uid = req.query.userId as string;
    const activeQuestions = Array.from(questionsMap.values()).filter((q) => q.status !== 'desativada');

    const userAttempts = uid ? (attemptsMap.get(uid) || []).filter(a => !a.hiddenFromStats) : [];
    const doneQuestions = new Set(userAttempts.map(a => a.questionId));

    const volumeDoneCounts: Record<string, number> = {};
    const cadernoDoneCounts: Record<string, Record<string, number>> = {};
    const topicDoneCounts: Record<string, Record<string, Record<string, number>>> = {};`;

code = code.replace(filterRouteMatch, filterRouteReplacement);

const countUpdateMatch = `      if (sub) {`;
const countUpdateReplacement = `      const isDone = doneQuestions.has(q.id);
      if (isDone) {
        volumeDoneCounts[vol] = (volumeDoneCounts[vol] || 0) + 1;
        if (!cadernoDoneCounts[vol]) cadernoDoneCounts[vol] = {};
        cadernoDoneCounts[vol][cad] = (cadernoDoneCounts[vol][cad] || 0) + 1;
        if (!topicDoneCounts[vol]) topicDoneCounts[vol] = {};
        if (!topicDoneCounts[vol][cad]) topicDoneCounts[vol][cad] = {};
        topicDoneCounts[vol][cad][top] = (topicDoneCounts[vol][cad][top] || 0) + 1;
      }

      if (sub) {`;

code = code.replace(countUpdateMatch, countUpdateReplacement);

const mappingMatch = `        const topics = topicList.map((top) => ({
          name: top,
          questionCount: topicCounts[vol]?.[cad]?.[top] || 0,
          subtopics: Array.from(subtopicsByTopicMap[top] || []),
        }));

        return {
          name: cad,
          questionCount: cadernoCounts[vol]?.[cad] || 0,
          topics,
        };
      });

      return {
        name: vol,
        questionCount: volumeCounts[vol] || 0,
        cadernos,
      };
    });`;

const mappingReplacement = `        const topics = topicList.map((top) => ({
          name: top,
          questionCount: topicCounts[vol]?.[cad]?.[top] || 0,
          doneCount: topicDoneCounts[vol]?.[cad]?.[top] || 0,
          subtopics: Array.from(subtopicsByTopicMap[top] || []),
        }));

        return {
          name: cad,
          questionCount: cadernoCounts[vol]?.[cad] || 0,
          doneCount: cadernoDoneCounts[vol]?.[cad] || 0,
          topics,
        };
      });

      return {
        name: vol,
        questionCount: volumeCounts[vol] || 0,
        doneCount: volumeDoneCounts[vol] || 0,
        cadernos,
      };
    });`;

code = code.replace(mappingMatch, mappingReplacement);

fs.writeFileSync('server.ts', code);
