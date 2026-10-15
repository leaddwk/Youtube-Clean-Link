const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
(async () => {
  const requests = [];
  const server = http.createServer((request, response) => {
    requests.push({host:request.headers.host, url:request.url});
    response.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});
    response.end('<!doctype html><html><body>Incoming navigation fixture</body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  let context;
  try {
    context = await chromium.launchPersistentContext('', {
      headless:true, executablePath:process.env.BROWSER_EXECUTABLE || undefined,
      ignoreDefaultArgs:['--disable-extensions'],
      args:[`--disable-extensions-except=${root}`, `--load-extension=${root}`, '--no-proxy-server',
        '--host-resolver-rules=MAP youtu.be 127.0.0.1, MAP www.youtube.com 127.0.0.1, MAP youtube.com.example.test 127.0.0.1']
    });
    const manager = await context.newPage();
    await manager.goto('chrome://extensions');
    const extensions = await manager.evaluate(() => new Promise(resolve => chrome.developerPrivate.getExtensionsInfo({includeDisabled:true, includeTerminated:true}, resolve)));
    const extension = extensions.find(item => item.name === '��Ʃ�� ��ũ ����');
    assert.ok(extension, 'unpacked extension must be registered');
    assert.deepEqual(extension.manifestErrors || [], [], JSON.stringify(extension.manifestErrors));
    await manager.goto(`chrome-extension://${extension.id}/popup.html`);
    const enabled = await manager.evaluate(() => chrome.declarativeNetRequest.getEnabledRulesets());
    assert.deepEqual(enabled, ['incoming_links']);
    console.log('Actual extension rule set enabled:', enabled.join(', '));
    const diagnostics = await manager.evaluate(async ({port, rules}) => ({
      regexes: await Promise.all(rules.map(rule => chrome.declarativeNetRequest.isRegexSupported({regex:rule.condition.regexFilter, isCaseSensitive:true}))),
      match: await chrome.declarativeNetRequest.testMatchOutcome({url:`http://youtu.be:${port}/video?si=track&t=107`,type:'main_frame',method:'get'})
    }), {port, rules:require('../rules/incoming.json')});
    assert.ok(diagnostics.regexes.every(item => item.isSupported), JSON.stringify(diagnostics.regexes));
    assert.ok(diagnostics.match.matchedRules.length > 0);
    for (const url of [
      'https://www.youtube.com/watch?v=video&si=track&t=107&list=PL123&index=2',
      'https://www.youtube-nocookie.com/embed/video?si=track&start=107'
    ]) {
      const match = await manager.evaluate(url => chrome.declarativeNetRequest.testMatchOutcome({url,type:'main_frame'}), url);
      assert.ok(match.matchedRules.length > 0, url);
    }
    await manager.close();
    const page = await context.newPage();
    for (const [host, input, expected] of [
      ['youtu.be', '/video?si=track&t=107', '/video?t=107'],
      ['youtu.be', '/video?t=107&si=track&utm_source=chat', '/video?t=107'],
      ['youtu.be', '/video?si=track', '/video'],
      ['youtu.be', '/video?si=track&t=107&list=PL123&index=2', '/video?t=107&list=PL123&index=2'],
      ['youtu.be', '/video?t=1m47s', '/video?t=1m47s'],
      ['youtube.com.example.test', '/video?si=keep&t=107', '/video?si=keep&t=107']
    ]) {
      requests.length = 0;
      await page.goto(`http://${host}:${port}${input}`);
      assert.equal(new URL(page.url()).pathname + new URL(page.url()).search, expected);
      const documentRequests = requests.filter(request => !request.url.startsWith('/favicon'));
      assert.equal(documentRequests.length, 1, JSON.stringify(documentRequests));
      assert.equal(documentRequests[0].url, expected, 'server must never receive the original tracked URL');
    }
    // An actual click from a non-YouTube page also uses the network rule.
    await page.goto(`http://127.0.0.1:${port}/inbox`);
    await page.evaluate(port => {
      const a = document.createElement('a'); a.id='received'; a.textContent='���� ��ũ';
      a.href=`http://youtu.be:${port}/received?si=received&t=42`; document.body.append(a);
    }, port);
    requests.length=0;
    await page.locator('#received').click();
    await page.waitForURL(`http://youtu.be:${port}/received?t=42`);
    assert.ok(requests.some(request => request.url === '/received?t=42'));
    assert.ok(requests.every(request => !request.url.includes('si=')));
    console.log('PASS: real DNR before-network redirects, timestamps, playlists, clean-link no-loop, spoof-host exclusion, received-link click. Original tracked URLs never reached the local HTTP server.');
  } finally {
    if (context) await context.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode=1; });
