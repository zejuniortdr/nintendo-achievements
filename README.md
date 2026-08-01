# 100% Game Checklists

A static GitHub Pages site for tracking 100% completion checklists across multiple gaming platforms (Switch 2, and more). Built for serious trophy hunters who want organized, persistent checklists without relying on platform-specific services.

## Features

- **Multi-platform support**: Organize games by platform (Switch 2, etc.)
- **Interactive checklists**: Check off tasks with progress saved in your browser's `localStorage`
- **Progress tracking**: Visual progress bars show completion percentage per game
- **Dark theme**: Gaming-inspired dark UI with neon accents
- **Responsive design**: Works on desktop and mobile
- **No server required**: Pure static site, deployable on GitHub Pages
- **Privacy-first**: All progress is stored locally—nothing is sent to any server

## Quick Start

### Local Testing

```bash
# Start local server (default: http://127.0.0.1:8000)
make serve

# Or start server and open in browser
make open

# Stop the server
make stop

# Clean up temporary files
make clean
```

**Alternative (without Make):**

```bash
# Python 3
python3 -m http.server 8000

# Then open http://localhost:8000 in your browser
```

### Deployment to GitHub Pages

1. **Create a new repository** on GitHub (e.g., `game-checklists`)
2. **Push your code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: 100% Game Checklists"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/game-checklists.git
   git push -u origin main
   ```
3. **Enable GitHub Pages**:
   - Go to repository **Settings** → **Pages**
   - Select **Source**: `Deploy from a branch`
   - Select **Branch**: `main` / `root`
   - Click **Save**
4. **Access your site**: `https://YOUR_USERNAME.github.io/game-checklists/`

## Project Structure

```
nintendo-achievements/
├─ index.html                      # Landing page
├─ games/
│  ├─ index.html                   # Games list (reads games.json)
│  ├─ game.html                    # Single dynamic detail template (?id=<gameId>)
│  ├─ games.json                   # Registry of all games
│  └─ switch2/
│     └─ star-fox/
│        ├─ game.md                # Frontmatter + checklist (markdown)
│        └─ imgs/
│           ├─ cover.jpg
│           └─ header.jpg
├─ assets/
│  ├─ css/style.css
│  ├─ js/
│  │  ├─ main.js                   # Data loading, rendering, progress
│  │  └─ markdown.js               # Frontmatter + checklist parser
│  └─ img/
├─ Makefile
└─ README.md
```

There is **one** detail page: `games/game.html`. It reads `id` from the query
string, looks it up in `games/games.json`, fetches the matching `game.md`,
and renders title, metadata, cover, checklist and progress bar. Games never
get their own `index.html` — that pattern was tried and removed because it
duplicated rendering logic and drifted out of sync with the JSON registry.

## Adding a New Game

1. Add an entry to `games/games.json`:
   ```json
   {
     "id": "your-game-id",
     "title": "Your Game Title",
     "platform": "Switch 2",
     "tags": ["Adventure"],
     "path": "switch2/your-game-id/game.md",
     "active": true
   }
   ```
2. Create the folder `games/switch2/your-game-id/`.
3. Add `game.md` with frontmatter + checklist:
   ```markdown
   ---
   title: Your Game Title
   platform: Switch 2
   tags: Adventure
   cover: imgs/cover.jpg
   ---

   ## Main Story

   - [ ] Task title  Optional longer description
   - [x] Already completed task
   ```
4. Add `imgs/cover.jpg` (and `imgs/header.jpg` if you want a banner asset).
5. Open `games/game.html?id=your-game-id` to verify it renders.

No new HTML file is needed — the dynamic template handles every game.

### Checklist Format

Each line under a `## Section` heading becomes one checklist item:

```markdown
- [ ] Task title  Optional description
- [x] Already-done task
```

- `[x]` marks a task as done by default (`mdDone`); the user can still toggle it.
- Title and description are split on the **first** double-space — keep the
  title short and put any longer text after two spaces.
- Task IDs are derived from the section + title, slugified.

## How Progress is Stored

Progress is saved in `localStorage` under `game-progress:<gameId>` as a JSON
map of `taskId -> boolean`. Only overrides are stored — an unmarked entry
falls back to the task's `mdDone` value from the markdown.

**To reset progress:**

- Click the "Reset Progress" button on the game's detail page, or
- Clear your browser's localStorage for the site

## Customization

### Change Colors

Edit `assets/css/style.css` and modify the CSS variables:

```css
:root {
  --color-bg-primary: #0f0f13;
  --color-bg-secondary: #1a1a24;
  --color-accent: #7c3aed;
  --color-accent-hover: #6d28d9;
  --color-text-primary: #f3f4f6;
  --color-text-secondary: #9ca3af;
}
```

### Add Game Cover Images

Put `cover.jpg` (and optionally `header.jpg`) inside the game's `imgs/`
folder and reference it via the `cover`/`header` frontmatter keys in
`game.md` — no HTML or CSS changes needed.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome for Android)

## Known Limitations

- Progress is **per-browser, per-device** (no cloud sync)
- No user accounts or authentication
- No cross-device progress sharing
- Manual content updates (no CMS)

## Future Enhancements (Optional)

- [ ] Import/export progress as JSON
- [ ] Search/filter games by name, tags, or completion status
- [ ] Backlog page for games not yet started
- [ ] Tags/categories for games (RPG, Action, etc.)
- [ ] Dark/light theme toggle
- [ ] PWA support for offline usage
- [ ] Markdown-based game content with client-side rendering

## License

MIT License — feel free to fork, modify, and use for your own trophy hunting!

## Credits

Built for the community of completionists who deserve better tools than fragmented spreadsheets and notes. 🎮