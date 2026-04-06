// popup.js — Tabby
// Copyright © LogicalLokesh

const STORAGE_KEY = 'tabby_groups';

// ── DOM refs ──────────────────────────────────────────────────
const saveTabsBtn = document.getElementById('saveTabsBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');
const groupsList = document.getElementById('groupsList');
const emptyState = document.getElementById('emptyState');
const groupCountChip = document.getElementById('groupCountChip');
const tabCountEl = document.getElementById('tabCount');
// Rename dialog
const renameDialog = document.getElementById('renameDialog');
const renameInput = document.getElementById('renameInput');
const renameCancelBtn = document.getElementById('renameCancelBtn');
const renameConfirmBtn = document.getElementById('renameConfirmBtn');
// Delete dialog
const deleteDialog = document.getElementById('deleteDialog');
const deleteCancelBtn = document.getElementById('deleteCancelBtn');
const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
// Toast
const toastEl = document.getElementById('toast');
// Theme
const themeBtn = document.getElementById('themeBtn');
const themeIcon = document.getElementById('themeIcon');

const THEME_KEY = 'tabby_theme';
const THEMES = [
  { value: 'system', icon: 'brightness_auto', label: 'System' },
  { value: 'light', icon: 'light_mode', label: 'Light' },
  { value: 'dark', icon: 'dark_mode', label: 'Dark' },
];

// ── State ─────────────────────────────────────────────────────
let groups = [];          // { id, name, date, tabs: [{title, url, favIconUrl}] }
let renameTargetId = null;
let deleteTargetId = null;
let toastTimer = null;
let pickerTabs = [];      // tabs waiting in the tab-picker dialog

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await initTheme();
  await loadGroups();
  renderGroups();
  updateCurrentTabCount();
  // Inject semantic version from manifest
  const { version } = chrome.runtime.getManifest();
  document.getElementById('appVersion').textContent = `v${version}`;
});

// ── Theme ─────────────────────────────────────────────────────
async function initTheme() {
  const { [THEME_KEY]: saved } = await chrome.storage.local.get(THEME_KEY);
  const theme = saved || 'system';
  applyTheme(theme);
}

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value);
  const t = THEMES.find(t => t.value === value) || THEMES[0];
  themeIcon.textContent = t.icon;
  themeBtn.title = `Theme: ${t.label}`;
}

themeBtn.addEventListener('click', async () => {
  const current = document.documentElement.getAttribute('data-theme') || 'system';
  const idx = THEMES.findIndex(t => t.value === current);
  const next = THEMES[(idx + 1) % THEMES.length];
  applyTheme(next.value);
  await chrome.storage.local.set({ [THEME_KEY]: next.value });
  showToast(`Theme: ${next.label}`);
});

// ── Current Tab Count ─────────────────────────────────────────
async function updateCurrentTabCount() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const n = tabs.length;
  tabCountEl.textContent = `${n} tab${n !== 1 ? 's' : ''} in current window`;
}

// ── Storage ───────────────────────────────────────────────────
async function loadGroups() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  groups = result[STORAGE_KEY] || [];
}

async function saveGroups() {
  await chrome.storage.local.set({ [STORAGE_KEY]: groups });
}

// ── Save Current Tabs — opens tab picker ──────────────────────
saveTabsBtn.addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  if (!tabs.length) { showToast('No tabs to save!'); return; }

  // Filter out internal browser URLs that can't be reopened
  pickerTabs = tabs
    .filter(t => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('about:') && !t.url.startsWith('edge://'))
    .map(t => ({
      title: t.title || t.url,
      url: t.url,
      favIconUrl: t.favIconUrl || ''
    }));

  if (!pickerTabs.length) { showToast('No saveable tabs (browser pages excluded)'); return; }
  openTabPickerDialog();
});

