import { createStore } from './store.js';
import { catFace, scene, paw, I, FURS, DEFS } from './icons.js';
import {
  todayStr, thisYm, shiftYm, parseD, addDays, dim, pad, num, money, WEEK,
  catList, catInfo, tileColor, ACCOUNTS, accountLabel,
  personalLedger, monthSummary, byCategory, monthlySeries, budgetInfo, statTip,
  distribute, balances, settleUp, supplyInfo, monthEvents,
} from './logic.js';

/* ---------- 小工具 ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
$('#defs').innerHTML = DEFS;
const store = await createStore();
const S = store.state;
const me = () => store.user;
const profile = () => S.profile;
const family = () => S.groups.find(g => g.type === 'family');
const trips = () => S.groups.filter(g => g.type === 'trip');
const customCats = () => profile().customCats || [];
const ledger = () => personalLedger(S.entries, me().uid);
const famEntries = () => (family() ? S.entries.filter(e => e.scopeId === family().id && e.kind === 'family') : []);
const scopeKind = id => (id === me().uid ? 'personal' : 'family');
const memberOf = (g, id) => g.members[id] || { name: '已離開的人', avatar: 'gray' };
const nameOf = (g, id) => (id === me().uid ? '我' : memberOf(g, id).name);
let toastTimer = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
const wd = s => '週' + WEEK[parseD(s).getDay()];
const mdLabel = s => `${Number(s.slice(5, 7))}月${Number(s.slice(8))}日`;

const ui = {
  tab: 'home', home: 'personal', statsScope: 'personal', statsYm: thisYm(), calYm: thisYm(), calSel: todayStr(),
  calFilter: 'all', catId: null, openGroup: null, sheet: null, form: null,
};

/* ---------- 共用片段 ---------- */
const tile = (c, size) => `<span class="tile" style="background:${tileColor(c.id)}${size ? `;width:${size}px;height:${size}px` : ''}">${esc(c.g)}</span>`;
const progress = (pct, cls = '') => `<div class="progress ${cls}" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.min(100, Math.max(0, pct))}%"></i></div>`;
const empty = (msg, sleep = true) => `<div class="empty">${catFace('calico', 64, sleep)}<div>${msg}</div></div>`;
const avatarOf = (m, size = 28) => catFace(m.avatar, size);

function entryRow(e) {
  const kind = e.kind === 'family' ? 'family' : e.kind === 'split' ? 'split' : 'personal';
  const c = catInfo(e.category, kind === 'split' ? 'personal' : kind, e.type, customCats());
  const sub = [accountLabel(e.account), e.note].filter(Boolean).join(' · ');
  const tag = e.fromSplit ? '<span class="tag">分帳份額</span>' : '';
  return `<button class="row" data-a="editEntry" data-id="${e.id}">${tile(c)}
    <span class="grow"><div class="t">${esc(c.label)}${tag}</div><div class="muted small">${esc(sub || mdLabel(e.date))}</div></span>
    <span class="amt ${e.type === 'income' ? 'inc' : ''}">${e.type === 'income' ? '+' : '-'}${num(e.amount)}</span></button>`;
}
function budgetBlock(spent, budget, target) {
  const b = budgetInfo(spent, budget);
  if (!b) return `<div class="bud"><button class="btn ghost sm" data-a="budget" data-t="${target}">設定每月預算</button></div>`;
  return `<div class="bud"><div class="line"><span>預算 ${money(budget)}</span><span class="${b.over ? 'neg' : ''}">${b.over ? `超過 ${money(-b.left)}` : `還剩 ${money(b.left)}`}</span></div>
    ${progress(b.pct, b.over ? 'over' : '')}
    <div class="row" style="border:0;min-height:44px;justify-content:space-between"><span class="muted small">已使用 ${Math.round(b.pct)}%</span><button class="muted small" style="min-height:44px" data-a="budget" data-t="${target}">調整預算</button></div></div>`;
}

/* ---------- 登入 ---------- */
function loginView() {
  const demo = store.mode === 'demo';
  return `<main class="login">${scene()}
    <h1>喵帳本</h1>
    <p class="muted" style="margin:0 0 22px">和貓咪一起，輕鬆記好每一筆</p>
    ${demo
      ? `<button class="btn block" data-a="signin">進入試玩模式</button>
         <p class="muted small" style="margin-top:16px">目前是試玩模式，資料只存在這台裝置。<br>管理員完成 Firebase 設定後，就能用 Google 登入並和家人朋友同步。</p>`
      : `<button class="btn gbtn block" data-a="signin"><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.4-4.8 7.1l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.4z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.6l-7.5-5.8c-2.1 1.4-4.7 2.3-7.7 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg>用 Google 登入</button>
         <p class="muted small" style="margin-top:16px">第一次登入就會自動註冊。<br>你只能看到自己的帳，以及你加入的家庭與群組。</p>`}
  </main>`;
}

/* ---------- 首頁 ---------- */
function pagePersonal() {
  const ym = thisYm(), L = ledger();
  const { income, expense } = monthSummary(L, ym);
  const todayL = L.filter(e => e.date === todayStr());
  return `<section class="card hero"><div class="label">${Number(ym.slice(5))}月剩餘</div>
    <div class="big ${income - expense < 0 ? 'neg' : ''}">${money(income - expense)}</div>
    <div class="duo"><div><span class="label">收入</span><b class="inc">${money(income)}</b></div><div><span class="label">支出</span><b>${money(expense)}</b></div></div>
    ${budgetBlock(expense, profile().budget, 'personal')}</section>
    <section class="card"><div class="card-head"><h3>今天的帳目</h3><span class="muted small">${mdLabel(todayStr())} ${wd(todayStr())}</span></div>
    ${todayL.length ? todayL.map(entryRow).join('') : empty('今天還沒有帳目，點下方貓掌記一筆吧')}</section>
    ${recentList(L.filter(e => e.date !== todayStr()).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6), '最近的帳目')}`;
}
function recentList(list, title) {
  if (!list.length) return '';
  const groups = {};
  list.forEach(e => (groups[e.date] = groups[e.date] || []).push(e));
  return `<section class="card"><h3>${title}</h3>${Object.entries(groups).map(([d, es]) =>
    `<div class="muted small" style="margin-top:6px">${mdLabel(d)} ${wd(d)}</div>${es.map(entryRow).join('')}`).join('')}</section>`;
}

function pageFamily() {
  const fam = family();
  if (!fam) {
    return `<section class="card hero" style="text-align:center">${scene()}
      <h3 style="margin-top:8px">還沒有家庭帳</h3><p class="muted" style="margin:6px 0 14px">家庭帳會和個人帳分開記錄、分開分析。</p>
      <div class="btnrow" style="justify-content:center"><button class="btn" data-a="newGroup" data-t="family">建立家庭</button>
      <button class="btn ghost" data-a="joinGroup">輸入邀請碼</button></div></section>`;
  }
  const ym = thisYm(), E = famEntries();
  const { expense } = monthSummary(E, ym);
  const cats = byCategory(E, ym);
  const recent = E.slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 8);
  return `<div class="fam"><section class="card hero"><div class="card-head"><div class="label">${esc(fam.name)} ${Number(ym.slice(5))}月家庭支出</div></div>
    <div class="big">${money(expense)}</div>
    ${budgetBlock(expense, fam.budget, fam.id)}
    <div class="row" style="border:0;margin-top:6px"><span class="grow" style="display:flex;gap:6px;flex-wrap:wrap">${Object.values(fam.members).map(m => avatarOf(m, 34)).join('')}</span>
    <button class="btn ghost sm" data-a="groupInfo" data-id="${fam.id}">成員與邀請</button></div></section>
    <section class="card"><h3>分類分析</h3>${cats.length ? cats.map(c => catAnalysisRow(c, 'family')).join('') : empty('這個月還沒有家庭支出')}</section>
    <section class="card"><h3>最近的家庭帳目</h3>${recent.length ? recent.map(e => entryRow(e)).join('') : empty('點下方貓掌，選「家庭」來記第一筆')}</section></div>`;
}
function catAnalysisRow(c, kind) {
  const info = catInfo(c.id, kind, 'expense', customCats());
  return `<div class="catrow">${tile(info)}<div class="grow"><div class="line"><span>${esc(info.label)}</span><span><b>${money(c.amount)}</b> <span class="muted">${Math.round(c.pct)}%</span></span></div>${progress(c.pct)}</div></div>`;
}

