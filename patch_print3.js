const fs = require('fs');
let html = fs.readFileSync('./public/index.html', 'utf8');

// Fix 1: TTD - nama di atas garis dengan jarak 7 baris
const oldTTD = `                <div style="margin-top:15px;display:flex;justify-content:flex-end">
                    <div style="text-align:center;font-size:9px;min-width:160px">
                        <p style="margin:0">............., ............. \${new Date().getFullYear()}</p>
                        <p style="margin:2px 0">Guru Mata Pelajaran</p>
                        <p style="margin:2px 0;font-weight:bold">\${CONFIG.guru.nama||'_________________'}</p>
                        <div style="height:40px"></div>
                        <div style="border-top:1px solid #333;padding-top:2px;min-width:160px"></div>
                    </div>
                </div>`;

const newTTD = `                <div style="margin-top:15px;display:flex;justify-content:flex-end">
                    <div style="text-align:center;font-size:9px;min-width:180px">
                        <p style="margin:0">............., ............. \${new Date().getFullYear()}</p>
                        <p style="margin:2px 0">Guru Mata Pelajaran</p>
                        <br/><br/><br/><br/><br/><br/><br/>
                        <p style="margin:0 0 2px 0;font-weight:bold">\${CONFIG.guru.nama||'_________________'}</p>
                        <div style="border-top:2px solid #333;width:100%"></div>
                    </div>
                </div>`;

if (html.includes(oldTTD)) {
    html = html.replace(oldTTD, newTTD);
    console.log('TTD fixed');
} else {
    console.log('TTD pattern not found, trying alternative...');
    // Try to find and replace with regex
    const ttdRegex = /(<div style="margin-top:15px;display:flex;justify-content:flex-end">[\s\S]*?<\/div>\s*<\/div>)/;
    const match = html.match(ttdRegex);
    if (match) console.log('Found TTD at:', html.indexOf(match[0]));
}

// Fix 2: Better page scaling - use CSS zoom instead of transform
const oldScale = `// Hitung scale berdasarkan jumlah siswa agar muat 1-2 halaman
            const jumlahSiswa = siswaKelas.length;
            const scale = jumlahSiswa <= 20 ? 1 : jumlahSiswa <= 36 ? 0.85 : jumlahSiswa <= 50 ? 0.72 : 0.65;
            const printContent = \`<div style="font-family:Arial,sans-serif;font-size:9px;padding:0;margin:0;transform-origin:top left;transform:scale(\${scale});width:\${Math.round(100/scale)}%">`;

const newScale = `// Hitung zoom berdasarkan jumlah siswa
            const jumlahSiswa = siswaKelas.length;
            const zoom = jumlahSiswa <= 20 ? 100 : jumlahSiswa <= 30 ? 90 : jumlahSiswa <= 36 ? 80 : jumlahSiswa <= 45 ? 70 : 65;
            const printContent = \`<div style="font-family:Arial,sans-serif;font-size:9px;padding:0;margin:0;zoom:\${zoom}%">`;

if (html.includes(oldScale)) {
    html = html.replace(oldScale, newScale);
    console.log('Scale fixed');
} else {
    console.log('Scale pattern not found');
}

fs.writeFileSync('./public/index.html', html);
console.log('Done');
