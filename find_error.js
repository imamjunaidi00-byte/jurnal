const fs = require('fs');
const html = fs.readFileSync('./public/index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const code = scripts[1][1];
const lines = code.split('\n');
// Show lines around 1533
const start = Math.max(0, 1530);
const end = Math.min(lines.length, 1540);
lines.slice(start, end).forEach((l, i) => console.log(start+i+1, ':', l.substring(0,120)));
