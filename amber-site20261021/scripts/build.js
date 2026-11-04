// 由 posts.js 產生：文章列表頁、每篇文章獨立頁、sitemap.xml、robots.txt，
// 並把 index.html 裡的網址同步成 site.config.js 的 siteUrl。
// 執行：npm run build
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "../site.config.js";
import { posts } from "../posts.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = site.siteUrl.replace(/\/$/, "");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const write = (p, c) => { mkdirSync(dirname(join(root, p)), { recursive: true }); writeFileSync(join(root, p), c); };
const fmt = (d) => d.replace(/-/g, "／").replace(/^(\d+)／(\d+)／(\d+)$/, "$1 年 $2 月 $3 日").replace(/ 0(\d)/g, " $1");

// 檢查文章資料
const slugs = new Set();
for (const p of posts) {
  if (!/^[a-z0-9-]+$/.test(p.slug)) throw new Error(`slug 只能用小寫英文、數字、減號：${p.slug}`);
  if (slugs.has(p.slug)) throw new Error(`slug 重複：${p.slug}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) throw new Error(`日期格式要是 YYYY-MM-DD：${p.slug}`);
  slugs.add(p.slug);
}
const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));

const header = `<header class="site-header">
  <div class="wrap nav">
    <a class="brand" href="/"><i></i>Amber</a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="menu">選單</button>
    <ul id="menu">
      <li><a href="/#services">服務</a></li>
      <li><a href="/#cases">案例</a></li>
      <li><a href="/#plans">方案</a></li>
      <li><a href="/#about">自我介紹</a></li>
      <li><a href="/posts/" aria-current="page">最新文章</a></li>
      <li><a href="/#contact">聯絡我</a></li>
    </ul>
  </div>
</header>`;
const footer = `<footer>
  <div class="wrap">
    <p>Email：<a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p>
    <p>© 2026 ${esc(site.name)}. All rights reserved.</p>
    <p style="font-size:13px;opacity:.7">本站內容皆為示範資料</p>
  </div>
</footer>`;

function page({ title, desc, path, type = "website", body, extraHead = "" }) {
  const full = `${url}${path}`;
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${full}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="${type}">
<meta property="og:locale" content="zh_TW">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${full}">
<meta property="og:image" content="${url}${site.ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/assets/styles.css">
${extraHead}</head>
<body>
${header}
${body}
${footer}
<script src="/assets/nav.js" defer></script>
</body>
</html>
`;
}

function renderBody(lines) {
  let out = "", list = [];
  const flush = () => { if (list.length) { out += `<ul>${list.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>\n`; list = []; } };
  for (const l of lines) {
    if (l.startsWith("- ")) { list.push(l.slice(2)); continue; }
    flush();
    out += l.startsWith("## ") ? `<h2>${esc(l.slice(3))}</h2>\n` : `<p>${esc(l)}</p>\n`;
  }
  flush();
  return out;
}

// 清掉舊的文章頁（刪文章時才不會殘留）
const postsDir = join(root, "posts");
if (existsSync(postsDir)) for (const d of readdirSync(postsDir)) rmSync(join(postsDir, d), { recursive: true, force: true });

// 文章列表頁
write("posts/index.html", page({
  title: `最新文章｜${site.name}`,
  desc: "小店與個人品牌的行銷觀念、實作方法與數字檢視，都整理在這裡。",
  path: "/posts/",
  body: `<main>
<div class="page-title"><div class="wrap"><p class="eyebrow">ARTICLES</p><h1>最新文章</h1><p style="color:var(--muted)">給小店與個人品牌的行銷小筆記（示範文章）</p></div></div>
<div class="narrow post-list">
${sorted.map((p) => `<a class="post-item" href="/posts/${p.slug}/"><time datetime="${p.date}">${fmt(p.date)}</time><h2>${esc(p.title)}</h2><p>${esc(p.summary)}</p><span class="more">閱讀全文 →</span></a>`).join("\n")}
</div>
</main>`,
}));

// 每篇文章
for (const p of sorted) {
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.summary, datePublished: p.date, inLanguage: "zh-Hant", image: `${url}${site.ogImage}`, mainEntityOfPage: `${url}/posts/${p.slug}/`, author: { "@type": "Person", name: "Amber" } };
  write(`posts/${p.slug}/index.html`, page({
    title: `${p.title}｜${site.name}`,
    desc: p.summary,
    path: `/posts/${p.slug}/`,
    type: "article",
    extraHead: `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`,
    body: `<main>
<article class="article narrow">
<p class="breadcrumb"><a href="/">首頁</a> › <a href="/posts/">最新文章</a></p>
<time datetime="${p.date}">${fmt(p.date)}</time>
<h1>${esc(p.title)}</h1>
<div class="body">
${renderBody(p.body)}</div>
<div class="cta-box"><h3>想聊聊你的店或品牌？</h3><p>先說說你的現況，我會給你下一步的建議。</p><a class="btn" href="/#contact">聯絡 Amber</a></div>
<p><a href="/posts/">← 回到文章列表</a></p>
</article>
</main>`,
  }));
}

// sitemap 與 robots
const urls = [{ loc: "/", mod: sorted[0]?.date }, { loc: "/posts/", mod: sorted[0]?.date }, ...sorted.map((p) => ({ loc: `/posts/${p.slug}/`, mod: p.date }))];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${url}${u.loc}</loc>${u.mod ? `<lastmod>${u.mod}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`);

// 同步首頁網址
let home = readFileSync(join(root, "index.html"), "utf8");
home = home
  .replace(/(<link rel="canonical" href=")[^"]*/, `$1${url}/`)
  .replace(/(<meta property="og:url" content=")[^"]*/, `$1${url}/`)
  .replace(/(<meta property="og:image" content=")[^"]*/, `$1${url}${site.ogImage}`)
  .replace(/("url":")[^"]*/, `$1${url}/`);
writeFileSync(join(root, "index.html"), home);
console.log(`完成：${sorted.length} 篇文章，網址 ${url}`);
