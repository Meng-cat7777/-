// 喵帳本：貓咪頭像與圖示（全部是 SVG，不使用 emoji）
export const FURS = [
  { id: 'black', name: '黑貓', c: '#222B35', ear: '#1A2028', eye: '#F1DFA8', rim: '#4B5766', dark: true },
  { id: 'white', name: '雪白貓', c: '#F7F9FB', mask: '#5B6674', ear: '#5F6A78', eye: '#1C2430' },
  { id: 'calico', name: '三花貓', c: '#FFFFFF', patch: '#F3B27C', ear: '#F3B27C', eye: '#2E2850' },
  { id: 'gray', name: '灰貓', c: '#B8C0CA', ear: '#9EA8B4', eye: '#1C2430' },
  { id: 'orange', name: '橘貓', c: '#F5BE88', ear: '#EFA574', eye: '#2E2850' },
  { id: 'cream', name: '奶茶貓', c: '#F1E1C4', ear: '#E5CDA2', eye: '#2E2850' },
];

// 共用的柔邊濾鏡，放在頁面最上方一次（見 index.html）
export const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="blur2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="blur6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="fuzz" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".6"/></filter>
</defs></svg>`;

// 貓臉本體（64x64 座標），沒有外框，用柔和色塊堆出毛茸茸的水彩感
function faceParts(fur, sleep) {
  const f = FURS.find(x => x.id === fur) || FURS[0];
  const dark = !!f.dark;
  const lid = f.mask || dark ? '#D9DEE5' : '#4A3F66';
  const eyes = sleep
    ? `<path d="M18.5 38 q5 4.2 10 0 M35.5 38 q5 4.2 10 0" stroke="${lid}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="24" cy="37.5" rx="3.6" ry="4.2" fill="${f.eye}"/><ellipse cx="40" cy="37.5" rx="3.6" ry="4.2" fill="${f.eye}"/>
       ${dark ? `<ellipse cx="24" cy="37.5" rx="1.3" ry="3.2" fill="#10151B"/><ellipse cx="40" cy="37.5" rx="1.3" ry="3.2" fill="#10151B"/>` : ''}<circle cx="25.3" cy="35.8" r="1.3" fill="#fff"/><circle cx="41.3" cy="35.8" r="1.3" fill="#fff"/>`;
  const mask = f.mask ? `<ellipse cx="32" cy="38.5" rx="16" ry="12.5" fill="${f.mask}" opacity=".92" filter="url(#blur2)"/>` : '';
  const patch = f.patch ? `<ellipse cx="45" cy="28" rx="10" ry="8" fill="${f.patch}" filter="url(#blur2)"/><ellipse cx="17" cy="44" rx="6" ry="5" fill="${f.patch}" opacity=".8" filter="url(#blur2)"/>` : '';
  return `<g class="fur">
    <path d="M9 34 L11 10 Q12 8.5 14 9.5 L30 21 Z" fill="${f.ear}" stroke="${f.ear}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M55 34 L53 10 Q52 8.5 50 9.5 L34 21 Z" fill="${f.ear}" stroke="${f.ear}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="32" cy="39" rx="24" ry="20" fill="${f.c}" ${f.rim ? `stroke="${f.rim}" stroke-width="1.2"` : ''}/>
    <ellipse cx="11.5" cy="44" rx="8" ry="7" fill="${f.c}"/><ellipse cx="52.5" cy="44" rx="8" ry="7" fill="${f.c}"/>
    ${patch}${mask}${eyes}
    <ellipse cx="32" cy="44.5" rx="1.9" ry="1.4" fill="#E9A1AA"/>
    <path d="M7 42 l11 1.2 M7 47 l11 -1.2 M57 42 l-11 1.2 M57 47 l-11 -1.2" stroke="${f.mask || dark ? '#B9C3CE' : '#7E8896'}" stroke-width=".9" stroke-linecap="round" opacity=".75"/>
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
  const flakes = [[255, 40, 15, 1], [222, 70, 11, .95], [248, 108, 13, 1], [205, 128, 9, .9], [232, 160, 11, 1], [190, 176, 8, .9], [176, 204, 7, .85], [152, 218, 10, 1]]
    .map(([x, y, r, o]) => flake(x, y, r, o)).join('');
  const dots = [[40, 60, 1.8], [90, 30, 1.4], [320, 90, 2], [330, 170, 1.6], [300, 40, 1.4], [60, 130, 1.5], [280, 230, 1.6], [20, 200, 1.4], [150, 70, 1.4], [120, 110, 1.2], [200, 20, 1.6], [340, 250, 1.4]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".85"/>`).join('');
  return `<svg class="scene ${extra}" viewBox="0 0 360 300" role="img" aria-label="冬夜裡，黑貓伸手接住金色的雪花">
    <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7F8D99"/><stop offset="1" stop-color="#56626E"/></linearGradient></defs>
    <rect width="360" height="300" rx="28" fill="url(#sk)"/>
    ${dots}${flakes}
    <g filter="url(#fuzz)"><ellipse cx="90" cy="282" rx="120" ry="20" fill="#CBD3DA"/><ellipse cx="300" cy="288" rx="90" ry="16" fill="#C2CBD3"/></g>
    <ellipse cx="108" cy="288" rx="60" ry="5" fill="#2B3541" opacity=".5" filter="url(#blur2)"/>
    <g filter="url(#fuzz)" fill="#1E2630">
      <path d="M78 262 C30 262 22 200 58 182" stroke="#1E2630" stroke-width="15" fill="none" stroke-linecap="round"/>
      <ellipse cx="112" cy="240" rx="30" ry="44" transform="rotate(8 112 240)"/>
      <ellipse cx="96" cy="276" rx="12" ry="9"/><ellipse cx="126" cy="276" rx="12" ry="9"/>
      <ellipse cx="152" cy="204" rx="8" ry="17" transform="rotate(38 152 204)"/>
    </g>
    <g transform="translate(86 150) scale(.78) rotate(8 32 40)">${faceParts('black', false)}</g>
    <circle cx="160" cy="190" r="2.4" fill="#F8E3A8"/>
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
