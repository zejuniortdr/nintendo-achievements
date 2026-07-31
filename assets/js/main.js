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

function getProgress(key) {
  const items = Object.keys(localStorage).filter(k => k.startsWith(key));
  const total = items.length;

  if (total === 0) return 0;

  const done = items.filter(k => localStorage.getItem(k) === "true").length;

  return Math.round((done / total) * 100);
}

async function renderGameList() {
  const games = await loadGames();
  const container = document.getElementById("game-list");

  if (!container) return;

  const prefix = gamesBasePath();
  const gamePage = prefix + "game.html";

  container.innerHTML = games.map(game => {
    const basePath = game.path.replace("game.md", "");
    const cover = prefix + basePath + "imgs/cover.jpeg";
    const progress = getProgress(game.id);
    const tags = (game.tags || [])
      .map(t => `<span class="game-tag">${t}</span>`)
      .join("");

    return `
      <a href="${gamePage}?id=${game.id}" class="game-card" data-game-name="${game.title.toLowerCase()}">
        <div class="game-cover-wrapper">
          <img src="${cover}" alt="${game.title}" class="game-cover-img">
        </div>

        <div class="game-card-content">
          <h3>${game.title}</h3>
          <p>${game.platform}</p>

          ${tags ? `<div class="game-tags">${tags}</div>` : ""}

          <div class="progress-bar">
            <div class="progress-bar-fill" style="width:${progress}%"></div>
          </div>

          <p>${progress}% complete</p>
        </div>
      </a>
    `;
  }).join("");
}
async function loadGameById(id) {
  const games = await loadGames();
  const game = games.find(g => g.id === id);

  if (!game) return;

  const { meta, html } = await loadMarkdown(game.path);
  const basePath = game.path.replace("game.md", "");

  document.getElementById("game-title").textContent = meta.title;
  document.getElementById("game-meta").textContent = `${meta.platform} · ${meta.tags}`;
  
  // Prioriza o header para a página interna; se não existir, faz fallback para o cover
  document.getElementById("game-cover").src = basePath + (meta.header || meta.cover);
  
  document.getElementById("game-container").innerHTML = html;

  initChecklist(game.id);
}

function initChecklist(key) {
  const section = document.querySelector(".checklist-section");
  if (!section) return;
  
  const checkboxes = section.querySelectorAll("input");
  const text = document.getElementById("progress-text");
  const bar = document.getElementById("progress-fill");

  checkboxes.forEach(cb => {
    const storageKey = key + "-" + cb.dataset.taskId;
    const saved = localStorage.getItem(storageKey);
    
    if (saved === "true") cb.checked = true;

    cb.addEventListener("change", () => {
      localStorage.setItem(storageKey, cb.checked);
      update();
    });
  });

  function update() {
    const total = checkboxes.length;
    const done = [...checkboxes].filter(c => c.checked).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    if(text) text.textContent = `${done} / ${total}`;
    if(bar) bar.style.width = percent + "%";
  }

  update();

  const resetBtn = document.querySelector(".reset-button");
  if (resetBtn) {
    resetBtn.onclick = () => {
      checkboxes.forEach(cb => {
        const storageKey = key + "-" + cb.dataset.taskId;
        localStorage.removeItem(storageKey);
        cb.checked = false;
      });
      update();
    };
  }
}

// Inicialização sem o bloco de busca
document.addEventListener("DOMContentLoaded", () => {
  renderGameList();
});