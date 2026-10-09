// 喵帳本：純計算邏輯（不碰畫面與資料庫，方便測試）

/* ---------- 日期與金額 ---------- */
export const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => ymd(new Date());
export const thisYm = () => todayStr().slice(0, 7);
export const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
export const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
export const dim = (y, m) => new Date(y, m, 0).getDate(); // m 為 1 到 12
export const shiftYm = (s, n) => { const [y, m] = s.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
export const num = n => Math.round(n).toLocaleString('en-US');
export const money = n => { const v = Math.round(n); return (v < 0 ? '-' : '') + 'NT$ ' + Math.abs(v).toLocaleString('en-US'); };
export const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

/* ---------- 分類與帳戶 ---------- */
export const EXPENSE_CATS = [
  { id: 'food', label: '餐飲', g: '食' }, { id: 'transport', label: '交通', g: '行' },
  { id: 'shop', label: '購物', g: '購' }, { id: 'pet', label: '毛孩', g: '貓' },
  { id: 'fun', label: '娛樂', g: '樂' }, { id: 'home', label: '居住', g: '住' },
  { id: 'med', label: '醫療', g: '醫' }, { id: 'other', label: '其他', g: '他' },
];
export const FAMILY_CATS = [
  { id: 'mortgage', label: '房貸', g: '房' }, { id: 'grocery', label: '菜錢與日用品', g: '菜' },
  { id: 'utility', label: '水電瓦斯網路', g: '水' }, { id: 'pet', label: '家裡的貓', g: '貓' },
  { id: 'other', label: '其他', g: '他' },
];
export const INCOME_CATS = [
  { id: 'salary', label: '薪水', g: '薪' }, { id: 'freelance', label: '接案', g: '接' },
  { id: 'bonus', label: '紅包', g: '包' }, { id: 'other_in', label: '其他', g: '他' },
];
export const ACCOUNTS = [
  { id: 'cash', label: '現金' }, { id: 'credit', label: '信用卡' },
  { id: 'easycard', label: '悠遊卡' }, { id: 'bank', label: '銀行' },
];
export const accountLabel = id => (ACCOUNTS.find(a => a.id === id) || ACCOUNTS[0]).label;

// kind: personal | family | split（分帳不用自訂分類，因為朋友看不到）
export function catList(kind, type, custom = []) {
  if (type === 'income') return INCOME_CATS;
  if (kind === 'family') return FAMILY_CATS;
  if (kind === 'split') return EXPENSE_CATS;
  const extra = custom.map(c => ({ id: c.id, label: c.label, g: c.g || [...c.label][0] }));
  return [...EXPENSE_CATS.slice(0, -1), ...extra, EXPENSE_CATS[EXPENSE_CATS.length - 1]];
}
export function catInfo(id, kind, type, custom = []) {
  return catList(kind, type, custom).find(c => c.id === id) || { id, label: '其他', g: '他' };
}
export const TILES = ['#E4DAF4', '#FBEBC8', '#DCE7F4', '#E3EEDF', '#F8E0D2'];
export const tileColor = id => TILES[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % TILES.length];

/* ---------- 個人帳與統計 ---------- */
// 個人帳 = 自己的個人帳目 + 朋友分帳裡「我的份額」
export function personalLedger(entries, uid) {
  const out = [];
  for (const e of entries) {
    if (e.kind === 'personal' && e.scopeId === uid) out.push(e);
    else if (e.kind === 'split' && e.splits && e.splits[uid] > 0) {
      out.push({ ...e, amount: e.splits[uid], type: 'expense', account: 'cash', fromSplit: true, totalAmount: e.amount });
    }
  }
  return out;
}
export function monthSummary(list, ym) {
  let income = 0, expense = 0;
  for (const e of list) {
    if (!e.date.startsWith(ym)) continue;
    if (e.type === 'income') income += e.amount; else expense += e.amount;
  }
  return { income, expense };
}
export function byCategory(list, ym) {
  const m = {};
  for (const e of list) if (e.type === 'expense' && e.date.startsWith(ym)) m[e.category] = (m[e.category] || 0) + e.amount;
  const total = Object.values(m).reduce((a, b) => a + b, 0);
  return Object.entries(m).map(([id, amount]) => ({ id, amount, pct: total ? amount / total * 100 : 0 })).sort((a, b) => b.amount - a.amount);
}
export function monthlySeries(list, endYm, n = 6) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const ym = shiftYm(endYm, -i);
    out.push({ ym, total: monthSummary(list, ym).expense });
  }
  return out;
}
export function budgetInfo(spent, budget) {
  if (!budget) return null;
  const pct = spent / budget * 100;
  return { pct, left: budget - spent, over: spent > budget };
}
export function statTip({ expense, prev, top, topPct, budget, label }) {
  if (!expense) return '這個月還沒有花費，貓咪替你守著錢包，喵。';
  if (budget && expense > budget) return `這個月已經超過預算 ${num(expense - budget)} 元了，先摸摸貓咪深呼吸，下個月再慢慢調整。`;
  if (budget && expense > budget * 0.85) return '預算快用完囉，剩下的日子可以挑想要的先買，其他的等一等。';
  if (prev && expense < prev * 0.9) return `比上個月少花了 ${num(prev - expense)} 元，貓咪幫你記一朵小紅花。`;
  if (prev && expense > prev * 1.2) return `比上個月多了 ${num(expense - prev)} 元，是不是有特別的事？記得留一點小魚乾基金。`;
  if (top && topPct >= 45) return `「${label}」占了 ${Math.round(topPct)}%，是這個月的主角，喵。`;
  return '花費很平穩，貓咪給你一個慢慢眨眼的讚。';
}

