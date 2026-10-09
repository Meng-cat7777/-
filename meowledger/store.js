// 喵帳本：資料層。同一組介面有兩種實作：
//   Firebase（Google 登入 + Firestore）與 試玩模式（localStorage）
import { firebaseConfig } from './firebase-config.js';

const FUR_IDS = ['orange', 'black', 'white', 'gray', 'cream'];
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const rid = () => Math.random().toString(36).slice(2, 10);
const genCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
const clean = o => JSON.parse(JSON.stringify(o));
const emptyState = () => ({ profile: null, groups: [], entries: [], schedules: [], cats: [], supplies: [] });
const newProfile = name => ({ name: name || '喵友', avatar: 'orange', budget: 0, customCats: [] });
const newGroup = (uid, profile, type, name) => ({
  type, name, ownerId: uid, memberIds: [uid], inviteCode: genCode(), budget: 0, createdAt: Date.now(),
  members: { [uid]: { name: profile.name, avatar: profile.avatar } },
});

export async function createStore() {
  return firebaseConfig ? makeFirebase() : makeDemo();
}

/* ============ 試玩模式 ============ */
function makeDemo() {
  const KEY = 'meowledger_demo_v1';
  const DEMO_USER = { uid: 'demo', name: '試玩貓友', email: '' };
  const st = { mode: 'demo', user: null, state: emptyState(), cb: () => {} };
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* 無痕模式 */ }
  if (saved) { Object.assign(st.state, saved.state); if (saved.in) st.user = DEMO_USER; }

  const commit = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ in: !!st.user, state: st.state })); } catch { /* 容量或無痕 */ }
    st.cb();
  };
  st.onChange = fn => { st.cb = fn; };
  st.init = async () => {};
  st.signIn = async () => {
    st.user = DEMO_USER;
    if (!st.state.profile) st.state.profile = newProfile(DEMO_USER.name);
    commit();
  };
  st.signOut = async () => { st.user = null; commit(); };
  st.saveProfile = async patch => {
    Object.assign(st.state.profile, clean(patch));
    for (const g of st.state.groups) if (g.members.demo) Object.assign(g.members.demo, { name: st.state.profile.name, avatar: st.state.profile.avatar });
    commit();
  };
  st.add = async (col, data) => {
    const id = rid();
    st.state[col].push({ ...clean(data), id, createdBy: st.user.uid, createdAt: Date.now() });
    commit();
    return id;
  };
  st.update = async (col, id, patch) => {
    const o = st.state[col].find(x => x.id === id);
    if (o) Object.assign(o, clean(patch));
    commit();
  };
  st.remove = async (col, id) => {
    st.state[col] = st.state[col].filter(x => x.id !== id);
    commit();
  };
  st.createGroup = async (type, name) => {
    const g = { id: rid(), ...newGroup(st.user.uid, st.state.profile, type, name) };
    st.state.groups.push(g);
    commit();
    return g.id;
  };
  st.joinByCode = async () => {
    throw new Error('試玩模式只能在這台裝置使用，和朋友、家人一起記帳需要先設定 Firebase。可以先用「新增沒有帳號的朋友」體驗分帳。');
  };
  st.updateGroup = async (gid, patch) => {
    Object.assign(st.state.groups.find(g => g.id === gid), clean(patch));
    commit();
  };
  st.addGuest = async (gid, name) => {
    const g = st.state.groups.find(x => x.id === gid);
    g.members['g_' + rid()] = { name, avatar: FUR_IDS[Object.keys(g.members).length % FUR_IDS.length], guest: true };
    commit();
  };
  st.removeGuest = async (gid, mid) => {
    delete st.state.groups.find(x => x.id === gid).members[mid];
    commit();
  };
  st.leaveGroup = async gid => {
    st.state.groups = st.state.groups.filter(g => g.id !== gid);
    for (const col of ['entries', 'schedules', 'cats', 'supplies']) st.state[col] = st.state[col].filter(x => x.scopeId !== gid);
    commit();
  };
  st.resetDemo = async () => {
    const p = st.state.profile;
    Object.assign(st.state, emptyState(), { profile: p });
    commit();
  };
  st.loadSample = async () => {
    Object.assign(st.state, sampleData(st.user.uid, st.state.profile));
    commit();
  };
  return st;
}

