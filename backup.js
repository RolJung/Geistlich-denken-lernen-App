// ===== GDL APP BACKUP & SYNC MODULE v1.0 =====
// Datensicherung, Versionierung, Auto-Backup, Wiederherstellung
// „Gott nahe zu sein ist mein Glück" – Psalm 73,28

// ===== ALL STORAGE KEYS =====
const GDL_ALL_KEYS = [
  'gdl_journal',      // Gespräche
  'gdl_mentees',      // Mentees mit Kontakt, Gebeten, Zielen
  'gdl_mentors',      // Notfall-Mentoren
  'gdl_orient',       // Orientierungsdaten
  'gdl_wirk',         // Wirksamkeitsanalyse
  'gdl_crosshair',    // Fadenkreuz-Verlauf
  'gdl_zielplaene',   // Zielplaene
  'gdl_bs_notes',     // Bibelstudien-Notizen
  'gdl_prayer_log',   // Gebet-Tagebuch
  'gdl_cal_events',   // Kalender-Einträge
  'gdl_reflexion',    // Reflexionsdaten
  'gdl_reminders',    // Erinnerungen
  'gdl_notif_queue',  // Benachrichtigungs-Queue
];

// ===== AUTO-BACKUP SYSTEM =====
const BACKUP_KEY = 'gdl_backups';
const MAX_BACKUPS = 10;
const AUTO_BACKUP_INTERVAL = 30 * 60 * 1000; // 30 Minuten

let autoBackupTimer = null;

function createBackup(label = 'auto') {
  const timestamp = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString('de-DE', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });

  const backup = {
    id: Date.now(),
    label,
    timestamp,
    dateStr,
    version: '4.1',
    data: {}
  };

  // Collect all data
  let totalItems = 0;
  GDL_ALL_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) {
      try {
        const parsed = JSON.parse(val);
        backup.data[key] = parsed;
        if (Array.isArray(parsed)) totalItems += parsed.length;
        else totalItems++;
      } catch(e) {
        backup.data[key] = val;
      }
    }
  });

  backup.itemCount = totalItems;
  backup.sizeKB = Math.round(JSON.stringify(backup).length / 1024);

  // Load existing backups
  let backups = [];
  try {
    backups = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
  } catch(e) { backups = []; }

  // Add new backup at beginning
  backups.unshift(backup);

  // Keep only MAX_BACKUPS
  if (backups.length > MAX_BACKUPS) {
    backups = backups.slice(0, MAX_BACKUPS);
  }

  // Save backups
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
    console.log(`[Backup] Created: ${label} (${backup.sizeKB}KB, ${totalItems} items)`);
    return backup;
  } catch(e) {
    console.warn('[Backup] Storage full, trying to save smaller backup...');
    // Try without large data
    backup.data = {};
    ['gdl_journal','gdl_mentees','gdl_zielplaene'].forEach(key => {
      const val = localStorage.getItem(key);
      if (val) try { backup.data[key] = JSON.parse(val); } catch(e) {}
    });
    backups[0] = backup;
    try { localStorage.setItem(BACKUP_KEY, JSON.stringify(backups)); } catch(e) {}
    return backup;
  }
}

function getBackups() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
  } catch(e) { return []; }
}

function restoreBackup(backupId) {
  const backups = getBackups();
  const backup = backups.find(b => b.id === backupId);
  if (!backup) { showToast('❌ Backup nicht gefunden.'); return false; }

  // Create safety backup before restore
  createBackup('vor-wiederherstellung');

  // Restore all data
  let restored = 0;
  Object.entries(backup.data).forEach(([key, value]) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      restored++;
    } catch(e) {}
  });

  // Reload in-memory data
  if (typeof journal !== 'undefined') {
    try { window.journal = JSON.parse(localStorage.getItem('gdl_journal') || '[]'); } catch(e) {}
  }
  if (typeof mentees !== 'undefined') {
    try { window.mentees = JSON.parse(localStorage.getItem('gdl_mentees') || '[]'); } catch(e) {}
  }

  showToast(`✅ Backup wiederhergestellt! ${restored} Datenbereiche geladen.`);
  return true;
}

function deleteBackup(backupId) {
  let backups = getBackups();
  backups = backups.filter(b => b.id !== backupId);
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
}

function startAutoBackup() {
  if (autoBackupTimer) clearInterval(autoBackupTimer);
  autoBackupTimer = setInterval(() => {
    const journal = JSON.parse(localStorage.getItem('gdl_journal') || '[]');
    if (journal.length > 0) {
      createBackup('auto');
    }
  }, AUTO_BACKUP_INTERVAL);
  console.log('[Backup] Auto-backup started (every 30 min)');
}