function pageSplit() {
  if (ui.openGroup) return groupDetail(S.groups.find(g => g.id === ui.openGroup));
  const list = trips();
  const cards = list.map(g => {
    const ids = Object.keys(g.members);
    const b = balances(S.entries.filter(e => e.scopeId === g.id), ids)[me().uid] || 0;
    const msg = b === 0 ? '<span class="muted">目前已結清</span>' : b > 0 ? `<span class="inc">你要收 ${money(b)}</span>` : `<span class="neg">你要付 ${money(-b)}</span>`;
    return `<button class="card row" style="display:flex;border:0" data-a="openGroup" data-id="${g.id}">
      <span class="grow"><h3 style="margin:0 0 4px">${esc(g.name)}</h3><div class="small">${msg}</div></span>
      <span style="display:flex">${ids.slice(0, 4).map(i => avatarOf(g.members[i], 32)).join('')}</span></button>`;
  }).join('');
  return `<div class="btnrow" style="margin-bottom:14px"><button class="btn" data-a="newGroup" data-t="trip">${I.plus}建立群組</button><button class="btn ghost" data-a="joinGroup">輸入邀請碼</button></div>
    ${cards || `<section class="card">${empty('還沒有分帳群組，建立一個旅遊或聚餐群組吧', false)}</section>`}`;
}
function groupDetail(g) {
  if (!g) { ui.openGroup = null; return pageSplit(); }
  const ids = Object.keys(g.members);
  const ents = S.entries.filter(e => e.scopeId === g.id).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const bal = balances(ents, ids);
  const transfers = settleUp(bal);
  const recs = ents.map(e => {
    if (e.kind === 'settle') {
      return `<div class="evt"><span class="tile" style="background:var(--green)">還</span><div class="grow"><div class="t">${esc(nameOf(g, e.from))} 還給 ${esc(nameOf(g, e.to))}</div><div class="muted small">${mdLabel(e.date)}</div></div>
      <b class="amt">${money(e.amount)}</b><button class="iconbtn" data-a="delSettle" data-id="${e.id}" aria-label="取消這筆還款">${I.trash}</button></div>`;
    }
    const c = catInfo(e.category, 'split', 'expense');
    return `<button class="row" data-a="editEntry" data-id="${e.id}">${tile(c)}<span class="grow"><div class="t">${esc(e.note || c.label)}</div>
      <div class="muted small">${esc(nameOf(g, e.payerId))} 先付 · ${Object.keys(e.splits).length} 人分攤 · ${mdLabel(e.date)}</div></span><span class="amt">${num(e.amount)}</span></button>`;
  }).join('');
  return `<div class="btnrow" style="align-items:center;margin-bottom:8px"><button class="iconbtn ondark" data-a="closeGroup" aria-label="回到群組列表">${I.back}</button>
    <h2 class="ondark" style="flex:1;font-size:22px">${esc(g.name)}</h2><button class="btn ghost sm" data-a="groupInfo" data-id="${g.id}">成員與邀請</button></div>
    <section class="card"><h3>誰該收、誰該付</h3>${ids.map(i => {
      const v = bal[i] || 0;
      return `<div class="balance">${avatarOf(memberOf(g, i), 34)}<span class="grow" style="flex:1">${esc(nameOf(g, i))}</span>
      ${v === 0 ? '<span class="muted">已結清</span>' : v > 0 ? `<b class="inc">應收 ${money(v)}</b>` : `<b class="neg">應付 ${money(-v)}</b>`}</div>`;
    }).join('')}</section>
    <section class="card"><h3>最少轉帳次數的還款方式</h3>${transfers.length ? transfers.map(t => `<div class="evt">
      <div class="grow"><b>${esc(nameOf(g, t.from))}</b> <span class="arrow">轉給</span> <b>${esc(nameOf(g, t.to))}</b><div class="small muted">${money(t.amount)}</div></div>
      <button class="btn sm" data-a="markPaid" data-g="${g.id}" data-from="${t.from}" data-to="${t.to}" data-amt="${t.amount}">${I.check}已還</button></div>`).join('')
      : empty('大家都結清囉', false)}<p class="muted small" style="margin:8px 0 0">共 ${transfers.length} 次轉帳。按「已還」會記下還款，餘額會自動更新。</p></section>
    <section class="card"><div class="card-head"><h3>紀錄</h3><button class="btn sm" data-a="addSplit" data-id="${g.id}">${I.plus}記一筆</button></div>${recs || empty('還沒有紀錄')}</section>`;
}

/* ---------- 貓咪 ---------- */
function pageCat() {
  const cats = S.cats;
  if (!cats.length) {
    return `<section class="card hero" style="text-align:center">${scene()}<h3 style="margin-top:12px">新增你的第一隻貓</h3>
      <p class="muted" style="margin:6px 0 14px">記錄貓砂、飼料的使用天數，快用完時會提醒你。</p><button class="btn" data-a="newCat">新增貓咪</button></section>`;
  }
  const cat = cats.find(c => c.id === ui.catId) || cats[0];
  ui.catId = cat.id;
  const kind = scopeKind(cat.scopeId);
  const ents = S.entries.filter(e => e.catId === cat.id && e.type === 'expense');
  const ym = thisYm();
  const series = monthlySeries(ents, ym, 6);
  const avg5 = series.slice(1).reduce((s, x) => s + x.total, 0) / 5;
  const sups = S.supplies.filter(s => s.catId === cat.id).map(s => ({ s, i: supplyInfo(s) })).sort((a, b) => a.i.left - b.i.left);
  const scopeName = kind === 'family' ? `家庭帳（${esc(family()?.name || '')}）` : '個人帳';
  return `<div class="${kind === 'family' ? 'fam' : ''}"><div class="pills" role="tablist">${cats.map(c => `<button class="pill" aria-pressed="${c.id === cat.id}" data-a="pickCat" data-id="${c.id}">${esc(c.name)}</button>`).join('')}
    <button class="pill" data-a="newCat" aria-label="新增貓咪">${I.plus}</button></div>
    <section class="card"><div class="catcard">${catFace(cat.fur, 72)}<div style="flex:1"><h2>${esc(cat.name)}</h2><div class="muted small">花費計入${scopeName}</div></div>
      <button class="iconbtn" data-a="editCat" data-id="${cat.id}" aria-label="編輯貓咪">${I.edit}</button></div>
      <div class="stat3"><div><span class="muted small">本月貓咪支出</span><b>${money(series[5].total)}</b></div><div><span class="muted small">近 5 個月平均</span><b>${money(avg5)}</b></div></div></section>
    <section class="card"><h3>近半年花費</h3>${barChart(series, null, false)}</section>
    <section class="card"><div class="card-head"><h3>用品</h3><button class="btn sm" data-a="newSupply" data-id="${cat.id}">${I.plus}新增用品</button></div>
    ${sups.length ? sups.map(({ s, i }) => `<div class="sup"><div class="line"><div><b>${esc(s.name)}</b><div class="muted small">${money(s.price)} · ${mdLabel(s.buyDate)}買入 · 可用 ${i.days} 天</div></div>
      <button class="iconbtn" data-a="editSupply" data-id="${s.id}" aria-label="編輯用品">${I.edit}</button></div>
      ${progress(i.progress * 100, `supply ${i.low ? 'low' : ''}`)}
      <div class="line" style="margin:6px 0 0;font-size:14px"><span>已用 ${i.used} 天 · ${i.left > 0 ? `還剩 ${i.left} 天` : '已用完'}${i.low ? '<span class="tag" style="background:#F6DDD7;color:var(--danger)">快補貨</span>' : ''}</span>
      <span class="muted">月平均 ${money(i.monthly)}</span></div>
      ${i.low ? `<button class="btn ghost sm" style="margin-top:8px" data-a="rebuy" data-id="${s.id}">再買一次</button>` : ''}</div>`).join('')
      : empty('還沒有用品，新增貓砂或飼料開始記錄')}</section></div>`;
}

