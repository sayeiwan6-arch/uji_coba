<?php
    $host = "localhost";
    $username = "root";
    $password = ""; // Default XAMPP kosong
    $database = "kalkulator";

    $koneksi = mysqli_connect($host, $username, $password, $database);

    if (!$koneksi) {
        die("Koneksi ke database gagal: " . mysqli_connect_error());
    }
?>