// ===== GDL APP AUTO-UPDATE & PC-TRANSFER MODULE v1.0 =====
// Automatische Update-Pruefung + PC-Uebertragungsassistent
// „Gott nahe zu sein ist mein Glueck" – Psalm 73,28

// ===== CONFIGURATION =====
const GDL_VERSION = '4.2';
const GDL_VERSION_DATE = '2026-10-07';

// Update-Server: GitHub Releases (kein Account fuer Nutzer noetig!)
// Roland Jung laedt neue Versionen auf GitHub hoch
// Nutzer bekommen automatisch Benachrichtigung
const UPDATE_CHECK_URL = 'https://api.github.com/repos/gdl-app/gdl-seelsorge/releases/latest';
// Fallback: eigene version.json (kann auf jedem Webserver liegen)
const UPDATE_FALLBACK_URL = 'https://raw.githubusercontent.com/gdl-app/gdl-seelsorge/main/version.json';

const UPDATE_CHECK_KEY = 'gdl_update_config';
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 Stunden

// ===== VERSION COMPARISON =====
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

// ===== AUTO-UPDATE CHECKER =====
async function checkForUpdates(silent = true) {
  const config = JSON.parse(localStorage.getItem(UPDATE_CHECK_KEY) || '{}');
  const now = Date.now();

  // Don't check too often
  if (silent && config.lastCheck && (now - config.lastCheck) < UPDATE_CHECK_INTERVAL) {
    return null;
  }

  try {
    // Try GitHub API first
    let updateInfo = null;

    try {
      const response = await fetch(UPDATE_CHECK_URL, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        const release = await response.json();
        const latestVersion = release.tag_name.replace('v', '');
        updateInfo = {
          version: latestVersion,
          date: release.published_at ? release.published_at.split('T')[0] : '',
          notes: release.body || '',
          downloadUrl: release.html_url,
          assets: (release.assets || []).map(a => ({
            name: a.name,
            url: a.browser_download_url,
            size: a.size,
          })),
        };
      }
    } catch(e) {
      // GitHub API failed, try fallback
      try {
        const response2 = await fetch(UPDATE_FALLBACK_URL, {
          signal: AbortSignal.timeout(5000)
        });
        if (response2.ok) {
          updateInfo = await response2.json();
        }
      } catch(e2) {
        // Both failed - offline or no server configured
      }
    }

    // Save check time
    config.lastCheck = now;
    localStorage.setItem(UPDATE_CHECK_KEY, JSON.stringify(config));

    if (!updateInfo) return null;

    // Compare versions
    const isNewer = compareVersions(updateInfo.version, GDL_VERSION) > 0;
    if (isNewer) {
      config.availableVersion = updateInfo.version;
      config.updateInfo = updateInfo;
      localStorage.setItem(UPDATE_CHECK_KEY, JSON.stringify(config));

      if (!silent) {
        showUpdateNotification(updateInfo);
      } else {
        // Show subtle notification
        setTimeout(() => showUpdateBanner(updateInfo), 3000);
      }
      return updateInfo;
    }

    return null;
  } catch(e) {
    console.log('[Update] Check failed:', e.message);
    return null;
  }
}