/* ---------- 圖表 ---------- */
function barChart(series, selYm, clickable = true) {
  const max = Math.max(1, ...series.map(s => s.total));
  const W = 320, H = 170, bw = 30, gap = (W - series.length * bw) / (series.length + 1);
  const bars = series.map((s, i) => {
    const x = gap + i * (bw + gap), h = Math.max(3, s.total / max * 110), y = 130 - h;
    const sel = clickable ? s.ym === selYm : i === series.length - 1;
    return `<g ${clickable ? `data-a="pickYm" data-ym="${s.ym}" role="button" aria-label="${s.ym} 支出 ${money(s.total)}"` : ''}>
      <rect class="bar-hit" x="${x - gap / 2}" y="0" width="${bw + gap}" height="${H}"/>
      <rect class="bar-rect ${sel ? 'sel' : ''}" x="${x}" y="${y}" width="${bw}" height="${h}" rx="9"/>
      <text class="bar-val" x="${x + bw / 2}" y="${y - 6}" text-anchor="middle">${s.total ? num(s.total) : ''}</text>
      <text class="bar-lbl" x="${x + bw / 2}" y="152" text-anchor="middle">${Number(s.ym.slice(5))}月</text></g>`;
  }).join('');
  return `<svg class="barchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="近半年每月支出長條圖">${bars}</svg>`;
}

/* ---------- 統計 ---------- */
function pageStats() {
  const fam = family();
  if (ui.statsScope === 'family' && !fam) ui.statsScope = 'personal';
  const isFam = ui.statsScope === 'family';
  const list = isFam ? famEntries() : ledger();
  const kind = isFam ? 'family' : 'personal';
  const ym = ui.statsYm;
  const series = monthlySeries(list, thisYm(), 6);
  if (!series.some(s => s.ym === ym)) ui.statsYm = thisYm();
  const cur = monthSummary(list, ym), prev = monthSummary(list, shiftYm(ym, -1));
  const cats = byCategory(list, ym);
  const top = cats[0];
  const budget = isFam ? fam.budget : profile().budget;
  const tip = statTip({ expense: cur.expense, prev: prev.expense, top: top?.id, topPct: top?.pct, budget, label: top ? catInfo(top.id, kind, 'expense', customCats()).label : '' });
  return `<div class="${isFam ? 'fam' : ''}"><div class="seg" style="margin-bottom:14px">
    <button class="${!isFam ? 'on' : ''}" data-a="statsScope" data-s="personal">個人</button>
    <button class="${isFam ? 'on' : ''}" data-a="statsScope" data-s="family" ${fam ? '' : 'disabled style="opacity:.5"'}>家庭</button></div>
    <div class="tip">${catFace(isFam ? 'white' : 'black', 54)}<p>${tip}</p></div>
    <section class="card"><div class="card-head"><h3>近半年每月支出</h3><span class="muted small">點長條切換月份</span></div>${barChart(series, ym)}</section>
    <section class="card"><div class="card-head"><h3>${Number(ym.slice(5))}月各分類</h3><b>${money(cur.expense)}</b></div>
    ${cats.length ? cats.map(c => catAnalysisRow(c, kind)).join('') : empty('這個月沒有支出')}</section></div>`;
}

/* ---------- 行事曆 ---------- */
function calContext() {
  return { schedules: S.schedules, supplies: S.supplies, cats: S.cats, entries: S.entries, uid: me().uid, today: todayStr() };
}
function pageCal() {
  const [y, m] = ui.calYm.split('-').map(Number);
  const f = ui.calFilter;
  const ok = ev => f === 'all' || ev.scopeKind === f;
  const evMap = monthEvents(calContext(), y, m);
  const first = new Date(y, m - 1, 1).getDay(), days = dim(y, m);
  let cells = WEEK.map(w => `<div class="wd">${w}</div>`).join('');
  for (let i = 0; i < first; i++) cells += '<div class="day out"></div>';
  for (let d = 1; d <= days; d++) {
    const date = `${y}-${pad(m)}-${pad(d)}`;
    const evs = (evMap[date] || []).filter(ok);
    const kinds = [...new Set(evs.map(e => e.scopeKind))];
    cells += `<button class="day ${date === todayStr() ? 'today' : ''} ${date === ui.calSel ? 'sel' : ''}" data-a="pickDay" data-d="${date}" aria-label="${m}月${d}日${evs.length ? `，${evs.length} 個排程` : ''}">
      <span>${d}</span><span class="dots">${kinds.map(k => `<i class="${k === 'family' ? 'f' : ''}"></i>`).join('')}</span></button>`;
  }
  const sel = ui.calSel, evs = (evMap[sel] || []).filter(ok);
  const isToday = sel === todayStr();
  const planned = evs.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const spentList = [...(f !== 'family' ? ledger() : []), ...(f !== 'personal' ? famEntries() : [])].filter(e => e.date === sel && e.type === 'expense');
  const spent = spentList.reduce((s, e) => s + e.amount, 0);
  const vs = isToday ? `<section class="card"><h3>今天：預計花費 vs 已花費</h3><div class="vs">
    <div><div class="card-head" style="margin:0"><span>預計花費</span><b>${money(planned)}</b></div>${progress(100)}</div>
    <div><div class="card-head" style="margin:0"><span>已花費</span><b class="${spent > planned && planned ? 'neg' : ''}">${money(spent)}</b></div>${progress(planned ? spent / planned * 100 : (spent ? 100 : 0), spent > planned && planned ? 'over' : '')}</div></div></section>` : '';
  const evHtml = evs.map(ev => {
    const lab = { plan: '預計開銷', fixed: '每月固定', restock: '補貨提醒' }[ev.kind];
    const mark = { plan: '預', fixed: '固', restock: '補' }[ev.kind];
    const who = ev.scopeKind === 'family' ? '家庭' : '個人';
    const action = ev.kind === 'restock'
      ? `<button class="btn ghost sm" data-a="goCat">去看看</button>`
      : ev.done ? `<button class="btn ghost sm" data-a="undoEv" data-k="${ev.key}">已記帳</button>`
        : `<button class="btn sm" data-a="doEv" data-k="${ev.key}" data-d="${ev.date}">記帳</button>`;
    return `<div class="evt ${ev.done ? 'done' : ''}"><span class="tile" style="background:${ev.scopeKind === 'family' ? 'var(--blue)' : 'var(--peach)'}">${mark}</span>
      <div class="grow"><div class="t">${esc(ev.title)}</div><div class="muted small">${lab} · ${who} · <span class="${ev.type === 'income' ? 'inc' : ''}">${ev.type === 'income' ? '+' : '-'}${num(ev.amount)}</span></div></div>
      ${action}${ev.schId ? `<button class="iconbtn" data-a="editSched" data-id="${ev.schId}" aria-label="編輯排程">${I.edit}</button>` : ''}</div>`;
  }).join('');
  return `<div class="calhead ondark"><button class="iconbtn ondark" data-a="calNav" data-n="-1" aria-label="上個月">${I.left}</button><h2>${y} 年 ${m} 月</h2><button class="iconbtn" data-a="calNav" data-n="1" aria-label="下個月" style="color:var(--light)">${I.right}</button></div>
    <div class="pills" style="padding-bottom:8px">${[['all', '全部'], ['personal', '個人'], ['family', '家庭']].map(([k, l]) => `<button class="pill" aria-pressed="${f === k}" data-a="calFilter" data-f="${k}">${l}</button>`).join('')}</div>
    <section class="card"><div class="cal">${cells}</div>
    <div class="muted small" style="margin-top:8px;display:flex;gap:14px"><span><span style="color:var(--brand)">●</span> 個人</span><span><span style="color:var(--teal)">●</span> 家庭</span></div></section>
    ${vs}
    <section class="card"><div class="card-head"><h3>${mdLabel(sel)} ${wd(sel)}</h3><button class="btn sm" data-a="newSched">${I.plus}新增排程</button></div>
    ${evHtml || empty('這天沒有排程，貓咪在睡午覺')}
    ${spentList.length ? `<div class="muted small" style="margin-top:10px">這天已記的支出</div>${spentList.map(entryRow).join('')}` : ''}</section>`;
}

