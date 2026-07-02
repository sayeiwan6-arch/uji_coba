<?php
// Matikan error bawaan HTML agar tidak merusak format JSON
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

try {
    include 'koneksi.php';

    if (!isset($koneksi)) {
        throw new Exception("Variabel koneksi database tidak ditemukan. Cek file koneksi.php kamu.");
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $json_data = file_get_contents('php://input');
        $data = json_decode($json_data, true);

        $id_perangkat = isset($data['id_perangkat']) ? mysqli_real_escape_string($koneksi, $data['id_perangkat']) : '';
        $operasi = isset($data['operasi']) ? mysqli_real_escape_string($koneksi, $data['operasi']) : '';
        $hasil = isset($data['hasil']) ? mysqli_real_escape_string($koneksi, $data['hasil']) : '';

        if (empty($id_perangkat) || empty($operasi) || empty($hasil)) {
            echo json_encode(["status" => "error", "message" => "Data yang dikirim dari JS tidak lengkap atau kosong"]);
            exit;
        }

        // =================================================================
        // 🛠️ SOLUSI: DAFTARKAN ID PERANGKAT KE TABEL INDUK ('perangkat')
        // =================================================================
        $cek_perangkat = mysqli_query($koneksi, "SELECT id_perangkat FROM perangkat WHERE id_perangkat = '$id_perangkat'");
        
        if (!$cek_perangkat) {
            throw new Exception("Gagal mengecek tabel perangkat: " . mysqli_error($koneksi));
        }

        // Jika ID perangkat acak dari JS belum terdaftar di MySQL, masukkan dulu!
        if (mysqli_num_rows($cek_perangkat) == 0) {
            $insert_perangkat = mysqli_query($koneksi, "INSERT INTO perangkat (id_perangkat) VALUES ('$id_perangkat')");
            if (!$insert_perangkat) {
                throw new Exception("Gagal mendaftarkan id_perangkat baru ke tabel induk: " . mysqli_error($koneksi));
            }
        }

        // 2. Sekarang simpan data ke tabel riwayat (Dijamin lolos Foreign Key!)
        $query = "INSERT INTO riwayat (id_perangkat, operasi, hasil) VALUES ('$id_perangkat', '$operasi', '$hasil')";
        
        if (mysqli_query($koneksi, $query)) {
            echo json_encode(["status" => "success", "message" => "Riwayat berhasil disimpan"]);
        } else {
            throw new Exception("Gagal insert data ke MySQL: " . mysqli_error($koneksi));
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Metode request harus POST"]);
    }

} catch (Throwable $e) {
    // Tangkap error php dan ubah menjadi format JSON aman
    echo json_encode([
        "status" => "error",
        "message" => "Terjadi kesalahan di PHP saat simpan: " . $e->getMessage()
    ]);
}
?>