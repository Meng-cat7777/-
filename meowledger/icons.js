// 喵帳本：貓咪頭像與圖示（全部是 SVG，不使用 emoji）
export const FURS = [
  { id: 'white', name: '布偶貓', c: '#FBF9FF', mask: '#58578A', ear: '#5F5E8E', eye: '#1F1B45' },
  { id: 'calico', name: '三花貓', c: '#FFFFFF', patch: '#F3B27C', ear: '#F3B27C', eye: '#2E2850' },
  { id: 'orange', name: '橘貓', c: '#F5BE88', ear: '#EFA574', eye: '#2E2850' },
  { id: 'black', name: '黑貓', c: '#4B4766', ear: '#3A3652', eye: '#FFE3A3' },
  { id: 'gray', name: '灰貓', c: '#C3BED6', ear: '#A9A3C2', eye: '#2E2850' },
  { id: 'cream', name: '奶茶貓', c: '#F3E0BD', ear: '#E8C99A', eye: '#2E2850' },
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
  const dark = f.id === 'black';
  const lid = f.mask || dark ? '#EDE9FF' : '#4A3F66';
  const eyes = sleep
    ? `<path d="M18.5 38 q5 4.2 10 0 M35.5 38 q5 4.2 10 0" stroke="${lid}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="24" cy="37.5" rx="3.6" ry="4.2" fill="${f.eye}"/><ellipse cx="40" cy="37.5" rx="3.6" ry="4.2" fill="${f.eye}"/>
       <circle cx="25.3" cy="35.8" r="1.3" fill="#fff"/><circle cx="41.3" cy="35.8" r="1.3" fill="#fff"/>`;
  const mask = f.mask ? `<ellipse cx="32" cy="38.5" rx="16" ry="12.5" fill="${f.mask}" opacity=".92" filter="url(#blur2)"/>` : '';
  const patch = f.patch ? `<ellipse cx="45" cy="28" rx="10" ry="8" fill="${f.patch}" filter="url(#blur2)"/><ellipse cx="17" cy="44" rx="6" ry="5" fill="${f.patch}" opacity=".8" filter="url(#blur2)"/>` : '';
  return `<g class="fur">
    <path d="M9 34 L11 10 Q12 8.5 14 9.5 L30 21 Z" fill="${f.ear}" stroke="${f.ear}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M55 34 L53 10 Q52 8.5 50 9.5 L34 21 Z" fill="${f.ear}" stroke="${f.ear}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="32" cy="39" rx="24" ry="20" fill="${f.c}"/>
    <ellipse cx="11.5" cy="44" rx="8" ry="7" fill="${f.c}"/><ellipse cx="52.5" cy="44" rx="8" ry="7" fill="${f.c}"/>
    ${patch}${mask}${eyes}
    <ellipse cx="32" cy="44.5" rx="1.9" ry="1.4" fill="#E9A1AA"/>
    <path d="M7 42 l11 1.2 M7 47 l11 -1.2 M57 42 l-11 1.2 M57 47 l-11 -1.2" stroke="${f.mask || dark ? '#CFC9EE' : '#8F89B5'}" stroke-width=".9" stroke-linecap="round" opacity=".75"/>
  </g>`;
}

export function catFace(fur = 'white', size = 40, sleep = false) {
  return `<svg class="catface" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">${faceParts(fur, sleep)}</svg>`;
}

// 登入與空白頁用的插畫：薰衣草花田、月亮、蝴蝶，布偶貓和舉手的三花貓
export function scene(extra = '') {
  const dots = [[40, 120, 2.2, '#F8C98C'], [70, 190, 1.8, '#fff'], [300, 150, 2.4, '#F8C98C'], [330, 210, 1.8, '#fff'], [210, 140, 1.8, '#F8C98C'], [25, 240, 1.8, '#fff'], [250, 250, 2.2, '#F8C98C'], [180, 95, 1.6, '#fff']]
    .map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');
  return `<svg class="scene ${extra}" viewBox="0 0 360 300" role="img" aria-label="花田裡的兩隻貓咪">
    <rect width="360" height="300" rx="28" fill="#CDBFE8"/>
    <g filter="url(#blur6)"><ellipse cx="110" cy="70" rx="95" ry="36" fill="#F4EEFB" opacity=".85"/><ellipse cx="230" cy="88" rx="110" ry="34" fill="#F4EEFB" opacity=".75"/><ellipse cx="60" cy="100" rx="70" ry="28" fill="#EDE4F8" opacity=".8"/></g>
    <circle cx="305" cy="42" r="17" fill="#F8C98C"/>
    <g transform="translate(225 38)"><ellipse cx="-6" cy="0" rx="8" ry="5.5" fill="#fff" transform="rotate(-25 -6 0)"/><ellipse cx="6" cy="0" rx="8" ry="5.5" fill="#fff" transform="rotate(25 6 0)"/></g>
    <g filter="url(#fuzz)"><ellipse cx="60" cy="235" rx="90" ry="55" fill="#AE9BD8"/><ellipse cx="300" cy="240" rx="95" ry="55" fill="#B3A1DB"/><ellipse cx="180" cy="215" rx="120" ry="40" fill="#BFAFE2"/></g>
    ${dots}
    <g filter="url(#fuzz)"><ellipse cx="120" cy="222" rx="46" ry="52" fill="#FBF9FF"/><ellipse cx="120" cy="238" rx="38" ry="30" fill="#fff"/></g>
    <g transform="translate(76 128) scale(1.4)">${faceParts('white', false)}</g>
    <g filter="url(#fuzz)"><ellipse cx="238" cy="244" rx="30" ry="30" fill="#fff"/><ellipse cx="248" cy="252" rx="18" ry="12" fill="#F3B27C" opacity=".9"/></g>
    <g transform="translate(206 176) scale(.82)">${faceParts('calico', true)}</g>
    <ellipse cx="203" cy="206" rx="4.5" ry="6" fill="#fff" transform="rotate(-20 203 206)"/><circle cx="202" cy="201" r="2" fill="#F2A7A7"/>
    <g filter="url(#fuzz)"><ellipse cx="180" cy="285" rx="200" ry="26" fill="#A58FD2"/></g>
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
