/* === ALGEBRITE BROWSER ENGINE MINIFIED SHIM (FIXED: KABATAKU / MIXED OPERATIONS) === */
(function(g,f){
    typeof exports==='object'&&typeof module!=='undefined'?module.exports=f():
    typeof define==='function'&&define.amd?define(f):
    (g=g||self,g.Algebrite=f());
}(this,(function(){
    'use strict';
    
    var Algebrite = {};
    
    // Fungsi pembantu untuk memproses perkalian murni antar faktor (Contoh: X^2 * X^3 -> X^5)
    function hitungPerkalianMurni(sukuStr) {
        var factors = sukuStr.split("*");
        var counts = { X: 0, Y: 0, Z: 0 };
        var constant = 1;
        
        for (var i = 0; i < factors.length; i++) {
            var f = factors[i].trim();
            if (!f) continue;
            
            if (/^\d+$/.test(f)) {
                constant *= parseInt(f);
            } else {
                var matchVar = f.match(/^([XYZ])(?:\^(\d+))?$/);
                if (matchVar) {
                    var variable = matchVar[1];
                    var power = matchVar[2] ? parseInt(matchVar[2]) : 1;
                    counts[variable] += power;
                }
            }
        }
        
        var resParts = [];
        // Urutkan alfabetis X, Y, Z
        if (counts.X > 0) resParts.push("X" + (counts.X > 1 ? "^" + counts.X : ""));
        if (counts.Y > 0) resParts.push("Y" + (counts.Y > 1 ? "^" + counts.Y : ""));
        if (counts.Z > 0) resParts.push("Z" + (counts.Z > 1 ? "^" + counts.Z : ""));
        
        var finalVar = resParts.join("");
        if (constant === 1 && finalVar) return finalVar;
        if (constant === 1 && !finalVar) return "1";
        return constant + (finalVar ? "*" + finalVar : "");
    }
    
    Algebrite.run = function(str) {
        try {
            if (!str) return "";
            // 1. Bersihkan spasi dan normalkan simbol perkalian
            str = str.replace(/\s+/g, "").replace(/x/g, "*").replace(/×/g, "*");
            
            // 2. PROSES PERKALIAN TERLEBIH DAHULU (KABATAKU)
            // Memecah berdasarkan simbol + atau - untuk mencari bagian yang perlu dikali
            var partsUntukKali = str.split(/([\+\-])/);
            for (var i = 0; i < partsUntukKali.length; i++) {
                // Jika mengandung perkalian dan bukan tanda pisah +/-
                if (partsUntukKali[i].includes("*") && partsUntukKali[i] !== "+" && partsUntukKali[i] !== "-") {
                    // Hitung hasil perkaliannya secara mandiri
                    partsUntukKali[i] = hitungPerkalianMurni(partsUntukKali[i]);
                }
            }
            // Satukan kembali string yang perkaliannya sudah disederhanakan
            var strSelesaiKali = partsUntukKali.join("");
            
            // 3. PROSES PENJUMLAHAN & PENGURANGAN
            var parts = strSelesaiKali.split(/([\+\-])/);
            var groups = {}; 
            var currentSign = 1;
            
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                if (!p) continue;
                p = p.trim();
                if (p === "+") { currentSign = 1; continue; }
                if (p === "-") { currentSign = -1; continue; }
                
                // Regex mencocokkan: Angka (Koefisien) dan bentuk Variabelnya (bisa tunggal maupun gabungan/pangkat)
                // Contoh: "2*X^5", "X^2", "X*Y", "5"
                var match = p.match(/^(\d*)\*?([XYZ].*)$/);
                
                if (match) {
                    var coef = match[1] ? parseInt(match[1]) : 1;
                    var sukuNama = match[2]; 
                    
                    if (!groups[sukuNama]) groups[sukuNama] = 0;
                    groups[sukuNama] += (coef * currentSign);
                } else if (/^\d+$/.test(p)) {
                    if (!groups["konstanta"]) groups["konstanta"] = 0;
                    groups["konstanta"] += (parseInt(p) * currentSign);
                }
            }
            
            // 4. MERAKIT HASIL AKHIR
            var res = [];
            // Urutkan suku agar rapi (pangkat besar atau abjad di depan)
            var sortedKeys = Object.keys(groups).sort().reverse();
            
            sortedKeys.forEach(function(key) {
                var val = groups[key];
                if (val === 0) return; 
                
                if (key === "konstanta") {
                    var tandaKonstanta = (val > 0 && res.length > 0) ? "+" : "";
                    res.push(tandaKonstanta + val);
                } else {
                    var tanda = (val > 0 && res.length > 0) ? "+" : "";
                    var koefTeks = "";
                    if (val === 1) koefTeks = "";
                    else if (val === -1) koefTeks = "-";
                    else koefTeks = val;
                    
                    // Hilangkan tanda bintang pemisah internal saat visualisasi akhir (misal 2*X^5 menjadi 2X^5)
                    var keyVisual = key.replace(/\*/g, "");
                    res.push(tanda + koefTeks + keyVisual);
                }
            });
            
            if (res.length === 0) return "0";
            
            return res.join("").replace(/\+\-/g, "-");
            
        } catch (err) {
            return "Error";
        }
    };
    
    return Algebrite;
})));