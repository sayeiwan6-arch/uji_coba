<?php
// Matikan error bawaan HTML agar tidak merusak JSON jika ada error kecil
error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

try {
    include 'koneksi.php';

    if (!isset($koneksi)) {
        throw new Exception("Variabel koneksi database tidak ditemukan. Cek file koneksi.php kamu.");
    }

    if (isset($_GET['id_perangkat'])) {
        // Gunakan fungsi asli PHP yang benar untuk mengamankan input string
        $id_perangkat = mysqli_real_escape_string($koneksi, $_GET['id_perangkat']);

        if (empty($id_perangkat)) {
            throw new Exception("ID Perangkat kosong atau tidak valid.");
        }

        // Jalankan query penghapusan data berdasarkan id_perangkat
        $query = "DELETE FROM riwayat WHERE id_perangkat = '$id_perangkat'";
        $result = mysqli_query($koneksi, $query);
        
        if (!$result) {
            throw new Exception("Gagal menghapus data dari database: " . mysqli_error($koneksi));
        }

        // Jika berhasil, kirim respons sukses berbentuk JSON
        echo json_encode([
            "status" => "success", 
            "message" => "Semua riwayat perangkat berhasil dikosongkan."
        ]);

    } else {
        echo json_encode([
            "status" => "error", 
            "message" => "Parameter id_perangkat tidak ditemukan di URL."
        ]);
    }

} catch (Throwable $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Terjadi kesalahan di PHP: " . $e->getMessage()
    ]);
}
?>