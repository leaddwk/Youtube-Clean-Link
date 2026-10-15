const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
(async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || undefined,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`]
  });
  try {
    await context.route('https://www.youtube.com/**', route => route.fulfill({contentType:'text/html', body:`<!doctype html><html><body>
      <ytd-unified-share-panel-renderer><input id="share-url" readonly value="https://youtu.be/video?si=original"></ytd-unified-share-panel-renderer>
      <a id="video" href="/watch?v=video&si=track">����</a>
    </body></html>`}));
    const page = await context.newPage();
    await page.goto('https://www.youtube.com/watch?v=video');
    await page.waitForFunction(() => document.querySelector('#share-url').value === 'https://youtu.be/video', undefined, {timeout:10000});
    assert.equal(await page.locator('#video').getAttribute('href'), '/watch?v=video');
    await page.evaluate(() => { document.querySelector('#share-url').value='https://youtu.be/video?si=new&t=107'; });
    assert.equal(await page.locator('#share-url').inputValue(), 'https://youtu.be/video?t=107');
    console.log('PASS: actual unpacked extension manifest injection, MAIN world, share field, timestamp, href (offline YouTube fixture).');
  } finally { await context.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