function sampleData(uid, profile) {
  const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const fam = { id: 'fam1', ...newGroup(uid, profile, 'family', '喵窩小家'), budget: 40000 };
  fam.members.g_mom = { name: '小明', avatar: 'gray', guest: true };
  const trip = { id: 'trip1', ...newGroup(uid, profile, 'trip', '花蓮兩天一夜'), budget: 0 };
  trip.members.g_a = { name: '阿花', avatar: 'white', guest: true };
  trip.members.g_b = { name: '小黑', avatar: 'black', guest: true };
  const E = (o) => ({ id: rid(), createdBy: uid, createdAt: Date.now(), ...o });
  const pe = (n, type, amount, category, note, account = 'cash', extra = {}) => E({ scopeId: uid, kind: 'personal', type, amount, category, note, account, date: d(n), ...extra });
  const entries = [
    pe(0, 'expense', 85, 'food', '早餐飯糰'), pe(0, 'expense', 120, 'transport', '捷運加值', 'easycard'),
    pe(1, 'expense', 260, 'food', '和同事午餐', 'credit'), pe(2, 'expense', 680, 'shop', '洗髮精與日用品', 'credit'),
    pe(3, 'expense', 450, 'fun', '電影', 'credit'), pe(5, 'income', 3000, 'bonus', '紅包', 'cash'),
    pe(6, 'expense', 150, 'food', '手搖飲', 'cash'), pe(9, 'income', 52000, 'salary', '本月薪水', 'bank'),
    pe(12, 'expense', 1800, 'med', '牙醫洗牙', 'credit'), pe(15, 'expense', 320, 'food', '火鍋', 'cash'),
    pe(40, 'expense', 12800, 'home', '房租', 'bank'), pe(41, 'expense', 3200, 'food', '', 'cash'),
    pe(70, 'expense', 9800, 'shop', '', 'credit'), pe(100, 'expense', 7600, 'food', '', 'cash'),
    pe(130, 'expense', 11200, 'fun', '', 'credit'),
    E({ scopeId: fam.id, kind: 'family', type: 'expense', amount: 18500, category: 'mortgage', note: '房貸', account: 'bank', date: d(4) }),
    E({ scopeId: fam.id, kind: 'family', type: 'expense', amount: 2860, category: 'grocery', note: '全聯', account: 'cash', date: d(1) }),
    E({ scopeId: fam.id, kind: 'family', type: 'expense', amount: 1650, category: 'utility', note: '電費', account: 'bank', date: d(6) }),
    E({ scopeId: fam.id, kind: 'family', type: 'expense', amount: 3100, category: 'grocery', note: '市場', account: 'cash', date: d(35) }),
    E({ scopeId: trip.id, kind: 'split', type: 'expense', amount: 3600, category: 'home', note: '民宿', date: d(3), payerId: uid, splits: { [uid]: 1200, g_a: 1200, g_b: 1200 } }),
    E({ scopeId: trip.id, kind: 'split', type: 'expense', amount: 900, category: 'food', note: '海鮮晚餐', date: d(3), payerId: 'g_a', splits: { [uid]: 300, g_a: 300, g_b: 300 } }),
    E({ scopeId: trip.id, kind: 'split', type: 'expense', amount: 700, category: 'transport', note: '租機車', date: d(2), payerId: 'g_b', splits: { [uid]: 350, g_b: 350 } }),
  ];
  const cat = { id: 'cat1', scopeId: uid, name: '麻糬', fur: 'orange' };
  const cat2 = { id: 'cat2', scopeId: fam.id, name: '墨墨', fur: 'black' };
  const sup = (id, catId, scopeId, name, price, ago, days) => ({ id, catId, scopeId, name, price, buyDate: d(ago), days });
  const supplies = [
    sup('s1', 'cat1', uid, '貓砂 10L', 380, 28, 40), sup('s2', 'cat1', uid, '主食罐', 720, 14, 20),
    sup('s3', 'cat1', uid, '凍乾零食', 280, 3, 30), sup('s4', 'cat2', fam.id, '乾飼料 2kg', 960, 22, 60),
  ];
  for (const s of supplies) {
    entries.push(E({
      scopeId: s.scopeId, kind: s.scopeId === uid ? 'personal' : 'family', type: 'expense', amount: s.price,
      category: 'pet', note: s.name, account: 'cash', date: s.buyDate, catId: s.catId, supplyId: s.id,
    }));
  }
  const schedules = [
    { id: rid(), scopeId: fam.id, title: '房貸', amount: 18500, type: 'expense', repeat: 'monthly', day: 5, startDate: d(120), category: 'mortgage' },
    { id: rid(), scopeId: uid, title: '信用卡繳款', amount: 6200, type: 'expense', repeat: 'monthly', day: 20, startDate: d(120), category: 'other' },
    { id: rid(), scopeId: uid, title: '薪水', amount: 52000, type: 'income', repeat: 'monthly', day: 10, startDate: d(120), category: 'salary' },
    { id: rid(), scopeId: uid, title: '朋友生日聚餐', amount: 1200, type: 'expense', repeat: 'none', date: d(-3), category: 'food' },
  ];
  return {
    profile: { ...profile, budget: 20000 }, groups: [fam, trip], entries, schedules,
    cats: [cat, cat2], supplies,
  };
}

