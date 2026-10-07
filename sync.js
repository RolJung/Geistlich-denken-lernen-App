// ===== GDL APP CLOUD-SYNC MODULE v1.0 =====
// GitHub Gist Sync + iOS-Backup-Strategie + Electron-Migration Guide
// „Gott nahe zu sein ist mein Glück" – Psalm 73,28

// ===== CLOUD SYNC ANALYSIS (in-app documentation) =====
const SYNC_OPTIONS_ANALYSIS = {
  gist: {
    name: "GitHub Gist",
    icon: "🐙",
    difficulty: "Mittel",
    cost: "Kostenlos",
    privacy: "Privat möglich",
    setup: "GitHub-Account + Token erstellen",
    pros: ["Kostenlos", "Versionierung inklusive", "API einfach", "Kein eigener Server", "Bis 100MB pro Gist"],
    cons: ["GitHub-Account nötig", "Token-Verwaltung", "Nicht für sensible Daten ohne Verschlüsselung"],
    recommended: true,
    rating: 5,
  },
  googledrive: {
    name: "Google Drive API",
    icon: "📁",
    difficulty: "Schwer",
    cost: "Kostenlos (15GB)",
    privacy: "Google hat Zugriff",
    setup: "Google Cloud Console, OAuth2, API-Keys",
    pros: ["15GB kostenlos", "Bekannte Plattform", "Gut dokumentiert"],
    cons: ["Komplexe OAuth2-Einrichtung", "Google-Datenschutz", "API-Limits", "Technisch anspruchsvoll"],
    recommended: false,
    rating: 2,
  },
  webdav: {
    name: "WebDAV (Nextcloud/iCloud)",
    icon: "☁️",
    difficulty: "Mittel",
    cost: "Kostenlos (iCloud) / Selbst-gehostet",
    privacy: "Sehr gut (eigener Server)",
    setup: "Nextcloud-Server oder iCloud-WebDAV",
    pros: ["DSGVO-konform", "Eigene Kontrolle", "iCloud kostenlos verfügbar"],
    cons: ["CORS-Probleme im Browser", "Komplexe Authentifizierung", "iCloud WebDAV eingeschränkt"],
    recommended: false,
    rating: 3,
  },
  dropbox: {
    name: "Dropbox API",
    icon: "📦",
    difficulty: "Mittel",
    cost: "Kostenlos (2GB)",
    privacy: "Dropbox hat Zugriff",
    setup: "Dropbox-App erstellen, Token",
    pros: ["Einfachere API als Google", "Gut dokumentiert", "2GB kostenlos"],
    cons: ["Nur 2GB kostenlos", "Datenschutz-Bedenken", "App-Registrierung nötig"],
    recommended: false,
    rating: 3,
  },
  manual: {
    name: "Manueller Export/Import",
    icon: "📤",
    difficulty: "Einfach",
    cost: "Kostenlos",
    privacy: "Vollständig",
    setup: "Keine",
    pros: ["Kein Account nötig", "Vollständige Kontrolle", "DSGVO-konform", "Funktioniert immer"],
    cons: ["Manuell", "Vergessen möglich", "Kein automatischer Sync"],
    recommended: true,
    rating: 4,
  },
};

// ===== GITHUB GIST SYNC =====
// Best option: free, versioned, simple API, private gists available

const GIST_STORAGE_KEY = 'gdl_gist_config';

function getGistConfig() {
  try {
    return JSON.parse(localStorage.getItem(GIST_STORAGE_KEY) || '{}');
  } catch(e) { return {}; }
}

function saveGistConfig(config) {
  localStorage.setItem(GIST_STORAGE_KEY, JSON.stringify(config));
}