// ===== EXPORT TO FILE =====
function exportBackupToFile(backupId = null) {
  let exportData;
  const dateStr = new Date().toLocaleDateString('de-DE').replace(/\./g,'-');

  if (backupId) {
    const backups = getBackups();
    const backup = backups.find(b => b.id === backupId);
    if (!backup) { showToast('❌ Backup nicht gefunden.'); return; }
    exportData = {
      version: '4.1',
      exportDate: new Date().toISOString(),
      exportType: 'backup',
      backupLabel: backup.label,
      backupDate: backup.dateStr,
      data: backup.data
    };
  } else {
    // Export current state
    exportData = {
      version: '4.1',
      exportDate: new Date().toISOString(),
      exportType: 'full-export',
      data: {}
    };
    GDL_ALL_KEYS.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) try { exportData.data[key] = JSON.parse(val); } catch(e) {}
    });
  }

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GDL-Backup-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Backup-Datei heruntergeladen!');
}

function importFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.data) { showToast('❌ Ungültige Backup-Datei.'); return; }

      // Create safety backup first
      createBackup('vor-import');

      let importedCount = 0;
      GDL_ALL_KEYS.forEach(key => {
        if (imported.data[key] !== undefined) {
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          const incoming = imported.data[key];
          if (Array.isArray(existing) && Array.isArray(incoming)) {
            const existingIds = new Set(existing.map(e => e.id));
            const newEntries = incoming.filter(e => !existingIds.has(e.id));
            localStorage.setItem(key, JSON.stringify([...newEntries, ...existing]));
            importedCount += newEntries.length;
          } else {
            localStorage.setItem(key, JSON.stringify(incoming));
            importedCount++;
          }
        }
      });

      // Reload data
      if (typeof renderJournal === 'function') renderJournal();
      if (typeof renderMentees === 'function') renderMentees();
      if (typeof updateDataOverview === 'function') updateDataOverview();

      showToast(`✅ Import erfolgreich! ${importedCount} neue Datensätze.`);
      renderBackupPage();
    } catch(err) {
      showToast('❌ Fehler beim Import: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ===== STORAGE ANALYSIS =====
function analyzeStorage() {
  const analysis = {
    keys: [],
    totalItems: 0,
    totalSizeKB: 0,
    backupCount: 0,
  };

  GDL_ALL_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) {
      const sizeKB = Math.round(val.length * 2 / 1024 * 10) / 10;
      let count = 0;
      try {
        const parsed = JSON.parse(val);
        count = Array.isArray(parsed) ? parsed.length : (typeof parsed === 'object' ? Object.keys(parsed).length : 1);
      } catch(e) {}
      analysis.keys.push({ key, sizeKB, count });
      analysis.totalSizeKB += sizeKB;
      analysis.totalItems += count;
    }
  });

  const backups = getBackups();
  analysis.backupCount = backups.length;
  analysis.lastBackup = backups.length > 0 ? backups[0].dateStr : null;
  analysis.totalSizeKB = Math.round(analysis.totalSizeKB * 10) / 10;

  return analysis;
}

