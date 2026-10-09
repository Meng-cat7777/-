// 喵帳本：貓咪頭像與圖示（全部是 SVG，不使用 emoji）
export const FURS = [
  { id: 'black', name: '黑貓', c: '#2B3440', rim: '#566274', ear: '#232B35', dark: true },
  { id: 'white', name: '雪白貓', c: '#FBFCFD', rim: '#B7C0CB', ear: '#8E99A9', mask: '#9AA5B5' },
  { id: 'calico', name: '三花貓', c: '#FFFFFF', rim: '#D2C2B6', earL: '#5A4F5C', earR: '#F2B27C', patch: '#F2B27C', patch2: '#5A4F5C' },
  { id: 'gray', name: '灰貓', c: '#C5CCD6', rim: '#8E99A8', ear: '#A9B3C0', stripes: '#9AA4B2' },
  { id: 'orange', name: '橘貓', c: '#F7C08A', rim: '#D8935A', ear: '#F2A872', stripes: '#E39A5F' },
  { id: 'cream', name: '奶茶貓', c: '#F5E6CC', rim: '#D9BF93', ear: '#EBD1A6' },
];

// 共用的柔邊濾鏡，放在頁面最上方一次（見 index.html）
export const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="blur2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="blur6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="fuzz" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".6"/></filter>
</defs></svg>`;

// 貓臉本體（64x64 座標）：圓滾滾的大臉、水汪汪的大眼睛、腮紅和小小的 ω 嘴
function faceParts(fur, sleep) {
  const f = FURS.find(x => x.id === fur) || FURS[0];
  const dark = !!f.dark;
  const line = dark ? '#E8A9B5' : '#8A5E6A';
  const eyes = sleep
    ? `<path d="M16.5 41.5 q5.5 -6 11 0 M36.5 41.5 q5.5 -6 11 0" stroke="${dark ? '#E9EDF2' : '#3A2F4A'}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    : dark
      ? `<ellipse cx="22" cy="40" rx="4.8" ry="5.6" fill="#F6DE9A"/><ellipse cx="42" cy="40" rx="4.8" ry="5.6" fill="#F6DE9A"/>
         <ellipse cx="22" cy="40.6" rx="2.7" ry="3.9" fill="#10151B"/><ellipse cx="42" cy="40.6" rx="2.7" ry="3.9" fill="#10151B"/>
         <circle cx="23.6" cy="37.6" r="1.9" fill="#fff"/><circle cx="43.6" cy="37.6" r="1.9" fill="#fff"/><circle cx="20.6" cy="43" r="1" fill="#fff"/><circle cx="40.6" cy="43" r="1" fill="#fff"/>`
      : `<ellipse cx="22" cy="40" rx="4.4" ry="5.4" fill="#2A2238"/><ellipse cx="42" cy="40" rx="4.4" ry="5.4" fill="#2A2238"/>
         <circle cx="23.6" cy="37.8" r="1.9" fill="#fff"/><circle cx="43.6" cy="37.8" r="1.9" fill="#fff"/><circle cx="20.8" cy="42.6" r="1" fill="#fff"/><circle cx="40.8" cy="42.6" r="1" fill="#fff"/>`;
  const stroke = `stroke="${f.rim}" stroke-width="1.5" stroke-linejoin="round"`;
  const extras = [
    f.mask ? `<ellipse cx="32" cy="38" rx="15" ry="11" fill="${f.mask}" opacity=".45" filter="url(#blur2)"/>` : '',
    f.patch ? `<ellipse cx="46" cy="32" rx="10" ry="9" fill="${f.patch}" filter="url(#blur2)"/><ellipse cx="14" cy="36" rx="7" ry="6" fill="${f.patch2}" opacity=".9" filter="url(#blur2)"/>` : '',
    f.stripes ? `<path d="M32 19 v6 M26.5 20.5 l1.2 5 M37.5 20.5 l-1.2 5" stroke="${f.stripes}" stroke-width="2.2" stroke-linecap="round"/>` : '',
  ].join('');
  return `<g class="fur">
    <path d="M9 33 C5 19 8 10.5 13.5 11 C18 11.5 25 16.5 29 22 Z" fill="${f.earL || f.ear || f.c}" ${stroke}/>
    <path d="M55 33 C59 19 56 10.5 50.5 11 C46 11.5 39 16.5 35 22 Z" fill="${f.earR || f.ear || f.c}" ${stroke}/>
    <path d="M12.5 27 C11 20 12 15.5 14.5 15.5 C17 16 21 18.5 23.5 21.5 Z M51.5 27 C53 20 52 15.5 49.5 15.5 C47 16 43 18.5 40.5 21.5 Z" fill="#F4B3BE"/>
    <ellipse cx="32" cy="39" rx="26" ry="21" fill="${f.c}" ${stroke}/>
    ${extras}${eyes}
    <ellipse cx="13.5" cy="48" rx="4.6" ry="2.8" fill="#F7A3B2" opacity=".7"/><ellipse cx="50.5" cy="48" rx="4.6" ry="2.8" fill="#F7A3B2" opacity=".7"/>
    <path d="M30.2 45 h3.6 l-1.8 2 z" fill="#EE8FA2"/>
    <path d="M32 47 q-2.3 3.2 -4.8 .7 M32 47 q2.3 3.2 4.8 .7" stroke="${line}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M4.5 44 l6 .8 M4.5 49 l6 -.8 M59.5 44 l-6 .8 M59.5 49 l-6 -.8" stroke="${dark ? '#B9C3CE' : f.rim}" stroke-width="1" stroke-linecap="round" opacity=".8"/>
  </g>`;
}

