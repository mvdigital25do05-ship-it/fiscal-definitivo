const fs = require('fs');
let code = fs.readFileSync('src/views/StudyView.tsx', 'utf8');

// 1. Extract loadMeta
const oldEffect = `  // Load available volumes, cadernos and topics metadata
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const meta = await api.getFiltersMeta(userId);
        if (meta) {
          if (meta.volumes) setAvailableVolumes(meta.volumes);
          if (meta.cadernosByVolume) setCadernosByVolume(meta.cadernosByVolume);
          if (meta.cadernoCounts) setCadernoCounts(meta.cadernoCounts);
          if (meta.cadernoDoneCounts) setCadernoDoneCounts(meta.cadernoDoneCounts);
          if (meta.topicCounts) setTopicCounts(meta.topicCounts);
          if (meta.topicDoneCounts) setTopicDoneCounts(meta.topicDoneCounts);
          if (meta.topicsByVolumeCaderno) {
            setTopicsByVolumeCaderno(meta.topicsByVolumeCaderno);
          }
          if (meta.topicsByVolume) {
            setTopicsByVolume(meta.topicsByVolume);
            const allTopsSet = new Set<string>();
            Object.values(meta.topicsByVolume).forEach((topList: any) => {
              topList.forEach((t: string) => allTopsSet.add(t));
            });
            setAllTopics(Array.from(allTopsSet));
          }
        }
      } catch (err) {
        console.error('Error loading filters metadata:', err);
      }
    };
    loadMeta();
  }, []);`;

const newEffect = `  const loadMeta = async () => {
    try {
      const meta = await api.getFiltersMeta(userId);
      if (meta) {
        if (meta.volumes) setAvailableVolumes(meta.volumes);
        if (meta.cadernosByVolume) setCadernosByVolume(meta.cadernosByVolume);
        if (meta.cadernoCounts) setCadernoCounts(meta.cadernoCounts);
        if (meta.cadernoDoneCounts) setCadernoDoneCounts(meta.cadernoDoneCounts);
        if (meta.topicCounts) setTopicCounts(meta.topicCounts);
        if (meta.topicDoneCounts) setTopicDoneCounts(meta.topicDoneCounts);
        if (meta.topicsByVolumeCaderno) {
          setTopicsByVolumeCaderno(meta.topicsByVolumeCaderno);
        }
        if (meta.topicsByVolume) {
          setTopicsByVolume(meta.topicsByVolume);
          const allTopsSet = new Set<string>();
          Object.values(meta.topicsByVolume).forEach((topList: any) => {
            topList.forEach((t: string) => allTopsSet.add(t));
          });
          setAllTopics(Array.from(allTopsSet));
        }
      }
    } catch (err) {
      console.error('Error loading filters metadata:', err);
    }
  };

  // Load available volumes, cadernos and topics metadata
  useEffect(() => {
    loadMeta();
  }, [userId]);`;

code = code.replace(oldEffect, newEffect);

const oldReset = `      await api.resetUserStats(userId, selectedVolume, selectedCaderno);
      setGlobalStats({`;

const newReset = `      await api.resetUserStats(userId, selectedVolume, selectedCaderno);
      await loadMeta();
      setGlobalStats({`;

code = code.replace(oldReset, newReset);

fs.writeFileSync('src/views/StudyView.tsx', code);
