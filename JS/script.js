document.addEventListener("DOMContentLoaded", function () {
    const idPerangkatAktif = "1"; // <-- Sesuaikan dengan id_perangkat di database-mu

    // 1. Ambil data Riwayat dari database MySQL via PHP
    fetch(`http://localhost/aplikasi_kalkulator/ambil_riwayat.php?id_perangkat=${idPerangkatAktif}`)
        .then(response => response.json())
        .then(hasil => {
            let totalRiwayat = 0;
            if (hasil.status === 'success' && hasil.data) {
                totalRiwayat = hasil.data.length;
            }

            // Update nilai target counter untuk Riwayat
            const elemenRiwayat = document.getElementById("stat-riwayat");
            if (elemenRiwayat) {
                elemenRiwayat.setAttribute("data-counter", totalRiwayat);
            }

            // Update nilai target counter untuk Kategori Konversi (ada 12 kategori sesuai file konversi.html)
            const elemenKategori = document.getElementById("stat-kategori");
            if (elemenKategori) {
                elemenKategori.setAttribute("data-counter", 12);
            }

            // Jalankan fungsi animasi angka SETELAH data berhasil didapatkan
            inisialisasiAnimasiCounter();
        })
        .catch(error => {
            console.error('Gagal mengambil data statistik:', error);
            // Tetap jalankan animasi meskipun API gagal (angka fallback ke 0 atau bawaan)
            inisialisasiAnimasiCounter();
        });
});

// 3. FUNGSI UNTUK MENJALANKAN ANIMASI ANGKA BERJALAN
function inisialisasiAnimasiCounter() {
    const counters = document.querySelectorAll(".landing-stats .num span");
    const speed = 100; // Mengatur kecepatan durasi animasi (makin kecil makin cepat)

    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute("data-counter");
            const count = +counter.innerText.replace(/[^0-9]/g, ''); // Ambil angka murni saja
            const suffix = counter.getAttribute("data-suffix") || "";

            // Hitung penambahan angka bertahap
            const inc = Math.ceil(target / speed) || 1;

            if (count < target) {
                counter.innerText = (count + inc > target ? target : count + inc) + suffix;
                setTimeout(updateCount, 20);
            } else {
                counter.innerText = target + suffix;
            }
        };
        
        updateCount();
    });
}