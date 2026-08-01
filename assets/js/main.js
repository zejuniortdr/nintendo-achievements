function isGamesSection() {
  return window.location.pathname.includes("/games/");
}

function gamesBasePath() {
  return isGamesSection() ? "" : "games/";
}

async function loadGames() {
  const res = await fetch(gamesBasePath() + "games.json");
  return await res.json();
}

async function loadActiveGames() {
  const games = await loadGames();
  return games.filter(game => game.active === true);
}

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

function getProgressStats(gameId, tasks) {
  migrateLegacyProgress(gameId);

  const progress = loadProgress(gameId);
  const total = tasks.length;
  const done = tasks.filter(task => isTaskDone(task, progress)).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return { done, total, percent };
}

async function renderProfile() {
  const section = document.getElementById("profile-section");
  if (!section) return;

  const games = await loadActiveGames();
  let achievements = 0;

  for (const game of games) {
    const { tasks } = await loadChecklistTasks(gamesBasePath() + game.path);
    achievements += getProgressStats(game.id, tasks).done;
  }

  let profile = {};
  try {
    const res = await fetch("profile.json");
    if (res.ok) profile = await res.json();
  } catch {}

  document.getElementById("profile-gamertag").textContent = profile.gamertag || "Player One";
  document.getElementById("profile-avatar").src = profile.avatar || "assets/img/profile-avatar.svg";
  document.getElementById("stat-games").textContent = games.length;
  document.getElementById("stat-achievements").textContent = achievements;
}

const IMAGE_FALLBACK_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

// ponytail: covers/headers referenced in game.md often drift from the real file
// extension (png saved but .md still says .jpg). Instead of hand-editing every
// game.md when that happens, retry the same path with sibling extensions.
function withImageExtensionFallback(img) {
  img.addEventListener("error", () => {
    const tried = (img.dataset.extTried || "").split(",").filter(Boolean);
    const match = img.src.match(/\.([a-zA-Z0-9]+)$/);
    const currentExt = match ? match[1].toLowerCase() : "";
    if (currentExt) tried.push(currentExt);

    const nextExt = IMAGE_FALLBACK_EXTENSIONS.find(ext => !tried.includes(ext));
    if (!nextExt) return;

    tried.push(nextExt);
    img.dataset.extTried = tried.join(",");
    img.src = img.src.replace(/\.[a-zA-Z0-9]+$/, "." + nextExt);
  });
}

const PLATFORM_SECTIONS = [
  { group: "switch2", label: "Switch 2", coverClass: "cover-portrait" },
  { group: "n64", label: "Nintendo 64", coverClass: "cover-landscape" },
  { group: "snes", label: "Super Nintendo", coverClass: "cover-landscape" }
];

async function renderGameList() {
  const games = await loadActiveGames();
  const container = document.getElementById("game-list");

  if (!container) return;

  const prefix = gamesBasePath();
  const gamePage = prefix + "game.html";

  const cardsByGame = new Map(await Promise.all(games.map(async game => {
    const { meta, tasks } = await loadChecklistTasks(prefix + game.path);
    const { done, total, percent } = getProgressStats(game.id, tasks);
    const basePath = game.path.replace("game.md", "");
    const cover = prefix + basePath + (meta.cover || "imgs/cover.jpg");
    const tags = (game.tags || [])
      .map(t => `<span class="game-tag">${t}</span>`)
      .join("");

    const html = `
      <a href="${gamePage}?id=${game.id}" class="game-card" data-game-name="${game.title.toLowerCase()}">
        <div class="game-cover-wrapper">
          <img src="${cover}" alt="${game.title}" class="game-cover-img">
        </div>

        <div class="game-card-content">
          <h3>${game.title}</h3>
          <p>${game.platform}</p>

          ${tags ? `<div class="game-tags">${tags}</div>` : ""}

          <div class="progress-bar">
            <div class="progress-bar-fill" style="width:${percent}%"></div>
          </div>

          <p>${done}/${total} · ${percent}% complete</p>
        </div>
      </a>
    `;

    return [game, html];
  })));

  const sections = PLATFORM_SECTIONS.map(section => {
    const sectionGames = games.filter(g => (g.group || "switch2") === section.group);
    if (sectionGames.length === 0) return "";

    const cards = sectionGames.map(g => cardsByGame.get(g)).join("");

    return `
      <section class="platform-section">
        <h2 class="platform-section-title">${section.label}</h2>
        <div class="game-card-grid ${section.coverClass}">${cards}</div>
      </section>
    `;
  }).join("");

  container.innerHTML = sections;
  container.querySelectorAll("img.game-cover-img").forEach(withImageExtensionFallback);
}