/* ---------- 我的 ---------- */
function pageMe() {
  const p = profile();
  return `<section class="card"><div class="catcard">${catFace(p.avatar, 76)}<div style="flex:1;min-width:0"><h2>${esc(p.name)}</h2><div class="muted small" style="overflow:hidden;text-overflow:ellipsis">${esc(me().email || (store.mode === 'demo' ? '試玩模式' : ''))}</div></div>
    <button class="btn ghost sm" data-a="editProfile">編輯</button></div></section>
    <section class="card"><div class="card-head"><h3>每月預算</h3><button class="btn ghost sm" data-a="budget" data-t="personal">調整</button></div><div>${p.budget ? money(p.budget) : '<span class="muted">還沒設定</span>'}</div></section>
    <section class="card"><div class="card-head"><h3>自訂支出分類</h3><button class="btn ghost sm" data-a="newCustom">${I.plus}新增</button></div>
      ${customCats().length ? `<div class="chips">${customCats().map(c => `<span class="chip">${esc(c.label)}<button class="iconbtn" style="width:32px;height:32px" data-a="delCustom" data-id="${c.id}" aria-label="刪除 ${esc(c.label)}">${I.close}</button></span>`).join('')}</div>` : '<div class="muted small">例如「訂閱」「保險」，會出現在記一筆的分類裡。</div>'}</section>
    <section class="card"><h3>我的家庭與群組</h3>${S.groups.length ? S.groups.map(g => `<div class="evt"><div class="grow"><b>${esc(g.name)}</b><div class="muted small">${g.type === 'family' ? '家庭' : '朋友分帳'} · ${Object.keys(g.members).length} 人</div></div>
      <button class="btn ghost sm" data-a="groupInfo" data-id="${g.id}">詳細</button></div>`).join('') : '<div class="muted small">還沒有加入任何家庭或群組。</div>'}</section>
    ${store.mode === 'demo' ? `<section class="card"><h3>試玩模式工具</h3><div class="btnrow"><button class="btn ghost sm" data-a="sample">載入範例資料</button><button class="btn danger sm" data-a="resetDemo">清空資料</button></div></section>` : ''}
    <button class="btn ghost block" data-a="signout">登出</button>`;
}

/* ---------- 外框與導覽 ---------- */
function shell(page, tabs) {
  const nav = [['home', '首頁', I.home], ['stats', '統計', I.chart], ['add'], ['cal', '行事曆', I.cal], ['me', '我的', I.user]]
    .map(([id, label, icon]) => id === 'add'
      ? `<div class="fab-wrap"><button class="fab" data-a="add" aria-label="記一筆">${paw(34)}</button><span class="fab-label">記一筆</span></div>`
      : `<button class="${ui.tab === id ? 'on' : ''}" data-a="tab" data-t="${id}" aria-current="${ui.tab === id}">${icon}${label}</button>`).join('');
  return `<div class="wrap"><header class="top"><div class="brand">${catFace('black', 38)}喵帳本</div>
    <button class="avatar-btn" data-a="tab" data-t="me" aria-label="我的">${catFace(profile().avatar, 36)}</button></header>
    ${tabs || ''}<main>${page}</main></div><nav class="nav" aria-label="主要導覽"><div class="nav-in">${nav}</div></nav>`;
}
function render() {
  const app = $('#app');
  if (!me()) { app.innerHTML = loginView(); return; }
  if (!profile()) { app.innerHTML = `<div class="login">${catFace('calico', 80, true)}<p class="muted">貓咪正在準備帳本…</p></div>`; return; }
  let page, tabs = '';
  if (ui.tab === 'home') {
    const hs = [['personal', '個人'], ['family', '家庭'], ['split', '朋友分帳'], ['cat', '貓咪']];
    tabs = `<div class="pills" role="tablist">${hs.map(([k, l]) => `<button class="pill" role="tab" aria-pressed="${ui.home === k}" data-a="homeTab" data-t="${k}">${l}</button>`).join('')}</div>`;
    page = { personal: pagePersonal, family: pageFamily, split: pageSplit, cat: pageCat }[ui.home]();
  } else page = { stats: pageStats, cal: pageCal, me: pageMe }[ui.tab]();
  const y = window.scrollY;
  app.innerHTML = shell(page, tabs);
  window.scrollTo(0, y);
}

/* ---------- 彈出視窗 ---------- */
function openSheet(type, form = {}, rerender = true) { ui.sheet = { type }; ui.form = form; if (rerender) renderSheet(); }
function closeSheet() { ui.sheet = null; ui.form = null; $('#sheet').innerHTML = ''; }
const field = (label, html) => `<div class="field"><label>${label}</label>${html}</div>`;
const input = (f, type = 'text', extra = '') => `<input class="in" type="${type}" data-f="${f}" value="${esc(ui.form[f] ?? '')}" ${extra}>`;
const chips = (f, opts, val) => `<div class="chips">${opts.map(([v, l]) => `<button type="button" class="chip ${val === v ? 'on' : ''}" data-a="setf" data-f="${f}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;
const sheetFrame = (title, body, full = false) => `<div class="overlay" data-a="overlay"><div class="sheet ${full ? 'full' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
  <div class="sheet-head"><h2>${esc(title)}</h2><button class="iconbtn" data-a="closeSheet" aria-label="關閉">${I.close}</button></div>${body}</div></div>`;

