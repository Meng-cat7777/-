// 喵帳本：貓咪頭像與圖示（全部是 SVG，不使用 emoji）
export const FURS = [
  { id: 'orange', name: '橘貓', c: '#E9A35F' },
  { id: 'black', name: '黑貓', c: '#4F433E' },
  { id: 'white', name: '白貓', c: '#FFFFFF' },
  { id: 'gray', name: '灰貓', c: '#B3ADA8' },
  { id: 'cream', name: '奶茶貓', c: '#EBCFA0' },
];

export function catFace(fur = 'orange', size = 40, sleep = false) {
  const f = FURS.find(x => x.id === fur) || FURS[0];
  const dark = f.id === 'black';
  const line = dark ? '#F3E6DA' : '#4A3428';
  const edge = dark ? '#2B211D' : '#4A3428';
  const eye = dark ? '#FFE9B0' : '#4A3428';
  const eyes = sleep
    ? `<path d="M18.5 35 q4.5 4 9 0 M36.5 35 q4.5 4 9 0" stroke="${line}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="23" cy="34.5" rx="2.8" ry="3.6" fill="${eye}"/><ellipse cx="41" cy="34.5" rx="2.8" ry="3.6" fill="${eye}"/>`;
  return `<svg class="catface" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
  <path d="M9 30 L11 6 L28 18 Z" fill="${f.c}" stroke="${edge}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M55 30 L53 6 L36 18 Z" fill="${f.c}" stroke="${edge}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M14 23 L15 13 L23 18 Z M50 23 L49 13 L41 18 Z" fill="#F4B6B0"/>
  <ellipse cx="32" cy="37" rx="23" ry="20" fill="${f.c}" stroke="${edge}" stroke-width="2.5"/>
  ${eyes}
  <path d="M29.3 41 h5.4 l-2.7 3.2 z" fill="#E58C8C"/>
  <path d="M32 44.2 q-3 4 -6.2 1.2 M32 44.2 q3 4 6.2 1.2" stroke="${line}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M6 40 l11 1.5 M6 46 l11 -1.5 M58 40 l-11 1.5 M58 46 l-11 -1.5" stroke="${line}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
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
