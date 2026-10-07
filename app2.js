// ===== GDL APP v3.3 – Part 2: Modules, Dashboard, PDF, PWA =====

// ===== ZIELPLAN (continued) =====
function newZielplan() {
  zpCurrentId=null;
  zpData={mentee:"",goalText:"",goalType:"",goalKind:"",reformulated:"",motivation:"",successCriteria:"",bibleVerse:"",steps:[],lernfelder:[],lernfeldHelp:"",helpers:[],finalDate:"",milestones:[],currentStep:1};
  zpSelectedLernfelder=[];zpMilestones=[];
  ["zp_mentee","zp_goal_text","zp_motivation","zp_success_criteria","zp_reformulated","zp_lernfeld_help","zp_final_date","zp_bible_verse"].forEach(id=>{const e=el(id);if(e)e.value="";});
  [1,2,3,4].forEach(f=>{const e=el("zp_lf"+f);if(e){e.style.opacity=".7";e.style.transform="";}});
  ["zp_type_goal","zp_type_wish"].forEach(id=>{const e=el(id);if(e){e.style.borderColor="#d4c9b0";e.style.background="";}});
  const wh=el("zp_wish_hint");if(wh)wh.classList.add("hidden");
  const kh=el("zp_kind_hint");if(kh)kh.classList.add("hidden");
  renderZpStepsList();renderZpHelpers();renderSpiritualMilestones();zpGoToStep(1);
}
function renderZpSavedList() {
  const c=el("zp_saved_list");if(!c)return;
  if(!zpSavedPlans.length){c.innerHTML="";return;}
  c.innerHTML='<div style="font-size:.8rem;font-weight:700;color:var(--primary-dark);margin-bottom:7px;">Gespeicherte Zielplaene:</div>'+
    zpSavedPlans.map(p=>`<div class="zp-saved-plan"><div style="width:30px;height:30px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.82rem;flex-shrink:0;">${(p.mentee||"?").charAt(0).toUpperCase()}</div><strong>${p.mentee||"Unbekannt"}</strong><span style="font-size:.72rem;color:var(--text-light);">${p.savedAt||""} · ${p.steps?p.steps.length:0} Schritte</span><button class="btn btn-primary btn-sm" onclick="loadZielplan(${p.id})">Öffnen</button><button class="btn btn-danger btn-sm" onclick="deleteZielplan(${p.id})">🗑</button></div>`).join("");
}
function renderZpMenteeSelect() {
  const sel=el("zp_mentee_select");if(!sel)return;
  sel.innerHTML='<option value="">– Aus Mentee-Liste –</option>'+mentees.map(m=>`<option value="${m.name}">${m.name}</option>`).join("");
}
function loadMenteeForZielplan() { const sel=el("zp_mentee_select");const inp=el("zp_mentee");if(sel&&inp&&sel.value)inp.value=sel.value; }
function deleteZielplan(id) {
  if(!confirm("Diesen Zielplan wirklich löschen?"))return;
  zpSavedPlans=zpSavedPlans.filter(p=>p.id!==id);
  localStorage.setItem("gdl_zielplaene",JSON.stringify(zpSavedPlans));
  if(zpCurrentId===id)newZielplan();
  renderZpSavedList();
}
function exportZielplanPDF() {
  collectZpData();
  const name=zpData.mentee||"Mentee";
  const today=new Date().toLocaleDateString("de-DE",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const total=zpData.steps.length;const done=zpData.steps.filter(s=>s.done).length;const pct=total>0?Math.round((done/total)*100):0;
  const fieldColors={1:"#8B2020",2:"#2c5f2e",3:"#1a4a7a",4:"#6b3d8a"};
  const fieldNames={1:"Loslassen & aufgeben",2:"Alles unter seine Herrschaft",3:"Vertrauen in Gottes Macht",4:"Aus der Fülle des Vaters"};
  const kindLabels={spiritual:"✝ Geistliches Ziel",practical:"🔧 Praktisches Ziel",both:"✝🔧 Geistlich-praktisches Ziel"};
  const smartChecks=["smart_s","smart_m","smart_a","smart_r","smart_t"].map(id=>{const e=el(id);return e?e.checked:false;});
  const smartCount=smartChecks.filter(Boolean).length;
  let html=`<div style="font-family:'Segoe UI',sans-serif;color:#2a2a2a;max-width:180mm;"><div style="border-bottom:4px solid #2c5f2e;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;"><div><h1 style="font-size:18pt;color:#1a3d1c;margin:0;">🎯 Zielplan</h1><div style="font-size:9pt;color:#666;">Geistlich Denken Lernen – Bottom-Up</div></div><div style="font-size:9pt;color:#666;">${today}<br><strong>${name}</strong></div></div><div style="font-size:9pt;font-style:italic;color:#666;margin-bottom:14px;">„Gott nahe zu sein ist mein Glück" – Psalm 73,28</div>`;
  html+=`${zpData.goalKind?`<div style="display:inline-block;padding:2px 9px;border-radius:20px;background:#e8f0e8;color:#1a3d1c;font-size:8pt;font-weight:700;margin-bottom:7px;">${kindLabels[zpData.goalKind]||""}</div>`:""}<div style="background:#e8f0e8;border:2px solid #2c5f2e;border-radius:6px;padding:9px 12px;margin-bottom:10px;"><strong style="font-size:10pt;color:#1a3d1c;">🎯 ${zpData.goalType==="goal"?"ZIEL":"WUNSCH → ZIEL"}:</strong><p style="font-size:10pt;margin-top:3px;">${zpData.goalText||"–"}</p></div>${zpData.motivation?`<div style="font-size:9pt;margin-bottom:5px;"><strong>Motivation:</strong> ${zpData.motivation}</div>`:""}${zpData.bibleVerse?`<div style="font-size:9pt;color:#2c5f2e;font-style:italic;margin-bottom:10px;">✝ ${zpData.bibleVerse}</div>`:""}<div style="margin-bottom:10px;"><strong>SMART-Check (${smartCount}/5):</strong> ${["S","M","A","R","T"].map((l,i)=>`<span style="padding:1px 7px;border-radius:20px;font-size:8pt;background:${smartChecks[i]?"#e8f8e8":"#f8d7da"};color:${smartChecks[i]?"#155724":"#721c24"};font-weight:600;">${smartChecks[i]?"✅":"❌"} ${l}</span>`).join(" ")}</div>`;
  html+=`<div style="background:#e0d8c8;border-radius:4px;height:12px;margin:5px 0;overflow:hidden;"><div style="width:${pct}%;height:100%;background:#2c5f2e;border-radius:4px;"></div></div><div style="font-size:9pt;color:#666;margin-bottom:12px;">${done} von ${total} Schritten (${pct}%)</div>`;
  html+=`<div style="font-size:10pt;font-weight:700;color:#1a3d1c;border-bottom:1px solid #d4c9b0;padding-bottom:4px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Schritte & Zeitstrahl</div><div style="position:relative;padding-left:28px;"><div style="position:absolute;left:9px;top:0;bottom:0;width:3px;background:linear-gradient(to bottom,#2c5f2e,#c8a84b);border-radius:2px;"></div><div style="position:relative;margin-bottom:10px;"><div style="position:absolute;left:-22px;top:3px;width:13px;height:13px;border-radius:50%;background:#2c5f2e;border:2px solid #fff;"></div><div style="background:#e8f0e8;border-radius:5px;padding:6px 9px;border-left:3px solid #2c5f2e;"><strong style="font-size:9pt;">🚀 Startpunkt – Heute</strong></div></div>${zpData.steps.map((s,i)=>{const color=s.done?"#27ae60":"#c8a84b";return `<div style="position:relative;margin-bottom:10px;"><div style="position:absolute;left:-22px;top:3px;width:13px;height:13px;border-radius:50%;background:${color};border:2px solid #fff;"></div><div style="background:#fff;border-radius:5px;padding:6px 9px;border-left:3px solid ${color};border:1px solid #e0d8c8;"><div style="display:flex;justify-content:space-between;"><strong style="font-size:9pt;${s.done?"text-decoration:line-through;color:#999;":""}">${s.done?"✅ ":""}${i+1}. ${s.text}</strong><span style="font-size:8pt;color:${color};font-weight:700;">${s.done?"Erledigt":"Offen"}</span></div>${s.deadline?`<div style="font-size:8pt;color:#c8a84b;margin-top:2px;">📅 ${formatDate(s.deadline)}</div>`:""}</div></div>`;}).join("")}${zpData.finalDate||zpData.goalText?`<div style="position:relative;margin-bottom:10px;"><div style="position:absolute;left:-24px;top:3px;width:17px;height:17px;border-radius:50%;background:#c8a84b;border:3px solid #fff;"></div><div style="background:linear-gradient(135deg,#fef9e7,#fdf0d0);border-radius:5px;padding:8px 10px;border-left:3px solid #c8a84b;"><strong style="font-size:9.5pt;color:#7d6608;">🎯 ZIEL ERREICHT!</strong>${zpData.finalDate?`<div style="font-size:8pt;color:#c8a84b;margin-top:2px;">📅 ${formatDate(zpData.finalDate)}</div>`:""}</div></div>`:""}</div>`;
  if(zpMilestones.length){html+=`<div style="margin-top:12px;"><div style="font-size:10pt;font-weight:700;color:#1a3d1c;border-bottom:1px solid #d4c9b0;padding-bottom:4px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Geistliche Meilensteine</div>${zpMilestones.map(m=>`<div style="padding:5px 9px;background:#e8f4fd;border-radius:5px;margin-bottom:5px;font-size:9pt;">✝ ${m.text}${m.date?" – "+formatDate(m.date):""}</div>`).join("")}</div>`;}
  if(zpData.lernfelder&&zpData.lernfelder.length){html+=`<div style="margin-top:12px;"><div style="font-size:10pt;font-weight:700;color:#1a3d1c;border-bottom:1px solid #d4c9b0;padding-bottom:4px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Geistliche Hilfe</div><div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px;">${zpData.lernfelder.map(f=>`<span style="background:${fieldColors[f]};color:#fff;padding:2px 9px;border-radius:20px;font-size:8pt;">${fieldNames[f]}</span>`).join("")}</div>${zpData.lernfeldHelp?`<div style="font-size:9pt;font-style:italic;">${zpData.lernfeldHelp}</div>`:""}</div>`;}
  if(zpData.helpers&&zpData.helpers.length){html+=`<div style="margin-top:12px;"><div style="font-size:10pt;font-weight:700;color:#1a3d1c;border-bottom:1px solid #d4c9b0;padding-bottom:4px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Menschen die mir helfen</div>${zpData.helpers.map(h=>`<div style="padding:5px 0;border-bottom:1px solid #eee;font-size:9pt;"><strong>${h.name}:</strong> ${h.what}</div>`).join("")}</div>`;}
  html+=`<div style="margin-top:22px;display:flex;gap:38px;"><div style="flex:1;border-top:1px solid #999;padding-top:4px;font-size:8pt;color:#666;">Unterschrift Mentee</div><div style="flex:1;border-top:1px solid #999;padding-top:4px;font-size:8pt;color:#666;">Unterschrift Mentor/in</div></div><div style="margin-top:18px;padding-top:9px;border-top:1px solid #d4c9b0;font-size:7.5pt;color:#999;text-align:center;">Geistlich Denken Lernen · Zielplan für ${name} · ${today} · Vertraulich</div></div>`;
  el("pdfContent").innerHTML=html;setTimeout(()=>window.print(),400);
}

// ===== SESSION PDF =====
function exportSessionPDF() {
  const entry={
    menteeName:g("menteePdfName")||"–",
    date:new Date().toLocaleDateString("de-DE",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),
    field:selectedField,situation:g("situationText")||"–",context:g("contextSelect")||"–",
    sitFeelings:g("sit_feelings"),sitGod:g("sit_god"),sitBurden:g("sit_burden")||"5",
    acker:selectedAcker,ackerReflection:g("ackerReflection"),actionType:g("actionType"),
    bibleRef:selectedVerseRef,bibleText:selectedVerseText,bibleThoughts:g("bibleThoughts"),
    ownThoughts:g("ownThoughts"),selfInsight:g("selfInsight"),prayerThought:g("prayerThought"),
    goal:g("goalText")||"–",timeframe:g("goalTimeframe"),
    accountability:g("accountability"),nextMeeting:g("nextMeeting"),closingPrayer:g("closingPrayer"),
  };
  buildSessionPDF(entry);setTimeout(()=>window.print(),400);
}
function exportEntryPDF(id) { const entry=journal.find(j=>j.id===id);if(!entry)return;buildSessionPDF(entry);setTimeout(()=>window.print(),400); }
function buildSessionPDF(e) {
  const fc=e.field?FIELD_COLORS[e.field]:"#2c5f2e";
  const fn=e.field?FIELD_NAMES[e.field]:"–";
  const an=e.acker?ACKER_NAMES[e.acker]:"–";
  el("pdfContent").innerHTML=`<div style="font-family:'Segoe UI',sans-serif;color:#2a2a2a;max-width:180mm;"><div style="border-bottom:4px solid #2c5f2e;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;"><div><h1 style="font-size:18pt;color:#1a3d1c;margin:0;">✝ Gesprächsprotokoll</h1><div style="font-size:9pt;color:#666;">Geistlich Denken Lernen</div></div><div style="font-size:9pt;color:#666;">${e.date||new Date().toLocaleDateString("de-DE")}</div></div><div style="font-size:9pt;font-style:italic;color:#666;margin-bottom:14px;">„Gott nahe zu sein ist mein Glück" – Psalm 73,28</div><div style="margin-bottom:12px;"><strong>Mentee:</strong> ${e.menteeName||"–"} &nbsp;|&nbsp; <strong>Lebensbereich:</strong> ${e.context||"–"}${e.sitBurden?` &nbsp;|&nbsp; <strong>Belastungsgrad:</strong> ${e.sitBurden}/10`:""}</div>${e.field?`<span style="display:inline-block;padding:2px 9px;border-radius:20px;color:#fff;font-size:8pt;font-weight:700;background:${fc};margin-bottom:10px;">${fn}</span>`:""}<div style="margin-bottom:12px;"><div style="font-size:10pt;font-weight:700;color:#1a3d1c;border-bottom:1px solid #d4c9b0;padding-bottom:4px;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;">1. Situation</div><div style="font-size:10pt;line-height:1.6;">${(e.situation||"–").replace(/\n/g,"<br>")}</div>${e.sitFeelings?`<div style="font-size:9pt;margin-top:5px;"><strong>Gefühle:</strong> ${e.sitFeelings}</div>`:""}${e.sitGod?`<div style="font-size:9pt;margin-top:5px;"><strong>Geistliche Dimension:</strong> ${e.sitGod}</div>`:""}</div><div style="margin-bottom:12px;"><div style="font-size:10pt;font-weight:700;color:#1a3d1c;border-bottom:1px solid #d4c9b0;padding-bottom:4px;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;">2. Lernfeld & Matthäus 13</div><div style="font-size:10pt;line-height:1.6;"><strong>Lernfeld:</strong> ${fn}<br><strong>Ackerfeld:</strong> ${an}${e.actionType?`<br><strong>Handlungstyp:</strong> ${e.actionType}`:""}<br>${e.ackerReflection?`<em>${e.ackerReflection.replace(/\n/g,"<br>")}</em>`:""}</div></div>${e.bibleRef?`<div style="margin-bottom:12px;"><div style="font-size:10pt;font-weight:700;color:#1a3d1c;border-bottom:1px solid #d4c9b0;padding-bottom:4px;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;">3. Biblische Antwort</div><div style="background:#f0ebe0;border-left:4px solid #2c5f2e;padding:7px 11px;border-radius:4px;font-style:italic;font-size:9.5pt;margin:5px 0;"><span style="font-weight:700;font-style:normal;color:#1a3d1c;">${e.bibleRef}</span><br>„${e.bibleText||""}"</div>${e.bibleThoughts?`<div style="font-size:9pt;margin-top:5px;">${e.bibleThoughts.replace(/\n/g,"<br>")}</div>`:""}</div>`:""}<div style="margin-bottom:12px;"><div style="font-size:10pt;font-weight:700;color:#1a3d1c;border-bottom:1px solid #d4c9b0;padding-bottom:4px;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;">4. Reflexion</div><div style="font-size:10pt;line-height:1.6;">${e.ownThoughts?`<strong>Eigene Gedanken:</strong><br>${e.ownThoughts.replace(/\n/g,"<br>")}<br><br>`:""}${e.selfInsight?`<strong>Erkenntnis:</strong><br>${e.selfInsight.replace(/\n/g,"<br>")}<br><br>`:""}${e.prayerThought?`<strong>Gebetsgedanken:</strong><br>${e.prayerThought.replace(/\n/g,"<br>")}`:""}</div></div><div style="margin-bottom:12px;"><div style="font-size:10pt;font-weight:700;color:#1a3d1c;border-bottom:1px solid #d4c9b0;padding-bottom:4px;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;">5. Vereinbarung & Ziel</div><div style="background:#e8f0e8;border:2px solid #2c5f2e;border-radius:6px;padding:9px 12px;margin:5px 0;"><strong style="font-size:10pt;color:#1a3d1c;">🎯 Mein Ziel:</strong><p style="font-size:10pt;margin-top:3px;">${(e.goal||"–").replace(/\n/g,"<br>")}</p></div><div style="font-size:10pt;line-height:1.6;margin-top:7px;"><strong>Zeitrahmen:</strong> ${e.timeframe||"–"}<br><strong>Rechenschaft:</strong> ${e.accountability||"–"}<br><strong>Nächstes Treffen:</strong> ${e.nextMeeting||"–"}</div></div>${e.closingPrayer?`<div style="margin-bottom:12px;"><div style="font-size:10pt;font-weight:700;color:#1a3d1c;border-bottom:1px solid #d4c9b0;padding-bottom:4px;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;">Abschlussgebet</div><div style="font-size:10pt;font-style:italic;">${e.closingPrayer.replace(/\n/g,"<br>")}</div></div>`:""}<div style="margin-top:22px;display:flex;gap:38px;"><div style="flex:1;border-top:1px solid #999;padding-top:4px;font-size:8pt;color:#666;">Unterschrift Mentee</div><div style="flex:1;border-top:1px solid #999;padding-top:4px;font-size:8pt;color:#666;">Unterschrift Mentor/in</div></div><div style="margin-top:18px;padding-top:9px;border-top:1px solid #d4c9b0;font-size:7.5pt;color:#999;text-align:center;">Geistlich Denken Lernen · ${e.date||new Date().toLocaleDateString("de-DE")} · Vertraulich</div></div>`;
}

// ===== DASHBOARD MODULE =====
function renderDashboard() {
  const c = el("dashboard_content"); if (!c) return;
  const totalSessions = journal.length;
  const thisMonth = new Date().toLocaleDateString("de-DE",{month:"long",year:"numeric"});
  const monthSessions = journal.filter(e => e.date && e.date.includes(new Date().getFullYear())).length;
  const fieldCounts = {1:0,2:0,3:0,4:0};
  journal.forEach(e => { if(e.field) fieldCounts[e.field]++; });
  const totalMentees = mentees.length;
  const activePrayers = mentees.reduce((sum,m) => sum + (m.prayers||[]).filter(p=>p.status==="active").length, 0);
  const answeredPrayers = mentees.reduce((sum,m) => sum + (m.prayers||[]).filter(p=>p.status==="answered").length, 0);
  const wirkAvgs = ["f1","f2","f3","f4"].map(key => {
    const items = WIRK_ITEMS[key];
    const vals = items.map((_,i) => wirkData[key]&&wirkData[key][i]!==undefined?wirkData[key][i]:0);
    return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length * 10) / 10;
  });
  const fieldColors = ["#8B2020","#2c5f2e","#1a4a7a","#6b3d8a"];
  const fieldNames = ["Loslassen & aufgeben","Alles unter seine Herrschaft","Vertrauen in Gottes Macht","Aus der Fülle des Vaters"];

  // Build SVG chart for field distribution
  const maxCount = Math.max(...Object.values(fieldCounts), 1);
  const barW = 60; const barGap = 20; const chartH = 120;
  let barsSVG = "";
  [1,2,3,4].forEach((f,i) => {
    const x = i * (barW + barGap) + 10;
    const h = Math.round((fieldCounts[f] / maxCount) * chartH);
    const y = chartH - h + 10;
    barsSVG += `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${fieldColors[i]}" rx="4" opacity=".85"/>
      <text x="${x+barW/2}" y="${y-5}" text-anchor="middle" fill="${fieldColors[i]}" font-size="11" font-weight="bold" font-family="Segoe UI,sans-serif">${fieldCounts[f]}</text>
      <text x="${x+barW/2}" y="${chartH+22}" text-anchor="middle" fill="#666" font-size="8" font-family="Segoe UI,sans-serif">${["Loslassen","Hingabe","Vertrauen","Gegenwart"][i]}</text>`;
  });

  // Wirksamkeit radar-like bars
  let wirkBars = wirkAvgs.map((avg,i) => {
    const pct = (avg/10)*100;
    return `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:3px;"><span style="color:${fieldColors[i]};">${fieldNames[i]}</span><strong style="color:${fieldColors[i]};">${avg}/10</strong></div><div style="height:10px;background:#e0d8c8;border-radius:5px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${fieldColors[i]};border-radius:5px;transition:width .6s;"></div></div></div>`;
  }).join("");

  // Recent sessions
  const recentSessions = journal.slice(0,5).map(e => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0ebe0;">
      ${e.field?`<div style="width:10px;height:10px;border-radius:50%;background:${FIELD_COLORS[e.field]};flex-shrink:0;"></div>`:'<div style="width:10px;height:10px;border-radius:50%;background:#ccc;flex-shrink:0;"></div>'}
      <div style="flex:1;font-size:.82rem;">${e.menteeName?`<strong>${e.menteeName}</strong> · `:""}${e.situation?e.situation.substring(0,50)+"...":"Gespräch"}</div>
      <div style="font-size:.72rem;color:var(--text-light);">${e.date}</div>
    </div>`).join("");

  // Milestone badges
  const badges = [];
  if(totalSessions >= 1) badges.push({icon:"🌱",label:"Erstes Gespräch",color:"#27ae60"});
  if(totalSessions >= 5) badges.push({icon:"🌿",label:"5 Gespräche",color:"#2c5f2e"});
  if(totalSessions >= 10) badges.push({icon:"🌳",label:"10 Gespräche",color:"#1a3d1c"});
  if(totalMentees >= 1) badges.push({icon:"👤",label:"Erster Mentee",color:"#1a4a7a"});
  if(totalMentees >= 3) badges.push({icon:"👥",label:"3 Mentees",color:"#1a4a7a"});
  if(answeredPrayers >= 1) badges.push({icon:"✅",label:"Gebet erhört",color:"#c8a84b"});
  if(answeredPrayers >= 5) badges.push({icon:"🙏",label:"5 Gebete erhört",color:"#c8a84b"});
  if(crosshairHistory.length >= 3) badges.push({icon:"📈",label:"3 Messungen",color:"#6b3d8a"});
  const badgesHTML = badges.length ? badges.map(b=>`<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;background:${b.color}20;border:2px solid ${b.color};margin:4px;"><span style="font-size:1.1rem;">${b.icon}</span><span style="font-size:.78rem;font-weight:700;color:${b.color};">${b.label}</span></div>`).join("") : '<p style="font-size:.82rem;color:var(--text-light);font-style:italic;">Noch keine Meilensteine. Starte dein erstes Gespräch!</p>';

  c.innerHTML = `
    <!-- KPI Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;">
      <div style="background:linear-gradient(135deg,#1a3d1c,#2c5f2e);color:#fff;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:2rem;font-weight:700;">${totalSessions}</div><div style="font-size:.78rem;opacity:.85;">Gespräche gesamt</div></div>
      <div style="background:linear-gradient(135deg,#1a4a7a,#2a6aaa);color:#fff;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:2rem;font-weight:700;">${totalMentees}</div><div style="font-size:.78rem;opacity:.85;">Mentees</div></div>
      <div style="background:linear-gradient(135deg,#7d5a00,#c8a84b);color:#fff;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:2rem;font-weight:700;">${activePrayers}</div><div style="font-size:.78rem;opacity:.85;">Aktive Gebete</div></div>
      <div style="background:linear-gradient(135deg,#155724,#27ae60);color:#fff;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:2rem;font-weight:700;">${answeredPrayers}</div><div style="font-size:.78rem;opacity:.85;">Gebete erhört</div></div>
    </div>

    <!-- Field Distribution Chart -->
    <div style="background:white;border-radius:10px;padding:16px;margin-bottom:14px;border:1px solid var(--border);">
      <strong style="font-size:.88rem;color:var(--primary-dark);">📊 Gespräche nach Lernfeld</strong>
      <div style="overflow-x:auto;margin-top:12px;">
        <svg viewBox="0 0 340 155" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:340px;display:block;margin:0 auto;">
          <line x1="0" y1="130" x2="340" y2="130" stroke="#e0d8c8" stroke-width="1"/>
          ${barsSVG}
        </svg>
      </div>
    </div>

    <!-- Wirksamkeit Progress -->
    <div style="background:white;border-radius:10px;padding:16px;margin-bottom:14px;border:1px solid var(--border);">
      <strong style="font-size:.88rem;color:var(--primary-dark);">📈 Geistliches Wachstum – Lernfelder</strong>
      <div style="margin-top:12px;">${wirkBars}</div>
      ${crosshairHistory.length > 1 ? `<div style="font-size:.78rem;color:var(--text-light);margin-top:8px;">📅 ${crosshairHistory.length} Messungen gespeichert · Letzte: ${crosshairHistory[crosshairHistory.length-1].date}</div>` : '<div style="font-size:.78rem;color:var(--text-light);margin-top:8px;">Noch keine Wirksamkeitsmessungen. Gehe zu "Wirksamkeit" und speichere deine erste Messung.</div>'}
      <div class="btn-row" style="margin-top:10px;"><button class="btn btn-outline btn-sm" onclick="showPage(\'wirksamkeit\')">📊 Zur Wirksamkeitsanalyse</button></div>
    </div>

    <!-- Recent Sessions -->
    <div style="background:white;border-radius:10px;padding:16px;margin-bottom:14px;border:1px solid var(--border);">
      <strong style="font-size:.88rem;color:var(--primary-dark);">💬 Letzte Gespräche</strong>
      <div style="margin-top:10px;">${recentSessions || '<p style="font-size:.82rem;color:var(--text-light);font-style:italic;">Noch keine Gespräche. Starte dein erstes Gespräch!</p>'}</div>
      <div class="btn-row" style="margin-top:10px;"><button class="btn btn-primary btn-sm" onclick="showPage(\'session\')">💬 Neues Gespräch</button><button class="btn btn-outline btn-sm" onclick="showPage(\'journal\')">📓 Alle Gespräche</button></div>
    </div>

    <!-- Milestone Badges -->
    <div style="background:white;border-radius:10px;padding:16px;border:1px solid var(--border);">
      <strong style="font-size:.88rem;color:var(--primary-dark);">🏆 Meilenstein-Badges</strong>
      <div style="margin-top:10px;">${badgesHTML}</div>
    </div>
  `;
}

// ===== BIBELSTUDIE MODULE =====
function filterBibleStudy() {
  const field = parseInt(g("bs_field_filter"));
  const search = g("bs_search").toLowerCase();
  const filtered = BIBLE_STUDIES.filter(s =>
    (field===0||s.field===field) &&
    (search.length<2||s.title.toLowerCase().includes(search)||s.ref.toLowerCase().includes(search)||s.theme.toLowerCase().includes(search))
  );
  renderBibleStudyCards(filtered);
}
function renderBibleStudyCards(studies) {
  const c = el("bs_cards"); if (!c) return;
  const colors = {1:"#8B2020",2:"#2c5f2e",3:"#1a4a7a",4:"#6b3d8a"};
  c.innerHTML = studies.map(s => `
    <div style="border-left:5px solid ${colors[s.field]};background:white;border-radius:10px;padding:14px;box-shadow:0 2px 8px rgba(0,0,0,.06);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <div>
          <span style="font-size:.72rem;padding:2px 8px;border-radius:20px;color:white;background:${colors[s.field]};">${["","Loslassen","Hingabe","Vertrauen","Gegenwart"][s.field]}</span>
          <h4 style="font-size:.92rem;font-weight:700;color:var(--primary-dark);margin-top:5px;">${s.title}</h4>
          <div style="font-size:.8rem;color:var(--text-light);">📖 ${s.ref} · Thema: ${s.theme}</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="startBibleStudy(${BIBLE_STUDIES.indexOf(s)})" style="flex-shrink:0;">Studieren</button>
      </div>
      <div style="background:#f5f0e8;border-radius:6px;padding:8px;font-size:.82rem;font-style:italic;color:var(--primary-dark);">„${s.keyVerse}"</div>
    </div>`).join("");
}
function startBibleStudy(idx) {
  const s = BIBLE_STUDIES[idx];
  const refEl = el("bs_ref"); if(refEl) refEl.value = s.ref;
  const noteEl = el("bs_note"); if(noteEl) noteEl.value = "Fragen zum Nachdenken:\n" + s.questions.map((q,i)=>`${i+1}. ${q}`).join("\n") + "\n\nMeine Antworten:\n";
  if(refEl) refEl.scrollIntoView({behavior:"smooth"});
}
function saveBibleStudyNote() {
  const ref=g("bs_ref"); const note=g("bs_note"); const apply=g("bs_apply");
  if(!ref&&!note) return;
  bsNotes.unshift({id:Date.now(),ref,note,apply,date:new Date().toLocaleDateString("de-DE")});
  localStorage.setItem("gdl_bs_notes",JSON.stringify(bsNotes));
  ["bs_ref","bs_note","bs_apply"].forEach(id=>{const e=el(id);if(e)e.value="";});
  renderBsNotes(); showToast("📚 Studiennotiz gespeichert!");
}
function renderBsNotes() {
  const c = el("bs_saved_notes"); if (!c) return;
  if (!bsNotes.length) { c.innerHTML=""; return; }
  c.innerHTML = '<div style="font-weight:700;font-size:.84rem;color:var(--primary-dark);margin-bottom:8px;">Meine Studiennotizen:</div>' +
    bsNotes.slice(0,5).map((n,i) => `<div style="padding:10px;background:white;border-radius:8px;border-left:4px solid var(--primary);margin-bottom:7px;"><div style="font-size:.72rem;color:var(--text-light);">📅 ${n.date} · 📖 ${n.ref}</div><div style="font-size:.82rem;margin-top:4px;">${n.note.substring(0,100)}${n.note.length>100?"...":""}</div>${n.apply?`<div style="font-size:.78rem;color:var(--primary-dark);margin-top:4px;font-style:italic;">→ ${n.apply.substring(0,80)}</div>`:""}<button class="btn btn-danger btn-sm" style="padding:2px 7px;margin-top:5px;" onclick="bsNotes.splice(${i},1);localStorage.setItem('gdl_bs_notes',JSON.stringify(bsNotes));renderBsNotes()">🗑</button></div>`).join("");
}

// ===== GEBET TIMER =====
function setTimer(minutes) { resetTimer(); timerTotal=minutes*60; timerRemaining=timerTotal; updateTimerDisplay(); }
function toggleTimer() { if(timerRunning) pauseTimer(); else startTimerRun(); }
function startTimerRun() {
  if(timerRemaining<=0) resetTimer();
  timerRunning=true;
  const btn=el("timer_btn"); if(btn) btn.textContent="⏸ Pause";
  const phase=el("timer_phase"); if(phase) phase.textContent="🙏 Im Gebet...";
  timerInterval=setInterval(()=>{
    timerRemaining--;updateTimerDisplay();
    if(timerRemaining<=0){clearInterval(timerInterval);timerRunning=false;const btn2=el("timer_btn");if(btn2)btn2.textContent="▶ Neu starten";const ph=el("timer_phase");if(ph)ph.textContent="✅ Gebetszeit beendet – Amen!";showToast("✅ Gebetszeit beendet! Amen.");}
  },1000);
}
function pauseTimer() { timerRunning=false;clearInterval(timerInterval);const btn=el("timer_btn");if(btn)btn.textContent="▶ Fortsetzen";const phase=el("timer_phase");if(phase)phase.textContent="⏸ Pausiert"; }
function resetTimer() {
  timerRunning=false;clearInterval(timerInterval);timerRemaining=timerTotal;updateTimerDisplay();
  const btn=el("timer_btn");if(btn)btn.textContent="▶ Starten";
  const phase=el("timer_phase");if(phase)phase.textContent="Bereit zum Gebet";
}
function updateTimerDisplay() {
  const mins=Math.floor(timerRemaining/60);const secs=timerRemaining%60;
  const display=el("timer_display");if(display)display.textContent=`${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
  const ring=el("timer_ring");const ringText=el("timer_ring_text");
  if(ring){const pct=timerTotal>0?timerRemaining/timerTotal:0;ring.style.strokeDashoffset=339*(1-pct);ring.style.stroke=timerRemaining<60?"#c0392b":"var(--primary)";}
  if(ringText)ringText.textContent=`${Math.floor(timerRemaining/60)}m`;
}
function addPrayerLog() {
  const text=g("prayer_log_entry");if(!text)return;
  prayerLog.unshift({text,date:new Date().toLocaleDateString("de-DE"),duration:Math.round((timerTotal-timerRemaining)/60)});
  localStorage.setItem("gdl_prayer_log",JSON.stringify(prayerLog));
  const e=el("prayer_log_entry");if(e)e.value="";
  renderPrayerLog();showToast("🙏 Gebetseintrag gespeichert!");
}
function renderPrayerLog() {
  const c=el("prayer_log");if(!c)return;
  if(!prayerLog.length){c.innerHTML='<p style="font-size:.8rem;color:var(--text-light);font-style:italic;">Noch keine Gebetseinträge.</p>';return;}
  c.innerHTML=prayerLog.slice(0,10).map((p,i)=>`<div style="padding:8px 10px;background:#f5f0e8;border-radius:8px;margin-bottom:5px;border-left:4px solid var(--accent);"><div style="font-size:.72rem;color:var(--text-light);">📅 ${p.date}${p.duration?" · ⏱️ "+p.duration+" Min":""}</div><div style="font-size:.82rem;margin-top:2px;">${p.text}</div><button class="btn btn-danger btn-sm" style="padding:2px 6px;margin-top:4px;" onclick="prayerLog.splice(${i},1);localStorage.setItem('gdl_prayer_log',JSON.stringify(prayerLog));renderPrayerLog()">🗑</button></div>`).join("");
}

// ===== KALENDER MODULE =====
function changeMonth(dir) { calCurrentDate=new Date(calCurrentDate.getFullYear(),calCurrentDate.getMonth()+dir,1);renderCalendar(); }
function renderCalendar() {
  const year=calCurrentDate.getFullYear();const month=calCurrentDate.getMonth();
  const label=el("cal_month_label");if(label)label.textContent=calCurrentDate.toLocaleDateString("de-DE",{month:"long",year:"numeric"});
  const grid=el("cal_grid");if(!grid)return;
  const days=["Mo","Di","Mi","Do","Fr","Sa","So"];
  let html=days.map(d=>`<div style="text-align:center;font-size:.72rem;font-weight:700;color:var(--text-light);padding:4px 0;">${d}</div>`).join("");
  const firstDay=new Date(year,month,1);let startDow=firstDay.getDay()-1;if(startDow<0)startDow=6;
  for(let i=0;i<startDow;i++)html+='<div></div>';
  const daysInMonth=new Date(year,month+1,0).getDate();
  const today=new Date();
  for(let d=1;d<=daysInMonth;d++){
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const evts=calEvents.filter(e=>e.date===dateStr);
    const isToday=today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===d;
    const typeColors={session:"#2c5f2e",prayer:"#c8a84b",bible:"#1a4a7a",goal:"#8B2020",note:"#666"};
    const dots=evts.map(e=>`<div style="width:6px;height:6px;border-radius:50%;background:${typeColors[e.type]||"#666"};display:inline-block;margin:1px;"></div>`).join("");
    html+=`<div onclick="showCalDay('${dateStr}')" style="min-height:44px;padding:4px;border-radius:6px;cursor:pointer;background:${isToday?"var(--primary)":"white"};color:${isToday?"white":"var(--text)"};border:1px solid ${isToday?"var(--primary)":"var(--border)"};transition:all .2s;"><div style="font-size:.8rem;font-weight:${isToday?"700":"400"};">${d}</div><div style="display:flex;flex-wrap:wrap;gap:1px;margin-top:2px;">${dots}</div></div>`;
  }
  grid.innerHTML=html;renderCalStats();
  const sel=el("cal_mentee");if(sel){sel.innerHTML='<option value="">– Kein Mentee –</option>'+mentees.map(m=>`<option value="${m.name}">${m.name}</option>`).join("");}
}
function showCalDay(dateStr) {
  const evts=calEvents.filter(e=>e.date===dateStr);
  if(!evts.length){showToast("📅 "+formatDate(dateStr)+" – Keine Einträge");return;}
  const typeLabels={session:"💬 Gespräch",prayer:"🙏 Gebet",bible:"📚 Bibelstudie",goal:"🎯 Ziel erreicht",note:"📝 Notiz"};
  alert(formatDate(dateStr)+":\n\n"+evts.map(e=>`${typeLabels[e.type]||e.type}: ${e.desc}${e.mentee?" ("+e.mentee+")":""}`).join("\n"));
}
function addCalEvent() {
  const date=g("cal_date");const type=g("cal_type");const desc=g("cal_desc");const mentee=g("cal_mentee");
  if(!date){showToast("⚠️ Bitte ein Datum wählen.");return;}
  calEvents.push({id:Date.now(),date,type,desc,mentee});
  localStorage.setItem("gdl_cal_events",JSON.stringify(calEvents));
  const e=el("cal_desc");if(e)e.value="";
  renderCalendar();showToast("📅 Eintrag hinzugefügt!");
}
function renderCalStats() {
  const c=el("cal_stats");if(!c)return;
  const year=calCurrentDate.getFullYear();const month=calCurrentDate.getMonth();
  const monthStr=`${year}-${String(month+1).padStart(2,"0")}`;
  const monthEvts=calEvents.filter(e=>e.date.startsWith(monthStr));
  const stats=[{icon:"💬",label:"Gespräche",count:monthEvts.filter(e=>e.type==="session").length,color:"#2c5f2e"},{icon:"🙏",label:"Gebete",count:monthEvts.filter(e=>e.type==="prayer").length,color:"#c8a84b"},{icon:"📚",label:"Bibelstudien",count:monthEvts.filter(e=>e.type==="bible").length,color:"#1a4a7a"},{icon:"🎯",label:"Ziele erreicht",count:monthEvts.filter(e=>e.type==="goal").length,color:"#8B2020"}];
  c.innerHTML=stats.map(s=>`<div style="text-align:center;padding:10px;background:white;border-radius:8px;border-top:3px solid ${s.color};box-shadow:0 2px 6px rgba(0,0,0,.06);"><div style="font-size:1.3rem;">${s.icon}</div><div style="font-size:1.2rem;font-weight:700;color:${s.color};">${s.count}</div><div style="font-size:.7rem;color:var(--text-light);">${s.label}</div></div>`).join("");
}

