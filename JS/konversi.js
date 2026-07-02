// === 1. SELEKTOR ELEMEN GLOBAL ===
const truthEkspresi = document.querySelector("[data-truth-ekspresi]") || document.getElementById("ekspresi"); 
const truthStepsContainer = document.querySelector("[data-truth-steps]");
const truthTableContainer = document.querySelector("[data-truth-table]");

// Biarkan fungsi keypad ini berada di scope global agar bisa dipanggil oleh onclick HTML
function inputLogika(nilai) {
    if (truthEkspresi) {
        truthEkspresi.value = (truthEkspresi.value + nilai).replace(/\s+/g, " ");
        hitungTruthTable(); // Otomatis update tabel tiap klik
    }
}

function clearLogika() {
    if (truthEkspresi) {
        truthEkspresi.value = "";
        hitungTruthTable();
    }
}

function tambahHurufManual() {
    const manualInput = document.getElementById("manualHuruf");
    if (!manualInput) return;
    const huruf = manualInput.value.trim().toUpperCase();
    if (huruf && /^[A-Z]$/.test(huruf)) {
        inputLogika(huruf);
        manualInput.value = "";
    } else {
        alert("Masukkan satu huruf saja (A-Z)!");
    }
}

// Menghitung & Render Tabel Kebenaran (Scope Global)
function hitungTruthTable() {
    let ekspresiRaw = truthEkspresi ? truthEkspresi.value.trim() : "";
    
    if (!ekspresiRaw) {
        if (truthStepsContainer) truthStepsContainer.innerHTML = "";
        if (truthTableContainer) truthTableContainer.innerHTML = `<div style="text-align:center; color:#475569; margin-top:20px;">Silakan klik tombol di atas untuk menyusun ekspresi...</div>`;
        return;
    }

    let ekspresi = ekspresiRaw.toUpperCase();

    // === DETEKSI VARIABEL DINAMIS DARI A SAMPAI Z ===
    let semuaHuruf = ekspresi.match(/\b[A-Z]\b/g) || [];
    let varUnik = [...new Set(semuaHuruf)].sort();

    // Batasi maksimal 5 variabel unik demi keamanan performa rendering
    if (varUnik.length > 5) {
        if (truthTableContainer) {
            truthTableContainer.innerHTML = `<div style="text-align:center; color:#f43f5e; margin-top:20px;">Maksimal 5 variabel berbeda dalam satu rumus agar browser tidak crash! (Variabel terdeteksi: ${varUnik.join(', ')})</div>`;
        }
        return;
    }

    // Pemecahan langkah-langkah penjelas logis secara dinamis
    let langkahSuku = [];
    let penjelasan = [];

    if (ekspresi.includes("NOT")) {
        langkahSuku.push("NOT " + (varUnik[0] || "P"));
        penjelasan.push("<b>Langkah - Negasi (NOT):</b> Membalikkan nilai kebenaran. B menjadi S, S menjadi B.");
    }
    if (ekspresi.includes("AND")) {
        langkahSuku.push((varUnik[0] || "P") + " AND " + (varUnik[1] || "Q"));
        penjelasan.push("<b>Langkah - Konjungsi (AND):</b> Menghitung nilai AND. Hanya bernilai <b>B</b> jika semua variabel bernilai B.");
    }
    if (ekspresi.includes("OR")) {
        langkahSuku.push((varUnik[0] || "P") + " OR " + (varUnik[1] || "Q"));
        penjelasan.push("<b>Langkah - Disjungsi (OR):</b> Menghitung nilai OR. Bernilai <b>B</b> jika salah satu atau semua variabel bernilai B.");
    }

    if (!langkahSuku.includes(ekspresi)) {
        langkahSuku.push(ekspresi);
        penjelasan.push(`<b>Langkah Akhir:</b> Mengevaluasi ekspresi utuh berdasarkan aturan tabel kebenaran.`);
    }

    // Render Penjelasan Langkah
    if (truthStepsContainer) {
        let stepsHtml = `<div style="background: rgba(99, 102, 241, 0.04); border-left: 4px solid #6366f1; padding: 15px; border-radius: 8px; margin-top: 15px;">`;
        stepsHtml += `<h4 style="color:#ffffff; margin-top:0; margin-bottom:10px; font-size:0.9rem;">Analisis Penjelasan Operasi:</h4>`;
        penjelasan.forEach(p => { stepsHtml += `<p style="font-size:0.85rem; color:#cbd5e1; margin: 6px 0; line-height:1.4;">${p}</p>`; });
        stepsHtml += `</div>`;
        truthStepsContainer.innerHTML = stepsHtml;
    }

    // ENGINE EVALUATOR LOGIKA UNTUK VARIABEL APA SAJA
    function evalLogikaDinamis(str, varMap) {
        let s = str;
        for (let namaVar in varMap) {
            let regex = new RegExp(`\\b${namaVar}\\b`, 'g');
            s = s.replace(regex, varMap[namaVar] ? "true" : "false");
        }
        
        s = s.replace(/NOT\s+true/g, "false").replace(/NOT\s+false/g, "true");
        s = s.replace(/AND/g, "&&").replace(/OR/g, "||");
        
        if (s.includes("XOR")) {
            let p = s.split("XOR");
            try { return eval(p[0]) !== eval(p[1]); } catch(e) { return false; }
        }
        if (s.includes("NAND")) {
            let p = s.split("NAND");
            try { return !(eval(p[0]) && eval(p[1])); } catch(e) { return false; }
        }
        if (s.includes("NOR")) {
            let p = s.split("NOR");
            try { return !(eval(p[0]) || eval(p[1])); } catch(e) { return false; }
        }
        if (s.includes("XNOR")) {
            let p = s.split("XNOR");
            try { return eval(p[0]) === eval(p[1]); } catch(e) { return false; }
        }

        try { return eval(s); } catch (e) { return false; }
    }

    function formatBS(booleanVal) {
        return booleanVal 
            ? `<b style="color:#2dd4bf; font-weight:700;">B</b>` 
            : `<b style="color:#f43f5e; font-weight:700;">S</b>`;
    }

    // ALGORITMA GENERATE COMBINATION BINARY
    let totalBaris = Math.pow(2, varUnik.length);
    let barisKombinasi = [];
    
    for (let i = 0; i < totalBaris; i++) {
        let objekKombinasi = {};
        for (let j = 0; j < varUnik.length; j++) {
            objekKombinasi[varUnik[j]] = (i >> (varUnik.length - 1 - j)) & 1 ? false : true;
        }
        barisKombinasi.push(objekKombinasi);
    }

    // GENERATE STRUKTUR TABEL DINAMIS
    if (truthTableContainer) {
        let htmlTable = `<table border="1" style="width:100%; border-collapse: collapse; text-align:center; color:white; border-color:rgba(255,255,255,0.1); margin-top:15px;">`;
        
        // Header Utama
        htmlTable += `<tr>`;
        varUnik.forEach(v => { htmlTable += `<th>${v}</th>`; });
        langkahSuku.forEach(suku => {
            htmlTable += `<th style="background: rgba(56, 189, 248, 0.05); color:#38bdf8; font-size:0.8rem;">${suku}</th>`;
        });
        htmlTable += `</tr>`;

        // Body Tabel
        barisKombinasi.forEach(varMap => {
            htmlTable += `<tr>`;
            varUnik.forEach(v => { htmlTable += `<td>${formatBS(varMap[v])}</td>`; });
            langkahSuku.forEach(suku => {
                let res = evalLogikaDinamis(suku, varMap);
                htmlTable += `<td>${formatBS(res)}</td>`;
            });
            htmlTable += `</tr>`;
        });
        
        htmlTable += `</table>`;
        truthTableContainer.innerHTML = htmlTable;
    }
}


