import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dispatch=fs.readFileSync('netlify/functions/push-dispatch.mts','utf8');
const register=fs.readFileSync('netlify/functions/push-register.mts','utf8');

test('push dispatch never writes a stale whole device record after sending',()=>{
  assert.match(dispatch,/const sentKey = `sent\/\$\{record\.deviceId\}`/);
  assert.match(dispatch,/const latestSent = await store\.get\(sentKey/);
  assert.match(dispatch,/await store\.setJSON\(sentKey, Object\.fromEntries\(recent\)\)/);
  assert.doesNotMatch(dispatch,/await store\.setJSON\(blob\.key, record\)/);
});

test('push unsubscribe removes the separate sent acknowledgement state',()=>{
  assert.match(register,/await store\.delete\(`sent\/\$\{deviceId\}`\)/);
});