// ── Render ────────────────────────────────────────────────────
function renderGroups() {
  // Preserve expanded states across renders
  const expandedIds = new Set([...groupsList.querySelectorAll('.group-card.expanded')].map(c => c.dataset.id));

  // Clear existing cards (keep emptyState)
  [...groupsList.querySelectorAll('.group-card')].forEach(el => el.remove());

  groupCountChip.textContent = groups.length;

  if (!groups.length) {
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';

  groups.forEach((group, idx) => {
    const card = buildGroupCard(group, idx);
    if (expandedIds.has(group.id)) {
      card.classList.add('expanded');
      card.style.animation = 'none'; // Avoid slide-up re-animation if already open
    }
    groupsList.appendChild(card);
  });
}

function buildGroupCard(group, idx) {
  const card = document.createElement('div');
  card.className = 'group-card';
  card.dataset.id = group.id;
  card.style.animationDelay = `${idx * 30}ms`;

  const dateStr = new Date(group.date).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // Build tab items HTML (no inline event handlers — MV3 CSP compliant)
  const tabItemsHTML = group.tabs.map((tab, tabIdx) => {
    const faviconHTML = tab.favIconUrl
      ? `<img class="tab-favicon" src="${escapeAttr(tab.favIconUrl)}" alt="">`
      : '';
    return `
      <div class="tab-item">
        ${faviconHTML}
        <span class="tab-favicon-fallback" ${tab.favIconUrl ? 'style="display:none"' : ''}>
          <span class="material-icons-round">language</span>
        </span>
        <div class="tab-info">
          <div class="tab-title">${escapeHtml(tab.title)}</div>
          <div class="tab-url">${escapeHtml(tab.url)}</div>
        </div>
        <button class="tab-remove-btn icon-btn" data-tab-idx="${tabIdx}" title="Remove tab">
          <span class="material-icons-round">close</span>
        </button>
      </div>`;
  }).join('');

  card.innerHTML = `
    <div class="group-card-header">
      <div class="group-header-left">
        <div class="group-avatar">
          <span class="material-icons-round">bookmarks</span>
        </div>
        <div class="group-name-wrap">
          <div class="group-name">${escapeHtml(group.name)}</div>
          <div class="group-meta">${group.tabs.length} tab${group.tabs.length !== 1 ? 's' : ''} · ${dateStr}</div>
        </div>
      </div>
      <div class="group-header-actions">
        <button class="icon-btn rename-btn" title="Rename">
          <span class="material-icons-round">edit</span>
        </button>
        <button class="icon-btn delete-btn" title="Delete">
          <span class="material-icons-round">delete</span>
        </button>
        <span class="material-icons-round expand-icon">expand_more</span>
      </div>
    </div>
    <div class="tab-list">${tabItemsHTML}</div>
    <div class="group-footer">
      <button class="tonal-btn incognito open-incognito-btn" title="Open in incognito">
        <span class="material-icons-round">security</span>
        Incognito
      </button>
      <button class="tonal-btn open-normal-btn" title="Open in new window">
        <span class="material-icons-round">open_in_new</span>
        Open
      </button>
    </div>`;

  // Attach favicon error handlers after innerHTML is set (CSP-safe, no inline handlers)
  card.querySelectorAll('.tab-favicon').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      img.nextElementSibling.style.display = 'flex';
    });
  });

  // Tab remove buttons
  card.querySelectorAll('.tab-remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const tabIdx = parseInt(btn.dataset.tabIdx, 10);
      const g = groups.find(g => g.id === group.id);
      if (!g) return;
      g.tabs.splice(tabIdx, 1);
      
      if (g.tabs.length === 0) {
        groups = groups.filter(x => x.id !== group.id);
        showToast('Group deleted — last tab removed');
        await saveGroups();
        renderGroups();
      } else {
        showToast('Tab removed');
        await saveGroups();
        
        // Remove the DOM element in-place to avoid visually collapsing/re-rendering
        const tabEl = btn.closest('.tab-item');
        if (tabEl) tabEl.remove();
        
        // Update tab count meta text
        const metaEl = card.querySelector('.group-meta');
        if (metaEl) {
          const dtStr = new Date(g.date).toLocaleString(undefined, {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          });
          metaEl.textContent = `${g.tabs.length} tab${g.tabs.length !== 1 ? 's' : ''} · ${dtStr}`;
        }
        
        // Ensure remaining buttons have the correct index for subsequent clicks
        card.querySelectorAll('.tab-remove-btn').forEach((b, newIdx) => {
          b.dataset.tabIdx = newIdx;
        });
      }
    });
  });

  // Toggle expand
  card.querySelector('.group-card-header').addEventListener('click', (e) => {
    if (e.target.closest('.icon-btn')) return; // don't expand on action buttons
    card.classList.toggle('expanded');
  });

  // Rename
  card.querySelector('.rename-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    openRenameDialog(group.id, group.name);
  });

  // Delete
  card.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    openDeleteDialog(group.id);
  });

  // Open normal
  card.querySelector('.open-normal-btn').addEventListener('click', () => {
    const urls = group.tabs.map(t => t.url);
    chrome.runtime.sendMessage({ action: 'openTabs', urls, incognito: false });
  });

  // Open incognito
  card.querySelector('.open-incognito-btn').addEventListener('click', () => {
    const urls = group.tabs.map(t => t.url);
    chrome.runtime.sendMessage({ action: 'openTabs', urls, incognito: true });
  });

  return card;
}

