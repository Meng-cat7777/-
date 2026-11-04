// 讀取 articles/posts.js，產生文章列表頁、每篇文章的獨立頁面、sitemap.xml、robots.txt。
// 執行方式：node tools/build-articles.mjs（不需要安裝任何套件）
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const data = require(join(ROOT, "articles", "posts.js"));
const SITE = (process.env.SITE_URL || data.SITE_URL || "").replace(/\/+$/, "");
const POSTS = [...data.POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
const BRAND = "Aira 艾拉";
const SITE_NAME = "Aira 艾拉｜喵選拾光";
const OG_IMAGE = `${SITE}/articles/og.png`;

// ---------- 檢查資料，寫錯就停下來 ----------
const seen = new Set();
for (const p of POSTS) {
  for (const k of ["slug", "title", "date", "summary", "body"]) {
    if (!p[k] || (Array.isArray(p[k]) && !p[k].length)) throw new Error(`文章缺少欄位「${k}」：${p.title || p.slug}`);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) throw new Error(`slug 只能用小寫英文、數字和 -：${p.slug}`);
  if (seen.has(p.slug)) throw new Error(`slug 重複：${p.slug}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) throw new Error(`日期格式要像 2026-11-04：${p.slug}`);
  seen.add(p.slug);
}

// ---------- 小工具 ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const fmtDate = (d) => { const [y, m, day] = d.split("-").map(Number); return `${y} 年 ${m} 月 ${day} 日`; };

function renderBody(blocks) {
  return blocks.map((b) => {
    if (b.h) return `<h2>${esc(b.h)}</h2>`;
    if (b.p) return `<p>${esc(b.p)}</p>`;
    if (b.quote) return `<blockquote>${esc(b.quote)}</blockquote>`;
    if (b.ol) return `<ol>${b.ol.map((i) => `<li>${esc(i)}</li>`).join("")}</ol>`;
    if (b.ul) return `<ul>${b.ul.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    throw new Error("不認得的內容區塊：" + JSON.stringify(b));
  }).join("\n      ");
}

function page({ depth, title, description, canonical, ogType, main, jsonld }) {
  const up = "../".repeat(depth); // 回到 articles/ 的相對路徑
  const home = up + "../";
  return `<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="theme-color" content="#F3E0E2">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:locale" content="zh_TW">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(OG_IMAGE)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(OG_IMAGE)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='22' fill='none' stroke='%23B04E68' stroke-width='3'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500;600&display=swap">
<link rel="stylesheet" href="${up}style.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>\n` : ""}</head>
<body>
<div class="sheet">
  <header class="top">
    <a class="brand" href="${home}">${BRAND}</a>
    <nav aria-label="主選單"><a href="${home}">首頁</a><a href="${up}" ${depth === 0 ? 'aria-current="page"' : ""}>文章</a></nav>
  </header>
  <main>
      ${main}
  </main>
  <footer class="foot">Aira 艾拉｜自我探索 x 能量調頻</footer>
</div>
</body>
</html>
`;
}

// ---------- 文章列表頁 ----------
const listMain = `<div class="intro">
      <p class="eyebrow">ARTICLES</p>
      <h1>文章</h1>
      <p class="lead">給小店老闆的行銷小筆記，一次一個步驟，慢慢做就好。</p>
    </div>
    <ul class="list">
${POSTS.map((p) => `      <li><a class="card" href="${p.slug}/">
        <time datetime="${p.date}">${fmtDate(p.date)}</time>
        <h2>${esc(p.title)}</h2>
        <p>${esc(p.summary)}</p>
        <span class="more">閱讀全文</span>
      </a></li>`).join("\n")}
    </ul>`;

const listDesc = "給小店老闆的行銷小筆記：找出目標客人、安排內容節奏、讀懂客人的猶豫，一次一個步驟慢慢做。";
writeFileSync(join(ROOT, "articles", "index.html"), page({
  depth: 0, title: `文章｜${SITE_NAME}`, description: listDesc,
  canonical: `${SITE}/articles/`, ogType: "website", main: listMain,
  jsonld: { "@context": "https://schema.org", "@type": "CollectionPage", name: "文章", description: listDesc, url: `${SITE}/articles/`, inLanguage: "zh-Hant-TW" }
}));

// ---------- 每篇文章（先清掉舊的文章資料夾，避免刪掉的文章還留著） ----------
for (const name of readdirSync(join(ROOT, "articles"), { withFileTypes: true })) {
  if (name.isDirectory()) rmSync(join(ROOT, "articles", name.name), { recursive: true, force: true });
}
POSTS.forEach((p, i) => {
  const newer = POSTS[i - 1], older = POSTS[i + 1];
  const main = `<article>
      <p class="crumb"><a href="../">文章</a> ／ ${esc(p.title.length > 16 ? p.title.slice(0, 16) + "…" : p.title)}</p>
      <header class="post-head">
        <time datetime="${p.date}">${fmtDate(p.date)}</time>
        <h1>${esc(p.title)}</h1>
      </header>
      <div class="post">
      ${renderBody(p.body)}
      </div>
    </article>
    <nav class="pager" aria-label="上下篇">
      ${older ? `<a class="prev" href="../${older.slug}/"><small>上一篇</small>${esc(older.title)}</a>` : "<span></span>"}
      ${newer ? `<a class="next" href="../${newer.slug}/"><small>下一篇</small>${esc(newer.title)}</a>` : "<span></span>"}
    </nav>
    <p class="back"><a href="../">← 回到文章列表</a></p>`;
  const dir = join(ROOT, "articles", p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), page({
    depth: 1, title: `${p.title}｜${BRAND}`, description: p.summary,
    canonical: `${SITE}/articles/${p.slug}/`, ogType: "article", main,
    jsonld: {
      "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.summary,
      datePublished: p.date, dateModified: p.date, inLanguage: "zh-Hant-TW",
      mainEntityOfPage: `${SITE}/articles/${p.slug}/`, image: OG_IMAGE,
      author: { "@type": "Person", name: BRAND }, publisher: { "@type": "Organization", name: BRAND }
    }
  }));
});

// ---------- sitemap.xml 和 robots.txt ----------
const urls = [
  { loc: `${SITE}/` },
  { loc: `${SITE}/services/` },
  { loc: `${SITE}/articles/`, lastmod: POSTS[0].date },
  ...POSTS.map((p) => ({ loc: `${SITE}/articles/${p.slug}/`, lastmod: p.date }))
];
writeFileSync(join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`);
writeFileSync(join(ROOT, "robots.txt"), `User-agent: *
Allow: /
Disallow: /tools/

Sitemap: ${SITE}/sitemap.xml
`);
console.log(`完成：${POSTS.length} 篇文章，網址前綴 ${SITE}`);
