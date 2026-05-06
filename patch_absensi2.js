const fs = require('fs');
let html = fs.readFileSync('./public/index.html', 'utf8');

const oldBlock = `
                const btnClass = (st) => {
                    if (status === st) {
                        const colors = {hadir:'bg-green-500 text-white shadow-green-200 shadow-lg scale-105', sakit:'bg-yellow-500 text-white shadow-yellow-200 shadow-lg scale-105', izin:'bg-blue-500 text-white shadow-blue-200 shadow-lg scale-105', alpha:'bg-red-500 text-white shadow-red-200 shadow-lg scale-105'};
                        return \`attendance-btn px-4 py-2 rounded-lg text-xs font-bold transition-all \${colors[st]}\`;
                    }
                    return 'attendance-btn px-4 py-2 rounded-lg text-xs font-bold transition-all bg-gray-100 text-gray-500 hover:bg-gray-200';
                };

                html += \`
                    <tr class="hover:bg-gray-50 transition-colors \${!status ? 'bg-amber-50' : ''}">
                        <td class="px-4 py-4 text-sm text-gray-500 font-medium">\${i+1}</td>
                        <td class="px-4 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full \${s.jenisKelamin==='L'?'bg-blue-100 text-blue-600':'bg-pink-100 text-pink-600'} flex items-center justify-center font-bold text-sm">\${s.nama.charAt(0)}</div>
                                <div>
                                    <div class="font-semibold text-gray-900">\${s.nama}</div>
                                    <div class="text-xs text-gray-500">\${s.jenisKelamin==='L'?'Laki-laki':'Perempuan'}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-4 py-4 text-sm font-mono text-gray-600">\${s.nisn}</td>
                        <td class="px-4 py-4">
                            <div class="flex gap-1.5 justify-center">
                                <button onclick="setAbsensi('\${key}','hadir')" class="\${btnClass('hadir')}">H</button>
                                <button onclick="setAbsensi('\${key}','sakit')" class="\${btnClass('sakit')}">S</button>
                                <button onclick="setAbsensi('\${key}','izin')" class="\${btnClass('izin')}">I</button>
                                <button onclick="setAbsensi('\${key}','alpha')" class="\${btnClass('alpha')}">A</button>
                                \${status ? \`<button onclick="resetSiswa('\${key}','\${s._id}','\${kelas}')" class="attendance-btn px-2 py-2 rounded-lg text-xs font-bold transition-all bg-gray-200 text-gray-500 hover:bg-red-100 hover:text-red-500" title="Reset siswa ini"><i class="fas fa-times"></i></button>\` : ''}
                            </div>
                        </td>
                        <td class="px-4 py-4">
                            <input type="text" value="\${ket}" placeholder="Keterangan..." class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50 focus:bg-white" onchange="absensiData['\${key}-ket']=this.value">
                        </td>
                    </tr>\`;
            });
            container.innerHTML = html || '<div class="text-center py-8 text-gray-400">Belum ada siswa di kelas ini</div>';`;

const newBlock = `
                const ab = (st, lbl) => {
                    const ac = {hadir:'bg-green-500 text-white border-green-400', sakit:'bg-yellow-500 text-white border-yellow-400', izin:'bg-blue-500 text-white border-blue-400', alpha:'bg-red-500 text-white border-red-400'};
                    return \`<button onclick="setAbsensi('\${key}','\${st}')" class="py-3 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 \${status===st ? ac[st] : 'bg-white text-gray-400 border-gray-200'}">\${lbl}</button>\`;
                };
                html += \`
                <div class="bg-white rounded-xl border \${!status ? 'border-amber-200' : 'border-gray-100'} p-4 shadow-sm">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full \${s.jenisKelamin==='L'?'bg-blue-500':'bg-pink-500'} text-white flex items-center justify-center font-bold text-sm shrink-0">\${s.nama.charAt(0)}</div>
                        <div class="flex-1 min-w-0">
                            <p class="font-semibold text-gray-900 text-sm">\${i+1}. \${s.nama}</p>
                            <p class="text-xs text-gray-400">\${s.nisn}</p>
                        </div>
                        \${status ? \`<span class="px-2 py-1 rounded-lg text-xs font-bold \${status==='hadir'?'bg-green-100 text-green-700':status==='sakit'?'bg-yellow-100 text-yellow-700':status==='izin'?'bg-blue-100 text-blue-700':'bg-red-100 text-red-700'}">\${status.toUpperCase()}</span>\` : '<span class="px-2 py-1 rounded-lg text-xs bg-amber-100 text-amber-600">Belum</span>'}
                    </div>
                    <div class="grid grid-cols-5 gap-2 mb-2">
                        \${ab('hadir','H')}\${ab('sakit','S')}\${ab('izin','I')}\${ab('alpha','A')}
                        <button onclick="resetSiswa('\${key}','\${s._id}','\${kelas}')" class="py-3 rounded-xl text-sm border-2 border-gray-200 bg-white text-gray-400 hover:bg-red-50 hover:text-red-400 transition-all"><i class="fas fa-times"></i></button>
                    </div>
                    <input type="text" value="\${ket}" placeholder="Keterangan (opsional)..."
                        class="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50"
                        onchange="absensiData['\${key}-ket']=this.value">
                </div>\`;
            });
            const el = document.getElementById('absensi-list');
            if (el) el.innerHTML = html || '<div class="text-center py-8 text-gray-400">Belum ada siswa di kelas ini</div>';`;

if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
    console.log('Replaced successfully');
} else {
    console.log('Block not found');
    // Find approximate location
    const idx = html.indexOf('btnClass');
    console.log('btnClass found at:', idx);
}

fs.writeFileSync('./public/index.html', html);
