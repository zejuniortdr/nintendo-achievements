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
game-checklists/
├─ index.html                      # Landing page
├─ platforms/
│  └─ switch2.html                 # Switch 2 game library
├─ games/
│  └─ switch2/
│     └─ zelda-totk.html           # Switch 2 game checklist
├─ assets/
│  ├─ css/
│  │  └─ style.css                 # Global styles
│  ├─ js/
│  │  └─ main.js                   # Interactive functionality
│  └─ img/                        # Game cover images (optional)
├─ Makefile                        # Local testing commands
└─ README.md                       # This file
```

## Adding New Content

### Add a New Platform

1. Create a new HTML file in `platforms/` (e.g., `xbox.html`)
2. Copy the structure from `switch2.html`
3. Update:
   - `<title>` and `<h1>` with platform name
   - Breadcrumb navigation
   - Game list section with new game cards
4. Add a link to the new platform in the main navigation (all pages)

### Add a New Game

1. Create a new HTML file in `games/<platform>/` (e.g., `games/switch2/zelda-totk.html`)
2. Use an existing game page as a template
3. Update:
   - `<title>` and `<h1>` with game title
   - Breadcrumb navigation
   - `data-checklist-key` in the checklist section (must be unique, e.g., `zelda-totk-switch2`)
   - Progress bar element IDs (e.g., `zelda-totk-progress-fill`, `zelda-totk-progress-text`)
   - Checklist items with your completion tasks
4. Add a game card linking to the new page in the platform's HTML file

### Checklist Format

Each checklist item uses this structure:

```html
<li>
  <label>
    <input type="checkbox" class="checklist-item" data-task-id="unique-task-id">
    Task description (e.g., "Complete Chapter 1", "Trophy: Platinum")
  </label>
</li>
```

**Tips:**

- Use `data-task-id` values that are unique within the game
- Mark missable trophies with a `.missable` class for visual distinction
- Group tasks by category (Main Story, Side Content, Trophies, DLC, etc.)

## How Progress is Stored

Progress is saved in your browser's `localStorage` using this key format:

```
checklist:<game-checklist-key>:<task-id>
```

For example, completing a task in God of War Ragnarok creates:

```
checklist:zelda-totk-switch2:main-01 = "true"
```

**To reset progress:**

- Click the "Reset Progress" button on any game page, or
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

1. Add images to `assets/img/` (recommended: 400x600px)
2. Replace `.game-cover-placeholder` with actual `<img>` tags:

```html
<img src="../../assets/img/covers/god-of-war-ragnarok.jpg" alt="God of War Ragnarok" class="game-cover">
```

3. Update CSS as needed for proper sizing

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