/* ---------- 朋友分帳 ---------- */
export function distribute(total, ids) {
  const n = ids.length, base = Math.floor(total / n);
  let rem = total - base * n;
  const out = {};
  ids.forEach(id => { out[id] = base + (rem > 0 ? 1 : 0); if (rem > 0) rem--; });
  return out;
}
// 正數 = 別人欠他（應收），負數 = 他欠別人（應付）
export function balances(entries, memberIds) {
  const b = {};
  memberIds.forEach(i => { b[i] = 0; });
  for (const e of entries) {
    if (e.kind === 'split') {
      b[e.payerId] = (b[e.payerId] || 0) + e.amount;
      for (const [m, a] of Object.entries(e.splits || {})) b[m] = (b[m] || 0) - a;
    } else if (e.kind === 'settle') {
      b[e.from] = (b[e.from] || 0) + e.amount;
      b[e.to] = (b[e.to] || 0) - e.amount;
    }
  }
  return b;
}
function greedy(items) {
  const cr = items.filter(x => x.v > 0).map(x => ({ ...x })).sort((a, b) => b.v - a.v);
  const de = items.filter(x => x.v < 0).map(x => ({ id: x.id, v: -x.v })).sort((a, b) => b.v - a.v);
  const out = [];
  let i = 0, j = 0;
  while (i < de.length && j < cr.length) {
    const t = Math.min(de[i].v, cr[j].v);
    out.push({ from: de[i].id, to: cr[j].id, amount: t });
    de[i].v -= t; cr[j].v -= t;
    if (de[i].v === 0) i++;
    if (cr[j].v === 0) j++;
  }
  return out;
}
// 最少轉帳次數：把人切成最多組「各組內部加總為 0」，每組 k 個人只要 k-1 次轉帳
export function settleUp(bal) {
  const ids = Object.keys(bal).filter(k => Math.round(bal[k]) !== 0);
  const v = ids.map(k => Math.round(bal[k]));
  const n = ids.length;
  if (!n) return [];
  if (n > 16) return greedy(ids.map((id, i) => ({ id, v: v[i] })));
  const N = 1 << n;
  const sum = new Int32Array(N);
  for (let m = 1; m < N; m++) { const low = m & -m; sum[m] = sum[m ^ low] + v[31 - Math.clz32(low)]; }
  const dp = new Int16Array(N), prev = new Int8Array(N);
  for (let m = 1; m < N; m++) {
    let best = -1, bi = 0;
    for (let i = 0; i < n; i++) if (m & (1 << i)) { const c = dp[m ^ (1 << i)]; if (c > best) { best = c; bi = i; } }
    dp[m] = best + (sum[m] === 0 ? 1 : 0);
    prev[m] = bi;
  }
  const order = [];
  for (let m = N - 1; m; m ^= 1 << prev[m]) order.push(prev[m]);
  order.reverse();
  const out = [];
  let cur = [], s = 0;
  for (const i of order) {
    cur.push({ id: ids[i], v: v[i] }); s += v[i];
    if (s === 0) { out.push(...greedy(cur)); cur = []; }
  }
  return out;
}

/* ---------- 行事曆排程 ---------- */
export function occurrences(sch, year, month) {
  const prefix = `${year}-${pad(month)}`;
  if (sch.repeat === 'monthly') {
    const date = `${prefix}-${pad(Math.min(sch.day || 1, dim(year, month)))}`;
    return sch.startDate && date < sch.startDate ? [] : [date];
  }
  return sch.date && sch.date.startsWith(prefix) ? [sch.date] : [];
}

/* ---------- 貓咪用品 ---------- */
export function supplyInfo(s, today = todayStr()) {
  const days = Math.max(1, Number(s.days) || 1);
  const used = Math.max(0, daysBetween(s.buyDate, today));
  const left = days - used;
  return {
    used, left, days,
    progress: Math.min(1, used / days),
    monthly: (Number(s.price) || 0) / days * 30,
    low: left <= 16,
    runOut: addDays(s.buyDate, days),
  };
}

// 某個月份的所有行事曆事件：{ 日期: [事件] }
// ctx: { schedules, supplies, cats, entries, uid, today }
export function monthEvents(ctx, year, month) {
  const map = {};
  const put = (date, ev) => { (map[date] = map[date] || []).push(ev); };
  const prefix = `${year}-${pad(month)}`;
  for (const s of ctx.schedules) {
    for (const date of occurrences(s, year, month)) {
      const key = `${s.id}@${date}`;
      put(date, {
        key, kind: s.repeat === 'monthly' ? 'fixed' : 'plan', schId: s.id, scopeId: s.scopeId, scopeKind: s.scopeId === ctx.uid ? 'personal' : 'family',
        title: s.title, amount: s.amount, type: s.type, date, category: s.category,
        done: ctx.entries.some(e => e.scheduleKey === key),
      });
    }
  }
  for (const sp of ctx.supplies) {
    const info = supplyInfo(sp, ctx.today);
    if (!info.low) continue;
    const date = info.runOut < ctx.today ? ctx.today : info.runOut;
    if (!date.startsWith(prefix)) continue;
    const cat = ctx.cats.find(c => c.id === sp.catId);
    put(date, {
      key: `restock@${sp.id}`, kind: 'restock', scopeId: sp.scopeId, scopeKind: sp.scopeId === ctx.uid ? 'personal' : 'family',
      title: `補貨：${sp.name}${cat ? `（${cat.name}）` : ''}`, amount: sp.price, type: 'expense', date, done: false,
    });
  }
  return map;
}
