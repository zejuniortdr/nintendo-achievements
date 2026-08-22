// ponytail: meta-achievements derived entirely from data already computed by
// collectGameStats() — no new storage, no new architecture, just rules.
const BADGE_DEFINITIONS = [
  {
    id: "starter",
    icon: "🎮",
    label: "Primeiros Passos",
    hint: "Marque o primeiro item de qualquer jogo",
    test: stats => stats.some(s => s.done > 0)
  },
  {
    id: "collector",
    icon: "🏆",
    label: "Colecionador",
    hint: "3 jogos zerados (100%)",
    test: stats => stats.filter(s => s.percent === 100).length >= 3
  },
  {
    id: "legend",
    icon: "👑",
    label: "Lendário",
    hint: "5 jogos zerados (100%)",
    test: stats => stats.filter(s => s.percent === 100).length >= 5
  },
  {
    id: "multi-platform",
    icon: "🌐",
    label: "Multi-plataforma",
    hint: "Jogos 100% em 2+ plataformas diferentes",
    test: stats => new Set(stats.filter(s => s.percent === 100).map(s => s.game.group)).size >= 2
  },
  {
    id: "platinum",
    icon: "💎",
    label: "Platina Absoluta",
    hint: "Todos os jogos ativos em 100%",
    test: stats => stats.length > 0 && stats.every(s => s.percent === 100)
  }
];

function renderBadges(gameStats) {
  const container = document.getElementById("badge-list");
  if (!container) return;

  container.innerHTML = BADGE_DEFINITIONS.map(badge => {
    const earned = badge.test(gameStats);
    return `
      <div class="badge ${earned ? "is-earned" : "is-locked"}" title="${badge.hint}">
        <span class="badge-icon">${badge.icon}</span>
        <span class="badge-label">${badge.label}</span>
      </div>
    `;
  }).join("");
}
