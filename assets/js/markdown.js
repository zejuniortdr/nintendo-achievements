async function loadMarkdown(path) {
  const res = await fetch(path);
  const text = await res.text();

  const { meta, content } = parseFrontmatter(text);
  const html = renderMarkdown(content);

  return { meta, html };
}

function parseFrontmatter(md) {
  const match = md.match(/^---([\s\S]*?)---([\s\S]*)$/);
  if (!match) return { meta: {}, content: md };

  const metaLines = match[1].trim().split("\n");
  const meta = {};

  metaLines.forEach(line => {
    const [key, ...rest] = line.split(":");
    if (key) {
      meta[key.trim()] = rest.join(":").trim();
    }
  });

  return {
    meta,
    content: match[2].trim()
  };
}

function renderMarkdown(md) {
  const lines = md.split("\n");
  let html = "";
  let checklistOpen = false;

  lines.forEach(line => {
    if (line.startsWith("## ")) {
      if (checklistOpen) html += "</ul>";
      html += `<h2>${line.replace("## ", "")}</h2><ul class="checklist">`;
      checklistOpen = true;
    } else if (line.trim().startsWith("- [ ]")) {
      const raw = line.replace("- [ ]", "").trim();
      const [title, desc] = raw.split("  ");
      const id = title.toLowerCase().replace(/[^a-z0-9]/g, "");

      html += `
        <li>
          <label>
            <input type="checkbox" class="checklist-item" data-task-id="${id}">
            ${title}
            ${desc ? `<small>${desc}</small>` : ""}
          </label>
        </li>
      `;
    }
  });

  if (checklistOpen) html += "</ul>";

  return `
    <section class="checklist-section" data-checklist-key="game">
      ${html}
      <button class="reset-button" data-reset-key="game">
        Reset Progress
      </button>
    </section>
  `;
}