export function catFace(fur = 'white', size = 40, sleep = false) {
  return `<svg class="catface" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">${faceParts(fur, sleep)}</svg>`;
}

// 金色雪花：三條交叉的線加一圈柔光
const flake = (x, y, r, o = 1) => `<g transform="translate(${x} ${y})" opacity="${o}">
  <circle r="${r * 0.9}" fill="#F3D27A" opacity=".45" filter="url(#blur2)"/>
  <g stroke="#FBE9B4" stroke-width="${Math.max(1, r / 7)}" stroke-linecap="round">
    <path d="M0 ${-r}V${r}"/><path d="M${-r * .87} ${-r / 2}L${r * .87} ${r / 2}"/><path d="M${-r * .87} ${r / 2}L${r * .87} ${-r / 2}"/>
    <path d="M${-r * .3} ${-r * .75}L0 ${-r * .5}L${r * .3} ${-r * .75}M${-r * .3} ${r * .75}L0 ${r * .5}L${r * .3} ${r * .75}" stroke-width="${Math.max(.8, r / 10)}"/>
  </g><circle r="${Math.max(1.2, r / 6)}" fill="#fff"/></g>`;

// 登入與空白頁用的插畫：冬夜的冰面，黑貓伸手去接金色的雪花
export function scene(extra = '') {
  const flakes = [[255, 40, 15, 1], [222, 68, 11, .95], [252, 106, 13, 1], [214, 128, 9, .9], [240, 158, 11, 1], [204, 176, 8, .9], [196, 200, 7, .85], [186, 186, 5, .8]]
    .map(([x, y, r, o]) => flake(x, y, r, o)).join('');
  const dots = [[40, 60, 1.8], [90, 30, 1.4], [320, 90, 2], [330, 170, 1.6], [300, 40, 1.4], [60, 130, 1.5], [280, 230, 1.6], [20, 200, 1.4], [150, 70, 1.4], [120, 110, 1.2], [200, 20, 1.6], [340, 250, 1.4]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".85"/>`).join('');
  return `<svg class="scene ${extra}" viewBox="0 0 360 300" role="img" aria-label="冬夜裡，圓滾滾的黑貓伸手接住金色的雪花">
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7F8D99"/><stop offset="1" stop-color="#56626E"/></linearGradient></defs>
    <rect width="360" height="300" rx="28" fill="url(#sk)"/>
    ${dots}${flakes}
    <g filter="url(#fuzz)"><ellipse cx="90" cy="282" rx="120" ry="20" fill="#CBD3DA"/><ellipse cx="300" cy="288" rx="90" ry="16" fill="#C2CBD3"/></g>
    <ellipse cx="108" cy="288" rx="60" ry="5" fill="#2B3541" opacity=".5" filter="url(#blur2)"/>
    <path d="M92 262 C48 272 36 232 60 222" stroke="#2B3440" stroke-width="13" fill="none" stroke-linecap="round"/>
    <g fill="#2B3440" stroke="#566274" stroke-width="1.2">
      <ellipse cx="118" cy="248" rx="33" ry="30"/>
      <ellipse cx="98" cy="276" rx="13" ry="8"/><ellipse cx="138" cy="276" rx="13" ry="8"/>
      <ellipse cx="172" cy="220" rx="7.5" ry="12" transform="rotate(35 172 220)"/>
    </g>
    <ellipse cx="118" cy="252" rx="17" ry="18" fill="#3A4452"/>
    <g transform="translate(70 142) scale(1.5)">${faceParts('black', false)}</g>
    <circle cx="180" cy="210" r="2.4" fill="#F8E3A8"/>
  </svg>`;
}

export const paw = (size = 30, color = '#fff') => `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="${color}" aria-hidden="true">
  <path d="M32 29 C42 29 52 40 48 50 C45 57 38 53 32 53 C26 53 19 57 16 50 C12 40 22 29 32 29Z"/>
  <ellipse cx="12" cy="29" rx="6" ry="8.2" transform="rotate(-22 12 29)"/>
  <ellipse cx="24.5" cy="16.5" rx="6" ry="8.6"/>
  <ellipse cx="39.5" cy="16.5" rx="6" ry="8.6"/>
  <ellipse cx="52" cy="29" rx="6" ry="8.2" transform="rotate(22 52 29)"/></svg>`;

const svg = (d, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const I = {
  home: svg('<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'),
  chart: svg('<path d="M5 20V11M12 20V5M19 20v-6"/>'),
  cal: svg('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>'),
  user: svg('<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  left: svg('<path d="M14 6l-6 6 6 6"/>', 22),
  right: svg('<path d="M10 6l6 6-6 6"/>', 22),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  trash: svg('<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>', 20),
  copy: svg('<rect x="8" y="8" width="11" height="12" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>', 20),
  check: svg('<path d="M5 12.5 10 17l9-10"/>', 20),
  del: svg('<path d="M9 5h10a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="m12 9 5 6M17 9l-5 6"/>', 26),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>', 20),
};