function scopeChips() {
  const fam = family();
  if (!fam) return '';
  return field('記在哪一本帳', chips('scope', [['personal', '個人帳'], ['family', `家庭帳（${fam.name}）`]], ui.form.scope));
}
function entrySheet() {
  const f = ui.form, isEdit = !!f.id;
  const kind = f.split ? 'split' : f.scope;
  const cats = catList(kind, f.type, customCats());
  const amt = parseInt(f.amount || '0', 10);
  const petCats = f.scope === 'family' ? S.cats.filter(c => c.scopeId === family()?.id) : S.cats.filter(c => c.scopeId === me().uid);
  const showPet = !f.split && f.type === 'expense' && f.category === 'pet' && petCats.length;
  const canSplit = f.type === 'expense' && (f.split || (!isEdit && f.scope === 'personal'));
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'];
  return `<div class="overlay" data-a="overlay"><div class="sheet full ${f.scope === 'family' && !f.split ? 'fam' : ''}" role="dialog" aria-modal="true" aria-label="記一筆">
    <div class="sheet-head"><button class="iconbtn" data-a="closeSheet" aria-label="關閉">${I.close}</button><h2>${isEdit ? '編輯帳目' : '記一筆'}</h2><span style="width:44px"></span></div>
    ${f.split ? '' : `<div class="seg" style="margin-bottom:6px"><button class="${f.type === 'expense' ? 'on' : ''}" data-a="setType" data-v="expense">支出</button><button class="${f.type === 'income' ? 'on' : ''}" data-a="setType" data-v="income">收入</button></div>`}
    ${!isEdit && !f.split ? scopeChips() : ''}
    <div class="amount ${f.type === 'income' ? 'inc' : 'exp'}" aria-live="polite">NT$ ${num(amt)}</div>
    <div class="catgrid">${cats.map(c => `<button class="catbtn ${f.category === c.id ? 'on' : ''}" data-a="setf" data-f="category" data-v="${c.id}">${tile(c)}<span>${esc(c.label)}</span></button>`).join('')}</div>
    ${showPet ? field('是哪隻貓的花費（可不選）', chips('catId', [['', '不指定'], ...petCats.map(c => [c.id, c.name])], f.catId)) : ''}
    <div class="keypad">${keys.map(k => `<button data-a="key" data-k="${k}" aria-label="${k === 'del' ? '刪除' : k}">${k === 'del' ? I.del : k}</button>`).join('')}</div>
    ${field('備註', input('note', 'text', 'placeholder="例如：和同事吃午餐" maxlength="60"'))}
    ${field('日期', input('date', 'date'))}
    ${f.split ? '' : field('帳戶', chips('account', ACCOUNTS.map(a => [a.id, a.label]), f.account))}
    ${canSplit ? `<button class="switch ${f.split ? 'on' : ''}" data-a="toggleSplit" role="switch" aria-checked="${f.split}"><span>和朋友分帳</span><span class="knob"></span></button>` : ''}
    ${f.split ? splitPanel() : ''}
    <div class="savebar"><button class="btn" data-a="saveEntry">儲存</button>${isEdit ? `<button class="btn danger" data-a="delEntry" aria-label="刪除">${I.trash}</button>` : ''}</div>
  </div></div>`;
}
function splitPanel() {
  const f = ui.form, list = trips();
  if (!list.length) return `<div class="splitbox muted">還沒有分帳群組，請先到「首頁 > 朋友分帳」建立。</div>`;
  const g = list.find(x => x.id === f.groupId) || list[0];
  const ids = Object.keys(g.members);
  const amt = parseInt(f.amount || '0', 10);
  const parts = ids.filter(i => f.part[i]);
  const eq = f.mode === 'equal' && parts.length && amt ? distribute(amt, parts) : {};
  return `<div class="splitbox">
    ${f.id ? `<div class="lbl">群組：${esc(g.name)}</div>` : field('分帳群組', chips('groupId', list.map(x => [x.id, x.name]), g.id))}
    ${field('誰先付錢', `<div class="chips">${ids.map(i => `<button class="chip ${f.payerId === i ? 'on' : ''}" data-a="setf" data-f="payerId" data-v="${i}">${avatarOf(memberOf(g, i), 24)}${esc(nameOf(g, i))}</button>`).join('')}</div>`)}
    <div class="field"><label>分攤方式</label><div class="seg"><button class="${f.mode === 'equal' ? 'on' : ''}" data-a="setf" data-f="mode" data-v="equal">平分</button><button class="${f.mode === 'custom' ? 'on' : ''}" data-a="setf" data-f="mode" data-v="custom">自訂金額</button></div></div>
    ${ids.map(i => f.mode === 'equal'
      ? `<button class="mrow" data-a="togglePart" data-id="${i}" role="checkbox" aria-checked="${!!f.part[i]}"><span class="check ${f.part[i] ? 'on' : ''}">${f.part[i] ? I.check : ''}</span>${avatarOf(memberOf(g, i), 30)}<span class="grow">${esc(nameOf(g, i))}</span><span class="muted">${f.part[i] ? money(eq[i] || 0) : ''}</span></button>`
      : `<div class="mrow">${avatarOf(memberOf(g, i), 30)}<span class="grow">${esc(nameOf(g, i))}</span><input class="in amt-in" inputmode="numeric" data-f="custom:${i}" value="${esc(f.custom[i] ?? '')}" placeholder="0" aria-label="${esc(nameOf(g, i))} 的分攤金額"></div>`).join('')}
    ${f.mode === 'custom' ? `<div class="small" id="splitHint">${customHint()}</div>` : ''}</div>`;
}
function customHint() {
  const f = ui.form, amt = parseInt(f.amount || '0', 10);
  const s = Object.values(f.custom).reduce((a, v) => a + (parseInt(v, 10) || 0), 0);
  const diff = amt - s;
  return diff === 0 ? '<span class="inc">金額剛好分完</span>' : `<span class="${diff < 0 ? 'neg' : 'muted'}">${diff > 0 ? `還差 ${money(diff)} 沒分配` : `多分配了 ${money(-diff)}`}</span>`;
}