document.addEventListener("DOMContentLoaded", function () {
    // === 2. DATA SATUAN KONVERSI (LINEAR) ===
    const dataSatuan = {
        panjang: { km: 1000, m: 1, cm: 0.01, mm: 0.001 },
        berat: { kg: 1000, g: 1, mg: 0.001 },
        suhu: { C: "C", F: "F", K: "K" },
        area: { "km²": 1000000, "m²": 1, "cm²": 0.0001 },
        volume: { "m³": 1000, liter: 1, ml: 0.001 },
        waktu: { jam: 3600, menit: 60, detik: 1 },
        data: { GB: 1024, MB: 1, KB: 1 / 1024 },
        kecepatan: { "km/jam": 1 / 3.6, "m/s": 1 },
        mata_uang: { USD: 16000, EUR: 17500, IDR: 1 }
    };

    let kategoriAktif = "panjang";

    // === 3. SELEKTOR ELEMEN FORM / TAB ===
    const tabs = document.querySelectorAll("[data-tab-kategori]");
    const formLinear = document.querySelector("[data-form-linear]");
    const panelsKalkulator = document.querySelectorAll("[data-panel-konversi]");
    
    const inputNilai = document.querySelector("[data-input-nilai]");
    const selectDari = document.querySelector("[data-select-dari]");
    const selectKe = document.querySelector("[data-select-ke]");
    const hasilLinear = document.querySelector("[data-konversi-hasil]");
    const btnSwap = document.querySelector("[data-konversi-swap]");

    const basisInput = document.querySelector("[data-basis-input]");
    const basisDari = document.querySelector("[data-basis-dari]");
    const basisKe = document.querySelector("[data-basis-ke]");
    const basisHasil = document.querySelector("[data-basis-hasil]");

    const diskonHarga = document.querySelector("[data-diskon-harga]");
    const diskonPersen = document.querySelector("[data-diskon-persen]");
    const diskonHasil = document.querySelector("[data-diskon-hasil]");

    const imtBerat = document.querySelector("[data-imt-berat]");
    const imtTinggi = document.querySelector("[data-imt-tinggi]");
    const imtHasil = document.querySelector("[data-imt-hasil]");

    const truthOperator = document.querySelector("[data-truth-operator]");

    // === 4. LOGIKA PERPINDAHAN TAB / PANEL ===
    tabs.forEach(tab => {
        tab.addEventListener("click", function () {
            tabs.forEach(t => t.classList.remove("active"));
            this.classList.add("active");

            kategoriAktif = this.getAttribute("data-tab-kategori");
            const panelKhusus = document.querySelector(`[data-panel-konversi="${kategoriAktif}"]`);

            if (panelKhusus) {
                if (formLinear) formLinear.style.display = "none";
                panelsKalkulator.forEach(p => p.style.display = "none");
                panelKhusus.style.display = "block";
                
                if (kategoriAktif === "truth_table") hitungTruthTable();
            } else {
                panelsKalkulator.forEach(p => p.style.display = "none");
                if (formLinear) formLinear.style.display = "block";
                isiOpsiSelect(kategoriAktif);
                hitungLinear();
            }
        });
    });

    // === 5. FUNGSI FORM LINEAR ===
    function isiOpsiSelect(kategori) {
        if(!selectDari || !selectKe) return;
        selectDari.innerHTML = "";
        selectKe.innerHTML = "";
        const opsi = Object.keys(dataSatuan[kategori]);
        opsi.forEach((satuan, index) => {
            let opt1 = new Option(satuan, satuan);
            let opt2 = new Option(satuan, satuan);
            if (index === 1 && opsi.length > 1) opt2.selected = true; 
            selectDari.add(opt1);
            selectKe.add(opt2);
        });
    }

    function hitungLinear() {
        if(!inputNilai || !hasilLinear) return;
        const nilai = parseFloat(inputNilai.value);
        if (isNaN(nilai)) {
            hasilLinear.innerText = "Masukkan nilai...";
            return;
        }

        const dari = selectDari.value;
        const ke = selectKe.value;

        if (kategoriAktif === "suhu") {
            hasilLinear.innerHTML = hitungSuhu(nilai, dari, ke);
            return;
        }

        const dalamBaseUnit = nilai * dataSatuan[kategoriAktif][dari];
        const nilaiAkhir = dalamBaseUnit / dataSatuan[kategoriAktif][ke];
        hasilLinear.innerHTML = `${nilai} ${dari} = <span>${Number(nilaiAkhir.toFixed(5))}</span> ${ke}`;
    }

    function hitungSuhu(val, dari, ke) {
        let c = val;
        if (dari === "F") c = (val - 32) * 5/9;
        if (dari === "K") c = val - 273.15;

        let hasil = c;
        if (ke === "F") hasil = (c * 9/5) + 32;
        if (ke === "K") hasil = c + 273.15;

        return `${val} °${dari} = <span>${Number(hasil.toFixed(2))}</span> °${ke}`;
    }

    if (btnSwap) {
        btnSwap.addEventListener("click", function () {
            const temp = selectDari.value;
            selectDari.value = selectKe.value;
            selectKe.value = temp;
            hitungLinear();
        });
    }

    if (inputNilai) inputNilai.addEventListener("input", hitungLinear);
    if (selectDari) selectDari.addEventListener("change", hitungLinear);
    if (selectKe) selectKe.addEventListener("change", hitungLinear);

    // === 6. FUNGSI PANEL KHUSUS ===
    function hitungBasis() {
        if(!basisInput || !basisHasil) return;
        const input = basisInput.value.trim();
        if (!input) { basisHasil.innerText = "Masukkan angka..."; return; }
        
        try {
            const dariBase = parseInt(basisDari.value);
            const keBase = parseInt(basisKe.value);
            const desimal = parseInt(input, dariBase);
            
            if (isNaN(desimal)) throw new Error();
            
            let hasil = desimal.toString(keBase).toUpperCase();
            basisHasil.innerHTML = `Hasil: <span>${hasil}</span>`;
        } catch (e) {
            basisHasil.innerText = "Format angka tidak valid untuk basis asal!";
        }
    }
    if (basisInput) {
        [basisInput, basisDari, basisKe].forEach(el => el.addEventListener("input", hitungBasis));
        [basisDari, basisKe].forEach(el => el.addEventListener("change", hitungBasis));
    }

    function hitungDiskon() {
        if(!diskonHarga || !diskonHasil) return;
        const harga = parseFloat(diskonHarga.value);
        const persen = parseFloat(diskonPersen.value) || 0;
        
        if (isNaN(harga) || harga < 0) { diskonHasil.innerText = "Masukkan harga awal..."; return; }
        
        const potongan = harga * (persen / 100);
        const hargaAkhir = harga - potongan;
        
        diskonHasil.innerHTML = `Hemat: <span>Rp ${potongan.toLocaleString("id-ID")}</span><br>Harga Akhir: <span>Rp ${hargaAkhir.toLocaleString("id-ID")}</span>`;
    }
    if (diskonHarga) [diskonHarga, diskonPersen].forEach(el => el.addEventListener("input", hitungDiskon));

    function hitungIMT() {
        if(!imtBerat || !imtHasil) return;
        const berat = parseFloat(imtBerat.value);
        const tinggi = parseFloat(imtTinggi.value) / 100; 
        
        if (isNaN(berat) || isNaN(tinggi) || tinggi === 0) { imtHasil.innerText = "Masukkan berat dan tinggi badan..."; return; }
        
        const imt = berat / (tinggi * tinggi);
        let ket = "";
        if (imt < 18.5) ket = "Kurus (Kurang berat badan)";
        else if (imt < 25) ket = "Normal (Ideal)";
        else if (imt < 30) ket = "Kelebihan berat badan";
        else ket = "Obesitas";
        
        imtHasil.innerHTML = `Skor IMT: <span>${imt.toFixed(1)}</span> (${ket})`;
    }
    if (imtBerat) [imtBerat, imtTinggi].forEach(el => el.addEventListener("input", hitungIMT));

    // Input listen manual ke input text kebenaran jika diketik keyboard langsung
    if (truthEkspresi) truthEkspresi.addEventListener("input", hitungTruthTable);

    // Inisialisasi awal
    isiOpsiSelect("panjang");
});