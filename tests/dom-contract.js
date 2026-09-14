import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const ids=new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]));
// Match only direct $('#id') calls. The negative lookbehind avoids matching the second $
// inside $$('#selector'), which is a querySelectorAll helper rather than an element id.
const directRefs=[...js.matchAll(/(?<!\$)\$\('#([^']+)'\)/g)].map(m=>m[1]);
const missing=[...new Set(directRefs.filter(id=>!ids.has(id)))];
assert.deepEqual(missing,[],`app.js references missing DOM ids: ${missing.join(', ')}`);

for(const required of ['channelSwitch','todayAppointments','bagList','chatList','clientList','agendaList','reminderList','metricKpis','appointmentForm','clientForm','taskForm','toast']){
  assert.ok(ids.has(required),`missing required DOM contract id: ${required}`);
}

for(const asset of ['styles.css','app.js','manifest.webmanifest']){
  assert.ok(html.includes(asset),`index.html does not reference ${asset}`);
}

console.log(`OK: ${directRefs.length} direct DOM references resolved against ${ids.size} ids`);
