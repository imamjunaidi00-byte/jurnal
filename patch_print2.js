const fs = require('fs');
let html = fs.readFileSync('./public/index.html', 'utf8');

// 1. Fix TTD section - nama di atas garis
html = html.replace(
    `                <div style="margin-top:15px;display:flex;justify-content:flex-end">
                    <div style="text-align:center;font-size:9px;min-width:160px">
                        <p style="margin:0">............., ............. \${new Date().getFullYear()}</p>
                        <p style="margin:2px 0">Guru Mata Pelajaran</p>
                        <div style="height:45px"></div>
                        <p style="margin:0;font-weight:bold;border-top:1px solid #333;padding-top:2px">\${CONFIG.guru.nama||'_________________'}</p>
                    </div>
                </div>`,
    `                <div style="margin-top:15px;display:flex;justify-content:flex-end">
                    <div style="text-align:center;font-size:9px;min-width:160px">
                        <p style="margin:0">............., ............. \${new Date().getFullYear()}</p>
                        <p style="margin:2px 0">Guru Mata Pelajaran</p>
                        <p style="margin:2px 0;font-weight:bold">\${CONFIG.guru.nama||'_________________'}</p>
                        <div style="height:40px"></div>
                        <div style="border-top:1px solid #333;padding-top:2px;min-width:160px"></div>
                    </div>
                </div>`
);

// 2. Fix page scaling - wrap content in scaled div
html = html.replace(
    `const printContent = \`<div style="font-family:Arial,sans-serif;font-size:9px;padding:0;margin:0">`,
    `// Hitung scale berdasarkan jumlah siswa agar muat 1-2 halaman
            const jumlahSiswa = siswaKelas.length;
            const scale = jumlahSiswa <= 20 ? 1 : jumlahSiswa <= 36 ? 0.85 : jumlahSiswa <= 50 ? 0.72 : 0.65;
            const printContent = \`<div style="font-family:Arial,sans-serif;font-size:9px;padding:0;margin:0;transform-origin:top left;transform:scale(\${scale});width:\${Math.round(100/scale)}%">`
);

fs.writeFileSync('./public/index.html', html);
console.log('TTD and scale patched');
