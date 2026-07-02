<?php
// Matikan error bawaan HTML agar tidak merusak JSON
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
        $id_perangkat = mysqli_real_escape_string($koneksi, $_GET['id_perangkat']);

        // Ambil data riwayat berdasarkan id_perangkat tanpa ORDER BY ID yang bikin crash kemarin
        $query = "SELECT * FROM riwayat WHERE id_perangkat = '$id_perangkat' LIMIT 20";
        $result = mysqli_query($koneksi, $query);
        
        if (!$result) {
            throw new Exception("Query gagal: " . mysqli_error($koneksi));
        }

        $riwayat_array = array();
        while ($row = mysqli_fetch_assoc($result)) {
            // Deteksi nama kolom waktu secara fleksibel jika ada
            $waktu = '-';
            if (isset($row['waktu'])) $waktu = $row['waktu'];
            elseif (isset($row['waktu_dibuat'])) $waktu = $row['waktu_dibuat'];
            elseif (isset($row['tanggal'])) $waktu = $row['tanggal'];

            $riwayat_array[] = [
                "operasi" => isset($row['operasi']) ? $row['operasi'] : 'Tidak ada kolom operasi',
                "hasil" => isset($row['hasil']) ? $row['hasil'] : 'Tidak ada kolom hasil',
                "waktu_dibuat" => $waktu
            ];
        }

        // Balik urutan array di sisi PHP agar data terbaru tetap muncul di paling atas
        $riwayat_array = array_reverse($riwayat_array);

        echo json_encode(["status" => "success", "data" => $riwayat_array]);
    } else {
        echo json_encode(["status" => "error", "message" => "Parameter id_perangkat tidak ditemukan"]);
    }

} catch (Throwable $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Terjadi kesalahan di PHP: " . $e->getMessage()
    ]);
}
?>