function showUpdateBanner(info) {
  // Remove existing banner
  const existing = document.getElementById('gdl_update_banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'gdl_update_banner';
  banner.style.cssText = `
    position:fixed;top:0;left:0;right:0;
    background:linear-gradient(135deg,#1a4a7a,#2a6aaa);
    color:white;padding:10px 16px;z-index:9997;
    display:flex;align-items:center;justify-content:space-between;
    flex-wrap:wrap;gap:8px;font-size:.84rem;
    box-shadow:0 2px 10px rgba(0,0,0,.3);
  `;
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:1.2rem;">🔄</span>
      <div>
        <strong>Update verfügbar: GDL App v${info.version}</strong>
        <div style="font-size:.75rem;opacity:.85;">Neue Version mit Verbesserungen</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="showUpdateDetails()" style="background:#c8a84b;color:#1a3d1c;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:700;font-size:.82rem;">Details</button>
      <button onclick="document.getElementById('gdl_update_banner').remove()" style="background:rgba(255,255,255,.2);color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:.82rem;">✕</button>
    </div>
  `;
  document.body.prepend(banner);
}

function showUpdateNotification(info) {
  if (typeof window.gdlNotifications !== 'undefined') {
    window.gdlNotifications.showInAppNotification(
      `🔄 Update verfügbar: v${info.version}`,
      'Neue Version der GDL App ist verfügbar. Gehe zu Einstellungen → Update.',
      { action: () => showPage('update') }
    );
  }
}

function showUpdateDetails() {
  const config = JSON.parse(localStorage.getItem(UPDATE_CHECK_KEY) || '{}');
  const info = config.updateInfo;
  if (!info) return;
  showPage('update');
  const banner = document.getElementById('gdl_update_banner');
  if (banner) banner.remove();
}

// ===== UPDATE PAGE RENDERER =====
function renderUpdatePage() {
  const c = document.getElementById('update_content');
  if (!c) return;

  const config = JSON.parse(localStorage.getItem(UPDATE_CHECK_KEY) || '{}');
  const hasUpdate = config.availableVersion && compareVersions(config.availableVersion, GDL_VERSION) > 0;
  const info = config.updateInfo || {};
  const lastCheck = config.lastCheck ? new Date(config.lastCheck).toLocaleString('de-DE') : 'Noch nie';

  c.innerHTML = `
    <!-- Current Version -->
    <div style="background:linear-gradient(135deg,#1a3d1c,#2c5f2e);color:white;border-radius:10px;padding:16px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-size:.82rem;opacity:.8;">Installierte Version</div>
          <div style="font-size:1.4rem;font-weight:700;">GDL App v${GDL_VERSION}</div>
          <div style="font-size:.75rem;opacity:.7;">Stand: ${GDL_VERSION_DATE}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:.75rem;opacity:.7;">Letzte Prüfung: ${lastCheck}</div>
          <button class="btn btn-secondary btn-sm" onclick="checkForUpdates(false).then(r=>renderUpdatePage())" style="margin-top:6px;">🔄 Jetzt prüfen</button>
        </div>
      </div>
    </div>

    ${hasUpdate ? `
    <!-- Update Available -->
    <div style="background:#e8f4fd;border-radius:10px;padding:16px;margin-bottom:14px;border:2px solid #1a4a7a;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <span style="font-size:2rem;">🔄</span>
        <div style="flex:1;">
          <strong style="font-size:.95rem;color:#1a4a7a;">Update verfügbar: v${info.version}</strong>
          <div style="font-size:.78rem;color:#666;margin-top:3px;">Veröffentlicht: ${info.date||'–'}</div>
          ${info.notes ? `<div style="font-size:.8rem;color:#333;margin-top:8px;background:white;border-radius:6px;padding:8px;max-height:100px;overflow-y:auto;">${info.notes.substring(0,300)}</div>` : ''}
          <div class="btn-row" style="margin-top:10px;">
            ${info.downloadUrl ? `<a href="${info.downloadUrl}" target="_blank" class="btn btn-primary btn-sm">📥 Update herunterladen</a>` : ''}
            <button class="btn btn-outline btn-sm" onclick="showUpdateInstructions()">📋 Anleitung</button>
          </div>
        </div>
      </div>
    </div>` : `
    <!-- Up to date -->
    <div style="background:#e8f8e8;border-radius:10px;padding:14px;margin-bottom:14px;border-left:4px solid #27ae60;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:1.5rem;">✅</span>
        <div>
          <strong style="font-size:.88rem;color:#155724;">Du hast die neueste Version!</strong>
          <div style="font-size:.78rem;color:#666;margin-top:2px;">GDL App v${GDL_VERSION} ist aktuell.</div>
        </div>
      </div>
    </div>`}

    <!-- Manual Update Instructions -->
    <div style="background:white;border-radius:10px;padding:16px;margin-bottom:14px;border:1px solid var(--border);">
      <strong style="font-size:.9rem;color:var(--primary-dark);">📋 Update-Anleitung (ohne automatische Installation)</strong>
      <div style="margin-top:12px;display:grid;gap:8px;">
        <div style="padding:10px;background:#f5f0e8;border-radius:8px;border-left:3px solid #c8a84b;">
          <strong style="font-size:.82rem;">Schritt 1: Daten sichern</strong>
          <p style="font-size:.78rem;color:var(--text-light);margin-top:3px;">Tab „💾 Backup" → „Jetzt sichern" → „Export (.json)" → Datei speichern</p>
          <button class="btn btn-secondary btn-sm" style="margin-top:6px;" onclick="showPage('backup')">💾 Zum Backup</button>
        </div>
        <div style="padding:10px;background:#f5f0e8;border-radius:8px;border-left:3px solid #c8a84b;">
          <strong style="font-size:.82rem;">Schritt 2: Neue Dateien herunterladen</strong>
          <p style="font-size:.78rem;color:var(--text-light);margin-top:3px;">Neue ZIP-Datei herunterladen und entpacken. Neue Dateien in den App-Ordner kopieren (alte überschreiben).</p>
        </div>
        <div style="padding:10px;background:#e8f8e8;border-radius:8px;border-left:3px solid #27ae60;">
          <strong style="font-size:.82rem;">✅ Daten bleiben erhalten!</strong>
          <p style="font-size:.78rem;color:var(--text-light);margin-top:3px;">localStorage wird beim Update NICHT gelöscht. Alle Gespräche, Mentees und Zielplaene bleiben erhalten.</p>
        </div>
      </div>
    </div>

    <!-- PC Transfer Section -->
    <div style="background:white;border-radius:10px;padding:16px;border:1px solid var(--border);">
      <strong style="font-size:.9rem;color:var(--primary-dark);">💻 Daten auf neuen PC übertragen</strong>
      <p style="font-size:.8rem;color:var(--text-light);margin-top:6px;margin-bottom:12px;">Wechselst du den Computer? So überträgst du alle Daten sicher.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        <div style="padding:12px;background:#e8f0e8;border-radius:8px;text-align:center;">
          <div style="font-size:1.5rem;margin-bottom:5px;">📤</div>
          <strong style="font-size:.84rem;">Alter PC</strong>
          <p style="font-size:.74rem;color:var(--text-light);margin:5px 0;">Daten exportieren</p>
          <button class="btn btn-primary btn-sm" onclick="exportForTransfer()" style="width:100%;margin-top:4px;">📤 Export für Transfer</button>
        </div>
        <div style="padding:12px;background:#e8f4fd;border-radius:8px;text-align:center;">
          <div style="font-size:1.5rem;margin-bottom:5px;">📥</div>
          <strong style="font-size:.84rem;">Neuer PC</strong>
          <p style="font-size:.74rem;color:var(--text-light);margin:5px 0;">Daten importieren</p>
          <label class="btn btn-outline btn-sm" style="width:100%;margin-top:4px;cursor:pointer;justify-content:center;">
            📥 Import
            <input type="file" accept=".json" onchange="importForTransfer(event)" style="display:none;">
          </label>
        </div>
      </div>
      <button class="btn btn-secondary" onclick="showTransferWizard()" style="width:100%;">🧙 Transfer-Assistent starten</button>
    </div>
  `;
}

function showUpdateInstructions() {
  if (typeof window.gdlNotifications !== 'undefined') {
    window.gdlNotifications.showInAppNotification(
      '📋 Update-Anleitung',
      '1. Backup erstellen → 2. Neue ZIP herunterladen → 3. Dateien kopieren → 4. Fertig!',
      {}
    );
  }
}

// ===== PC TRANSFER WIZARD =====
let transferStep = 1;

function showTransferWizard() {
  const modal = document.createElement('div');
  modal.id = 'transfer_wizard';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1001;
    display:flex;align-items:center;justify-content:center;padding:16px;
  `;
  modal.innerHTML = `
    <div style="background:white;border-radius:12px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.4);">
      <div style="background:linear-gradient(135deg,#1a3d1c,#2c5f2e);color:white;padding:18px 22px;border-radius:12px 12px 0 0;display:flex;align-items:center;justify-content:space-between;">
        <h2 style="font-size:1.1rem;">💻 PC-Transfer-Assistent</h2>
        <button onclick="document.getElementById('transfer_wizard').remove()" style="background:rgba(255,255,255,.2);border:none;color:white;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;">✕</button>
      </div>
      <div style="padding:20px;" id="wizard_content"></div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  renderWizardStep(1);
}

function renderWizardStep(step) {
  transferStep = step;
  const c = document.getElementById('wizard_content');
  if (!c) return;

  const steps = [
    { num:1, title:'Welche Seite bist du?', icon:'🤔' },
    { num:2, title:'Daten exportieren', icon:'📤' },
    { num:3, title:'Dateien übertragen', icon:'📁' },
    { num:4, title:'Auf neuem PC importieren', icon:'📥' },
    { num:5, title:'Fertig!', icon:'✅' },
  ];

  // Step indicator
  let stepHTML = `<div style="display:flex;gap:0;margin-bottom:20px;border-radius:8px;overflow:hidden;">`;
  steps.forEach(s => {
    const active = s.num === step;
    const done = s.num < step;
    stepHTML += `<div style="flex:1;padding:8px 4px;text-align:center;font-size:.68rem;background:${done?'#2c5f2e':active?'#1a4a7a':'#e8e0d0'};color:${done||active?'white':'#666'};border-right:1px solid white;">
      <div style="font-size:.9rem;">${done?'✓':s.icon}</div>
      <div style="margin-top:2px;">${s.num}</div>
    </div>`;
  });
  stepHTML += '</div>';

  let content = '';

  if (step === 1) {
    content = `
      <h3 style="font-size:1rem;color:var(--primary-dark);margin-bottom:14px;">Welche Seite bist du?</h3>
      <div style="display:grid;gap:10px;">
        <div onclick="renderWizardStep(2)" style="padding:16px;border-radius:10px;border:2px solid var(--border);cursor:pointer;transition:all .2s;" onmouseover="this.style.borderColor='#2c5f2e'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="font-size:1.5rem;margin-bottom:6px;">📤</div>
          <strong style="font-size:.9rem;">Ich bin auf dem ALTEN PC</strong>
          <p style="font-size:.78rem;color:var(--text-light);margin-top:4px;">Ich möchte meine Daten exportieren und auf den neuen PC übertragen.</p>
        </div>
        <div onclick="renderWizardStep(4)" style="padding:16px;border-radius:10px;border:2px solid var(--border);cursor:pointer;transition:all .2s;" onmouseover="this.style.borderColor='#1a4a7a'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="font-size:1.5rem;margin-bottom:6px;">📥</div>
          <strong style="font-size:.9rem;">Ich bin auf dem NEUEN PC</strong>
          <p style="font-size:.78rem;color:var(--text-light);margin-top:4px;">Ich habe bereits eine Export-Datei und möchte sie importieren.</p>
        </div>
      </div>`;
  } else if (step === 2) {
    const journal = JSON.parse(localStorage.getItem('gdl_journal')||'[]');
    const mentees = JSON.parse(localStorage.getItem('gdl_mentees')||'[]');
    const ziele = JSON.parse(localStorage.getItem('gdl_zielplaene')||'[]');
    content = `
      <h3 style="font-size:1rem;color:var(--primary-dark);margin-bottom:10px;">📤 Schritt 1: Daten exportieren</h3>
      <div style="background:#f5f0e8;border-radius:8px;padding:12px;margin-bottom:12px;">
        <strong style="font-size:.84rem;">Deine Daten:</strong>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px;">
          <div style="text-align:center;padding:8px;background:white;border-radius:6px;"><div style="font-size:1.2rem;font-weight:700;color:#2c5f2e;">${journal.length}</div><div style="font-size:.72rem;color:#666;">Gespräche</div></div>
          <div style="text-align:center;padding:8px;background:white;border-radius:6px;"><div style="font-size:1.2rem;font-weight:700;color:#1a4a7a;">${mentees.length}</div><div style="font-size:.72rem;color:#666;">Mentees</div></div>
          <div style="text-align:center;padding:8px;background:white;border-radius:6px;"><div style="font-size:1.2rem;font-weight:700;color:#c8a84b;">${ziele.length}</div><div style="font-size:.72rem;color:#666;">Zielplaene</div></div>
        </div>
      </div>
      <div class="alert alert-success"><span>✅</span><span>Alle Daten werden in einer JSON-Datei gespeichert. Diese Datei enthält alles!</span></div>
      <button class="btn btn-primary" onclick="exportForTransfer();renderWizardStep(3)" style="width:100%;margin-bottom:10px;">📤 Jetzt exportieren (Transfer-Datei erstellen)</button>
      <button class="btn btn-outline btn-sm" onclick="renderWizardStep(1)">← Zurück</button>`;
  } else if (step === 3) {
    content = `
      <h3 style="font-size:1rem;color:var(--primary-dark);margin-bottom:10px;">📁 Schritt 2: Dateien übertragen</h3>
      <div class="alert alert-info"><span>💡</span><span>Übertrage die Export-Datei UND den App-Ordner auf den neuen PC.</span></div>
      <div style="display:grid;gap:8px;margin-bottom:14px;">
        <div style="padding:10px;background:#f5f0e8;border-radius:8px;border-left:3px solid #c8a84b;">
          <strong style="font-size:.82rem;">📧 Per E-Mail</strong>
          <p style="font-size:.76rem;color:var(--text-light);margin-top:3px;">Export-Datei als Anhang an dich selbst senden. App-Ordner als ZIP anhängen.</p>
        </div>
        <div style="padding:10px;background:#f5f0e8;border-radius:8px;border-left:3px solid #c8a84b;">
          <strong style="font-size:.82rem;">💾 Per USB-Stick</strong>
          <p style="font-size:.76rem;color:var(--text-light);margin-top:3px;">Export-Datei + App-Ordner auf USB-Stick kopieren.</p>
        </div>
        <div style="padding:10px;background:#f5f0e8;border-radius:8px;border-left:3px solid #c8a84b;">
          <strong style="font-size:.82rem;">☁️ Per Cloud (iCloud/Google Drive)</strong>
          <p style="font-size:.76rem;color:var(--text-light);margin-top:3px;">Export-Datei in Cloud-Ordner speichern. Auf neuem PC herunterladen.</p>
        </div>
        <div style="padding:10px;background:#f5f0e8;border-radius:8px;border-left:3px solid #c8a84b;">
          <strong style="font-size:.82rem;">🐙 Per GitHub Gist (automatisch)</strong>
          <p style="font-size:.76rem;color:var(--text-light);margin-top:3px;">Tab „☁️ Sync" → Hochladen. Auf neuem PC: Herunterladen.</p>
          <button class="btn btn-outline btn-sm" style="margin-top:5px;" onclick="document.getElementById('transfer_wizard').remove();showPage('sync')">☁️ Zum Sync</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" onclick="renderWizardStep(2)">← Zurück</button>
        <button class="btn btn-primary" onclick="renderWizardStep(4)" style="flex:1;">Weiter: Auf neuem PC importieren →</button>
      </div>`;
  } else if (step === 4) {
    content = `
      <h3 style="font-size:1rem;color:var(--primary-dark);margin-bottom:10px;">📥 Schritt 3: Auf neuem PC importieren</h3>
      <div class="alert alert-warning"><span>⚠️</span><span>Stelle sicher, dass die GDL App auf dem neuen PC bereits installiert ist (App-Ordner kopiert).</span></div>
      <div style="margin-bottom:14px;">
        <label style="font-size:.84rem;font-weight:600;">Transfer-Datei auswählen:</label>
        <div style="margin-top:8px;">
          <label class="btn btn-primary" style="cursor:pointer;width:100%;justify-content:center;">
            📥 Transfer-Datei öffnen (.json)
            <input type="file" accept=".json" onchange="importForTransfer(event);renderWizardStep(5)" style="display:none;">
          </label>
        </div>
      </div>
      <div style="background:#e8f8e8;border-radius:8px;padding:10px;margin-bottom:12px;">
        <strong style="font-size:.82rem;color:#155724;">✅ Was wird importiert:</strong>
        <ul style="font-size:.76rem;color:#155724;padding-left:16px;margin-top:4px;line-height:1.8;">
          <li>Alle Gespräche & Protokolle</li>
          <li>Alle Mentees mit Kontaktdaten</li>
          <li>Alle Zielplaene & Vereinbarungen</li>
          <li>Wirksamkeitsanalysen</li>
          <li>Bibelstudien-Notizen</li>
          <li>Gebet-Tagebuch</li>
        </ul>
      </div>
      <button class="btn btn-outline btn-sm" onclick="renderWizardStep(3)">← Zurück</button>`;
  } else if (step === 5) {
    content = `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:3rem;margin-bottom:12px;">✅</div>
        <h3 style="font-size:1.1rem;color:var(--primary-dark);margin-bottom:8px;">Transfer erfolgreich!</h3>
        <p style="font-size:.84rem;color:var(--text-light);margin-bottom:16px;">Alle Daten wurden auf den neuen PC übertragen.</p>
        <div class="alert alert-gold"><span>✝</span><span>„Gott nahe zu sein ist mein Glück" – Psalm 73,28</span></div>
        <div class="btn-row" style="justify-content:center;margin-top:16px;">
          <button class="btn btn-primary" onclick="document.getElementById('transfer_wizard').remove();showPage('journal')">💬 Gespräche ansehen</button>
          <button class="btn btn-outline" onclick="document.getElementById('transfer_wizard').remove();showPage('mentoring')">👥 Mentees ansehen</button>
        </div>
      </div>`;
  }

  c.innerHTML = stepHTML + content;
}

// ===== EXPORT FOR TRANSFER =====
function exportForTransfer() {
  const GDL_KEYS = ['gdl_journal','gdl_mentees','gdl_mentors','gdl_orient','gdl_wirk','gdl_zielplaene','gdl_crosshair','gdl_bs_notes','gdl_prayer_log','gdl_cal_events','gdl_reflexion'];
  const data = {
    version: GDL_VERSION,
    exportDate: new Date().toISOString(),
    exportType: 'pc-transfer',
    exportDevice: navigator.userAgent.substring(0, 60),
    data: {}
  };
  GDL_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) try { data.data[key] = JSON.parse(val); } catch(e) {}
  });

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toLocaleDateString('de-DE').replace(/\./g,'-');
  a.href = url;
  a.download = `GDL-Transfer-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);

  // Mark export done
  if (typeof markExportDone === 'function') markExportDone();
  showToast('✅ Transfer-Datei erstellt! Jetzt auf den neuen PC übertragen.');
}

// ===== IMPORT FOR TRANSFER =====
function importForTransfer(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported.data) { showToast('❌ Ungültige Transfer-Datei.'); return; }

      // Create safety backup
      if (typeof createBackup === 'function') createBackup('vor-transfer');

      let importedCount = 0;
      const GDL_KEYS = ['gdl_journal','gdl_mentees','gdl_mentors','gdl_orient','gdl_wirk','gdl_zielplaene','gdl_crosshair','gdl_bs_notes','gdl_prayer_log','gdl_cal_events'];
      GDL_KEYS.forEach(key => {
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

      if (typeof renderJournal === 'function') renderJournal();
      if (typeof renderMentees === 'function') renderMentees();
      if (typeof updateDataOverview === 'function') updateDataOverview();

      showToast(`✅ Transfer erfolgreich! ${importedCount} Datensätze importiert.`);
    } catch(err) {
      showToast('❌ Fehler beim Import: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Check for updates after 5 seconds (silent)
  setTimeout(() => checkForUpdates(true), 5000);
  console.log('[Update] Module initialized – GDL App v' + GDL_VERSION);
});