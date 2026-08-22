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

// ponytail: shared by the profile dashboard and the badges module so both
// read the same per-game numbers instead of re-parsing every game.md twice.
async function collectGameStats() {
  const games = await loadActiveGames();

  return Promise.all(games.map(async game => {
    const { tasks } = await loadChecklistTasks(gamesBasePath() + game.path);
    return { game, ...getProgressStats(game.id, tasks) };
  }));
}

async function renderProfile() {
  const section = document.getElementById("profile-section");
  if (!section) return;

  const gameStats = await collectGameStats();
  const achievements = gameStats.reduce((sum, s) => sum + s.done, 0);
  const totalTasks = gameStats.reduce((sum, s) => sum + s.total, 0);
  const overallPercent = totalTasks > 0 ? Math.round((achievements / totalTasks) * 100) : 0;
  const completedGames = gameStats.filter(s => s.percent === 100).length;

  let profile = {};
  try {
    const res = await fetch("profile.json");
    if (res.ok) profile = await res.json();
  } catch {}

  document.getElementById("profile-gamertag").textContent = profile.gamertag || "Player One";
  const avatarImg = document.getElementById("profile-avatar");
  revealOnLoad(avatarImg);
  withImageExtensionFallback(avatarImg);
  avatarImg.src = profile.avatar || "assets/img/profile-avatar.svg";
  document.getElementById("stat-games").textContent = gameStats.length;
  document.getElementById("stat-achievements").textContent = achievements;

  const percentEl = document.getElementById("stat-percent");
  if (percentEl) percentEl.textContent = overallPercent + "%";

  const completedEl = document.getElementById("stat-completed");
  if (completedEl) completedEl.textContent = completedGames;

  renderBadges(gameStats);
}

const IMAGE_FALLBACK_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

// ponytail: covers/headers referenced in game.md often drift from the real file
// extension (png saved but .md still says .jpg). Instead of hand-editing every
// game.md when that happens, retry the same path with sibling extensions.
// ponytail: img starts opacity:0 in CSS (no broken-icon flash while src is
// unset); reveal it once the browser actually has pixels to show.
function revealOnLoad(img) {
  if (img.complete && img.naturalWidth > 0) {
    img.classList.add("is-loaded");
    return;
  }
  img.addEventListener("load", () => img.classList.add("is-loaded"));
}

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

function renderSkeletonCards(count = 6) {
  return `<div class="game-card-grid">${
    Array.from({ length: count }, () => `
      <div class="game-card game-card-skeleton">
        <div class="game-cover-wrapper skeleton-block"></div>
        <div class="game-card-content">
          <div class="skeleton-block skeleton-line" style="width:70%"></div>
          <div class="skeleton-block skeleton-line" style="width:40%"></div>
        </div>
      </div>
    `).join("")
  }</div>`;
}

async function renderGameList() {
  const container = document.getElementById("game-list");
  if (!container) return;

  container.innerHTML = renderSkeletonCards();

  const games = await loadActiveGames();

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

    const tagList = (game.tags || []).map(t => t.toLowerCase()).join(",");

    const html = `
      <a href="${gamePage}?id=${game.id}" class="game-card" data-game-name="${game.title.toLowerCase()}" data-group="${game.group || ""}" data-tags="${tagList}">
        <div class="game-cover-wrapper">
          <img src="${cover}" alt="${game.title}" class="game-cover-img">
        </div>

        <div class="game-card-content">
          <h3>${game.title}</h3>
          <p>${game.platform}</p>

          ${tags ? `<div class="game-tags">${tags}</div>` : ""}

          <div class="progress-bar">
            <div class="progress-bar-fill" data-grade="${progressGrade(percent)}" style="width:${percent}%"></div>
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
  container.querySelectorAll("img.game-cover-img").forEach(img => {
    revealOnLoad(img);
    withImageExtensionFallback(img);
  });

  populateGameFilters(games);
}

function populateGameFilters(games) {
  const platformSelect = document.getElementById("platform-filter");
  if (platformSelect) {
    const groups = [...new Set(games.map(g => g.group || "switch2"))];
    const options = groups.map(group => {
      const section = PLATFORM_SECTIONS.find(s => s.group === group);
      const label = section ? section.label : group;
      return `<option value="${group}">${label}</option>`;
    });
    platformSelect.innerHTML = `<option value="">All platforms</option>${options.join("")}`;
  }

  const tagContainer = document.getElementById("tag-filters");
  if (tagContainer) {
    const tags = [...new Set(games.flatMap(g => g.tags || []))].sort();
    tagContainer.innerHTML = tags
      .map(tag => `<button type="button" class="tag-filter-chip" data-tag="${tag.toLowerCase()}">${tag}</button>`)
      .join("");
  }
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

  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    gameContainer.innerHTML = `
      <div class="skeleton-block skeleton-line" style="width:60%"></div>
      <div class="skeleton-block skeleton-line" style="width:90%"></div>
      <div class="skeleton-block skeleton-line" style="width:80%"></div>
    `;
  }

  const { meta, html, tasks } = await loadMarkdown(game.path);
  const basePath = game.path.replace("game.md", "");

  document.getElementById("game-title").textContent = meta.title;
  document.getElementById("game-meta").textContent = `${meta.platform} · ${meta.tags}`;
  const coverImg = document.getElementById("game-cover");
  revealOnLoad(coverImg);
  withImageExtensionFallback(coverImg);
  coverImg.src = basePath + (meta.header || meta.cover);
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
    if (bar) {
      bar.style.width = stats.percent + "%";
      bar.dataset.grade = progressGrade(stats.percent);
    }
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
  const platformSelect = document.getElementById("platform-filter");
  const tagContainer = document.getElementById("tag-filters");
  if (!input && !platformSelect && !tagContainer) return;

  const activeTags = new Set();

  function applyFilters() {
    const query = (input?.value || "").trim().toLowerCase();
    const platform = platformSelect?.value || "";

    document.querySelectorAll("#game-list .game-card").forEach(card => {
      const matchesQuery = !query || card.dataset.gameName.includes(query);
      const matchesPlatform = !platform || card.dataset.group === platform;
      const cardTags = (card.dataset.tags || "").split(",").filter(Boolean);
      const matchesTags = activeTags.size === 0 || [...activeTags].every(tag => cardTags.includes(tag));

      card.style.display = matchesQuery && matchesPlatform && matchesTags ? "" : "none";
    });
  }

  input?.addEventListener("input", applyFilters);
  platformSelect?.addEventListener("change", applyFilters);

  tagContainer?.addEventListener("click", event => {
    const chip = event.target.closest(".tag-filter-chip");
    if (!chip) return;

    const tag = chip.dataset.tag;
    if (activeTags.has(tag)) {
      activeTags.delete(tag);
      chip.classList.remove("is-active");
    } else {
      activeTags.add(tag);
      chip.classList.add("is-active");
    }

    applyFilters();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await renderProfile();
  await renderGameList();
  initGameSearch();
});