// ── Rename Dialog ─────────────────────────────────────────────
function openRenameDialog(id, currentName) {
  renameTargetId = id;
  renameInput.value = currentName;
  renameDialog.hidden = false;
  setTimeout(() => renameInput.focus(), 50);
}

renameCancelBtn.addEventListener('click', () => {
  renameDialog.hidden = true;
  renameTargetId = null;
});

renameConfirmBtn.addEventListener('click', async () => {
  const newName = renameInput.value.trim();
  if (!newName) { renameInput.focus(); return; }
  const group = groups.find(g => g.id === renameTargetId);
  if (group) {
    group.name = newName;
    await saveGroups();
    renderGroups();
    showToast('Group renamed');
  }
  renameDialog.hidden = true;
  renameTargetId = null;
});

renameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') renameConfirmBtn.click();
  if (e.key === 'Escape') renameCancelBtn.click();
});

// ── Delete Dialog ─────────────────────────────────────────────
function openDeleteDialog(id) {
  deleteTargetId = id;
  deleteDialog.hidden = false;
}

deleteCancelBtn.addEventListener('click', () => {
  deleteDialog.hidden = true;
  deleteTargetId = null;
});

deleteConfirmBtn.addEventListener('click', async () => {
  groups = groups.filter(g => g.id !== deleteTargetId);
  await saveGroups();
  renderGroups();
  showToast('Group deleted');
  deleteDialog.hidden = true;
  deleteTargetId = null;
});

// Close dialogs on overlay click
[renameDialog, deleteDialog].forEach(dlg => {
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) {
      dlg.hidden = true;
      renameTargetId = null;
      deleteTargetId = null;
    }
  });
});

// ── Tab Picker Dialog ─────────────────────────────────────────
const tabPickerDialog    = document.getElementById('tabPickerDialog');
const tabPickerList      = document.getElementById('tabPickerList');
const tabPickerCancelBtn = document.getElementById('tabPickerCancelBtn');
const tabPickerSaveBtn   = document.getElementById('tabPickerSaveBtn');
const selectAllTabsBtn   = document.getElementById('selectAllTabsBtn');
const deselectAllTabsBtn = document.getElementById('deselectAllTabsBtn');

