// ===== GDL APP REPORT MODULE v1.0 =====
// Gesamtbericht, Teilberichte, Word- und PDF-Export
// „Gott nahe zu sein ist mein Glück" – Psalm 73,28

// ===== REPORT DATA COLLECTOR =====
function collectReportData(options = {}) {
  const {
    menteeId = null,       // null = alle Mentees
    dateFrom = null,       // Datum von (ISO string)
    dateTo = null,         // Datum bis (ISO string)
    fieldFilter = 0,       // 0 = alle Lernfelder
    includeJournal = true,
    includeMentees = true,
    includeWirksamkeit = true,
    includeOrientierung = true,
    includeZielplaene = true,
    includeKalender = true,
  } = options;

  const today = new Date().toLocaleDateString('de-DE', {weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const todayShort = new Date().toLocaleDateString('de-DE');

  // Filter journal entries
  let journalEntries = JSON.parse(localStorage.getItem('gdl_journal') || '[]');
  if (menteeId) {
    const m = (JSON.parse(localStorage.getItem('gdl_mentees')||'[]')).find(x=>x.id===menteeId);
    if (m) journalEntries = journalEntries.filter(e => e.menteeName === m.name);
  }
  if (dateFrom) journalEntries = journalEntries.filter(e => e.sessionDate >= dateFrom);
  if (dateTo) journalEntries = journalEntries.filter(e => e.sessionDate <= dateTo);
  if (fieldFilter > 0) journalEntries = journalEntries.filter(e => e.field === fieldFilter);

  // Mentees
  let allMentees = JSON.parse(localStorage.getItem('gdl_mentees') || '[]');
  if (menteeId) allMentees = allMentees.filter(m => m.id === menteeId);

  // Wirksamkeit
  const wirkData = JSON.parse(localStorage.getItem('gdl_wirk') || '{}');
  const crosshairHistory = JSON.parse(localStorage.getItem('gdl_crosshair') || '[]');

  // Orientierung
  const orientData = JSON.parse(localStorage.getItem('gdl_orient') || '{}');

  // Zielplaene
  let zielplaene = JSON.parse(localStorage.getItem('gdl_zielplaene') || '[]');
  if (menteeId) {
    const m = allMentees[0];
    if (m) zielplaene = zielplaene.filter(z => z.mentee === m.name);
  }

  // Kalender
  const calEvents = JSON.parse(localStorage.getItem('gdl_cal_events') || '[]');

  // Statistics
  const fieldCounts = {1:0,2:0,3:0,4:0};
  journalEntries.forEach(e => { if(e.field) fieldCounts[e.field]++; });
  const totalPrayers = allMentees.reduce((s,m)=>s+(m.prayers||[]).length,0);
  const answeredPrayers = allMentees.reduce((s,m)=>s+(m.prayers||[]).filter(p=>p.status==='answered').length,0);
  const totalGoals = allMentees.reduce((s,m)=>s+(m.goals||[]).length,0);
  const doneGoals = allMentees.reduce((s,m)=>s+(m.goals||[]).filter(g=>g.done).length,0);

  // Prayer log
  const prayerLog = JSON.parse(localStorage.getItem('gdl_prayer_log') || '[]');
  // Bible study notes
  const bsNotes = JSON.parse(localStorage.getItem('gdl_bs_notes') || '[]');

  return {
    meta: { today, todayShort, generatedAt: new Date().toISOString() },
    stats: { totalSessions: journalEntries.length, totalMentees: allMentees.length, fieldCounts, totalPrayers, answeredPrayers, totalGoals, doneGoals },
    journal: includeJournal ? journalEntries : [],
    mentees: includeMentees ? allMentees : [],
    wirkData: includeWirksamkeit ? wirkData : {},
    crosshairHistory: includeWirksamkeit ? crosshairHistory : [],
    orientData: includeOrientierung ? orientData : {},
    zielplaene: includeZielplaene ? zielplaene : [],
    calEvents: includeKalender ? calEvents : [],
    prayerLog: includeJournal ? prayerLog : [],
    bsNotes: includeJournal ? bsNotes : [],
    options,
  };
}

// ===== HTML REPORT BUILDER =====
function buildReportHTML(data, format = 'screen') {
  const { meta, stats, journal, mentees, wirkData, crosshairHistory, orientData, zielplaene, calEvents, options } = data;
  const FC = {1:'#8B2020',2:'#2c5f2e',3:'#1a4a7a',4:'#6b3d8a'};
  const FN = {1:'Loslassen & aufgeben',2:'Alles unter seine Herrschaft',3:'Vertrauen in Gottes Macht',4:'Aus der Fülle des Vaters'};
  const ACKER = {1:'Weg (V.4,19)',2:'Felsiger Boden',3:'Dornen',4:'Guter Boden'};

  const isWord = format === 'word';
  const fontFamily = isWord ? "'Calibri', sans-serif" : "'Segoe UI', sans-serif";

  let html = `
<div style="font-family:${fontFamily};color:#2a2a2a;max-width:${isWord?'180mm':'900px'};margin:0 auto;padding:${isWord?'0':'20px'};">

<!-- ===== DECKBLATT ===== -->
<div style="text-align:center;padding:${isWord?'20mm 0':'40px 0'};border-bottom:4px solid #2c5f2e;margin-bottom:${isWord?'10mm':'30px'};">
  <div style="font-size:${isWord?'28pt':'2.5rem'};color:#1a3d1c;font-weight:700;margin-bottom:8px;">✝ GDL App – Gesamtbericht</div>
  <div style="font-size:${isWord?'14pt':'1.1rem'};color:#2c5f2e;margin-bottom:6px;">Geistlich Denken Lernen · Seelsorge &amp; Jüngerschafts-Coaching</div>
  <div style="font-size:${isWord?'11pt':'0.9rem'};color:#666;font-style:italic;margin-bottom:12px;">„Gott nahe zu sein ist mein Glück" – Psalm 73,28</div>
  <div style="font-size:${isWord?'10pt':'0.85rem'};color:#888;">Erstellt am: ${meta.today}</div>
  ${options.menteeId ? `<div style="font-size:${isWord?'12pt':'1rem'};color:#2c5f2e;margin-top:8px;font-weight:700;">Mentee-Bericht: ${mentees[0]?.name||'–'}</div>` : ''}
  ${options.dateFrom||options.dateTo ? `<div style="font-size:${isWord?'10pt':'0.85rem'};color:#888;margin-top:4px;">Zeitraum: ${options.dateFrom||'Beginn'} bis ${options.dateTo||'heute'}</div>` : ''}
</div>

<!-- ===== ZUSAMMENFASSUNG ===== -->
<div style="margin-bottom:${isWord?'8mm':'24px'};">
  <h2 style="font-size:${isWord?'16pt':'1.3rem'};color:#1a3d1c;border-bottom:2px solid #c8a84b;padding-bottom:6px;margin-bottom:12px;">📊 Zusammenfassung</h2>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
    ${[
      {icon:'💬',val:stats.totalSessions,label:'Gespräche',color:'#2c5f2e'},
      {icon:'👥',val:stats.totalMentees,label:'Mentees',color:'#1a4a7a'},
      {icon:'🙏',val:stats.answeredPrayers+'/'+stats.totalPrayers,label:'Gebete erhört',color:'#c8a84b'},
      {icon:'🎯',val:stats.doneGoals+'/'+stats.totalGoals,label:'Ziele erreicht',color:'#8B2020'},
    ].map(s=>`<div style="text-align:center;padding:12px;background:#f5f0e8;border-radius:8px;border-top:3px solid ${s.color};">
      <div style="font-size:1.4rem;">${s.icon}</div>
      <div style="font-size:1.4rem;font-weight:700;color:${s.color};">${s.val}</div>
      <div style="font-size:.75rem;color:#666;">${s.label}</div>
    </div>`).join('')}
  </div>

  <!-- Lernfeld-Verteilung -->
  <div style="margin-bottom:12px;">
    <div style="font-weight:700;font-size:.9rem;color:#1a3d1c;margin-bottom:8px;">Gespräche nach Lernfeld:</div>
    ${[1,2,3,4].map(f=>{
      const count = stats.fieldCounts[f]||0;
      const pct = stats.totalSessions>0?Math.round((count/stats.totalSessions)*100):0;
      return `<div style="margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:2px;">
          <span style="color:${FC[f]};">${FN[f]}</span>
          <span style="font-weight:700;color:${FC[f]};">${count} (${pct}%)</span>
        </div>
        <div style="height:8px;background:#e0d8c8;border-radius:4px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${FC[f]};border-radius:4px;"></div>
        </div>
      </div>`;
    }).join('')}
  </div>
</div>

${mentees.length > 0 ? `
<!-- ===== MENTEES ===== -->
<div style="margin-bottom:${isWord?'8mm':'24px'};">
  <h2 style="font-size:${isWord?'16pt':'1.3rem'};color:#1a3d1c;border-bottom:2px solid #c8a84b;padding-bottom:6px;margin-bottom:12px;">👥 Mentees (${mentees.length})</h2>
  ${mentees.map(m=>{
    const activePrayers = (m.prayers||[]).filter(p=>p.status==='active').length;
    const answeredP = (m.prayers||[]).filter(p=>p.status==='answered').length;
    const openGoals = (m.goals||[]).filter(g=>!g.done).length;
    const doneG = (m.goals||[]).filter(g=>g.done).length;
    return `<div style="padding:14px;background:#fafaf5;border-radius:8px;border-left:5px solid #2c5f2e;margin-bottom:10px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
        <div>
          <div style="font-weight:700;font-size:1rem;color:#1a3d1c;">${m.name}${m.nickname?' ('+m.nickname+')':''}</div>
          <div style="font-size:.82rem;color:#666;margin-top:3px;">
            ${m.phone?'📞 '+m.phone+' · ':''}${m.email?'✉️ '+m.email:''}
            ${m.city?'<br>🏠 '+m.city:''}
            ${m.birthday?'<br>🎂 '+m.birthday:''}
          </div>
          ${m.note?`<div style="font-size:.8rem;color:#555;margin-top:4px;font-style:italic;">${m.note}</div>`:''}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <span style="padding:3px 10px;border-radius:20px;background:#e8f4fd;color:#0c5460;font-size:.75rem;">🙏 ${activePrayers} aktiv · ${answeredP} erhört</span>
          <span style="padding:3px 10px;border-radius:20px;background:#e8f8e8;color:#155724;font-size:.75rem;">🎯 ${doneG}/${openGoals+doneG} Ziele</span>
        </div>
      </div>
      ${(m.prayers||[]).filter(p=>p.status==='active').length>0?`
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e0d8c8;">
        <div style="font-size:.78rem;font-weight:700;color:#1a4a7a;margin-bottom:4px;">Aktive Gebetsanliegen:</div>
        ${(m.prayers||[]).filter(p=>p.status==='active').map(p=>`<div style="font-size:.78rem;color:#555;padding:2px 0;">🙏 ${p.text}</div>`).join('')}
      </div>`:''}
      ${(m.goals||[]).filter(g=>!g.done).length>0?`
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e0d8c8;">
        <div style="font-size:.78rem;font-weight:700;color:#8B2020;margin-bottom:4px;">Offene Ziele:</div>
        ${(m.goals||[]).filter(g=>!g.done).map(g=>`<div style="font-size:.78rem;color:#555;padding:2px 0;">🎯 ${g.text}${g.date?' – bis '+g.date:''}</div>`).join('')}
      </div>`:''}
      ${m.consent?`<div style="font-size:.72rem;color:#888;margin-top:6px;">🔒 Einwilligung: ${m.consent.date||'–'} (${m.consent.form||'–'})</div>`:''}
    </div>`;
  }).join('')}
</div>` : ''}

${journal.length > 0 ? `
<!-- ===== GESPRÄCHE ===== -->
<div style="margin-bottom:${isWord?'8mm':'24px'};">
  <h2 style="font-size:${isWord?'16pt':'1.3rem'};color:#1a3d1c;border-bottom:2px solid #c8a84b;padding-bottom:6px;margin-bottom:12px;">💬 Gespräche (${journal.length})</h2>
  ${journal.map((e,idx)=>`
  <div style="padding:14px;background:#fafaf5;border-radius:8px;border-left:5px solid ${e.field?FC[e.field]:'#2c5f2e'};margin-bottom:12px;page-break-inside:avoid;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
      <div>
        <span style="font-weight:700;font-size:.95rem;">Gespräch ${idx+1}</span>
        ${e.menteeName?`<span style="font-size:.85rem;color:#666;"> · ${e.menteeName}</span>`:''}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:.78rem;color:#888;">📅 ${e.date}</span>
        ${e.field?`<span style="padding:2px 8px;border-radius:20px;color:white;font-size:.72rem;background:${FC[e.field]};">${FN[e.field]}</span>`:''}
        ${e.sitBurden?`<span style="padding:2px 8px;border-radius:20px;background:#f5f0e8;color:#666;font-size:.72rem;">Belastung: ${e.sitBurden}/10</span>`:''}
      </div>
    </div>
    ${e.context?`<div style="font-size:.8rem;color:#666;margin-bottom:6px;">📍 ${e.context}</div>`:''}
    ${e.situation?`<div style="margin-bottom:8px;"><div style="font-size:.78rem;font-weight:700;color:#1a3d1c;margin-bottom:3px;">Situation:</div><div style="font-size:.82rem;color:#333;line-height:1.5;">${e.situation.replace(/\n/g,'<br>')}</div></div>`:''}
    ${e.sitGod?`<div style="margin-bottom:8px;background:#e8f4fd;border-radius:6px;padding:8px;"><div style="font-size:.78rem;font-weight:700;color:#1a5276;margin-bottom:2px;">Geistliche Dimension:</div><div style="font-size:.8rem;color:#1a5276;font-style:italic;">${e.sitGod}</div></div>`:''}
    ${e.acker?`<div style="font-size:.8rem;color:#666;margin-bottom:6px;">🌾 Ackerfeld: ${ACKER[e.acker]||'–'}${e.actionType?' · '+e.actionType:''}</div>`:''}
    ${e.bibleRef?`<div style="margin-bottom:8px;background:#f0ebe0;border-left:4px solid #2c5f2e;padding:8px 10px;border-radius:4px;"><div style="font-weight:700;font-size:.8rem;color:#1a3d1c;">${e.bibleRef}</div><div style="font-size:.8rem;font-style:italic;color:#333;margin-top:2px;">${e.bibleText?'„'+e.bibleText+'"':''}</div>${e.bibleThoughts?`<div style="font-size:.78rem;color:#555;margin-top:4px;">${e.bibleThoughts}</div>`:''}</div>`:''}
    ${e.ownThoughts?`<div style="margin-bottom:6px;"><div style="font-size:.78rem;font-weight:700;color:#1a3d1c;margin-bottom:2px;">Reflexion:</div><div style="font-size:.8rem;color:#333;">${e.ownThoughts.replace(/\n/g,'<br>')}</div></div>`:''}
    ${e.goal?`<div style="background:#e8f0e8;border:2px solid #2c5f2e;border-radius:6px;padding:8px 10px;margin-top:6px;"><div style="font-weight:700;font-size:.8rem;color:#1a3d1c;">🎯 Vereinbarung:</div><div style="font-size:.82rem;margin-top:2px;">${e.goal}</div>${e.timeframe?`<div style="font-size:.75rem;color:#666;margin-top:3px;">⏱ ${e.timeframe}${e.nextMeeting?' · Nächstes Treffen: '+e.nextMeeting:''}</div>`:''}</div>`:''}
    ${e.closingPrayer?`<div style="margin-top:6px;font-size:.78rem;color:#555;font-style:italic;">🙏 ${e.closingPrayer}</div>`:''}
  </div>`).join('')}
</div>` : ''}

${Object.keys(wirkData).length > 0 ? `
<!-- ===== WIRKSAMKEIT ===== -->
<div style="margin-bottom:${isWord?'8mm':'24px'};page-break-before:${isWord?'always':'auto'};">
  <h2 style="font-size:${isWord?'16pt':'1.3rem'};color:#1a3d1c;border-bottom:2px solid #c8a84b;padding-bottom:6px;margin-bottom:12px;">📊 Wirksamkeitsanalyse</h2>
  ${['f1','f2','f3','f4','fruechte'].map((key,ki)=>{
    const colors=['#8B2020','#2c5f2e','#1a4a7a','#6b3d8a','#27ae60'];
    const labels=['Loslassen & aufgeben','Alles unter seine Herrschaft','Vertrauen in Gottes Macht','Aus der Fülle des Vaters','Früchte des Geistes'];
    const WIRK_ITEMS_LOCAL = {
      f1:['Sünde erkennen & vor Gott bringen','Vergebung empfangen & Schuld loslassen','Selbstüberwindung','Auf dem Sieg Jesu stehen','Kreuz auf sich nehmen'],
      f2:['Totale Hingabe an Gott','Jesus ähnlicher werden','Früchte des Geistes','Freiwillig & aus Liebe handeln','Alles unter Gottes Herrschaft'],
      f3:['Gott vertrauen wenn nichts sichtbar','Glaubensschritte gehen','Im Glauben beten','Gottes Treue erleben','Hoffnung & Geduld'],
      f4:['In Gottes Gegenwart leben','Kraft aus der Stille','Aus Gottes Händen empfangen','Gott loben & anbeten','In Jesus bleiben'],
      fruechte:['Liebe','Freude','Friede','Geduld','Freundlichkeit','Treue','Sanftmut'],
    };
    const items = WIRK_ITEMS_LOCAL[key]||[];
    const vals = items.map((_,i)=>wirkData[key]&&wirkData[key][i]!==undefined?wirkData[key][i]:0);
    const avg = vals.length>0?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10:0;
    return `<div style="margin-bottom:12px;border-left:4px solid ${colors[ki]};padding:10px 12px;background:#fafaf5;border-radius:0 8px 8px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <div style="font-weight:700;color:${colors[ki]};font-size:.9rem;">${labels[ki]}</div>
        <div style="font-weight:700;color:${colors[ki]};">Ø ${avg}/10</div>
      </div>
      <div style="height:10px;background:#e0d8c8;border-radius:5px;overflow:hidden;margin-bottom:8px;">
        <div style="width:${avg*10}%;height:100%;background:${colors[ki]};border-radius:5px;"></div>
      </div>
      ${items.map((item,i)=>`<div style="display:flex;justify-content:space-between;font-size:.78rem;padding:2px 0;border-bottom:1px solid #f0ebe0;"><span>${item}</span><strong style="color:${colors[ki]};">${vals[i]||0}/10</strong></div>`).join('')}
    </div>`;
  }).join('')}
  ${crosshairHistory.length>0?`<div style="margin-top:10px;font-size:.8rem;color:#666;">📈 ${crosshairHistory.length} Messungen gespeichert · Letzte: ${crosshairHistory[crosshairHistory.length-1].date}</div>`:''}
</div>` : ''}

${zielplaene.length > 0 ? `
<!-- ===== ZIELPLAENE ===== -->
<div style="margin-bottom:${isWord?'8mm':'24px'};">
  <h2 style="font-size:${isWord?'16pt':'1.3rem'};color:#1a3d1c;border-bottom:2px solid #c8a84b;padding-bottom:6px;margin-bottom:12px;">🎯 Zielplaene (${zielplaene.length})</h2>
  ${zielplaene.map(z=>{
    const total=z.steps?z.steps.length:0;
    const done=z.steps?(z.steps.filter(s=>s.done).length):0;
    const pct=total>0?Math.round((done/total)*100):0;
    return `<div style="padding:14px;background:#fafaf5;border-radius:8px;border-left:5px solid #c8a84b;margin-bottom:10px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:6px;margin-bottom:8px;">
        <div style="font-weight:700;font-size:.95rem;">${z.mentee||'–'} · ${z.goalText?z.goalText.substring(0,60)+'...':'Zielplan'}</div>
        <span style="padding:3px 10px;border-radius:20px;background:#fef9e7;color:#7d6608;font-size:.75rem;">${pct}% erreicht (${done}/${total})</span>
      </div>
      <div style="height:8px;background:#e0d8c8;border-radius:4px;overflow:hidden;margin-bottom:8px;">
        <div style="width:${pct}%;height:100%;background:#c8a84b;border-radius:4px;"></div>
      </div>
      ${z.goalText?`<div style="font-size:.82rem;color:#333;margin-bottom:6px;"><strong>Ziel:</strong> ${z.goalText}</div>`:''}
      ${z.bibleVerse?`<div style="font-size:.78rem;color:#2c5f2e;font-style:italic;margin-bottom:6px;">✝ ${z.bibleVerse}</div>`:''}
      ${z.steps&&z.steps.length>0?`<div style="font-size:.78rem;color:#666;">${z.steps.map((s,i)=>`<div style="padding:2px 0;${s.done?'text-decoration:line-through;color:#999;':''}">${s.done?'✅':'⏳'} ${i+1}. ${s.text}${s.deadline?' ('+s.deadline+')':''}</div>`).join('')}</div>`:''}
      <div style="font-size:.72rem;color:#888;margin-top:6px;">Gespeichert: ${z.savedAt||'–'}</div>
    </div>`;
  }).join('')}
</div>` : ''}


${data.prayerLog && data.prayerLog.length > 0 ? `
<!-- ===== GEBET-TAGEBUCH ===== -->
<div style="margin-bottom:${isWord?'8mm':'24px'};">
  <h2 style="font-size:${isWord?'16pt':'1.3rem'};color:#1a3d1c;border-bottom:2px solid #c8a84b;padding-bottom:6px;margin-bottom:12px;">🙏 Gebet-Tagebuch (${data.prayerLog.length})</h2>
  ${data.prayerLog.slice(0,20).map(p=>`<div style="padding:8px 12px;background:#f5f0e8;border-radius:6px;border-left:4px solid #c8a84b;margin-bottom:6px;"><div style="font-size:.72rem;color:#666;">📅 ${p.date}${p.duration?' · ⏱️ '+p.duration+' Min':''}</div><div style="font-size:.82rem;margin-top:2px;">${p.text}</div></div>`).join('')}
  ${data.prayerLog.length>20?`<div style="font-size:.78rem;color:#666;font-style:italic;">... und ${data.prayerLog.length-20} weitere Einträge</div>`:''}
</div>` : ''}

${data.bsNotes && data.bsNotes.length > 0 ? `
<!-- ===== BIBELSTUDIEN ===== -->
<div style="margin-bottom:${isWord?'8mm':'24px'};">
  <h2 style="font-size:${isWord?'16pt':'1.3rem'};color:#1a3d1c;border-bottom:2px solid #c8a84b;padding-bottom:6px;margin-bottom:12px;">📚 Bibelstudien-Notizen (${data.bsNotes.length})</h2>
  ${data.bsNotes.map(n=>`<div style="padding:10px 12px;background:#fafaf5;border-radius:8px;border-left:4px solid #1a4a7a;margin-bottom:8px;page-break-inside:avoid;"><div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-weight:700;font-size:.85rem;color:#1a4a7a;">📖 ${n.ref||'–'}</span><span style="font-size:.72rem;color:#666;">📅 ${n.date}</span></div><div style="font-size:.8rem;color:#333;line-height:1.5;">${(n.note||'').replace(/\n/g,'<br>').substring(0,300)}${(n.note||'').length>300?'...':''}</div>${n.apply?`<div style="font-size:.78rem;color:#2c5f2e;margin-top:5px;font-style:italic;">→ Anwendung: ${n.apply}</div>`:''}</div>`).join('')}
</div>` : ''}

${data.calEvents && data.calEvents.length > 0 ? `
<!-- ===== KALENDER ===== -->
<div style="margin-bottom:${isWord?'8mm':'24px'};">
  <h2 style="font-size:${isWord?'16pt':'1.3rem'};color:#1a3d1c;border-bottom:2px solid #c8a84b;padding-bottom:6px;margin-bottom:12px;">📅 Kalender-Einträge (${data.calEvents.length})</h2>
  <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
    <tr style="background:#f5f0e8;"><th style="padding:6px 8px;border:1px solid #d4c9b0;text-align:left;">Datum</th><th style="padding:6px 8px;border:1px solid #d4c9b0;text-align:left;">Typ</th><th style="padding:6px 8px;border:1px solid #d4c9b0;text-align:left;">Beschreibung</th><th style="padding:6px 8px;border:1px solid #d4c9b0;text-align:left;">Mentee</th></tr>
    ${data.calEvents.sort((a,b)=>a.date.localeCompare(b.date)).map(e=>{
      const typeLabels={session:'💬 Gespräch',prayer:'🙏 Gebet',bible:'📚 Bibelstudie',goal:'🎯 Ziel',note:'📝 Notiz'};
      return `<tr><td style="padding:5px 8px;border:1px solid #e0d8c8;">${e.date}</td><td style="padding:5px 8px;border:1px solid #e0d8c8;">${typeLabels[e.type]||e.type}</td><td style="padding:5px 8px;border:1px solid #e0d8c8;">${e.desc||'–'}</td><td style="padding:5px 8px;border:1px solid #e0d8c8;">${e.mentee||'–'}</td></tr>`;
    }).join('')}
  </table>
</div>` : ''}
<!-- ===== FOOTER ===== -->
<div style="margin-top:${isWord?'10mm':'30px'};padding-top:12px;border-top:2px solid #d4c9b0;text-align:center;font-size:.75rem;color:#999;">
  Geistlich Denken Lernen · Seelsorge &amp; Jüngerschafts-Coaching · Erstellt am ${meta.today} · Vertraulich<br>
  „Gott nahe zu sein ist mein Glück" – Psalm 73,28 · Joh 14,6 · Phil 3,12-14
</div>

</div>`;

  return html;
}

// ===== PDF EXPORT =====
function exportReportPDF(options = {}) {
  const data = collectReportData(options);
  const html = buildReportHTML(data, 'pdf');
  const pdfEl = document.getElementById('pdfContent');
  if (pdfEl) {
    pdfEl.innerHTML = html;
    setTimeout(() => window.print(), 400);
  }
}

// ===== WORD EXPORT (HTML-to-Word via Blob) =====
function exportReportWord(options = {}) {
  const data = collectReportData(options);
  const bodyHTML = buildReportHTML(data, 'word');

  const wordHTML = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="GDL App v4.0">
<meta name="Originator" content="GDL App">
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: A4;
    margin: 2cm 2.5cm;
  }
  body {
    font-family: Calibri, sans-serif;
    font-size: 11pt;
    color: #2a2a2a;
    line-height: 1.5;
  }
  h1 { font-size: 20pt; color: #1a3d1c; }
  h2 { font-size: 14pt; color: #1a3d1c; border-bottom: 2pt solid #c8a84b; padding-bottom: 4pt; margin-top: 16pt; }
  h3 { font-size: 12pt; color: #2c5f2e; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 10pt; }
  td, th { border: 1pt solid #d4c9b0; padding: 4pt 6pt; font-size: 10pt; }
  th { background: #f5f0e8; font-weight: bold; }
  .page-break { page-break-before: always; }
  p { margin: 4pt 0; }
</style>
</head>
<body>
${bodyHTML}
</body>
</html>`;

  const blob = new Blob(['\ufeff' + wordHTML], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toLocaleDateString('de-DE').replace(/\./g,'-');
  a.href = url;
  a.download = `GDL-Bericht-${dateStr}.doc`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Word-Dokument wird heruntergeladen!');
}

// ===== REPORT PAGE RENDERER =====
function renderReportPage() {
  const c = document.getElementById('report_content');
  if (!c) return;

  const mentees = JSON.parse(localStorage.getItem('gdl_mentees') || '[]');
  const journal = JSON.parse(localStorage.getItem('gdl_journal') || '[]');
  const zielplaene = JSON.parse(localStorage.getItem('gdl_zielplaene') || '[]');

  c.innerHTML = `
    <!-- Filter Options -->
    <div style="background:#f5f0e8;border-radius:10px;padding:16px;margin-bottom:16px;">
      <strong style="font-size:.9rem;color:var(--primary-dark);">🔧 Bericht konfigurieren</strong>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;">
        <div>
          <label style="font-size:.82rem;">Mentee (leer = alle):</label>
          <select id="rpt_mentee" style="font-size:.85rem;">
            <option value="">– Alle Mentees –</option>
            ${mentees.map(m=>`<option value="${m.id}">${m.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:.82rem;">Lernfeld (leer = alle):</label>
          <select id="rpt_field" style="font-size:.85rem;">
            <option value="0">– Alle Lernfelder –</option>
            <option value="1">🔴 Loslassen & aufgeben</option>
            <option value="2">🟢 Alles unter seine Herrschaft</option>
            <option value="3">🔵 Vertrauen in Gottes Macht</option>
            <option value="4">🟣 Aus der Fülle des Vaters</option>
          </select>
        </div>
        <div>
          <label style="font-size:.82rem;">Datum von:</label>
          <input type="date" id="rpt_from" style="font-size:.85rem;">
        </div>
        <div>
          <label style="font-size:.82rem;">Datum bis:</label>
          <input type="date" id="rpt_to" style="font-size:.85rem;">
        </div>
      </div>

      <div style="margin-top:12px;">
        <strong style="font-size:.82rem;color:var(--primary-dark);">Einschließen:</strong>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
          ${[
            ['rpt_inc_journal','💬 Gespräche',true],
            ['rpt_inc_mentees','👥 Mentees',true],
            ['rpt_inc_wirk','📊 Wirksamkeit',true],
            ['rpt_inc_orient','🧭 Orientierung',false],
            ['rpt_inc_ziele','🎯 Zielplaene',true],
            ['rpt_inc_cal','📅 Kalender',false],
            ['rpt_inc_prayer','🙏 Gebet-Tagebuch',false],
            ['rpt_inc_bible','📚 Bibelstudien',false],
          ].map(([id,label,checked])=>`<label style="display:flex;align-items:center;gap:5px;font-size:.82rem;cursor:pointer;"><input type="checkbox" id="${id}" ${checked?'checked':''} style="accent-color:var(--primary);"> ${label}</label>`).join('')}
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
      <div style="text-align:center;padding:12px;background:white;border-radius:8px;border-top:3px solid #2c5f2e;box-shadow:0 2px 6px rgba(0,0,0,.06);">
        <div style="font-size:1.8rem;font-weight:700;color:#2c5f2e;">${journal.length}</div>
        <div style="font-size:.75rem;color:var(--text-light);">Gespräche gesamt</div>
      </div>
      <div style="text-align:center;padding:12px;background:white;border-radius:8px;border-top:3px solid #1a4a7a;box-shadow:0 2px 6px rgba(0,0,0,.06);">
        <div style="font-size:1.8rem;font-weight:700;color:#1a4a7a;">${mentees.length}</div>
        <div style="font-size:.75rem;color:var(--text-light);">Mentees</div>
      </div>
      <div style="text-align:center;padding:12px;background:white;border-radius:8px;border-top:3px solid #c8a84b;box-shadow:0 2px 6px rgba(0,0,0,.06);">
        <div style="font-size:1.8rem;font-weight:700;color:#c8a84b;">${zielplaene.length}</div>
        <div style="font-size:.75rem;color:var(--text-light);">Zielplaene</div>
      </div>
    </div>

    <!-- Export Buttons -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
      <div style="background:#e8f0e8;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:1.8rem;margin-bottom:6px;">📄</div>
        <strong style="font-size:.88rem;color:var(--primary-dark);">PDF / Drucken</strong>
        <p style="font-size:.76rem;color:var(--text-light);margin:6px 0;">Druckoptimierter Bericht für alle Drucker</p>
        <button class="btn btn-primary btn-sm" onclick="exportReportFromUI('pdf')" style="width:100%;margin-top:4px;">📄 Als PDF exportieren</button>
      </div>
      <div style="background:#e8f4fd;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:1.8rem;margin-bottom:6px;">📝</div>
        <strong style="font-size:.88rem;color:var(--primary-dark);">Word (.doc)</strong>
        <p style="font-size:.76rem;color:var(--text-light);margin:6px 0;">Bearbeitbares Word-Dokument</p>
        <button class="btn btn-outline btn-sm" onclick="exportReportFromUI('word')" style="width:100%;margin-top:4px;">📝 Als Word exportieren</button>
      </div>
    </div>

    <!-- Partial Reports -->
    <div style="background:#f5f0e8;border-radius:10px;padding:14px;margin-bottom:16px;">
      <strong style="font-size:.88rem;color:var(--primary-dark);">📋 Schnellberichte</strong>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">
        <button class="btn btn-sm" style="background:#8B2020;color:white;" onclick="quickReport('field',1)">🔴 Lernfeld 1</button>
        <button class="btn btn-sm" style="background:#2c5f2e;color:white;" onclick="quickReport('field',2)">🟢 Lernfeld 2</button>
        <button class="btn btn-sm" style="background:#1a4a7a;color:white;" onclick="quickReport('field',3)">🔵 Lernfeld 3</button>
        <button class="btn btn-sm" style="background:#6b3d8a;color:white;" onclick="quickReport('field',4)">🟣 Lernfeld 4</button>
        <button class="btn btn-secondary btn-sm" onclick="quickReport('month')">📅 Dieser Monat</button>
        <button class="btn btn-outline btn-sm" onclick="quickReport('all')">📊 Gesamtbericht</button>
      </div>
    </div>

    <!-- Preview -->
    <div style="background:white;border-radius:10px;padding:16px;border:1px solid var(--border);">
      <strong style="font-size:.88rem;color:var(--primary-dark);">👁️ Vorschau</strong>
      <div id="report_preview" style="margin-top:12px;max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:12px;background:#fafaf5;">
        <p style="font-size:.82rem;color:var(--text-light);text-align:center;padding:20px;">Klicke auf einen Export-Button oder Schnellbericht, um eine Vorschau zu sehen.</p>
      </div>
    </div>
  `;
}

function getReportOptions() {
  const menteeId = document.getElementById('rpt_mentee')?.value;
  return {
    menteeId: menteeId ? parseInt(menteeId) : null,
    fieldFilter: parseInt(document.getElementById('rpt_field')?.value || '0'),
    dateFrom: document.getElementById('rpt_from')?.value || null,
    dateTo: document.getElementById('rpt_to')?.value || null,
    includeJournal: document.getElementById('rpt_inc_journal')?.checked !== false,
    includeMentees: document.getElementById('rpt_inc_mentees')?.checked !== false,
    includeWirksamkeit: document.getElementById('rpt_inc_wirk')?.checked !== false,
    includeOrientierung: document.getElementById('rpt_inc_orient')?.checked || false,
    includeZielplaene: document.getElementById('rpt_inc_ziele')?.checked !== false,
    includeKalender: document.getElementById('rpt_inc_cal')?.checked || false,
  };
}

function exportReportFromUI(format) {
  const options = getReportOptions();
  const data = collectReportData(options);
  const html = buildReportHTML(data, format);

  // Show preview
  const preview = document.getElementById('report_preview');
  if (preview) preview.innerHTML = html;

  if (format === 'pdf') {
    const pdfEl = document.getElementById('pdfContent');
    if (pdfEl) { pdfEl.innerHTML = html; setTimeout(() => window.print(), 400); }
  } else if (format === 'word') {
    exportReportWord(options);
  }
}

function quickReport(type, value) {
  let options = {};
  if (type === 'field') options = { fieldFilter: value, includeJournal: true, includeMentees: false, includeWirksamkeit: false, includeZielplaene: false };
  else if (type === 'month') {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const to = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];
    options = { dateFrom: from, dateTo: to };
  } else {
    options = { includeJournal: true, includeMentees: true, includeWirksamkeit: true, includeZielplaene: true };
  }

  const data = collectReportData(options);
  const html = buildReportHTML(data, 'screen');
  const preview = document.getElementById('report_preview');
  if (preview) preview.innerHTML = html;
  showToast('✅ Vorschau aktualisiert – jetzt exportieren!');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Report] Module loaded');
});