// ===== PWA =====
function initPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js", {scope:"./"})
      .then(reg => {
        const swEl = el("sw_status"); if(swEl) swEl.textContent = "✅ Aktiv (Offline-Modus)";
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          nw.addEventListener("statechange", () => { if(nw.state==="installed"&&navigator.serviceWorker.controller) showToast("🔄 Update verfügbar!"); });
        });
      })
      .catch(() => { const swEl=el("sw_status"); if(swEl) swEl.textContent="⚠️ Nicht verfügbar (file://)"; });
  }
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault(); deferredInstallPrompt=e;
    const banner=el("pwa_install_banner"); if(banner) banner.classList.remove("hidden");
    updatePWAStatus();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt=null;
    const banner=el("pwa_install_banner"); if(banner) banner.classList.add("hidden");
    updatePWAStatus(); showToast("✅ GDL App wurde erfolgreich installiert!");
  });
  updatePWAStatus(); updateDataOverview();
  const serverEl=el("server_url_display");
  if(serverEl){const url=window.location.href;if(url.startsWith("http")){serverEl.innerHTML=`<strong>Aktuelle URL:</strong><br>${url}<br><br><span style="color:var(--text-light);font-size:.78rem;">Teile diese URL mit anderen Geräten im gleichen WLAN.</span>`;}else{serverEl.innerHTML=`<span style="color:var(--text-light);">Starte <strong>start.bat</strong> (Windows) oder <strong>python3 server.py</strong> (Mac/Linux).</span>`;}}
  const wlanEl=el("wlan_url_display");
  if(wlanEl){const url=window.location.href;if(url.startsWith("http")){wlanEl.innerHTML=`<strong style="color:#c8a84b;">Deine Server-URL:</strong><br><span style="font-family:monospace;">${url}</span><br><span style="font-size:.78rem;opacity:.8;margin-top:4px;display:block;">Teile diese URL mit anderen Geräten im gleichen WLAN.</span>`;}else{wlanEl.innerHTML=`<span style="opacity:.8;">Starte den Server, um die URL zu sehen.</span>`;}}
}
function updatePWAStatus() {
  const box=el("pwa_status_box");const txt=el("pwa_status_text");if(!box||!txt)return;
  const isStandalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
  if(isStandalone){box.style.background="#e8f8e8";txt.innerHTML="✅ <strong>App ist installiert</strong> – Du nutzt die GDL App als native App.";}
  else if(deferredInstallPrompt){box.style.background="#fef9e7";txt.innerHTML="📲 <strong>Installation verfügbar</strong> – Klicke oben auf 'Installieren'.";}
  else{box.style.background="#f5f0e8";txt.innerHTML="🌐 <strong>Im Browser</strong> – Folge der Anleitung unten, um die App zu installieren.";}
}
function installPWA() { if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();deferredInstallPrompt.userChoice.then(result=>{if(result.outcome==="accepted")showToast("✅ App wird installiert...");deferredInstallPrompt=null;}); }
function updateApp() { if("serviceWorker"in navigator){navigator.serviceWorker.getRegistration().then(reg=>{if(reg){reg.update().then(()=>{if(reg.waiting){reg.waiting.postMessage({type:"SKIP_WAITING"});window.location.reload();}else showToast("✅ App ist bereits aktuell.");})}});}else window.location.reload(); }

