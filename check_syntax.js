const fs = require('fs');
const html = fs.readFileSync('./public/index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const code = scripts[1][1];
const lines = code.split('\n');

// Track brace depth per line
let depth = 0;
let inStr = false, strCh = '';
for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inStr) {
            if (c === strCh && line[i-1] !== '\\') inStr = false;
            continue;
        }
        if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
        if (c === '{') depth++;
        if (c === '}') depth--;
    }
    // Flag lines where depth goes negative or stays high at end of function
    if (depth < 0) {
        console.log('NEGATIVE depth at line', li+1, '(depth='+depth+'):', line.substring(0,100));
        depth = 0;
    }
}
console.log('Final depth:', depth);
// Show lines around where depth is still open
if (depth > 0) {
    // Find last function that opened but didn't close
    depth = 0;
    let lastOpen = 0;
    for (let li = 0; li < lines.length; li++) {
        const prev = depth;
        const line = lines[li];
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '{') depth++;
            if (c === '}') depth--;
        }
        if (depth > prev && depth === 1) lastOpen = li;
    }
    console.log('Last unclosed block opened near line:', lastOpen+1);
    lines.slice(Math.max(0,lastOpen-2), lastOpen+5).forEach((l,j)=>console.log(lastOpen-2+j+1,':', l.substring(0,100)));
}
