# Changelog

All notable changes to Tabby will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Version numbers follow [Semantic Versioning](https://semver.org/).

---

## [1.0.1] - 2026-04-07

### Added
- **Tab picker on save** — clicking "Save" now opens a dialog listing all open tabs with checkboxes. All tabs are pre-selected; uncheck any you don't want before saving.
- **Per-tab removal** — hovering a tab inside an expanded group reveals a `×` button to remove that single tab without deleting the whole group. Removing the last tab deletes the group.

### Fixed
- Removing a tab from an expanded group no longer collapses the card. The tab row is now removed in-place and the tab count updates instantly.
- Expanded group state is now preserved across all re-render operations (e.g. after rename or delete of another group).

---

## [1.0.0] - 2026-04-06


### Added
- Save all tabs in the current window as a named group with an auto-generated name.
- Open saved groups in a new regular or incognito window.
- Rename and delete saved groups with confirmation dialogs.
- Export all groups to a `.json` backup file and import them back (with smart deduplication).
- System / Light / Dark theme switcher, persisted via `chrome.storage.local`.
- Version number displayed in the popup footer, read live from `manifest.json`.
- Themed text selection using Material You 3 primary-container color.
- Material You 3 design with full dark mode support.
- Persistent storage that survives browser restarts.

### Notes
- Internal browser pages (`chrome://`, `about:`, `edge://`) are excluded from saved groups as they cannot be reopened by extensions.
