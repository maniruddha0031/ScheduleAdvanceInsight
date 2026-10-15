/* ============================================================
   Schedule Insight — tab-switch controller + display settings
   ============================================================ */

function siSwitchTab(tab){
  // Eva chatbot is hidden on Deep Dive
  document.body.classList.toggle('si-on-deepdive', tab === 'deepdive');
  // page title follows the tab: "Schedule Deep Dive" (no AI tag) on Deep Dive
  const title = document.querySelector('.si-title');
  if (title) title.textContent = tab === 'deepdive' ? 'Schedule Deep Dive' : 'Schedule AI Insight';
  const aiTag = document.querySelector('.si-ai-badge');
  if (aiTag) aiTag.style.display = tab === 'deepdive' ? 'none' : '';
  // KPI tile arrows can only measure once the Deep Dive panel is visible
  if (tab === 'deepdive' && typeof ddKpiArrows === 'function') setTimeout(ddKpiArrows, 0);
  document.querySelectorAll('.si-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.si-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
  // the Insights tab's "AI Hub" mode borrows the AI Hub screen — hand it back / re-borrow
  if (tab === 'aihub' && typeof siInsReturnHub === 'function') siInsReturnHub();
  if (tab === 'insights' && typeof SI_INS_STATE !== 'undefined' && SI_INS_STATE.mode === 'hub') siInsSetMode('hub');
}

/* ---- settings gear: "New UI" layout toggle ----
   On  -> body.si-newui; the Insights detail puts Root Cause and
          Recommendation side by side (evidence table below).
   Off -> the current layout, unchanged.
   Remembered per browser (localStorage, best-effort). */
const SI_NEWUI_KEY = 'si-new-ui';

function siIsNewUi(){ return document.body.classList.contains('si-newui'); }

function siSetNewUi(on){
  document.body.classList.toggle('si-newui', !!on);
  const sw = document.getElementById('si-newui-switch');
  if (sw) sw.setAttribute('aria-checked', on ? 'true' : 'false');
  try { localStorage.setItem(SI_NEWUI_KEY, on ? '1' : '0'); } catch (e) {}
  // re-draw the open insight so the layout switches immediately
  if (typeof siInsRenderDetail === 'function' && typeof SI_INS_STATE !== 'undefined' && SI_INS_STATE.activeId != null) {
    siInsRenderDetail(SI_INS_STATE.activeId);
  }
}

/* ---- "Disable date range" flag: hides Deep Dive's From / To pickers
   (the Last 7 days / 2 / 4 / 8 weeks presets stay). Default: off. ---- */
const SI_NODATE_KEY = 'si-no-daterange-v2';   // v2: resets the flag to its default (off) for everyone

function siSetNoDateRange(on){
  document.body.classList.toggle('si-no-daterange', !!on);
  const sw = document.getElementById('si-nodate-switch');
  if (sw) sw.setAttribute('aria-checked', on ? 'true' : 'false');
  try { localStorage.setItem(SI_NODATE_KEY, on ? '1' : '0'); } catch (e) {}
}

/* ---- Theme (Light default / Dark) — chosen in the profile menu,
   persisted in localStorage, applied pre-paint by index.html's head
   script. One class on <html> drives assets/dark-theme.css. ---- */
const SI_THEME_KEY = 'si-theme';
function siCurrentTheme(){ return document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light'; }
function siSetTheme(theme){
  const dark = theme === 'dark';
  document.documentElement.classList.toggle('theme-dark', dark);
  try { localStorage.setItem(SI_THEME_KEY, dark ? 'dark' : 'light'); } catch (e) {}
  document.querySelectorAll('.pm-seg button').forEach(b => {
    const on = b.dataset.theme === (dark ? 'dark' : 'light');
    b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  // Chart.js (KPI trend modal): dark-compatible labels + gridlines, redraw open charts
  if (window.Chart && Chart.defaults) {
    Chart.defaults.color = dark ? '#94A3B8' : '#666';
    Chart.defaults.borderColor = dark ? 'rgba(148,163,184,.14)' : 'rgba(0,0,0,.1)';
    if (Chart.instances) Object.values(Chart.instances).forEach(c => {
      try {
        Object.values(c.options.scales || {}).forEach(s => {
          if (s.grid) s.grid.color = Chart.defaults.borderColor;
          if (s.ticks) s.ticks.color = Chart.defaults.color;
        });
        c.update('none');
      } catch (e) {}
    });
  }
  // Eva chatbot has its own dark mode — follow the app theme
  const ov = document.getElementById('chatboxOverlay');
  if (ov) {
    if (typeof setDarkMode === 'function') setDarkMode(dark);
    else ov.classList.toggle('dark-mode', dark);
  }
}
/* ---- Account Settings flag: "Enable New Tiles for Insight" (default off).
   On  -> body.si-newtiles: AI Insights list tiles also show the impact
          value and data-point tags.
   Off -> tiles show only the status tag and the KPI name.
   Remembered per browser (localStorage, best-effort). ---- */
const SI_NEWTILES_KEY = 'si-new-tiles';
function siSetNewTiles(on){
  document.body.classList.toggle('si-newtiles', !!on);
  const sw = document.getElementById('si-newtiles-switch');
  if (sw) sw.setAttribute('aria-checked', on ? 'true' : 'false');
  try { localStorage.setItem(SI_NEWTILES_KEY, on ? '1' : '0'); } catch (e) {}
}
function siToggleProfileMenu(){
  const w = document.getElementById('pmWrap');
  if (w) w.classList.toggle('open');
}
document.addEventListener('click', () => { const w = document.getElementById('pmWrap'); if (w) w.classList.remove('open'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { const w = document.getElementById('pmWrap'); if (w) w.classList.remove('open'); } });

function siToggleSettings(){
  const el = document.getElementById('si-settings');
  if (el) el.classList.toggle('open');
}

document.addEventListener('click', () => {
  const el = document.getElementById('si-settings');
  if (el) el.classList.remove('open');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { const el = document.getElementById('si-settings'); if (el) el.classList.remove('open'); }
});

document.addEventListener('DOMContentLoaded', function(){
  // New UI: ON by default (only off if the user switched it off before)
  let on = true;
  // settings gear removed: New UI is always on (saved choices ignored)
  document.body.classList.toggle('si-newui', on);
  const sw = document.getElementById('si-newui-switch');
  if (sw) sw.setAttribute('aria-checked', on ? 'true' : 'false');

  // Disable date range: OFF by default
  let noDate = false;
  // settings gear removed: date range always shown
  document.body.classList.toggle('si-no-daterange', noDate);
  const sw2 = document.getElementById('si-nodate-switch');
  if (sw2) sw2.setAttribute('aria-checked', noDate ? 'true' : 'false');

  // New Insight tiles: OFF by default
  let newTiles = false;
  try { newTiles = localStorage.getItem(SI_NEWTILES_KEY) === '1'; } catch (e) {}
  siSetNewTiles(newTiles);

  siRenderInsights();
  siRenderDeepDive();
  buildAiHub(); // ported verbatim from AI Dashboard/assets/ai-hub-render.js
  // sync theme-dependent pieces (switch state, Chart.js, Eva) once everything exists
  setTimeout(() => siSetTheme(siCurrentTheme()), 0);
});
