# Tabby 🐱

> Save, organize, and restore your browser tab groups — with style.

Tabby is a lightweight Chrome extension that lets you snapshot your open tabs into named groups, restore them anytime in a regular or incognito window, and carry your sessions across devices via JSON export/import.

---

## Features

- **Save tabs** — Capture all tabs in the current window as a named group in one click.
- **Open in new window** — Restore any saved group in a fresh browser window.
- **Open in incognito** — Launch a group privately in an incognito window.
- **Rename groups** — Give sessions meaningful names so you can find them later.
- **Delete groups** — Remove groups you no longer need.
- **Export / Import** — Back up all your groups to a `.json` file and restore them on any machine.
- **Theme switcher** — Toggle between System, Light, and Dark themes.
- **Persistent storage** — All data is stored locally via `chrome.storage.local` and survives browser restarts.

---

## Installation

**From a GitHub Release (recommended):**

1. Go to the [Releases](../../releases) page and download the latest `tabby-vX.X.X.zip`.
2. Unzip it anywhere on your machine.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** and select the unzipped folder.
6. The Tabby icon will appear in your toolbar — pin it for quick access.

**From source:**

1. Clone this repository.
2. Follow steps 3–6 above, selecting the cloned `tabby` folder.

---

## Releases

Tabby uses **semantic versioning** (`MAJOR.MINOR.PATCH`):

| Part | Bump when… |
| ---- | --- |
| `PATCH` | Bug fixes, minor tweaks (e.g. `1.0.1`) |
| `MINOR` | New features, backward-compatible (e.g. `1.1.0`) |
| `MAJOR` | Breaking changes or major redesign (e.g. `2.0.0`) |

Releases are **automatic** — pushing a version tag triggers the GitHub Actions workflow, which packages the extension and publishes the release with the `.zip` attached.

See [CHANGELOG.md](CHANGELOG.md) for the full history of changes.


## Usage

| Action            | How                                                 |
| ----------------- | --------------------------------------------------- |
| Save current tabs | Click the **Save Tabs** button                      |
| View saved tabs   | Click any group card to expand it                   |
| Restore a group   | Click **Open** (new window) or **Incognito**        |
| Rename a group    | Click the ✏️ icon on a group card                   |
| Delete a group    | Click the 🗑️ icon on a group card                   |
| Export all groups | Click the **Export** icon in the header             |
| Import a backup   | Click the **Import** icon and pick a `.json` file   |
| Switch theme      | Click the theme icon (☀️ / 🌙 / Auto) in the header |

---

## File Structure

```
tabby/
├── manifest.json      # Extension manifest (MV3)
├── popup.html         # Extension popup UI
├── popup.css          # Material You 3 styles
├── popup.js           # All popup logic
├── background.js      # Service worker (opens tab windows)
└── icons/             # Extension icons (16, 48, 128 px)
```

---

## Permissions

| Permission | Purpose                             |
| ---------- | ----------------------------------- |
| `tabs`     | Read open tabs to save them         |
| `storage`  | Persist groups across sessions      |
| `windows`  | Open restored groups in new windows |

---

## Contributing

Contributions are welcome and appreciated! This project is open source under the MIT License.

**Ways to contribute:**

- 🐛 **Report bugs** — Open an issue describing what went wrong and how to reproduce it.
- 💡 **Suggest features** — Have an idea? Open an issue with the `enhancement` label.
- 🔧 **Submit a pull request** — Fix a bug or build a feature, then open a PR against `main`.

**Guidelines:**

- Keep PRs focused — one fix or feature per PR.
- Follow the existing code style (Material You 3, vanilla JS/CSS, no build tools).
- Test your changes by loading the extension unpacked in Chrome before submitting.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright © 2026 [LogicalLokesh](https://github.com/LogicalLokesh).