/* ============ Firebase ============ */
async function makeFirebase() {
  const V = '10.12.2';
  const base = `https://www.gstatic.com/firebasejs/${V}/`;
  const [{ initializeApp }, A, F] = await Promise.all([
    import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);
  const COLS = ['entries', 'schedules', 'cats', 'supplies'];
  const st = { mode: 'firebase', user: null, state: emptyState(), cb: () => {} };
  const parts = Object.fromEntries(COLS.map(c => [c, {}]));
  const scopeUnsubs = new Map();
  let profileUnsub = null, groupsUnsub = null, timer = 0;

  const emit = () => { clearTimeout(timer); timer = setTimeout(() => st.cb(), 30); };
  const rebuild = () => { for (const c of COLS) st.state[c] = Object.values(parts[c]).flat(); emit(); };
  const stopAll = () => {
    profileUnsub?.(); groupsUnsub?.(); profileUnsub = groupsUnsub = null;
    for (const fns of scopeUnsubs.values()) fns.forEach(f => f());
    scopeUnsubs.clear();
    for (const c of COLS) parts[c] = {};
    Object.assign(st.state, emptyState());
  };
  const watchScopes = ids => {
    for (const [id, fns] of scopeUnsubs) {
      if (!ids.includes(id)) { fns.forEach(f => f()); scopeUnsubs.delete(id); for (const c of COLS) delete parts[c][id]; }
    }
    for (const id of ids) {
      if (scopeUnsubs.has(id)) continue;
      scopeUnsubs.set(id, COLS.map(c => F.onSnapshot(
        F.query(F.collection(db, c), F.where('scopeId', '==', id)),
        snap => { parts[c][id] = snap.docs.map(d => ({ id: d.id, ...d.data() })); rebuild(); },
        err => console.warn(c, err),
      )));
    }
    rebuild();
  };
  const startSession = user => {
    profileUnsub = F.onSnapshot(F.doc(db, 'users', user.uid), async snap => {
      if (!snap.exists()) {
        await F.setDoc(F.doc(db, 'users', user.uid), newProfile(user.displayName));
        return;
      }
      st.state.profile = snap.data();
      emit();
    });
    groupsUnsub = F.onSnapshot(F.query(F.collection(db, 'groups'), F.where('memberIds', 'array-contains', user.uid)), snap => {
      st.state.groups = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      watchScopes([user.uid, ...st.state.groups.map(g => g.id)]);
    }, err => console.warn('groups', err));
    watchScopes([user.uid]);
  };

  st.onChange = fn => { st.cb = fn; };
  st.init = () => new Promise(resolve => {
    A.onAuthStateChanged(auth, u => {
      stopAll();
      st.user = u ? { uid: u.uid, name: u.displayName || '喵友', email: u.email || '' } : null;
      if (u) startSession(u);
      emit();
      resolve();
    });
  });
  st.signIn = async () => {
    const provider = new A.GoogleAuthProvider();
    try { await A.signInWithPopup(auth, provider); }
    catch (e) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') await A.signInWithRedirect(auth, provider);
      else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') throw e;
    }
  };
  st.signOut = () => A.signOut(auth);
  st.saveProfile = async patch => {
    const uid = st.user.uid;
    await F.updateDoc(F.doc(db, 'users', uid), clean(patch));
    if (patch.name !== undefined || patch.avatar !== undefined) {
      const m = { name: patch.name ?? st.state.profile.name, avatar: patch.avatar ?? st.state.profile.avatar };
      await Promise.all(st.state.groups.map(g => F.updateDoc(F.doc(db, 'groups', g.id), { [`members.${uid}`]: m })));
    }
  };
  st.add = async (col, data) => {
    const ref = await F.addDoc(F.collection(db, col), { ...clean(data), createdBy: st.user.uid, createdAt: Date.now() });
    return ref.id;
  };
  st.update = (col, id, patch) => F.updateDoc(F.doc(db, col, id), clean(patch));
  st.remove = (col, id) => F.deleteDoc(F.doc(db, col, id));
  st.createGroup = async (type, name) => {
    const g = newGroup(st.user.uid, st.state.profile, type, name);
    const ref = await F.addDoc(F.collection(db, 'groups'), g);
    await F.setDoc(F.doc(db, 'invites', g.inviteCode), { groupId: ref.id });
    return ref.id;
  };
  st.joinByCode = async code => {
    const snap = await F.getDoc(F.doc(db, 'invites', code.trim().toUpperCase()));
    if (!snap.exists()) throw new Error('找不到這組邀請碼，請再確認一次');
    const gid = snap.data().groupId;
    const uid = st.user.uid, p = st.state.profile;
    await F.updateDoc(F.doc(db, 'groups', gid), {
      memberIds: F.arrayUnion(uid), [`members.${uid}`]: { name: p.name, avatar: p.avatar },
    });
    return gid;
  };
  st.updateGroup = (gid, patch) => F.updateDoc(F.doc(db, 'groups', gid), clean(patch));
  st.addGuest = (gid, name) => {
    const g = st.state.groups.find(x => x.id === gid);
    return F.updateDoc(F.doc(db, 'groups', gid), {
      [`members.g_${rid()}`]: { name, avatar: FUR_IDS[Object.keys(g.members).length % FUR_IDS.length], guest: true },
    });
  };
  st.removeGuest = (gid, mid) => F.updateDoc(F.doc(db, 'groups', gid), { [`members.${mid}`]: F.deleteField() });
  st.leaveGroup = gid => F.updateDoc(F.doc(db, 'groups', gid), {
    memberIds: F.arrayRemove(st.user.uid), [`members.${st.user.uid}`]: F.deleteField(),
  });
  return st;
}