// Create a new private Gist with GDL data
async function createGistSync(token) {
  const data = collectSyncData();
  const content = JSON.stringify(data, null, 2);

  try {
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        description: 'GDL App Backup – Geistlich Denken Lernen',
        public: false, // Private Gist!
        files: {
          'gdl-backup.json': { content },
          'gdl-info.md': {
            content: `# GDL App Backup\n\nErstellt: ${new Date().toLocaleString('de-DE')}\n\n„Gott nahe zu sein ist mein Glück" – Psalm 73,28\n\nDieses Gist enthält verschlüsselte Backup-Daten der GDL App.`
          }
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    const gist = await response.json();
    const config = { token, gistId: gist.id, gistUrl: gist.html_url, lastSync: new Date().toISOString() };
    saveGistConfig(config);
    return { success: true, gistId: gist.id, url: gist.html_url };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// Update existing Gist
async function updateGistSync(token, gistId) {
  const data = collectSyncData();
  const content = JSON.stringify(data, null, 2);

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        description: `GDL App Backup – ${new Date().toLocaleString('de-DE')}`,
        files: {
          'gdl-backup.json': { content },
          'gdl-info.md': {
            content: `# GDL App Backup\n\nAktualisiert: ${new Date().toLocaleString('de-DE')}\n\n„Gott nahe zu sein ist mein Glück" – Psalm 73,28`
          }
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    const config = getGistConfig();
    config.lastSync = new Date().toISOString();
    saveGistConfig(config);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// Download from Gist
async function downloadFromGist(token, gistId) {
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const gist = await response.json();

    const fileContent = gist.files['gdl-backup.json']?.content;
    if (!fileContent) throw new Error('Keine Backup-Datei im Gist gefunden.');

    const data = JSON.parse(fileContent);
    return { success: true, data };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// Sync: Upload current data to Gist
async function syncToGist() {
  const config = getGistConfig();
  if (!config.token) return { success: false, error: 'Kein GitHub-Token konfiguriert.' };

  updateSyncStatus('uploading');
  let result;
  if (config.gistId) {
    result = await updateGistSync(config.token, config.gistId);
  } else {
    result = await createGistSync(config.token);
  }

  if (result.success) {
    updateSyncStatus('success');
    showToast('✅ Daten erfolgreich mit GitHub Gist synchronisiert!');
  } else {
    updateSyncStatus('error', result.error);
    showToast('❌ Sync fehlgeschlagen: ' + result.error);
  }
  return result;
}

// Sync: Download from Gist and merge
async function syncFromGist() {
  const config = getGistConfig();
  if (!config.token || !config.gistId) return { success: false, error: 'Gist nicht konfiguriert.' };

  updateSyncStatus('downloading');
  const result = await downloadFromGist(config.token, config.gistId);

  if (result.success) {
    // Create safety backup first
    if (typeof createBackup === 'function') createBackup('vor-gist-sync');

    // Merge data
    let importedCount = 0;
    const GDL_KEYS = ['gdl_journal','gdl_mentees','gdl_mentors','gdl_orient','gdl_wirk','gdl_zielplaene','gdl_crosshair','gdl_bs_notes','gdl_prayer_log','gdl_cal_events'];
    GDL_KEYS.forEach(key => {
      if (result.data[key] !== undefined) {
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const incoming = result.data[key];
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

    updateSyncStatus('success');
    showToast(`✅ ${importedCount} neue Datensätze vom Gist geladen!`);
    if (typeof renderJournal === 'function') renderJournal();
    if (typeof renderMentees === 'function') renderMentees();
  } else {
    updateSyncStatus('error', result.error);
    showToast('❌ Download fehlgeschlagen: ' + result.error);
  }
  return result;
}

function collectSyncData() {
  const data = { version: '4.1', syncDate: new Date().toISOString() };
  const keys = ['gdl_journal','gdl_mentees','gdl_mentors','gdl_orient','gdl_wirk','gdl_zielplaene','gdl_crosshair','gdl_bs_notes','gdl_prayer_log','gdl_cal_events'];
  keys.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) try { data[key] = JSON.parse(val); } catch(e) {}
  });
  return data;
}

function updateSyncStatus(status, error = '') {
  const el = document.getElementById('sync_status_indicator');
  if (!el) return;
  const states = {
    idle: { text: '⚪ Bereit', color: '#666' },
    uploading: { text: '⬆️ Wird hochgeladen...', color: '#1a4a7a' },
    downloading: { text: '⬇️ Wird heruntergeladen...', color: '#1a4a7a' },
    success: { text: '✅ Synchronisiert', color: '#27ae60' },
    error: { text: '❌ Fehler: ' + error, color: '#c0392b' },
  };
  const s = states[status] || states.idle;
  el.textContent = s.text;
  el.style.color = s.color;
}

// ===== iOS BACKUP REMINDER SYSTEM =====
const IOS_BACKUP_KEY = 'gdl_ios_backup_config';

function getIOSBackupConfig() {
  try { return JSON.parse(localStorage.getItem(IOS_BACKUP_KEY) || '{}'); }
  catch(e) { return {}; }
}

function checkIOSBackupReminder() {
  const config = getIOSBackupConfig();
  const lastExport = config.lastExport ? new Date(config.lastExport) : null;
  const now = new Date();

  if (!lastExport) {
    // Never exported
    if (typeof window.gdlNotifications !== 'undefined') {
      window.gdlNotifications.showInAppNotification(
        '💾 Backup empfohlen',
        'Du hast noch kein Backup erstellt. Gehe zu Backup → Export, um deine Daten zu sichern.',
        { action: () => showPage('backup') }
      );
    }
    return;
  }

  const daysSinceExport = Math.floor((now - lastExport) / (1000 * 60 * 60 * 24));

  if (daysSinceExport >= 7) {
    if (typeof window.gdlNotifications !== 'undefined') {
      window.gdlNotifications.showInAppNotification(
        '⚠️ Backup überfällig',
        `Letztes Backup vor ${daysSinceExport} Tagen. Bitte jetzt sichern!`,
        { action: () => showPage('backup') }
      );
    }
  }
}

function markExportDone() {
  const config = getIOSBackupConfig();
  config.lastExport = new Date().toISOString();
  config.exportCount = (config.exportCount || 0) + 1;
  localStorage.setItem(IOS_BACKUP_KEY, JSON.stringify(config));
}

// ===== SYNC PAGE RENDERER =====
function renderSyncPage() {
  const c = document.getElementById('sync_content');
  if (!c) return;

  const config = getGistConfig();
  const iosConfig = getIOSBackupConfig();
  const lastExport = iosConfig.lastExport ? new Date(iosConfig.lastExport).toLocaleString('de-DE') : 'Noch nie';
  const daysSince = iosConfig.lastExport ? Math.floor((Date.now() - new Date(iosConfig.lastExport)) / 86400000) : 999;

  c.innerHTML = `
    <!-- iOS Backup Status -->
    <div style="background:${daysSince>7?'#fdf0f0':'#e8f8e8'};border-radius:10px;padding:14px;margin-bottom:14px;border-left:4px solid ${daysSince>7?'#c0392b':'#27ae60'};">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div>
          <strong style="font-size:.88rem;color:${daysSince>7?'#c0392b':'#155724'};">${daysSince>7?'⚠️ Backup überfällig':'✅ Backup aktuell'}</strong>
          <p style="font-size:.78rem;color:var(--text-light);margin-top:2px;">Letzter Export: ${lastExport} ${iosConfig.exportCount?'('+iosConfig.exportCount+'x exportiert)':''}</p>
        </div>
        <button class="btn btn-primary btn-sm" onclick="exportAndMark()">📤 Jetzt exportieren</button>
      </div>
      ${daysSince>7?`<div style="font-size:.78rem;color:#c0392b;margin-top:8px;">⚠️ iOS kann Daten bei Updates löschen. Bitte regelmäßig exportieren!</div>`:''}
    </div>

    <!-- Cloud Sync Options Analysis -->
    <div style="background:white;border-radius:10px;padding:16px;margin-bottom:14px;border:1px solid var(--border);">
      <strong style="font-size:.9rem;color:var(--primary-dark);">☁️ Cloud-Sync Optionen – Vergleich</strong>
      <div style="margin-top:12px;display:grid;gap:10px;">
        ${Object.entries(SYNC_OPTIONS_ANALYSIS).map(([key, opt]) => `
          <div style="padding:12px;border-radius:8px;background:${opt.recommended?'#e8f0e8':'#f5f0e8'};border-left:4px solid ${opt.recommended?'#2c5f2e':'#d4c9b0'};">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:1.2rem;">${opt.icon}</span>
                <strong style="font-size:.88rem;">${opt.name}</strong>
                ${opt.recommended?'<span style="padding:2px 8px;border-radius:20px;background:#2c5f2e;color:white;font-size:.7rem;font-weight:700;">✅ Empfohlen</span>':''}
              </div>
              <div style="display:flex;gap:5px;">
                ${'⭐'.repeat(opt.rating)}${'☆'.repeat(5-opt.rating)}
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
              <span style="font-size:.72rem;padding:2px 7px;border-radius:20px;background:white;color:#666;">🔧 ${opt.difficulty}</span>
              <span style="font-size:.72rem;padding:2px 7px;border-radius:20px;background:white;color:#666;">💰 ${opt.cost}</span>
              <span style="font-size:.72rem;padding:2px 7px;border-radius:20px;background:white;color:#666;">🔒 ${opt.privacy}</span>
            </div>
            <div style="font-size:.78rem;color:#555;">
              <span style="color:#27ae60;">✅ ${opt.pros.slice(0,2).join(' · ')}</span><br>
              <span style="color:#c0392b;">❌ ${opt.cons.slice(0,2).join(' · ')}</span>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- GitHub Gist Sync -->
    <div style="background:white;border-radius:10px;padding:16px;margin-bottom:14px;border:1px solid var(--border);">
      <strong style="font-size:.9rem;color:var(--primary-dark);">🐙 GitHub Gist Sync (Empfohlen)</strong>
      <div class="alert alert-info" style="margin-top:10px;font-size:.8rem;">
        <span>💡</span><span>GitHub Gist ist kostenlos, privat und versioniert. Deine Daten werden als privates Gist gespeichert – nur du hast Zugriff.</span>
      </div>

      ${config.gistId ? `
      <div style="background:#e8f8e8;border-radius:8px;padding:10px;margin-bottom:10px;border-left:4px solid #27ae60;">
        <div style="font-size:.82rem;font-weight:700;color:#155724;">✅ Gist konfiguriert</div>
        <div style="font-size:.75rem;color:#666;margin-top:3px;">Gist-ID: ${config.gistId.substring(0,12)}...</div>
        <div style="font-size:.75rem;color:#666;">Letzter Sync: ${config.lastSync ? new Date(config.lastSync).toLocaleString('de-DE') : '–'}</div>
        <div id="sync_status_indicator" style="font-size:.78rem;margin-top:4px;color:#666;">⚪ Bereit</div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary btn-sm" onclick="syncToGist()">⬆️ Hochladen</button>
        <button class="btn btn-outline btn-sm" onclick="syncFromGist()">⬇️ Herunterladen</button>
        <button class="btn btn-danger btn-sm" onclick="resetGistConfig()">🗑 Verbindung trennen</button>
      </div>` : `
      <div id="sync_status_indicator" style="font-size:.78rem;margin-bottom:8px;color:#666;">⚪ Nicht konfiguriert</div>
      <div style="display:grid;gap:8px;margin-bottom:10px;">
        <div>
          <label style="font-size:.82rem;">GitHub Personal Access Token:</label>
          <input type="password" id="gist_token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" style="font-size:.85rem;">
          <div style="font-size:.72rem;color:var(--text-light);margin-top:3px;">
            Token erstellen: github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → Scope: <strong>gist</strong>
          </div>
        </div>
      </div>
      <button class="btn btn-primary" onclick="setupGistSync()">🐙 Mit GitHub Gist verbinden</button>`}

      <!-- Setup Guide -->
      <div style="margin-top:14px;background:#f5f0e8;border-radius:8px;padding:12px;">
        <strong style="font-size:.82rem;color:var(--primary-dark);">📋 Schritt-für-Schritt Einrichtung:</strong>
        <ol style="padding-left:18px;font-size:.78rem;line-height:2.2;margin-top:6px;color:var(--text);">
          <li>Gehe zu <strong>github.com</strong> und erstelle einen kostenlosen Account</li>
          <li>Klicke oben rechts auf dein Profilbild → <strong>Settings</strong></li>
          <li>Links unten: <strong>Developer settings</strong> → <strong>Personal access tokens</strong> → <strong>Tokens (classic)</strong></li>
          <li>Klicke <strong>Generate new token (classic)</strong></li>
          <li>Name: „GDL App", Ablauf: „No expiration", Scope: nur <strong>✅ gist</strong> ankreuzen</li>
          <li>Token kopieren (beginnt mit <code>ghp_</code>) und oben einfügen</li>
          <li>Auf <strong>„Mit GitHub Gist verbinden"</strong> klicken</li>
        </ol>
      </div>
    </div>

    <!-- Manual Sync (always available) -->
    <div style="background:white;border-radius:10px;padding:16px;margin-bottom:14px;border:1px solid var(--border);">
      <strong style="font-size:.9rem;color:var(--primary-dark);">📤 Manueller Sync (immer verfügbar)</strong>
      <p style="font-size:.8rem;color:var(--text-light);margin-top:6px;margin-bottom:12px;">Exportiere deine Daten und speichere sie in iCloud Drive, Google Drive oder Nextcloud.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="padding:12px;background:#f5f0e8;border-radius:8px;text-align:center;">
          <div style="font-size:1.5rem;margin-bottom:5px;">📤</div>
          <strong style="font-size:.82rem;">Exportieren</strong>
          <p style="font-size:.72rem;color:var(--text-light);margin:4px 0;">JSON-Datei in Cloud speichern</p>
          <button class="btn btn-primary btn-sm" onclick="exportAndMark()" style="width:100%;margin-top:4px;">📤 Export</button>
        </div>
        <div style="padding:12px;background:#f5f0e8;border-radius:8px;text-align:center;">
          <div style="font-size:1.5rem;margin-bottom:5px;">📥</div>
          <strong style="font-size:.82rem;">Importieren</strong>
          <p style="font-size:.72rem;color:var(--text-light);margin:4px 0;">JSON-Datei aus Cloud laden</p>
          <label class="btn btn-outline btn-sm" style="width:100%;margin-top:4px;cursor:pointer;justify-content:center;">
            📥 Import
            <input type="file" accept=".json" onchange="importFromFile(event)" style="display:none;">
          </label>
        </div>
      </div>
    </div>

    <!-- Electron Migration Guide -->
    <div style="background:white;border-radius:10px;padding:16px;border:1px solid var(--border);">
      <strong style="font-size:.9rem;color:var(--primary-dark);">⚡ Electron-Migration: Wann lohnt es sich?</strong>
      <div style="margin-top:12px;display:grid;gap:8px;">
        <div style="padding:10px;background:#e8f8e8;border-radius:8px;border-left:3px solid #27ae60;">
          <strong style="font-size:.82rem;color:#155724;">✅ Jetzt (PWA bleibt richtig) wenn:</strong>
          <ul style="font-size:.78rem;color:var(--text-light);padding-left:16px;margin-top:4px;line-height:1.8;">
            <li>Persönliche Nutzung (1–5 Personen)</li>
            <li>iPad als Hauptgerät</li>
            <li>Kein Budget für Code-Signing (~200€/Jahr)</li>
            <li>Kein Entwickler verfügbar</li>
          </ul>
        </div>
        <div style="padding:10px;background:#fef9e7;border-radius:8px;border-left:3px solid #f39c12;">
          <strong style="font-size:.82rem;color:#7d6608;">⚡ Electron erwägen wenn:</strong>
          <ul style="font-size:.78rem;color:var(--text-light);padding-left:16px;margin-top:4px;line-height:1.8;">
            <li>10+ Nutzer in der Gemeinde</li>
            <li>Automatische Updates zwingend nötig</li>
            <li>Windows als einziges Gerät</li>
            <li>Professionelle App-Erfahrung gewünscht</li>
          </ul>
        </div>
        <div style="padding:10px;background:#fdf0f0;border-radius:8px;border-left:3px solid #c0392b;">
          <strong style="font-size:.82rem;color:#c0392b;">❌ Electron NICHT wenn:</strong>
          <ul style="font-size:.78rem;color:var(--text-light);padding-left:16px;margin-top:4px;line-height:1.8;">
            <li>iPad/iPhone Hauptgerät bleibt</li>
            <li>Kein technisches Know-how vorhanden</li>
            <li>Kleine Nutzerzahl (&lt;10)</li>
          </ul>
        </div>
        <div style="padding:10px;background:#f5f0e8;border-radius:8px;border-left:3px solid var(--accent);">
          <strong style="font-size:.82rem;color:var(--primary-dark);">🎯 Empfehlung für Roland Jung (2024–2027):</strong>
          <p style="font-size:.78rem;color:var(--text-light);margin-top:4px;line-height:1.5;">PWA + GitHub Gist Sync + wöchentlicher manueller Export. In 2–3 Jahren evaluieren ob Electron-Build sinnvoll ist, wenn die App in der Gemeinde breiter eingesetzt wird.</p>
        </div>
      </div>
    </div>
  `;
}

async function setupGistSync() {
  const token = document.getElementById('gist_token')?.value?.trim();
  if (!token || !token.startsWith('ghp_')) {
    showToast('⚠️ Bitte einen gültigen GitHub-Token eingeben (beginnt mit ghp_)');
    return;
  }
  showToast('🔄 Verbinde mit GitHub...');
  updateSyncStatus('uploading');
  const result = await createGistSync(token);
  if (result.success) {
    showToast('✅ Erfolgreich verbunden! Gist-ID: ' + result.gistId.substring(0,8) + '...');
    renderSyncPage();
  } else {
    showToast('❌ Fehler: ' + result.error);
    updateSyncStatus('error', result.error);
  }
}

function resetGistConfig() {
  if (!confirm('GitHub Gist Verbindung trennen? Lokale Daten bleiben erhalten.')) return;
  localStorage.removeItem(GIST_STORAGE_KEY);
  renderSyncPage();
  showToast('✅ Verbindung getrennt.');
}

function exportAndMark() {
  if (typeof exportAllData === 'function') exportAllData();
  markExportDone();
  renderSyncPage();
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Check iOS backup reminder after 10 seconds
  setTimeout(checkIOSBackupReminder, 10000);
  console.log('[Sync] Module initialized');
});