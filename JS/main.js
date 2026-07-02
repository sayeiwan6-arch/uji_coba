let langkahPengerjaan = "";

// === FUNGSI UTILS UNTUK HITUNGAN SAINTIFIK ===
// Wajib ada di paling atas agar bisa dibaca oleh fungsi calculate()
function sinDeg(x) { return Math.sin(x * Math.PI / 180); }
function cosDeg(x) { return Math.cos(x * Math.PI / 180); }
function tanDeg(x) { return Math.tan(x * Math.PI / 180); }
function logBase10(x) { return Math.log10(x); }
function lnBaseE(x) { return Math.log(x); }

function clearCalc() {
    // Menghapus total seluruh teks yang ada di dalam layar monitor
    document.getElementById("calcDisplay").value = "";
    
    // Opsional: Jika kamu punya variabel riwayat pengerjaan, kosongkan juga
    if (typeof langkahPengerjaan !== 'undefined') {
        langkahPengerjaan = "";
    }
}

function toggleSign() {
    let display = document.getElementById("calcDisplay");
    let currentVal = display.value;

    if (currentVal === "") return;

    let targetText = currentVal;
    let operatorSufiks = "";

    const operators = ["+", "-", "x", "÷", "*", "/"];
    if (operators.includes(currentVal.slice(-1))) {
        operatorSufiks = currentVal.slice(-1); 
        targetText = currentVal.slice(0, -1);   
    }

    let lastOperatorIndex = Math.max(
        targetText.lastIndexOf("+"),
        targetText.lastIndexOf("-"),
        targetText.lastIndexOf("x"),
        targetText.lastIndexOf("÷"),
        targetText.lastIndexOf("*"),
        targetText.lastIndexOf("/")
    );

    let newVal = "";

    if (lastOperatorIndex === -1) {
        if (targetText.startsWith("(-") && targetText.endsWith(")")) {
            newVal = targetText.slice(2, -1);
        } else {
            newVal = `(-${targetText})`;
        }
    } else {
        let prefix = targetText.slice(0, lastOperatorIndex + 1);
        let suffix = targetText.slice(lastOperatorIndex + 1);

        if (suffix.startsWith("(-") && suffix.endsWith(")")) {
            newVal = prefix + suffix.slice(2, -1);
        } else {
            newVal = prefix + `(-${suffix})`;
        }
    }

    display.value = newVal + operatorSufiks;
}

function percent() {
    let display = document.getElementById("calcDisplay");
    display.value += "/100";
}

function appendToCalc(value) {
    let display = document.getElementById("calcDisplay");
    let currentVal = display.value;

    if (currentVal === "Error" || currentVal === "NaN") {
        currentVal = "";
        display.value = "";
    }

    if (value === "delete") {
        display.value = currentVal.slice(0, -1);
        return;
    }

    const operators = ["+", "-", "*", "÷", "/", "x", "×"];
    const variables = ["X", "Y", "Z"]; // Daftar variabel aljabar

    // --- VALIDASI OPERATOR ---
    if (operators.includes(value)) {
        if (currentVal === "") {
            if (value === "-") {
                display.value += value;
            }
            return; 
        }

        let lastChar = currentVal.slice(-1);
        if (operators.includes(lastChar)) {
            display.value = currentVal.slice(0, -1) + (value === "*" || value === "x" ? "×" : value);
            return;
        }
    }

    // --- VALIDASI VARIABEL (X, Y, Z) AGAR TIDAK DUPLIKAT ---
    if (variables.includes(value)) {
        let lastChar = currentVal.slice(-1);
        // Jika huruf yang ditekan sama dengan huruf terakhir di layar, abaikan (return)
        if (lastChar === value) {
            return;
        }
    }

    // Konversi visual untuk tombol perkalian
    if (value === "*" || value === "x") {
        display.value += "×";
    } else {
        display.value += value;
    }
}

