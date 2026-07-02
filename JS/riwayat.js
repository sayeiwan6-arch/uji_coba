// Gunakan ID perangkat yang valid dari phpMyAdmin kamu
let idPerangkat = '1'; 

// Fungsi mengambil riwayat (Hanya berjalan jika elemennya ada di HTML)
function ambilRiwayat() {
    const wadahRiwayat = document.getElementById('tempat-riwayat'); 
    
    if (!wadahRiwayat) return; 

    fetch(`http://localhost/aplikasi_kalkulator/ambil_riwayat.php?id_perangkat=${idPerangkat}`)
        .then(response => response.json())
        .then(hasil => {
            if (hasil.status === 'success' && hasil.data && hasil.data.length > 0) {
                wadahRiwayat.innerHTML = ''; 
                hasil.data.forEach(item => {
                    let operasiTeks = item.operasi || 'Kosong';
                    let hasilTeks = item.hasil || '0';
                    
                    // 1. Ambil property 'waktu_dibuat' sesuai kiriman JSON dari PHP kamu
                    let waktuMentah = item.waktu_dibuat; 
                    let waktuTeks = '-';

                    // 2. Format waktu bawaan MySQL (YYYY-MM-DD HH:MM:SS) menjadi format di gambar (DD/MM/YYYY, HH.MM)
                    if (waktuMentah && waktuMentah !== '-') {
                        try {
                            let t = new Date(waktuMentah);
                            // Cek apakah tanggal valid
                            if (!isNaN(t.getTime())) {
                                let tanggal = String(t.getDate()).padStart(2, '0');
                                let bulan = String(t.getMonth() + 1).padStart(2, '0');
                                let tahun = t.getFullYear();
                                let jam = String(t.getHours()).padStart(2, '0');
                                let menit = String(t.getMinutes()).padStart(2, '0');
                                
                                waktuTeks = `${tanggal}/${bulan}/${tahun}, ${jam}.${menit}`;
                            } else {
                                waktuTeks = waktuMentah; // Fallback jika format string berbeda
                            }
                        } catch (e) {
                            waktuTeks = waktuMentah;
                        }
                    }

                    // 3. Cetak ke HTML menggunakan kelas CSS gelap/neon terpadu
                    wadahRiwayat.innerHTML += `
                        <div class="item-riwayat">
                            <p class="operasi">${operasiTeks}</p>
                            <p class="hasil">= ${hasilTeks}</p>
                            <span class="waktu">${waktuTeks}</span>
                        </div>
                    `;
                });
            } else {
                wadahRiwayat.innerHTML = '<p class="pesan-kosong">Belum ada riwayat perhitungan di database.</p>';
            }
        })
        .catch(error => console.error('Gagal mengambil data:', error));
}

// Jalankan saat halaman siap
document.addEventListener("DOMContentLoaded", ambilRiwayat);

// Menangkap sinyal dari main.js untuk menyimpan data ke database secara diam-diam
window.addEventListener("simpanKeDatabase", function(e) {
    const dataKalkulasi = e.detail;

    fetch('http://localhost/aplikasi_kalkulator/simpan_riwayat.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id_perangkat: idPerangkat,
            operasi: dataKalkulasi.operasi,
            hasil: dataKalkulasi.hasil
        })
    })
    .then(res => res.json())
    .then(responsServer => {
        console.log('Respons penyimpanan otomatis:', responsServer);
        // Panggil ambilRiwayat() hanya jika kita sedang berada di halaman yang ada tampilan riwayatnya
        if (responsServer.status === 'success') {
            ambilRiwayat(); 
        }
    })
    .catch(err => console.error('Gagal melakukan fetch simpan:', err));
});

function hapusSemuaRiwayat() {
    // Tampilkan konfirmasi terlebih dahulu agar tidak sengaja tertekan
    if (!confirm("Apakah Anda yakin ingin menghapus seluruh riwayat perhitungan?")) {
        return;
    }

    fetch(`http://localhost/aplikasi_kalkulator/hapus_riwayat.php?id_perangkat=${idPerangkat}`, {
        method: 'GET' // Atau bisa menggunakan POST jika file PHP kamu dikonfigurasi menerima POST
    })
    .then(response => response.json())
    .then(hasil => {
        if (hasil.status === 'success') {
            alert("Riwayat berhasil dikosongkan!");
            // Refresh tampilan riwayat agar langsung kosong di layar
            ambilRiwayat(); 
        } else {
            alert("Gagal menghapus riwayat: " + hasil.message);
        }
    })
    .catch(error => {
        console.error('Error saat menghapus data:', error);
        alert("Terjadi kesalahan koneksi ke server.");
    });
}