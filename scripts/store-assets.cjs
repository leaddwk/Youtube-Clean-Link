// Deterministic vector artwork and screenshots of the actual packaged popup.
// No images, fonts or scripts are fetched from the network.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'store/assets');
const esc = text => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const font = 'Malgun Gothic, sans-serif';
const pngData = buffer => 'data:image/png;base64,' + buffer.toString('base64');
async function svgPng(svg, file) {
  await sharp(Buffer.from(svg)).flatten({background:'#101a25'}).removeAlpha().png().toFile(file);
}
(async () => {
  fs.mkdirSync(assets, {recursive:true});
  const source = fs.readFileSync(path.join(root,'icons/source.svg'));
  for (const size of [16,32,48,128]) {
    await sharp(source, {density:384}).resize(size,size).png().toFile(path.join(root,`icons/${size}.png`));
  }
  fs.copyFileSync(path.join(root,'icons/128.png'), path.join(assets,'icon-128.png'));
  if (process.argv.includes('--icons-only')) { console.log('Original icons built with transparent padding.'); return; }
  const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const extensionPath = path.resolve(process.env.EXTENSION_PATH || root);
  const manifest = JSON.parse(fs.readFileSync(path.join(extensionPath, 'manifest.json'), 'utf8'));
  const context = await chromium.launchPersistentContext('', {
    headless:true, executablePath:process.env.BROWSER_EXECUTABLE || undefined,
    ignoreDefaultArgs:['--disable-extensions'],
    args:[`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    viewport:{width:500,height:740}, deviceScaleFactor:2
  });
  const shots = [];
  try {
    const manager = await context.newPage();
    await manager.goto('chrome://extensions');
    const extensions = await manager.evaluate(() => new Promise(resolve => chrome.developerPrivate.getExtensionsInfo({includeDisabled:true,includeTerminated:true}, resolve)));
    const extension = extensions.find(item => item.name === manifest.name);
    if (!extension || extension.manifestErrors?.length) throw new Error('Packaged extension failed to load');
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extension.id}/popup.html`);
    for (const time of ['', '&t=107']) {
      await popup.locator('#source').fill('https://youtu.be/example1234?si=tracking' + time);
      await popup.waitForFunction(time => document.getElementById('result').value === 'https://youtu.be/example1234' + (time ? '?t=107' : ''), time);
      shots.push(await popup.locator('body').screenshot());
    }
    console.log('Captured actual packaged popup, with and without timestamp.');
  } finally { await context.close(); }
  const icon = pngData(fs.readFileSync(path.join(assets,'icon-128.png')));
  const svg = (width,height,content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#101a25"/>${content}</svg>`;
  const text = (x,y,size,color,value,weight=400) => `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(value)}</text>`;
  await svgPng(svg(1280,800,`
    <circle cx="1100" cy="100" r="400" fill="#153c39" opacity=".30"/>
    <image href="${icon}" x="57" y="58" width="80" height="80"/>
    ${text(151,108,26,'#c3eedc','클린 링크',700)}
    ${text(72,240,50,'#f0f5f8','공유할 때는',700)}
    ${text(72,310,50,'#88e7bd','필요한 주소만.',700)}
    ${text(75,373,22,'#a9b8ca','추적 인자를 정리하고 시작 시간은 유지합니다.')}
    <rect x="74" y="435" width="495" height="62" rx="14" fill="#1d2a38"/>
    ${text(96,474,19,'#9eb0c5','youtu.be/example1234?si=tracking')}
    <path d="M308 518v34m-9-9 9 9 9-9" fill="none" stroke="#88e7bd" stroke-width="3"/>
    <rect x="74" y="574" width="495" height="62" rx="14" fill="#193d34"/>
    ${text(96,613,21,'#c3f6df','youtu.be/example1234')}
    ${text(75,726,16,'#7f94a9','YouTube™ 링크 정리 · 기기 내부 처리')}
    <rect x="697" y="51" width="463" height="697" rx="24" fill="#223345"/>
    <image href="${pngData(shots[0])}" x="712" y="67" width="433" height="646" preserveAspectRatio="xMidYMin meet"/>
    ${text(841,732,14,'#a1b5c8','실제 확장 팝업 화면')}
  `), path.join(assets,'screenshot-01.png'));
  await svgPng(svg(1280,800,`
    ${text(67,79,40,'#f0f5f8','시작 시간은 그대로 남깁니다.',700)}
    ${text(69,124,20,'#a9b8ca','같은 영상 주소, 시간 지정 여부에 맞춰 깔끔하게.')}
    <rect x="104" y="176" width="465" height="542" rx="20" fill="#1f3040"/>
    <rect x="711" y="176" width="465" height="542" rx="20" fill="#1b3c34"/>
    ${text(129,212,20,'#d5e1ed','시간 미지정',700)}
    ${text(736,212,20,'#b1f3d6','1:47부터 공유',700)}
    <image href="${pngData(shots[0])}" x="149" y="228" width="375" height="474" preserveAspectRatio="xMidYMin meet"/>
    <image href="${pngData(shots[1])}" x="756" y="228" width="375" height="474" preserveAspectRatio="xMidYMin meet"/>
    ${text(104,765,17,'#89a0b5','제출 패키지의 실제 팝업 · 예시 링크 사용')}
    ${text(890,765,17,'#88e7bd','정리된 링크의 시간 인자: t=107')}
  `), path.join(assets,'screenshot-02.png'));
  // Abstract link/check motif: original art, no Google/YouTube logos or approval badges.
  await svgPng(svg(440,280,`
    <circle cx="366" cy="-12" r="178" fill="#1a4f43"/>
    <circle cx="12" cy="302" r="150" fill="#203b53"/>
    <image href="${icon}" x="119" y="14" width="202" height="202"/>
    <rect x="69" y="214" width="302" height="29" rx="14.5" fill="#234b41"/>
    <path d="M92 228h157" stroke="#9deacb" stroke-width="4" stroke-linecap="round"/>
    <circle cx="270" cy="228" r="3" fill="#9deacb"/><circle cx="283" cy="228" r="3" fill="#9deacb"/>
    <path d="m317 228 7 7 13-15" fill="none" stroke="#9deacb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  `), path.join(assets,'promo-440x280.png'));
  console.log('Store images built: 128×128 icon, two 1280×800 screenshots, 440×280 promotional tile.');
})().catch(error => { console.error(error); process.exitCode=1; });