// ===== DATA SYNC =====
const GDL_STORAGE_KEYS = ["gdl_journal","gdl_mentees","gdl_mentors","gdl_orient","gdl_wirk","gdl_zielplaene","gdl_crosshair","gdl_bs_notes","gdl_prayer_log","gdl_cal_events"];
function exportAllData() {
  const data={version:"3.3",exportDate:new Date().toISOString(),data:{}};
  GDL_STORAGE_KEYS.forEach(key=>{const val=localStorage.getItem(key);if(val){try{data.data[key]=JSON.parse(val);}catch(e){data.data[key]=val;}}});
  const json=JSON.stringify(data,null,2);const blob=new Blob([json],{type:"application/json"});const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`GDL-Daten-${new Date().toLocaleDateString("de-DE").replace(/\./g,"-")}.json`;a.click();URL.revokeObjectURL(url);
  showToast("✅ Daten exportiert!");
}
function importAllData(event) {
  const file=event.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const imported=JSON.parse(e.target.result);const statusEl=el("sync_status");
      if(!imported.data){if(statusEl){statusEl.className="alert alert-danger";statusEl.textContent="❌ Ungültige Datei.";statusEl.classList.remove("hidden");}return;}
      let importedCount=0;
      GDL_STORAGE_KEYS.forEach(key=>{if(imported.data[key]!==undefined){const existing=JSON.parse(localStorage.getItem(key)||"[]");const incoming=imported.data[key];if(Array.isArray(existing)&&Array.isArray(incoming)){const existingIds=new Set(existing.map(e=>e.id));const newEntries=incoming.filter(e=>!existingIds.has(e.id));const merged=[...newEntries,...existing];localStorage.setItem(key,JSON.stringify(merged));importedCount+=newEntries.length;}else{localStorage.setItem(key,JSON.stringify(incoming));importedCount++;}}});
      journal=JSON.parse(localStorage.getItem("gdl_journal")||"[]");mentees=JSON.parse(localStorage.getItem("gdl_mentees")||"[]");savedMentors=JSON.parse(localStorage.getItem("gdl_mentors")||"[]");zpSavedPlans=JSON.parse(localStorage.getItem("gdl_zielplaene")||"[]");
      if(statusEl){statusEl.className="alert alert-success";statusEl.innerHTML=`✅ <strong>Import erfolgreich!</strong> ${importedCount} neue Datensätze importiert.`;statusEl.classList.remove("hidden");}
      updateDataOverview();showToast(`✅ ${importedCount} Datensätze importiert!`);event.target.value="";
    }catch(err){const statusEl=el("sync_status");if(statusEl){statusEl.className="alert alert-danger";statusEl.textContent="❌ Fehler: "+err.message;statusEl.classList.remove("hidden");}}
  };
  reader.readAsText(file);
}
function updateDataOverview() {
  const c=el("data_overview");if(!c)return;
  const items=[{key:"gdl_journal",label:"Gespräche",icon:"📓"},{key:"gdl_mentees",label:"Mentees",icon:"👤"},{key:"gdl_zielplaene",label:"Zielplaene",icon:"🎯"},{key:"gdl_mentors",label:"Mentoren",icon:"📞"}];
  c.innerHTML=items.map(item=>{const data=JSON.parse(localStorage.getItem(item.key)||"[]");const count=Array.isArray(data)?data.length:(data?1:0);return `<div class="data-ov-item"><div class="doi-icon">${item.icon}</div><div class="doi-count">${count}</div><div class="doi-label">${item.label}</div></div>`;}).join("");
}
function clearAllData() {
  if(!confirm("⚠️ Wirklich ALLE Daten auf diesem Gerät löschen?\n\nBitte vorher exportieren!"))return;
  GDL_STORAGE_KEYS.forEach(key=>localStorage.removeItem(key));
  journal=[];mentees=[];savedMentors=[];zpSavedPlans=[];
  updateDataOverview();renderJournal();renderMentees();showToast("🗑️ Alle Daten gelöscht.");
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  // Set today's date for consent
  const cd=el("consent_date");if(cd)cd.value=new Date().toISOString().split("T")[0];
  // Set today for calendar
  const calDate=el("cal_date");if(calDate)calDate.value=new Date().toISOString().split("T")[0];
  // Init all
  renderBibleResults(BIBLE_LIBRARY);
  renderDailyImpulse();
  renderJournal();
  renderMentees();
  renderSavedMentors();
  renderBibleStudyCards(BIBLE_STUDIES);
  renderBsNotes();
  renderPrayerLog();
  renderCalendar();
  setTimer(10);
  initPWA();
  updateDataOverview();
  // Modal close on backdrop
  const menteeModal=el("menteeDetailModal");
  if(menteeModal)menteeModal.addEventListener("click",function(e){if(e.target===this)closeMenteeDetail();});
  const crisisModal=el("crisisModal");
  if(crisisModal)crisisModal.addEventListener("click",function(e){if(e.target===this)closeCrisisModal();});
  // ESC key
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeCrisisModal();closeMenteeDetail();}});
});