// ===== BACKUP PAGE RENDERER =====
function renderBackupPage() {
  const c = document.getElementById('backup_content');
  if (!c) return;

  const backups = getBackups();
  const analysis = analyzeStorage();
  const lsLimit = 5 * 1024; // 5MB in KB
  const usedPct = Math.min(Math.round((analysis.totalSizeKB / lsLimit) * 100), 100);

  const keyLabels = {
    gdl_journal: '💬 Gespräche',
    gdl_mentees: '👥 Mentees',
    gdl_mentors: '📞 Mentoren',
    gdl_orient: '🧭 Orientierung',
    gdl_wirk: '📊 Wirksamkeit',
    gdl_crosshair: '🎯 Fadenkreuz',
    gdl_zielplaene: '🎯 Zielplaene',
    gdl_bs_notes: '📚 Bibelstudien',
    gdl_prayer_log: '🙏 Gebet-Tagebuch',
    gdl_cal_events: '📅 Kalender',
    gdl_reflexion: '🧭 Reflexion',
    gdl_reminders: '🔔 Erinnerungen',
    gdl_backups: '💾 Backups',
  };

  c.innerHTML = `
    <!-- Storage Overview -->
    <div style="background:linear-gradient(135deg,#1a3d1c,#2c5f2e);color:white;border-radius:10px;padding:16px;margin-bottom:14px;">
      <div style="font-weight:700;font-size:.9rem;margin-bottom:8px;">💾 Speicher-Übersicht</div>
      <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:5px;">
        <span>Verwendet: <strong>${analysis.totalSizeKB} KB</strong></span>
        <span>Limit: <strong>5.120 KB</strong></span>
        <span>Frei: <strong>${Math.max(0, lsLimit - analysis.totalSizeKB).toFixed(0)} KB</strong></span>
      </div>
      <div style="height:10px;background:rgba(255,255,255,.2);border-radius:5px;overflow:hidden;margin-bottom:8px;">
        <div style="width:${usedPct}%;height:100%;background:${usedPct>80?'#e74c3c':usedPct>60?'#f39c12':'#c8a84b'};border-radius:5px;transition:width .5s;"></div>
      </div>
      <div style="font-size:.75rem;opacity:.8;">${usedPct}% belegt · ${analysis.totalItems} Datensätze · ${analysis.backupCount} Backups gespeichert</div>
      ${analysis.lastBackup ? `<div style="font-size:.75rem;opacity:.7;margin-top:3px;">Letztes Backup: ${analysis.lastBackup}</div>` : ''}
    </div>

    <!-- Quick Actions -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
      <div style="background:#e8f0e8;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:1.8rem;margin-bottom:6px;">💾</div>
        <strong style="font-size:.86rem;color:var(--primary-dark);">Backup erstellen</strong>
        <p style="font-size:.75rem;color:var(--text-light);margin:5px 0;">Alle Daten jetzt sichern</p>
        <button class="btn btn-primary btn-sm" onclick="createBackup('manuell');renderBackupPage();showToast('✅ Backup erstellt!')" style="width:100%;margin-top:4px;">💾 Jetzt sichern</button>
      </div>
      <div style="background:#e8f4fd;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:1.8rem;margin-bottom:6px;">📤</div>
        <strong style="font-size:.86rem;color:var(--primary-dark);">Exportieren</strong>
        <p style="font-size:.75rem;color:var(--text-light);margin:5px 0;">Als JSON-Datei speichern</p>
        <button class="btn btn-outline btn-sm" onclick="exportBackupToFile()" style="width:100%;margin-top:4px;">📤 Export (.json)</button>
      </div>
      <div style="background:#f5f0f8;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:1.8rem;margin-bottom:6px;">📥</div>
        <strong style="font-size:.86rem;color:var(--primary-dark);">Importieren</strong>
        <p style="font-size:.75rem;color:var(--text-light);margin:5px 0;">Backup-Datei laden</p>
        <label class="btn btn-outline btn-sm" style="width:100%;margin-top:4px;cursor:pointer;justify-content:center;background:#f5f0f8;border-color:#6b3d8a;color:#6b3d8a;">
          📥 Import wählen
          <input type="file" accept=".json" onchange="importFromFile(event)" style="display:none;">
        </label>
      </div>
      <div style="background:#fdf0f0;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:1.8rem;margin-bottom:6px;">🗑️</div>
        <strong style="font-size:.86rem;color:var(--primary-dark);">Alle Daten löschen</strong>
        <p style="font-size:.75rem;color:var(--text-light);margin:5px 0;">Erst exportieren!</p>
        <button class="btn btn-danger btn-sm" onclick="clearAllData()" style="width:100%;margin-top:4px;">🗑️ Alles löschen</button>
      </div>
    </div>

    <!-- Auto-Backup Status -->
    <div style="background:#fef9e7;border-radius:10px;padding:12px;margin-bottom:14px;border-left:4px solid #f39c12;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div>
          <strong style="font-size:.86rem;color:#7d6608;">🔄 Auto-Backup</strong>
          <p style="font-size:.78rem;color:#7d6608;margin-top:2px;">Automatisch alle 30 Minuten (wenn Daten vorhanden)</p>
        </div>
        <span style="padding:4px 12px;border-radius:20px;background:#27ae60;color:white;font-size:.75rem;font-weight:700;">✅ Aktiv</span>
      </div>
    </div>

    <!-- Data Breakdown -->
    <div style="background:white;border-radius:10px;padding:14px;margin-bottom:14px;border:1px solid var(--border);">
      <strong style="font-size:.86rem;color:var(--primary-dark);">📊 Daten-Übersicht</strong>
      <div style="margin-top:10px;display:grid;gap:5px;">
        ${analysis.keys.map(k => `
          <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f0ebe0;">
            <span style="font-size:.82rem;flex:1;">${keyLabels[k.key]||k.key}</span>
            <span style="font-size:.75rem;color:var(--text-light);">${k.count} Einträge</span>
            <span style="font-size:.72rem;padding:2px 7px;border-radius:20px;background:#f5f0e8;color:#666;">${k.sizeKB} KB</span>
          </div>`).join('')}
      </div>
    </div>

    <!-- Backup History -->
    <div style="background:white;border-radius:10px;padding:14px;border:1px solid var(--border);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong style="font-size:.86rem;color:var(--primary-dark);">📋 Backup-Verlauf (${backups.length}/${MAX_BACKUPS})</strong>
        ${backups.length > 0 ? `<button class="btn btn-danger btn-sm" onclick="if(confirm('Alle Backups löschen?')){localStorage.removeItem('${BACKUP_KEY}');renderBackupPage();}">🗑 Alle löschen</button>` : ''}
      </div>
      ${backups.length === 0 ? '<p style="font-size:.82rem;color:var(--text-light);font-style:italic;text-align:center;padding:16px;">Noch keine Backups. Erstelle jetzt dein erstes Backup!</p>' :
        backups.map(b => `
          <div style="padding:10px 12px;border-radius:8px;background:#fafaf5;border-left:4px solid ${b.label==='auto'?'#c8a84b':b.label==='manuell'?'#2c5f2e':'#1a4a7a'};margin-bottom:7px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
              <div>
                <span style="font-size:.82rem;font-weight:700;">${b.label==='auto'?'🔄 Auto':b.label==='manuell'?'💾 Manuell':'🔵 '+b.label}</span>
                <span style="font-size:.75rem;color:var(--text-light);margin-left:8px;">📅 ${b.dateStr}</span>
              </div>
              <div style="display:flex;gap:5px;align-items:center;">
                <span style="font-size:.72rem;padding:2px 7px;border-radius:20px;background:#f5f0e8;color:#666;">${b.sizeKB||'?'} KB · ${b.itemCount||'?'} Einträge</span>
                <button class="btn btn-secondary btn-sm" style="padding:3px 8px;" onclick="exportBackupToFile(${b.id})">📤</button>
                <button class="btn btn-primary btn-sm" style="padding:3px 8px;" onclick="if(confirm('Backup vom ${b.dateStr} wiederherstellen?\\n\\nAktuelle Daten werden gesichert.')){restoreBackup(${b.id});renderBackupPage();}">↩️</button>
                <button class="btn btn-danger btn-sm" style="padding:3px 8px;" onclick="deleteBackup(${b.id});renderBackupPage();">🗑</button>
              </div>
            </div>
          </div>`).join('')}
    </div>

    <!-- Backup Strategy Info -->
    <div style="margin-top:14px;background:#f5f0e8;border-radius:10px;padding:14px;">
      <strong style="font-size:.86rem;color:var(--primary-dark);">💡 Empfohlene Backup-Strategie</strong>
      <div style="margin-top:10px;display:grid;gap:8px;">
        <div style="padding:8px 10px;background:white;border-radius:6px;border-left:3px solid #27ae60;font-size:.8rem;">
          <strong>✅ Täglich:</strong> Auto-Backup läuft automatisch alle 30 Min.
        </div>
        <div style="padding:8px 10px;background:white;border-radius:6px;border-left:3px solid #c8a84b;font-size:.8rem;">
          <strong>📅 Wöchentlich:</strong> Manuelles Backup + Export als JSON-Datei auf Computer/Cloud speichern.
        </div>
        <div style="padding:8px 10px;background:white;border-radius:6px;border-left:3px solid #1a4a7a;font-size:.8rem;">
          <strong>📱 Vor Gerätewechsel:</strong> Export → auf neuem Gerät importieren → altes Gerät löschen.
        </div>
        <div style="padding:8px 10px;background:white;border-radius:6px;border-left:3px solid #8B2020;font-size:.8rem;">
          <strong>⚠️ Vor iOS-Update:</strong> Immer exportieren! iOS kann PWA-Daten bei Updates löschen.
        </div>
      </div>
    </div>
  `;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Start auto-backup
  startAutoBackup();

  // Create initial backup if data exists
  setTimeout(() => {
    const journal = JSON.parse(localStorage.getItem('gdl_journal') || '[]');
    const backups = getBackups();
    if (journal.length > 0 && backups.length === 0) {
      createBackup('initial');
    }
  }, 5000);

  console.log('[Backup] Module initialized');
});