function calculate() {
    let display = document.getElementById("calcDisplay");
    let soalAwal = "";
    let result = "";

    try {
        let expression = display.value;
        if (expression === "") return;

        // 🛠️ AUTOMATIC PARENTHESES CLOSER
        let openBrackets = (expression.match(/\(/g) || []).length;
        let closeBrackets = (expression.match(/\)/g) || []).length;

        if (openBrackets > closeBrackets) {
            let missingBrackets = openBrackets - closeBrackets;
            expression += ")".repeat(missingBrackets);
        }

        soalAwal = expression;

        // 🔒 TAHAP 1: PEMBERSIHAN OPERATOR VISUAL & STANDARISASI VARIABEL
        // Ubah semua x kecil menjadi X kapital agar seragam
        let fixedExpression = expression.replace(/x/g, "X"); 
        fixedExpression = fixedExpression.replace(/×/g, "*");
        fixedExpression = fixedExpression.replace(/÷/g, "/");

        // 🔒 TAHAP 2: KOREKSI TOTAL PERKALIAN IMPLISIT VARIABEL (X, Y, Z)
        fixedExpression = fixedExpression.replace(/(\d)([XYZ])/g, "$1*$2");
        fixedExpression = fixedExpression.replace(/([XYZ])(\d)/g, "$1*$2");
        fixedExpression = fixedExpression.replace(/([XYZ])([XYZ])/g, "$1*$2");
        fixedExpression = fixedExpression.replace(/([XYZ])\(/g, "$1*(");
        fixedExpression = fixedExpression.replace(/\)([XYZ])/g, ")*$1");
        fixedExpression = fixedExpression.replace(/(\d)\(/g, "$1*(");
        fixedExpression = fixedExpression.replace(/\)(\d)/g, ")*$1");
        fixedExpression = fixedExpression.replace(/\)\(/g, ")*(");
        fixedExpression = fixedExpression.replace(/([XYZ\d])(sin|cos|tan|log|ln|π|√)/g, "$1*$2");

        // 🔒 TAHAP 3: TERJEMAHKAN FUNGSI SAINTIFIK SECARA GLOBAL
        fixedExpression = fixedExpression.replace(/π/g, "Math.PI");
        fixedExpression = fixedExpression.replace(/√\(/g, "Math.sqrt(");
        fixedExpression = fixedExpression.replace(/sin\(/g, "sinDeg(");
        fixedExpression = fixedExpression.replace(/cos\(/g, "cosDeg(");
        fixedExpression = fixedExpression.replace(/tan\(/g, "tanDeg(");
        fixedExpression = fixedExpression.replace(/log\(/g, "logBase10(");
        fixedExpression = fixedExpression.replace(/ln\(/g, "Math.log(");

        // 🔒 TAHAP 4: PILIH JALUR EKSEKUSI (ALJABAR VS ANGKA BIASA)
        let hasVariable = /[XYZ]/.test(fixedExpression);

        if (hasVariable) {
            // JALUR ALJABAR: Kirim murni dengan tanda '^' ke Algebrite tiruan yang baru
            let algebriteResult = Algebrite.run(fixedExpression);
            result = algebriteResult.toString(); 
        } else {
            // JALUR ANGKA BIASA: Ubah '^' menjadi Math.pow hanya jika TIDAK ADA variabel
            while (fixedExpression.includes('^')) {
                fixedExpression = fixedExpression.replace(/([0-9.]+|\([^)]+\))\^([0-9.]+|\([^)]+\))/, "Math.pow($1,$2)");
            }
            result = eval(fixedExpression);

            if (typeof result === "number" && !Number.isInteger(result)) {
                result = parseFloat(result.toFixed(10)); 
            }
        }

        display.value = result;

        // 📋 TAHAP 5: PEMBUATAN TEKS CARA KERJA (EDUPANEL)
        let eduPanel = document.getElementById("eduArt");
        if (eduPanel) {
            let langkahTeks = hasVariable 
                ? `<p>✨ <b>Metode: Aljabar Simbolik (Algebrite)</b></p><p>1. Membaca persamaan: <code>${soalAwal}</code></p><p>2. Memproses perkalian pangkat sejenis.</p>`
                : `<p>🔢 <b>Metode: Hitungan Aritmatika (Eval)</b></p><p>1. Membaca operasi angka: <code>${soalAwal}</code></p>`;

            eduPanel.innerHTML = `
                <div class="edu-content" style="animation: fadeIn 0.3s ease;">
                    <h3 style="margin-top:0; color:#0056b3; border-bottom: 2px solid #007bff; padding-bottom: 5px;">📋 Cara Kerja Sistem</h3>
                    <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
                        <tr style="background:#f8f9fa;">
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight:bold; width:30%;">Soal Asli</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6;"><code>${soalAwal}</code></td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight:bold;">Langkah Proses</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6; line-height: 1.6;">${langkahTeks}</td>
                        </tr>
                        <tr style="background:#e2f0d9;">
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight:bold; color:#2e7d32;">Hasil Akhir</td>
                            <td style="padding: 8px; border: 1px solid #dee2e6; font-weight:bold; color:#2e7d32;">${result}</td>
                        </tr>
                    </table>
                </div>`;
        }

        if (soalAwal !== "" && result !== "") {
            const eventSimpan = new CustomEvent("simpanKeDatabase", {
                detail: { operasi: soalAwal, hasil: result }
            });
            window.dispatchEvent(eventSimpan);
        }

    } catch (err) {
        console.error("Terjadi error saat menghitung:", err);
        display.value = "Error";
    }
}

function toggleEdukasi() {
    const eduPanel = document.getElementById("eduArt");

    if (eduPanel.style.display === "none" || eduPanel.style.display === "") {
        if (langkahPengerjaan === "") {
            eduPanel.innerHTML = "<p>Silakan lakukan perhitungan terlebih dahulu.</p>";
        } else {
            eduPanel.innerHTML = `<h3>Cara Pengerjaan :</h3><p>${langkahPengerjaan}</p>`;
        }
        eduPanel.style.display = "block";
    } else {
        eduPanel.style.display = "none";
    }
}

// === FITUR INPUT KEYBOARD ===
document.addEventListener("keydown", function(event) {
    let key = event.key;
    const validKeys = [
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", 
        "+", "-", ".", "(", ")", "^", "X", "Y", "Z" // Semuanya sudah KAPITAL!
    ];

    if (validKeys.includes(key)) {
        event.preventDefault();
        appendToCalc(key);
    }   
    else if (key === "*") {
        event.preventDefault();
        appendToCalc("x");
    }   
    else if (key === "/") {
        event.preventDefault();
        appendToCalc("÷");
    }   
    else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    }   
    else if (key === "Backspace") {
        event.preventDefault();
        appendToCalc("delete");
    }   
    else if (key === "Escape") {
        event.preventDefault();
        clearCalc();
    }
    else if (key === "*") {
    event.preventDefault();
    appendToCalc("x"); // Harus mengirim "x" kecil
    }
});

function insertPower(powerType) {
    let display = document.getElementById("calcDisplay");
    if (display.value !== "") {
        display.value += powerType;
    }
}

function tampilkanCaraKerja() {
    let display = document.getElementById("calcDisplay");
    let panel = document.getElementById("eduArt"); // Tempat memunculkan teks
    
    // Jika panelnya tidak sengaja tersembunyi lewat CSS, kita munculkan dulu
    if (panel) {
        panel.style.display = "block";
        
        let ekspresi = display.value;
        if (ekspresi === "" || ekspresi === "Error") {
            panel.innerHTML = "<p style='color: red;'>Silakan ketik rumus dan hitung terlebih dahulu!</p>";
            return;
        }

        // Cek apakah rumusnya mengandung Aljabar Kapital X, Y, Z
        let isAljabar = /[XYZ]/.test(ekspresi);

        panel.innerHTML = `
            <div style="line-height: 1.8; font-family: sans-serif; padding: 10px;">
                <h4 style="margin-top: 0; color: #007bff;">Analisis Langkah Kerja:</h4>
                <p><b>Input Layar:</b> <code style="background: rgba(139, 92, 246, 0.1); padding: 2px 6px; border-radius: 4px;">${ekspresi}</code></p>
                <p><b>Jenis Perhitungan:</b> ${isAljabar ? "Aljabar Simbolik (Diproses oleh Algebrite)" : "Matematika Standar (Diproses oleh Eval)"}</p>
                <hr style="border: 0.5px solid rgba(139, 92, 246, 0.1);">
                <p style="color: green; font-weight: bold;">Status: Berhasil dianalisis!</p>
            </div>
        `;
    }
}

function toggleScientificMode() {
    const sciSection = document.getElementById('sciSection');
    const toggleBtn = document.getElementById('toggleSciBtn');
    const calcBox = document.querySelector('.calc-box'); // Mengambil kotak hitam utama
    
    if (sciSection.style.display === 'none' || sciSection.style.display === '') {
        sciSection.style.display = 'grid';        // Tampilkan tombol Sci
        calcBox.classList.add('sci-active');       // 🛠️ Efek melebarkan kotak hitam ke samping
        toggleBtn.classList.add('active');         // Tombol berubah biru
        toggleBtn.innerText = 'Mode Biasa';
    } else {
        sciSection.style.display = 'none';        // Sembunyikan tombol Sci
        calcBox.classList.remove('sci-active');    // 🛠️ Kembalikan ukuran kotak hitam semula
        toggleBtn.classList.remove('active');      // Kembalikan warna tombol semula
        toggleBtn.innerText = 'Mode Sci';
    }
}