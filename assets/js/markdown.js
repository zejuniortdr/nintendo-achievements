async function loadMarkdown(path) {
  const res = await fetch(path);
  const text = await res.text();

  const { meta, content } = parseFrontmatter(text);
  const tasks = parseChecklistTasks(content);
  const html = renderChecklistHtml(tasks);

  return { meta, html, tasks };
}

async function loadChecklistTasks(path) {
  const res = await fetch(path);
  const text = await res.text();
  const { content } = parseFrontmatter(text);
  return parseChecklistTasks(content);
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

function parseChecklistTasks(content) {
  const lines = content.split("\n");
  const tasks = [];
  let section = "";

  lines.forEach(line => {
    if (line.startsWith("## ")) {
      section = line.replace("## ", "").trim();
      return;
    }

    const match = line.trim().match(/^- \[([ xX])\]\s*(.*)$/);
    if (!match) return;

    const mdDone = match[1].toLowerCase() === "x";
    const raw = match[2].trim();
    const [title, desc] = raw.split("  ");
    const sectionSlug = section
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const taskSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const legacyId = title.toLowerCase().replace(/[^a-z0-9]/g, "");
    const id = sectionSlug ? `${sectionSlug}-${taskSlug}` : taskSlug;

    tasks.push({ id, legacyId, section, title, desc, mdDone });
  });

  return tasks;
}

function renderChecklistHtml(tasks) {
  let html = "";
  let checklistOpen = false;
  let lastSection = null;

  tasks.forEach(task => {
    if (task.section !== lastSection) {
      if (checklistOpen) html += "</ul>";
      html += `<h2>${task.section}</h2><ul class="checklist">`;
      checklistOpen = true;
      lastSection = task.section;
    }

    const checked = task.mdDone ? " checked" : "";
    const mdDone = task.mdDone ? ' data-md-done="true"' : "";

    html += `
      <li>
        <label>
          <input type="checkbox" class="checklist-item" data-task-id="${task.id}" data-legacy-task-id="${task.legacyId}"${checked}${mdDone}>
          ${task.title}
          ${task.desc ? `<small>${task.desc}</small>` : ""}
        </label>
      </li>
    `;
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
