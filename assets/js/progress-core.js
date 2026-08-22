function progressKey(gameId) {
  return `game-progress:${gameId}`;
}

function loadProgress(gameId) {
  try {
    return JSON.parse(localStorage.getItem(progressKey(gameId)) || "{}");
  } catch {
    return {};
  }
}

function saveProgress(gameId, progress) {
  localStorage.setItem(progressKey(gameId), JSON.stringify(progress));
}

function migrateLegacyProgress(gameId) {
  const prefix = `${gameId}-`;
  const progress = loadProgress(gameId);
  let changed = false;

  Object.keys(localStorage).forEach(key => {
    if (!key.startsWith(prefix)) return;

    const taskId = key.slice(prefix.length);
    if (localStorage.getItem(key) === "true") {
      progress[taskId] = true;
    }

    localStorage.removeItem(key);
    changed = true;
  });

  if (changed) saveProgress(gameId, progress);
}

function getStoredTaskState(progress, task) {
  if (Object.prototype.hasOwnProperty.call(progress, task.id)) {
    return progress[task.id];
  }

  if (task.legacyId && Object.prototype.hasOwnProperty.call(progress, task.legacyId)) {
    return progress[task.legacyId];
  }

  return undefined;
}

function isTaskDone(task, progress) {
  const stored = getStoredTaskState(progress, task);

  if (stored === true) return true;
  if (stored === false) return false;

  return task.mdDone;
}

// ponytail: grade bands mirror PSNProfiles-style completion tiers (S/A-F)
function progressGrade(percent) {
  if (percent >= 100) return "s";
  if (percent >= 90) return "a";
  if (percent >= 80) return "b";
  if (percent >= 70) return "c";
  if (percent >= 60) return "d";
  if (percent >= 50) return "e";
  return "f";
}

function getProgressStats(gameId, tasks) {
  migrateLegacyProgress(gameId);

  const progress = loadProgress(gameId);
  const total = tasks.length;
  const done = tasks.filter(task => isTaskDone(task, progress)).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return { done, total, percent };
}

// ponytail: CommonJS export guard so `node --test` can import these pure
// functions directly; browsers load this as a classic script and never hit it.
if (typeof module !== "undefined") {
  module.exports = {
    progressKey,
    loadProgress,
    saveProgress,
    migrateLegacyProgress,
    getStoredTaskState,
    isTaskDone,
    progressGrade,
    getProgressStats
  };
}
