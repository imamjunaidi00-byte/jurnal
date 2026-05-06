const fs = require('fs');
let html = fs.readFileSync('./public/index.html', 'utf8');

const newFn = `        function printNilai() {
            const kelas = document.getElementById('nilai-kelas').value;
            const semesterPrint = document.getElementById('nilai-semester-print').value;
            const siswaKelas = dataSiswa.filter(s => s.kelas === kelas);
            if (!siswaKelas.length) return showToast('Tidak ada siswa di kelas ini', 'error');

            const bp = (CONFIG.bobotNilai?.pengetahuan ?? 60) / 100;
            const bk = (CONFIG.bobotNilai?.keterampilan ?? 40) / 100;
            const bh = (CONFIG.bobotNilai?.kehadiran ?? 0) / 100;

            // Auto mapel dari mapping kelas
            const mapel = CONFIG.kelasMapelMapping?.[kelas] ||
                (Array.isArray(CONFIG.guru.mapel) ? CONFIG.guru.mapel.join(', ') : CONFIG.guru.mapel) || '-';

            const rows = siswaKelas.map((s, i) => {
                const n = nilaiData[s._id] || {};
                const uh=n.uh||0, pts=n.pts||0, pas=n.pas||0, praktek=n.praktek||0, proyek=n.proyek||0, portofolio=n.portofolio||0;
                const naPenget = Math.round(uh*0.2+pts*0.3+pas*0.5);
                const naKeter = Math.round((praktek+proyek+portofolio)/3);
                const absen = absensiRekap[s._id.toString()] || {hadir:0,sakit:0,izin:0,alpha:0};
                const totalAbsen = absen.hadir+absen.sakit+absen.izin+absen.alpha;
                const nilaiHadir = totalAbsen ? Math.round(((absen.hadir*100)+(absen.sakit*75)+(absen.izin*75))/totalAbsen) : 0;
                const naAkhir = Math.round(naPenget*bp + naKeter*bk + nilaiHadir*bh);
                const predikat = naAkhir>=85?'A':naAkhir>=75?'B':naAkhir>=65?'C':'D';
                const pctHadir = totalAbsen ? Math.round((absen.hadir/totalAbsen)*100)+'%' : '-';
                const sikap = hitungRataSikap(s._id) || '-';
                const bg = i%2===0 ? '' : 'background:#f9fafb';
                return \`<tr style="\${bg}">
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">\${i+1}</td>
                    <td style="padding:3px 5px;border:1px solid #ccc;font-weight:600">\${s.nama}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">\${s.nisn||'-'}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">\${uh}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">\${pts}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">\${pas}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc;background:#dcfce7;font-weight:bold">\${naPenget}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">\${praktek}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">\${proyek}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">\${portofolio}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc;background:#dcfce7;font-weight:bold">\${naKeter}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc;background:#ede9fe;font-weight:bold;color:\${naAkhir>=75?'#15803d':'#dc2626'}">\${naAkhir}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc;font-weight:bold">\${predikat}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">\${pctHadir}</td>
                    <td style="text-align:center;padding:3px 4px;border:1px solid #ccc">\${sikap}</td>
                </tr>\`;
            }).join('');

            const printContent = \`<div style="font-family:Arial,sans-serif;font-size:9px;padding:0;margin:0">
                <div style="text-align:center;margin-bottom:8px;border-bottom:2px solid #1d4ed8;padding-bottom:6px">
                    <h2 style="margin:0;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">DAFTAR NILAI SISWA</h2>
                    <p style="margin:1px 0;font-size:10px;color:#555">\${CONFIG.app?.name || 'E-Journal SMK'}</p>
                </div>
                <table style="width:100%;margin-bottom:8px;font-size:9px;border-collapse:collapse">
                    <tr>
                        <td style="width:80px;padding:1px 0">Kelas</td>
                        <td style="padding:1px 0">: <strong>\${kelas}</strong></td>
                        <td style="width:100px;padding:1px 0">Mata Pelajaran</td>
                        <td style="padding:1px 0">: <strong>\${mapel}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding:1px 0">Semester</td>
                        <td style="padding:1px 0">: <strong>\${semesterPrint}</strong></td>
                        <td style="padding:1px 0">Tahun Ajaran</td>
                        <td style="padding:1px 0">: <strong>\${CONFIG.tahunAjaran}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding:1px 0">Guru</td>
                        <td colspan="3" style="padding:1px 0">: <strong>\${CONFIG.guru.nama||'-'}</strong></td>
                    </tr>
                </table>
                <table style="width:100%;border-collapse:collapse;font-size:8.5px">
                    <thead>
                        <tr style="background:#1d4ed8;color:white">
                            <th rowspan="2" style="padding:3px 4px;border:1px solid #93c5fd;text-align:center;width:20px">No</th>
                            <th rowspan="2" style="padding:3px 5px;border:1px solid #93c5fd;text-align:left">Nama Siswa</th>
                            <th rowspan="2" style="padding:3px 4px;border:1px solid #93c5fd;text-align:center">NISN</th>
                            <th colspan="3" style="padding:3px 4px;border:1px solid #93c5fd;text-align:center">Pengetahuan</th>
                            <th rowspan="2" style="padding:3px 4px;border:1px solid #93c5fd;text-align:center;background:#166534">NA-P</th>
                            <th colspan="3" style="padding:3px 4px;border:1px solid #93c5fd;text-align:center">Keterampilan</th>
                            <th rowspan="2" style="padding:3px 4px;border:1px solid #93c5fd;text-align:center;background:#166534">NA-K</th>
                            <th rowspan="2" style="padding:3px 4px;border:1px solid #93c5fd;text-align:center;background:#6d28d9">NA</th>
                            <th rowspan="2" style="padding:3px 4px;border:1px solid #93c5fd;text-align:center">Pred</th>
                            <th rowspan="2" style="padding:3px 4px;border:1px solid #93c5fd;text-align:center">Hadir</th>
                            <th rowspan="2" style="padding:3px 4px;border:1px solid #93c5fd;text-align:center">Sikap</th>
                        </tr>
                        <tr style="background:#2563eb;color:white">
                            <th style="padding:2px 4px;border:1px solid #93c5fd;text-align:center">UH</th>
                            <th style="padding:2px 4px;border:1px solid #93c5fd;text-align:center">PTS</th>
                            <th style="padding:2px 4px;border:1px solid #93c5fd;text-align:center">PAS</th>
                            <th style="padding:2px 4px;border:1px solid #93c5fd;text-align:center">Praktek</th>
                            <th style="padding:2px 4px;border:1px solid #93c5fd;text-align:center">Proyek</th>
                            <th style="padding:2px 4px;border:1px solid #93c5fd;text-align:center">Porto</th>
                        </tr>
                    </thead>
                    <tbody>\${rows}</tbody>
                </table>
                <div style="margin-top:15px;display:flex;justify-content:flex-end">
                    <div style="text-align:center;font-size:9px;min-width:160px">
                        <p style="margin:0">............., ............. \${new Date().getFullYear()}</p>
                        <p style="margin:2px 0">Guru Mata Pelajaran</p>
                        <div style="height:45px"></div>
                        <p style="margin:0;font-weight:bold;border-top:1px solid #333;padding-top:2px">\${CONFIG.guru.nama||'_________________'}</p>
                    </div>
                </div>
            </div>\`;

            const printArea = document.getElementById('print-area');
            printArea.innerHTML = printContent;
            printArea.style.display = 'block';
            window.print();
            setTimeout(() => { printArea.style.display = 'none'; }, 1500);
        }`;

// Find and replace the function
const start = html.indexOf('        function printNilai() {');
const end = html.indexOf('\n        function downloadNilai()');
if (start === -1 || end === -1) {
    console.log('Could not find function boundaries');
    console.log('start:', start, 'end:', end);
    process.exit(1);
}
html = html.slice(0, start) + newFn + '\n' + html.slice(end);
fs.writeFileSync('./public/index.html', html);
console.log('Done! Replaced printNilai function');
