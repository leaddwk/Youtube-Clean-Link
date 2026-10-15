const {test} = require('node:test');
const assert = require('node:assert/strict');
const {cleanUrl, cleanText, cleanShareUrl, trackingParams} = require('../cleaner.js');
const cases = [
  ['short link', 'https://youtu.be/video?si=tracking', 'https://youtu.be/video'],
  ['timestamp after tracking', 'https://youtu.be/video?si=x&t=107', 'https://youtu.be/video?t=107'],
  ['timestamp before tracking', 'https://youtu.be/video?t=107&si=x', 'https://youtu.be/video?t=107'],
  ['only time on short shares', 'https://youtu.be/video?unknown=x&list=PL123&t=1m47s&feature=share', 'https://youtu.be/video?t=1m47s'],
  ['time unchecked', 'https://youtu.be/video?si=new', 'https://youtu.be/video'],
  ['watch identity and playlist', 'https://www.youtube.com/watch?v=video&list=PL123&index=2&t=107&si=x&pp=abc', 'https://www.youtube.com/watch?v=video&list=PL123&index=2&t=107'],
  ['shorts', 'https://www.youtube.com/shorts/video?si=x&t=42', 'https://www.youtube.com/shorts/video?t=42'],
  ['live', 'https://www.youtube.com/live/video?si=x&t=42', 'https://www.youtube.com/live/video?t=42'],
  ['embed playback retained', 'https://www.youtube-nocookie.com/embed/video?start=107&autoplay=1&si=x', 'https://www.youtube-nocookie.com/embed/video?start=107&autoplay=1'],
  ['playlist', 'https://www.youtube.com/playlist?list=PL123&si=x', 'https://www.youtube.com/playlist?list=PL123'],
  ['relative', '/watch?v=x&feature=share&t=107', '/watch?v=x&t=107', 'https://www.youtube.com/'],
  ['original encoding retained', 'https://www.youtube.com/results?search_query=a%20b&si=x', 'https://www.youtube.com/results?search_query=a%20b'],
  ['hash retained', 'https://youtu.be/video?si=x&t=107#chapter', 'https://youtu.be/video?t=107#chapter'],
  ['encoded duplicate keys', 'https://youtu.be/video?%73i=x&si=y&t=107', 'https://youtu.be/video?t=107'],
  ['utm tracking', 'https://www.youtube.com/watch?v=x&utm_source=chat&utm_medium=copy', 'https://www.youtube.com/watch?v=x'],
  ['non youtube', 'https://example.com/watch?v=x&si=x', 'https://example.com/watch?v=x&si=x'],
  ['spoof host', 'https://youtube.com.example.com/watch?v=x&si=x', 'https://youtube.com.example.com/watch?v=x&si=x'],
  ['non web protocol', 'javascript:alert(1)', 'javascript:alert(1)'],
  ['invalid', 'not a URL', 'not a URL'],
  ['malformed encoding', 'https://youtu.be/video?%zz=x&t=107', 'https://youtu.be/video?t=107'],
  ['hash question mark', 'https://youtu.be/video#chapter?si=x', 'https://youtu.be/video#chapter?si=x'],
];
for (const [name, input, output, base] of cases) test(name, () => {
  assert.equal(cleanUrl(input, base), output);
  assert.equal(cleanUrl(output, base), output, 'must be idempotent');
});
test('message with multiple links and punctuation', () => {
  assert.equal(cleanText('영상 (https://youtu.be/x?si=a&t=107). 다음 https://www.youtube.com/watch?v=y&si=b!'),
    '영상 (https://youtu.be/x?t=107). 다음 https://www.youtube.com/watch?v=y!');
});
for (const [name, prefix, key] of [
  ['Facebook', 'https://www.facebook.com/sharer/sharer.php?', 'u'],
  ['WhatsApp', 'https://api.whatsapp.com/send?', 'text'],
  ['WhatsApp app', 'whatsapp://send?', 'text'],
  ['Google Messages', 'https://messages.google.com/web/authentication?', 'text'],
  ['SMS', 'sms:+123456789?', 'body'],
  ['email', 'mailto:?', 'body'],
  ['Messenger app', 'fb-messenger://share?', 'link']
]) test(`${name} share payload`, () => {
  const raw = prefix + key + '=' + encodeURIComponent('https://youtu.be/video?si=track&t=107');
  const cleaned = new URL(cleanShareUrl(raw));
  assert.equal(cleaned.searchParams.get(key), 'https://youtu.be/video?t=107');
  assert.equal(cleanShareUrl(cleaned.href), cleaned.href);
});
test('unrelated share text and duplicate fields retained', () => {
  const raw = 'https://api.whatsapp.com/send?text=hello&text=' + encodeURIComponent('https://youtu.be/video?si=x&t=107') + '&phone=123';
  const url = new URL(cleanShareUrl(raw));
  assert.deepEqual(url.searchParams.getAll('text'), ['hello','https://youtu.be/video?t=107']);
  assert.equal(url.searchParams.get('phone'), '123');
});
test('incoming rules remove exactly the shared tracking list and never time or identity', () => {
  const rules = require('../rules/incoming.json');
  const [rule] = rules;
  assert.deepEqual(rule.action.redirect.transform.queryTransform.removeParams, trackingParams);
  for (const key of ['v', 't', 'start', 'end', 'list', 'index']) assert.ok(!trackingParams.includes(key));
  const matches = url => rules.some(item => new RegExp(item.condition.regexFilter).test(url));
  assert.ok(matches('https://youtu.be/video?si=track&t=107'));
  assert.ok(matches('https://youtu.be/video?t=107&utm_source=chat'));
  assert.ok(!matches('https://youtu.be/video?t=107'));
  assert.deepEqual(rule.condition.resourceTypes, ['main_frame','sub_frame']);
});