function renderGameNotFound() {
  document.getElementById("game-title").textContent = "Game not found";
  document.getElementById("game-meta").textContent = "";
  document.getElementById("game-container").innerHTML = `
    <p>We couldn't find this game. It may have been removed or the link is wrong.</p>
    <p><a href="${gamesBasePath()}index.html">Back to Games</a></p>
  `;
  const sidebar = document.querySelector(".game-sidebar-right");
  if (sidebar) sidebar.hidden = true;
}

async function loadGameById(id) {
  const games = await loadGames();
  const game = games.find(g => g.id === id);

  if (!game) {
    renderGameNotFound();
    return;
  }

  const { meta, html, tasks } = await loadMarkdown(game.path);
  const basePath = game.path.replace("game.md", "");

  document.getElementById("game-title").textContent = meta.title;
  document.getElementById("game-meta").textContent = `${meta.platform} · ${meta.tags}`;
  const coverImg = document.getElementById("game-cover");
  coverImg.src = basePath + (meta.header || meta.cover);
  withImageExtensionFallback(coverImg);
  document.getElementById("game-container").innerHTML = html;

  initChecklist(game.id, tasks);
}

function initChecklist(gameId, tasks) {
  const section = document.querySelector(".checklist-section");
  if (!section) return;

  migrateLegacyProgress(gameId);

  const checkboxes = section.querySelectorAll("input[type='checkbox']");
  const text = document.getElementById("progress-text");
  const bar = document.getElementById("progress-fill");
  const taskById = Object.fromEntries(tasks.map(task => [task.id, task]));

  checkboxes.forEach(cb => {
    const taskId = cb.dataset.taskId;
    const task = taskById[taskId];
    const progress = loadProgress(gameId);

    if (task) {
      cb.checked = isTaskDone(task, progress);

      const legacyId = task.legacyId;
      if (legacyId && progress[legacyId] && !progress[taskId]) {
        progress[taskId] = progress[legacyId];
        delete progress[legacyId];
        saveProgress(gameId, progress);
      }
    }

    cb.addEventListener("change", () => {
      const current = loadProgress(gameId);

      if (cb.checked) {
        if (task && task.mdDone) {
          delete current[taskId];
          if (task.legacyId) delete current[task.legacyId];
        } else {
          current[taskId] = true;
        }
      } else if (task && task.mdDone) {
        current[taskId] = false;
      } else {
        delete current[taskId];
        if (task && task.legacyId) delete current[task.legacyId];
      }

      saveProgress(gameId, current);
      update();
    });
  });

  function update() {
    const stats = getProgressStats(gameId, tasks);

    if (text) text.textContent = `${stats.done} / ${stats.total}`;
    if (bar) bar.style.width = stats.percent + "%";
  }

  update();

  const resetBtn = document.querySelector(".reset-button");
  if (resetBtn) {
    resetBtn.onclick = () => {
      saveProgress(gameId, {});
      checkboxes.forEach(cb => {
        const task = taskById[cb.dataset.taskId];
        cb.checked = task ? task.mdDone : false;
      });
      update();
    };
  }
}

function initGameSearch() {
  const input = document.getElementById("game-search");
  if (!input) return;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    document.querySelectorAll("#game-list .game-card").forEach(card => {
      card.style.display = card.dataset.gameName.includes(query) ? "" : "none";
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await renderProfile();
  await renderGameList();
  initGameSearch();
});
