import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

// ponytail: progress-core.js is a classic browser script (window globals),
// not an ES module — a tiny in-memory localStorage stub lets it load under
// Node's CommonJS require() unmodified.
// ponytail: values live as own enumerable properties (not a private Map) so
// Object.keys(localStorage), which migrateLegacyProgress relies on, works
// for free — methods stay on the prototype and are excluded from Object.keys.
class FakeLocalStorage {
  getItem(key) { return Object.prototype.hasOwnProperty.call(this, key) ? this[key] : null; }
  setItem(key, value) { this[key] = String(value); }
  removeItem(key) { delete this[key]; }
}

global.localStorage = new FakeLocalStorage();

const require = createRequire(import.meta.url);
const {
  progressKey,
  isTaskDone,
  progressGrade,
  getProgressStats,
  migrateLegacyProgress,
  saveProgress
} = require("../assets/js/progress-core.js");

test("progressKey namespaces by gameId", () => {
  assert.equal(progressKey("zelda-oot"), "game-progress:zelda-oot");
});

test("isTaskDone: unset task falls back to mdDone", () => {
  assert.equal(isTaskDone({ id: "t1", mdDone: true }, {}), true);
  assert.equal(isTaskDone({ id: "t1", mdDone: false }, {}), false);
});

test("isTaskDone: explicit stored state overrides mdDone", () => {
  assert.equal(isTaskDone({ id: "t1", mdDone: false }, { t1: true }), true);
  assert.equal(isTaskDone({ id: "t1", mdDone: true }, { t1: false }), false);
});

test("isTaskDone: falls back to legacyId when current id has no state", () => {
  const task = { id: "new-id", legacyId: "old-id", mdDone: false };
  assert.equal(isTaskDone(task, { "old-id": true }), true);
});

test("progressGrade: bands match PSNProfiles-style thresholds", () => {
  assert.equal(progressGrade(100), "s");
  assert.equal(progressGrade(99), "a");
  assert.equal(progressGrade(90), "a");
  assert.equal(progressGrade(89), "b");
  assert.equal(progressGrade(70), "c");
  assert.equal(progressGrade(60), "d");
  assert.equal(progressGrade(50), "e");
  assert.equal(progressGrade(0), "f");
});

test("getProgressStats: counts done tasks and rounds percent", () => {
  const gameId = "test-game-" + Math.random();
  const tasks = [
    { id: "a", mdDone: false },
    { id: "b", mdDone: false },
    { id: "c", mdDone: false }
  ];
  saveProgress(gameId, { a: true });

  const stats = getProgressStats(gameId, tasks);
  assert.equal(stats.done, 1);
  assert.equal(stats.total, 3);
  assert.equal(stats.percent, 33);
});

test("getProgressStats: empty task list is 0%, not NaN", () => {
  const stats = getProgressStats("empty-game-" + Math.random(), []);
  assert.equal(stats.percent, 0);
});

test("migrateLegacyProgress: folds `${gameId}-${taskId}` keys into the namespaced object", () => {
  const gameId = "legacy-game-" + Math.random();
  localStorage.setItem(`${gameId}-old-task`, "true");

  migrateLegacyProgress(gameId);

  const stats = getProgressStats(gameId, [{ id: "old-task", mdDone: false }]);
  assert.equal(stats.done, 1);
  assert.equal(localStorage.getItem(`${gameId}-old-task`), null);
});
