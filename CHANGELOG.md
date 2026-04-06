# Changelog

All notable changes to Tabby will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Version numbers follow [Semantic Versioning](https://semver.org/).

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
