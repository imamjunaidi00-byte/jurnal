const fs = require('fs');
const { execSync } = require('child_process');

const html = fs.readFileSync('./public/index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const code = scripts[1][1];

// Write to temp file and try to parse with acorn or just node --check
fs.writeFileSync('./temp_check.js', code);
try {
    execSync('node --check temp_check.js', { stdio: 'pipe' });
    console.log('No syntax errors found!');
} catch(e) {
    console.log('Syntax error:', e.stderr.toString());
}
fs.unlinkSync('./temp_check.js');
