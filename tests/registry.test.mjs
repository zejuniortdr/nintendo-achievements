import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const gamesDir = path.dirname(fileURLToPath(import.meta.url)).replace(/tests$/, "games");
const registryPath = path.join(gamesDir, "games.json");
const REQUIRED_FIELDS = ["id", "title", "platform", "group", "path", "active"];

const games = JSON.parse(readFileSync(registryPath, "utf8"));

test("games.json parses as an array", () => {
  assert.ok(Array.isArray(games));
  assert.ok(games.length > 0);
});

test("every entry has the required fields", () => {
  for (const game of games) {
    for (const field of REQUIRED_FIELDS) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(game, field),
        `${game.id || JSON.stringify(game)} is missing field "${field}"`
      );
    }
  }
});

test("ids are unique", () => {
  const ids = games.map(g => g.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate id in games.json");
});

test("every path points to an existing game.md", () => {
  for (const game of games) {
    const fullPath = path.join(gamesDir, game.path);
    assert.ok(existsSync(fullPath), `${game.id}: ${game.path} does not exist`);
  }
});