function openTabPickerDialog() {
  tabPickerList.innerHTML = '';

  pickerTabs.forEach((tab, i) => {
    const item = document.createElement('label');
    item.className = 'tab-picker-item';

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'tab-picker-checkbox';
    checkbox.checked = true;
    checkbox.dataset.index = i;
    item.appendChild(checkbox);

    // Favicon
    const fallback = document.createElement('span');
    fallback.className = 'tab-favicon-fallback';
    fallback.style.display = 'none';
    fallback.innerHTML = '<span class="material-icons-round">language</span>';

    if (tab.favIconUrl) {
      const img = document.createElement('img');
      img.className = 'tab-favicon';
      img.src = tab.favIconUrl;
      img.alt = '';
      img.addEventListener('error', () => {
        img.style.display = 'none';
        fallback.style.display = 'flex';
      });
      item.appendChild(img);
    } else {
      fallback.style.display = 'flex';
    }
    item.appendChild(fallback);

    // Info
    const info = document.createElement('div');
    info.className = 'tab-info';
    info.innerHTML = `<div class="tab-title">${escapeHtml(tab.title)}</div><div class="tab-url">${escapeHtml(tab.url)}</div>`;
    item.appendChild(info);

    tabPickerList.appendChild(item);
  });

  tabPickerDialog.hidden = false;
}

selectAllTabsBtn.addEventListener('click', () => {
  tabPickerList.querySelectorAll('.tab-picker-checkbox').forEach(cb => { cb.checked = true; });
});

deselectAllTabsBtn.addEventListener('click', () => {
  tabPickerList.querySelectorAll('.tab-picker-checkbox').forEach(cb => { cb.checked = false; });
});

tabPickerCancelBtn.addEventListener('click', () => {
  tabPickerDialog.hidden = true;
  pickerTabs = [];
});

tabPickerDialog.addEventListener('click', (e) => {
  if (e.target === tabPickerDialog) {
    tabPickerDialog.hidden = true;
    pickerTabs = [];
  }
});

tabPickerSaveBtn.addEventListener('click', async () => {
  const checkboxes = [...tabPickerList.querySelectorAll('.tab-picker-checkbox')];
  const selectedTabs = checkboxes
    .filter(cb => cb.checked)
    .map(cb => pickerTabs[parseInt(cb.dataset.index, 10)]);

  if (!selectedTabs.length) { showToast('Select at least one tab'); return; }

  const now = new Date();
  const name = `Session – ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;

  const group = {
    id: `g_${Date.now()}`,
    name,
    date: now.toISOString(),
    tabs: selectedTabs
  };

  groups.unshift(group);
  await saveGroups();
  renderGroups();
  tabPickerDialog.hidden = true;
  pickerTabs = [];
  showToast(`Saved ${selectedTabs.length} tab${selectedTabs.length !== 1 ? 's' : ''}`);
});

// ── Export ────────────────────────────────────────────────────
exportBtn.addEventListener('click', () => {
  if (!groups.length) { showToast('Nothing to export'); return; }
  const data = JSON.stringify({ version: 1, app: 'Tabby', groups }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tabby-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Exported successfully');
});

// ── Import ────────────────────────────────────────────────────
importBtn.addEventListener('click', () => importFileInput.click());

importFileInput.addEventListener('change', async () => {
  const file = importFileInput.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    let importedGroups = [];
    if (data.groups && Array.isArray(data.groups)) {
      importedGroups = data.groups;
    } else if (Array.isArray(data)) {
      importedGroups = data;
    } else {
      throw new Error('Unrecognized format');
    }

    // Merge — deduplicate IDs using a counter to avoid same-millisecond collisions
    const existingIds = new Set(groups.map(g => g.id));
    let added = 0;
    let counter = 0;
    importedGroups.forEach(g => {
      if (!g.id || !Array.isArray(g.tabs) || !g.tabs.length) return;
      if (existingIds.has(g.id)) {
        g.id = `g_${Date.now()}_${counter++}`;
      }
      existingIds.add(g.id);
      groups.unshift(g);
      added++;
    });

    await saveGroups();
    renderGroups();
    showToast(`Imported ${added} group${added !== 1 ? 's' : ''}`);
  } catch (err) {
    showToast('Import failed: invalid file');
  }
  importFileInput.value = '';
});

// ── Toast ─────────────────────────────────────────────────────
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
}

// ── Utils ─────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