function renderSheet() {
  const s = ui.sheet, f = ui.form;
  if (!s) { $('#sheet').innerHTML = ''; return; }
  let html = '';
  const y = $('#sheet .sheet')?.scrollTop || 0;
  switch (s.type) {
    case 'entry': html = entrySheet(); break;
    case 'budget': html = sheetFrame(f.target === 'personal' ? '個人每月預算' : '家庭每月預算', `${field('預算金額（NT$）', input('value', 'number', 'inputmode="numeric" min="0" placeholder="例如 20000"'))}<button class="btn block" data-a="saveBudget">儲存</button>`); break;
    case 'group': html = sheetFrame(f.gtype === 'family' ? '建立家庭' : '建立分帳群組', `${field('名稱', input('name', 'text', `maxlength="20" placeholder="${f.gtype === 'family' ? '例如：喵窩小家' : '例如：花蓮旅行'}"`))}<button class="btn block" data-a="saveGroup">建立</button>`); break;
    case 'join': html = sheetFrame('輸入邀請碼', `${field('6 碼邀請碼', input('code', 'text', 'maxlength="6" autocapitalize="characters" placeholder="例如 K7M2QX" style="text-transform:uppercase;letter-spacing:3px"'))}<button class="btn block" data-a="saveJoin">加入</button>`); break;
    case 'guest': html = sheetFrame('新增沒有帳號的朋友', `${field('名字', input('name', 'text', 'maxlength="12" placeholder="朋友的名字"'))}<p class="muted small">對方不用註冊也能參與分帳，之後也可以請他用邀請碼加入。</p><button class="btn block" data-a="saveGuest">新增</button>`); break;
    case 'profile': html = sheetFrame('編輯個人資料', `${field('暱稱', input('name', 'text', 'maxlength="12"'))}${field('我的貓咪頭像', `<div class="chips">${FURS.map(x => `<button class="chip ${f.avatar === x.id ? 'on' : ''}" data-a="setf" data-f="avatar" data-v="${x.id}">${catFace(x.id, 28)}${x.name}</button>`).join('')}</div>`)}<button class="btn block" data-a="saveProfile">儲存</button>`); break;
    case 'custom': html = sheetFrame('新增自訂分類', `${field('分類名稱（會取第一個字當圖示）', input('label', 'text', 'maxlength="8" placeholder="例如：訂閱"'))}<button class="btn block" data-a="saveCustom">新增</button>`); break;
    case 'cat': html = sheetFrame(f.id ? '編輯貓咪' : '新增貓咪', `${field('名字', input('name', 'text', 'maxlength="12" placeholder="例如：麻糬"'))}${field('毛色', `<div class="chips">${FURS.map(x => `<button class="chip ${f.fur === x.id ? 'on' : ''}" data-a="setf" data-f="fur" data-v="${x.id}">${catFace(x.id, 28)}${x.name}</button>`).join('')}</div>`)}
      ${!f.id && family() ? field('花費記在', chips('scopeId', [[me().uid, '個人帳'], [family().id, '家庭帳']], f.scopeId)) : ''}
      <div class="btnrow"><button class="btn" style="flex:1" data-a="saveCat">儲存</button>${f.id ? `<button class="btn danger" data-a="delCat" aria-label="刪除">${I.trash}</button>` : ''}</div>`); break;
    case 'supply': html = sheetFrame(f.id ? '編輯用品' : '新增用品', `${field('名稱', input('name', 'text', 'maxlength="20" placeholder="例如：貓砂 10L"'))}${field('價格（NT$）', input('price', 'number', 'inputmode="numeric" min="0"'))}${field('買入日期', input('buyDate', 'date'))}${field('預計可用天數', input('days', 'number', 'inputmode="numeric" min="1"'))}
      <p class="muted small">儲存後會同時記一筆「毛孩」支出到${scopeKind(S.cats.find(c => c.id === f.catId)?.scopeId) === 'family' ? '家庭帳' : '個人帳'}，不用再記一次。</p>
      <div class="btnrow"><button class="btn" style="flex:1" data-a="saveSupply">儲存</button>${f.id ? `<button class="btn danger" data-a="delSupply" aria-label="刪除">${I.trash}</button>` : ''}</div>`); break;
    case 'sched': {
      const kind = f.scope;
      const cats = catList(kind, f.type, customCats());
      html = sheetFrame(f.id ? '編輯排程' : '新增排程', `${field('標題', input('title', 'text', 'maxlength="24" placeholder="例如：房貸、朋友聚餐"'))}${field('金額（NT$）', input('amount', 'number', 'inputmode="numeric" min="0"'))}
        ${field('收支', chips('type', [['expense', '支出'], ['income', '收入']], f.type))}
        ${field('重複', chips('repeat', [['none', '只有這一天'], ['monthly', '每月固定']], f.repeat))}
        ${field(f.repeat === 'monthly' ? '從哪天開始（之後每月同一天）' : '日期', input('date', 'date'))}
        ${family() && !f.id ? field('歸屬', chips('scope', [['personal', '個人'], ['family', '家庭']], f.scope)) : ''}
        ${field('記帳時用的分類', `<select class="in" data-f="category">${cats.map(c => `<option value="${c.id}" ${f.category === c.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}</select>`)}
        <div class="btnrow"><button class="btn" style="flex:1" data-a="saveSched">儲存</button>${f.id ? `<button class="btn danger" data-a="delSched" aria-label="刪除">${I.trash}</button>` : ''}</div>`);
      break;
    }
    case 'groupInfo': {
      const g = S.groups.find(x => x.id === f.id);
      if (!g) { closeSheet(); return; }
      html = sheetFrame(g.name, `<div class="field"><label>邀請碼（傳給${g.type === 'family' ? '家人' : '朋友'}，在「輸入邀請碼」貼上就能加入）</label>
        <div class="btnrow" style="align-items:center"><span class="code">${esc(g.inviteCode)}</span><button class="btn ghost sm" data-a="copyCode" data-c="${esc(g.inviteCode)}">${I.copy}複製</button></div></div>
        <div class="field"><label>成員</label>${Object.entries(g.members).map(([id, m]) => `<div class="mrow">${avatarOf(m, 34)}<span class="grow">${esc(m.name)}${id === me().uid ? '（我）' : ''}${m.guest ? '<span class="tag">沒有帳號</span>' : ''}</span>${m.guest ? `<button class="iconbtn" data-a="delGuest" data-g="${g.id}" data-id="${id}" aria-label="移除 ${esc(m.name)}">${I.trash}</button>` : ''}</div>`).join('')}
        <button class="btn ghost sm" data-a="newGuest" data-id="${g.id}">${I.plus}新增沒有帳號的朋友</button></div>
        ${g.type === 'family' ? `<div class="field"><label>家庭每月預算</label><button class="btn ghost sm" data-a="budget" data-t="${g.id}">${g.budget ? money(g.budget) : '設定'}</button></div>` : ''}
        <button class="btn danger block" data-a="leaveGroup" data-id="${g.id}">離開${g.type === 'family' ? '家庭' : '群組'}</button>`);
      break;
    }
  }
  $('#sheet').innerHTML = html;
  const sh = $('#sheet .sheet'); if (sh) sh.scrollTop = y;
}

/* ---------- 表單流程 ---------- */
function defaultCat(kind, type) { return catList(kind, type, customCats())[0].id; }
function openEntry(init = {}) {
  const form = {
    id: null, type: 'expense', scope: 'personal', amount: '', category: 'food', note: '', date: todayStr(), account: 'cash', catId: '',
    split: false, groupId: '', payerId: me().uid, mode: 'equal', part: {}, custom: {}, ...init,
  };
  openSheet('entry', form);
}
function initSplit(f, gid) {
  const list = trips();
  const g = list.find(x => x.id === gid) || list[0];
  if (!g) return;
  f.groupId = g.id;
  f.payerId = me().uid in g.members ? me().uid : Object.keys(g.members)[0];
  f.part = Object.fromEntries(Object.keys(g.members).map(i => [i, true]));
  f.custom = {};
}
function editEntry(id) {
  const e = S.entries.find(x => x.id === id);
  if (!e) return;
  if (e.supplyId) { const sp = S.supplies.find(s => s.id === e.supplyId); if (sp) return editSupply(sp.id); }
  if (e.kind === 'split') {
    openEntry({
      id, type: 'expense', amount: String(e.amount), category: e.category, note: e.note || '', date: e.date, split: true,
      groupId: e.scopeId, payerId: e.payerId, mode: 'custom', part: Object.fromEntries(Object.keys(e.splits).map(i => [i, true])),
      custom: Object.fromEntries(Object.entries(e.splits).map(([i, v]) => [i, String(v)])),
    });
  } else {
    openEntry({ id, type: e.type, scope: e.kind, amount: String(e.amount), category: e.category, note: e.note || '', date: e.date, account: e.account || 'cash', catId: e.catId || '' });
  }
}
async function saveEntry() {
  const f = ui.form, amt = parseInt(f.amount || '0', 10);
  if (!amt) return toast('先輸入金額喵');
  if (!f.date) return toast('請選擇日期');
  let data;
  if (f.split) {
    const g = trips().find(x => x.id === f.groupId);
    if (!g) return toast('請先選擇分帳群組');
    const ids = Object.keys(g.members);
    let splits;
    if (f.mode === 'equal') {
      const p = ids.filter(i => f.part[i]);
      if (!p.length) return toast('至少要選一位分攤的人');
      splits = distribute(amt, p);
    } else {
      splits = {}; let sum = 0;
      for (const i of ids) { const v = parseInt(f.custom[i] || '0', 10) || 0; if (v > 0) { splits[i] = v; sum += v; } }
      if (sum !== amt) return toast(`分攤合計要等於 ${money(amt)}，現在是 ${money(sum)}`);
    }
    data = { scopeId: g.id, kind: 'split', type: 'expense', amount: amt, category: f.category, note: f.note.trim(), date: f.date, payerId: f.payerId, splits };
  } else {
    const scopeId = f.scope === 'family' ? family().id : me().uid;
    data = { scopeId, kind: f.scope, type: f.type, amount: amt, category: f.category, note: f.note.trim(), date: f.date, account: f.account, catId: f.type === 'expense' && f.category === 'pet' ? f.catId || '' : '' };
  }
  try {
    if (f.id) { const { scopeId, kind, ...patch } = data; await store.update('entries', f.id, patch); } else await store.add('entries', data);
    closeSheet(); toast('記好了，喵');
  } catch (e) { toast('儲存失敗：' + e.message); }
}

function openSched(init = {}) {
  openSheet('sched', { id: null, title: '', amount: '', type: 'expense', repeat: 'none', date: ui.calSel, scope: 'personal', category: 'other', ...init });
}
async function saveSched() {
  const f = ui.form, amount = parseInt(f.amount || '0', 10);
  if (!f.title.trim()) return toast('請輸入標題');
  if (!amount) return toast('請輸入金額');
  if (!f.date) return toast('請選擇日期');
  const data = {
    scopeId: f.scope === 'family' && family() ? family().id : me().uid, title: f.title.trim(), amount, type: f.type, repeat: f.repeat,
    date: f.date, day: Number(f.date.slice(8)), startDate: f.date, category: f.category,
  };
  try {
    if (f.id) { const { scopeId, ...patch } = data; await store.update('schedules', f.id, patch); } else await store.add('schedules', data);
    ui.calYm = f.date.slice(0, 7); ui.calSel = f.date;
    closeSheet(); toast('排程新增好了');
  } catch (e) { toast('儲存失敗：' + e.message); }
}
async function recordEvent(key, date) {
  const evMap = monthEvents(calContext(), Number(date.slice(0, 4)), Number(date.slice(5, 7)));
  const ev = (evMap[date] || []).find(x => x.key === key);
  if (!ev) return;
  const kind = ev.scopeKind;
  const cat = ev.category && catList(kind, ev.type, customCats()).some(c => c.id === ev.category) ? ev.category : defaultCat(kind, ev.type);
  await store.add('entries', { scopeId: ev.scopeId, kind, type: ev.type, amount: ev.amount, category: cat, note: ev.title, date, account: 'cash', scheduleKey: key });
  toast('已記帳');
}

function supplyForm(init) {
  return { id: null, catId: ui.catId, name: '', price: '', buyDate: todayStr(), days: '30', ...init };
}
function editSupply(id) {
  const s = S.supplies.find(x => x.id === id);
  if (s) openSheet('supply', supplyForm({ id, catId: s.catId, name: s.name, price: String(s.price), buyDate: s.buyDate, days: String(s.days) }));
}
async function saveSupply() {
  const f = ui.form, cat = S.cats.find(c => c.id === f.catId);
  const price = parseInt(f.price || '0', 10), days = parseInt(f.days || '0', 10);
  if (!f.name.trim() || !price || !days || !f.buyDate) return toast('名稱、價格、日期和可用天數都要填喔');
  const kind = scopeKind(cat.scopeId);
  const base = { name: f.name.trim(), price, buyDate: f.buyDate, days };
  const entry = { amount: price, date: f.buyDate, note: base.name, catId: cat.id };
  try {
    if (f.id) {
      await store.update('supplies', f.id, base);
      const e = S.entries.find(x => x.supplyId === f.id);
      if (e) await store.update('entries', e.id, entry);
    } else {
      const sid = await store.add('supplies', { ...base, catId: cat.id, scopeId: cat.scopeId });
      await store.add('entries', { ...entry, scopeId: cat.scopeId, kind, type: 'expense', category: 'pet', account: 'cash', supplyId: sid });
    }
    closeSheet(); toast('用品記好了，已同步計入毛孩支出');
  } catch (e) { toast('儲存失敗：' + e.message); }
}
async function deleteSupply(id) {
  for (const e of S.entries.filter(x => x.supplyId === id)) await store.remove('entries', e.id);
  await store.remove('supplies', id);
}

/* ---------- 事件處理 ---------- */
const A = {
  signin: async () => { try { await store.signIn(); } catch (e) { toast('登入失敗：' + e.message); } },
  signout: async () => { await store.signOut(); ui.tab = 'home'; },
  tab(el) { ui.tab = el.dataset.t; window.scrollTo(0, 0); },
  homeTab(el) { ui.home = el.dataset.t; ui.openGroup = null; },
  add() { openEntry(ui.home === 'family' && family() ? { scope: 'family', category: 'grocery' } : {}); },
  closeSheet, overlay(el, ev) { if (ev.target === el) closeSheet(); },
  key(el) {
    const f = ui.form, k = el.dataset.k;
    if (k === 'del') f.amount = f.amount.slice(0, -1);
    else if (f.amount.length < 9) f.amount = (f.amount + k).replace(/^0+/, '');
    renderSheet();
  },
  setf(el) {
    const f = ui.form, k = el.dataset.f, v = el.dataset.v;
    f[k] = v;
    if (k === 'groupId') initSplit(f, v);
    if (k === 'scope') { f.category = defaultCat(f.split ? 'split' : v === 'family' ? 'family' : 'personal', f.type); f.catId = ''; if (ui.sheet.type === 'sched') f.category = defaultCat(v, f.type); }
    if (k === 'type' && ui.sheet.type === 'sched') f.category = defaultCat(f.scope, v);
    if (k === 'mode' && v === 'custom' && f.split) { /* 保留已輸入的金額 */ }
    renderSheet();
  },
  setType(el) {
    const f = ui.form; f.type = el.dataset.v; if (f.type === 'income') f.split = false;
    f.category = defaultCat(f.split ? 'split' : f.scope === 'family' ? 'family' : 'personal', f.type); renderSheet();
  },
  toggleSplit() {
    const f = ui.form;
    if (!trips().length) { toast('先到「首頁 > 朋友分帳」建立群組喔'); return; }
    f.split = !f.split;
    if (f.split) { initSplit(f, ui.openGroup); f.scope = 'personal'; }
    f.category = defaultCat(f.split ? 'split' : 'personal', f.type);
    renderSheet();
  },
  togglePart(el) { const f = ui.form, i = el.dataset.id; f.part[i] = !f.part[i]; renderSheet(); },
  saveEntry,
  editEntry(el) { editEntry(el.dataset.id); },
  async delEntry() {
    if (!confirm('確定要刪除這筆帳目嗎？')) return;
    await store.remove('entries', ui.form.id); closeSheet(); toast('已刪除');
  },
  budget(el) {
    const t = el.dataset.t;
    const cur = t === 'personal' ? profile().budget : S.groups.find(g => g.id === t)?.budget;
    openSheet('budget', { target: t, value: cur ? String(cur) : '' });
  },
  async saveBudget() {
    const f = ui.form, v = Math.max(0, parseInt(f.value || '0', 10) || 0);
    if (f.target === 'personal') await store.saveProfile({ budget: v }); else await store.updateGroup(f.target, { budget: v });
    closeSheet(); toast('預算更新了');
  },
  newGroup(el) { openSheet('group', { gtype: el.dataset.t, name: '' }); },
  async saveGroup() {
    const f = ui.form; if (!f.name.trim()) return toast('請輸入名稱');
    try {
      const id = await store.createGroup(f.gtype, f.name.trim());
      closeSheet(); toast('建立好了');
      if (f.gtype === 'trip') { ui.openGroup = id; }
      setTimeout(() => openSheet('groupInfo', { id }), 120);
    } catch (e) { toast('建立失敗：' + e.message); }
  },
  joinGroup() { openSheet('join', { code: '' }); },
  async saveJoin() {
    const code = (ui.form.code || '').trim();
    if (code.length < 6) return toast('邀請碼是 6 碼喔');
    try { await store.joinByCode(code); closeSheet(); toast('加入成功'); } catch (e) { toast(e.message); }
  },
  groupInfo(el) { openSheet('groupInfo', { id: el.dataset.id }); },
  openGroup(el) { ui.openGroup = el.dataset.id; window.scrollTo(0, 0); },
  closeGroup() { ui.openGroup = null; },
  newGuest(el) { openSheet('guest', { gid: el.dataset.id, name: '' }); },
  async saveGuest() {
    const f = ui.form; if (!f.name.trim()) return toast('請輸入名字');
    const gid = f.gid; await store.addGuest(gid, f.name.trim()); openSheet('groupInfo', { id: gid }); toast('新增好了');
  },
  async delGuest(el) {
    if (!confirm('移除這位朋友？他之前的分帳紀錄會保留。')) return;
    await store.removeGuest(el.dataset.g, el.dataset.id); renderSheet();
  },
  async leaveGroup(el) {
    if (!confirm('確定要離開嗎？離開後就看不到這裡的帳目了。')) return;
    await store.leaveGroup(el.dataset.id); ui.openGroup = null; closeSheet(); toast('已離開');
  },
  copyCode(el) { navigator.clipboard?.writeText(el.dataset.c).then(() => toast('邀請碼已複製'), () => toast('請手動複製邀請碼')); },
  addSplit(el) {
    openEntry({ split: true, category: 'food' });
    initSplit(ui.form, el.dataset.id); renderSheet();
  },
  async markPaid(el) {
    const d = el.dataset;
    await store.add('entries', { scopeId: d.g, kind: 'settle', type: 'expense', amount: Number(d.amt), from: d.from, to: d.to, date: todayStr(), category: 'other', note: '' });
    toast('已標記為已還');
  },
  async delSettle(el) { if (confirm('取消這筆還款紀錄？')) await store.remove('entries', el.dataset.id); },
  statsScope(el) { ui.statsScope = el.dataset.s; ui.statsYm = thisYm(); },
  pickYm(el) { ui.statsYm = el.dataset.ym; },
  calNav(el) { ui.calYm = shiftYm(ui.calYm, Number(el.dataset.n)); ui.calSel = ui.calYm === thisYm() ? todayStr() : ui.calYm + '-01'; },
  calFilter(el) { ui.calFilter = el.dataset.f; },
  pickDay(el) { ui.calSel = el.dataset.d; },
  newSched() { openSched(); },
  editSched(el) {
    const s = S.schedules.find(x => x.id === el.dataset.id); if (!s) return;
    openSched({ id: s.id, title: s.title, amount: String(s.amount), type: s.type, repeat: s.repeat, date: s.startDate || s.date, scope: scopeKind(s.scopeId), category: s.category || 'other' });
  },
  saveSched,
  async delSched() { if (confirm('刪除這個排程？已經記的帳不會被刪掉。')) { await store.remove('schedules', ui.form.id); closeSheet(); toast('已刪除'); } },
  doEv(el) { recordEvent(el.dataset.k, el.dataset.d); },
  async undoEv(el) { const e = S.entries.find(x => x.scheduleKey === el.dataset.k); if (e) { await store.remove('entries', e.id); toast('已取消記帳'); } },
  goCat() { ui.tab = 'home'; ui.home = 'cat'; },
  pickCat(el) { ui.catId = el.dataset.id; },
  newCat() { openSheet('cat', { id: null, name: '', fur: 'black', scopeId: me().uid }); },
  editCat(el) { const c = S.cats.find(x => x.id === el.dataset.id); openSheet('cat', { id: c.id, name: c.name, fur: c.fur, scopeId: c.scopeId }); },
  async saveCat() {
    const f = ui.form; if (!f.name.trim()) return toast('請輸入貓咪名字');
    if (f.id) await store.update('cats', f.id, { name: f.name.trim(), fur: f.fur });
    else ui.catId = await store.add('cats', { name: f.name.trim(), fur: f.fur, scopeId: f.scopeId });
    closeSheet(); toast('貓咪資料儲存了');
  },
  async delCat() {
    if (!confirm('刪除這隻貓和牠的用品？已記的支出會保留。')) return;
    const id = ui.form.id;
    for (const s of S.supplies.filter(x => x.catId === id)) await store.remove('supplies', s.id);
    await store.remove('cats', id); ui.catId = null; closeSheet();
  },
  newSupply(el) { openSheet('supply', supplyForm({ catId: el.dataset.id })); },
  editSupply(el) { editSupply(el.dataset.id); },
  saveSupply,
  async delSupply() { if (confirm('刪除這個用品和它的毛孩支出？')) { await deleteSupply(ui.form.id); closeSheet(); toast('已刪除'); } },
  async rebuy(el) {
    const s = S.supplies.find(x => x.id === el.dataset.id);
    const cat = S.cats.find(c => c.id === s.catId);
    const sid = await store.add('supplies', { name: s.name, price: s.price, days: s.days, buyDate: todayStr(), catId: s.catId, scopeId: s.scopeId });
    await store.add('entries', { scopeId: s.scopeId, kind: scopeKind(s.scopeId), type: 'expense', amount: s.price, category: 'pet', note: s.name, account: 'cash', date: todayStr(), catId: cat.id, supplyId: sid });
    toast('補貨記好了');
  },
  editProfile() { openSheet('profile', { name: profile().name, avatar: profile().avatar }); },
  async saveProfile() { const f = ui.form; if (!f.name.trim()) return toast('請輸入暱稱'); await store.saveProfile({ name: f.name.trim(), avatar: f.avatar }); closeSheet(); toast('更新好了'); },
  newCustom() { openSheet('custom', { label: '' }); },
  async saveCustom() {
    const label = (ui.form.label || '').trim(); if (!label) return toast('請輸入名稱');
    await store.saveProfile({ customCats: [...customCats(), { id: 'c_' + Math.random().toString(36).slice(2, 7), label, g: [...label][0] }] });
    closeSheet(); toast('分類新增好了');
  },
  async delCustom(el) { await store.saveProfile({ customCats: customCats().filter(c => c.id !== el.dataset.id) }); },
  async sample() { if (confirm('會用範例資料取代目前的資料，確定嗎？')) { await store.loadSample(); toast('範例資料載入了'); } },
  async resetDemo() { if (confirm('要清空所有試玩資料嗎？')) { await store.resetDemo(); toast('已清空'); } },
};

document.addEventListener('click', async ev => {
  const el = ev.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.a];
  if (!fn) return;
  await fn(el, ev);
  render();
});
document.addEventListener('input', ev => {
  const k = ev.target.dataset?.f;
  if (!k || !ui.form) return;
  if (k.startsWith('custom:')) { ui.form.custom[k.slice(7)] = ev.target.value; const h = $('#splitHint'); if (h) h.innerHTML = customHint(); }
  else ui.form[k] = ev.target.value;
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && ui.sheet) { closeSheet(); }
});

store.onChange(() => { render(); if (ui.sheet && ['groupInfo'].includes(ui.sheet.type)) renderSheet(); });
await store.init();
render();
