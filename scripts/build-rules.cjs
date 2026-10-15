const fs = require('node:fs');
const path = require('node:path');
const {trackingParams} = require('../cleaner.js');
// Chrome caps each compiled regular expression at 2 KB; use one small rule per key.
const rules = trackingParams.map((key, index) => ({
  id: index + 1,
  priority: 1,
  action: {type: 'redirect', redirect: {transform: {queryTransform: {removeParams: trackingParams}}}},
  condition: {
    requestDomains: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
    regexFilter: '[?&]' + key + '(=|&|$)',
    isUrlFilterCaseSensitive: true,
    resourceTypes: ['main_frame', 'sub_frame'],
    requestMethods: ['get']
  }
}));
const target = path.resolve(__dirname, '../rules/incoming.json');
fs.mkdirSync(path.dirname(target), {recursive:true});
fs.writeFileSync(target, JSON.stringify(rules, null, 2) + '\n');
console.log('Built incoming navigation rules');
