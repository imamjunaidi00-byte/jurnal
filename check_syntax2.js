const fs = require('fs');
const html = fs.readFileSync('./public/index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const code = scripts[1][1];
const lines = code.split('\n');

// Find ALL places where depth goes from 0 to 1 (function starts) but never returns to 0
let depth = 0;
let opens = []; // stack of {line, depth}

for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    let inStr = false, strCh = '';
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inStr) {
            if (c === strCh && (i===0 || line[i-1] !== '\\')) inStr = false;
            continue;
        }
        if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
        if (c === '{') { depth++; if(depth===1) opens.push(li+1); }
        if (c === '}') { depth--; if(depth===0 && opens.length) opens.pop(); }
    }
}
console.log('Unclosed opens at lines:', opens);
opens.forEach(l => console.log('Line', l, ':', lines[l-1].substring(0,100)));
