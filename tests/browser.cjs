const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({headless: true, executablePath: process.env.BROWSER_EXECUTABLE || undefined});
  try {
    const context = await browser.newContext();
    // Offline fixture uses YouTube's share-panel structure, no live website dependency.
    await context.route('https://www.youtube.com/**', route => route.fulfill({contentType: 'text/html', body: `<!doctype html><html><body>
      <a id="video" href="/watch?v=video&si=track&t=107">����</a>
      <ytd-unified-share-panel-renderer><input id="share-url" readonly value="https://youtu.be/video?si=original"><button id="time">���� �ð�</button></ytd-unified-share-panel-renderer>
      <input id="ordinary" value="https://youtu.be/video?si=keep">
      <script>document.getElementById('time').onclick = () => { document.getElementById('share-url').value='https://youtu.be/video?si=new&t=107'; };</script>
    </body></html>`}));
    await context.addInitScript({content: `
      window.captured = {};
      window.open = function(url, target, features) { window.captured.open = {url, target, features}; return null; };
      Object.defineProperty(Clipboard.prototype, 'writeText', {configurable:true, value: function(value) { window.captured.text = value; return Promise.resolve(); }});
      Object.defineProperty(Clipboard.prototype, 'write', {configurable:true, value: function(value) { window.captured.items = value; return Promise.resolve(); }});
      Object.defineProperty(Navigator.prototype, 'share', {configurable:true, value: function(value) { window.captured.share = value; return Promise.resolve(); }});
      ${fs.readFileSync(path.join(root, 'cleaner.js'), 'utf8')}
      ${fs.readFileSync(path.join(root, 'page.js'), 'utf8')}
    `});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('https://www.youtube.com/watch?v=video');
    assert.equal(await page.locator('#share-url').inputValue(), 'https://youtu.be/video');
    assert.equal(await page.locator('#video').getAttribute('href'), '/watch?v=video&t=107');
    assert.equal(await page.locator('#ordinary').inputValue(), 'https://youtu.be/video?si=keep');
    await page.locator('#time').click();
    assert.equal(await page.locator('#share-url').inputValue(), 'https://youtu.be/video?t=107');
    await page.evaluate(() => { document.querySelector('#share-url').value = 'https://youtu.be/video?si=off'; });
    assert.equal(await page.locator('#share-url').inputValue(), 'https://youtu.be/video');
    await page.evaluate(() => {
      const panel = document.createElement('ytd-unified-share-panel-renderer');
      panel.innerHTML = '<input id="late" readonly value="https://youtu.be/late?si=dynamic&t=42">';
      document.body.append(panel);
    });
    await page.waitForFunction(() => document.querySelector('#late').value === 'https://youtu.be/late?t=42');
    await page.evaluate(async () => {
      await navigator.clipboard.writeText('https://youtu.be/video?si=track&t=107');
      await navigator.share({title:'����', url:'https://youtu.be/video?si=track&t=107', text:'����: https://youtu.be/video?si=track'});
      await navigator.clipboard.write([new ClipboardItem({'text/plain': new Blob(['https://youtu.be/video?si=track&t=107'], {type:'text/plain'}), 'text/html': new Blob(['<b><a href="https://youtu.be/video?si=track&t=107">����</a></b>'], {type:'text/html'})})]);
    });
    assert.equal(await page.evaluate(() => captured.text), 'https://youtu.be/video?t=107');
    assert.equal(await page.evaluate(() => captured.share.url), 'https://youtu.be/video?t=107');
    assert.equal(await page.evaluate(() => captured.share.text), '����: https://youtu.be/video');
    assert.equal(await page.evaluate(async () => (await captured.items[0].getType('text/plain')).text()), 'https://youtu.be/video?t=107');
    assert.match(await page.evaluate(async () => (await captured.items[0].getType('text/html')).text()), /href="https:\/\/youtu.be\/video\?t=107"/);
    const copy = await page.evaluate(() => {
      document.addEventListener('copy', event => {
        event.clipboardData.setData('text/plain', 'https://youtu.be/video?si=event&t=107');
        event.preventDefault();
      }, {once:true});
      const data = new DataTransfer();
      document.dispatchEvent(new ClipboardEvent('copy', {bubbles:true, cancelable:true, clipboardData:data}));
      return data.getData('text/plain');
    });
    assert.equal(copy, 'https://youtu.be/video?t=107');
    await page.evaluate(() => {
      const anchor = document.createElement('a'); anchor.id='social';
      anchor.href='https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent('https://youtu.be/video?si=social&t=107');
      document.body.append(anchor);
    });
    await page.waitForFunction(() => new URL(document.querySelector('#social').href).searchParams.get('u') === 'https://youtu.be/video?t=107');
    for (const prefix of ['https://api.whatsapp.com/send?text=', 'https://messages.google.com/web/authentication?text=', 'sms:?body=']) {
      const opened = await page.evaluate(prefix => {
        window.open(prefix + encodeURIComponent('https://youtu.be/video?si=click&t=107'), '_blank', 'noopener');
        return captured.open;
      }, prefix);
      assert.equal([...new URL(opened.url).searchParams.values()][0], 'https://youtu.be/video?t=107');
      assert.equal(opened.target, '_blank');
      assert.equal(opened.features, 'noopener');
    }
    assert.deepEqual(errors, []);
    console.log('PASS: share field, timestamp on/off, dynamic dialog, hover href, ordinary input unchanged, clipboard text/rich data, copy event, native share, social share.');
    await context.close();
    // Popup fixture stubs only the Chrome tab query; all UI code is the shipped code.
    const popupContext = await browser.newContext({viewport:{width:410,height:650}});
    await popupContext.route('https://extension.test/**', route => {
      const file = path.join(root, new URL(route.request().url()).pathname.slice(1));
      const types = {'.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png'};
      return route.fulfill({contentType:types[path.extname(file)] || 'text/plain', body:fs.readFileSync(file)});
    });
    await popupContext.addInitScript(() => { window.chrome = {tabs:{query:async()=>[{url:'https://youtu.be/example1234?si=tracking&t=107'}]}}; });
    const popup = await popupContext.newPage();
    await popup.goto('https://extension.test/popup.html');
    await popup.waitForFunction(() => document.getElementById('result').value === 'https://youtu.be/example1234?t=107');
    assert.equal(await popup.locator('#copy').isEnabled(), true);
    await popup.locator('#source').fill('https://example.com/?si=keep');
    assert.equal(await popup.locator('#copy').isEnabled(), false);
    await popup.locator('#source').fill('https://youtu.be/example1234?si=tracking&t=107');
    await popup.locator('#copy').click();
    await popup.waitForFunction(() => document.getElementById('status').textContent.includes('�����߾��'));
    await popup.screenshot({path:path.join(root, 'preview.png')});
    console.log('PASS: popup current-tab URL, pasted URL, invalid URL, copy button. Screenshot: preview.png');
    await popupContext.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
