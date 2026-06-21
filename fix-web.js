// fix-web.js - 修復收藏/筆記/法條連結
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 修復1: 收藏讀取
html = html.replace(
  "let bm=JSON.parse(localStorage.getItem('bm')||'[]')",
  "let bm=[];try{bm=JSON.parse(localStorage.getItem('lawapp_bm')||'[]')}catch(e){}"
);
html = html.replace(
  "let nt=JSON.parse(localStorage.getItem('nt')||'{}')",
  "let nt={};try{nt=JSON.parse(localStorage.getItem('lawapp_nt')||'{}')}catch(e){}"
);

// 修復2: 收藏儲存
html = html.replace(
  "localStorage.setItem('bm',JSON.stringify(bm))",
  "localStorage.setItem('lawapp_bm',JSON.stringify(bm))"
);
html = html.replace(
  "localStorage.setItem('nt',JSON.stringify(nt))",
  "localStorage.setItem('lawapp_nt',JSON.stringify(nt))"
);

// 修復3: 法條連結 - 支援所有法規
html = html.replace(
  "const lm=ref.match(/^(民法|刑法|憲法|行政程序法)/)",
  "const lm=ref.match(/^(民法|刑法|憲法|憲法增修條文|行政程序法|行政訴訟法|行政罰法|行政執行法|民事訴訟法|刑事訴訟法|強制執行法|訴願法|國家賠償法|勞動基準法|著作權法|商標法|專利法|營業秘密法|通訊保障及監察法|貪污治罪條例|公司法|家庭暴力防治法|公務人員任用法)/)"
);

// 修復4: 搜尋範圍也擴大
html = html.replace(
  /\((?:民法\|刑法\|憲法\|行政程序法)\)\?第/g,
  "(?:民法|刑法|憲法|行政程序法|行政訴訟法|行政罰法|民事訴訟法|刑事訴訟法|強制執行法|訴願法|國家賠償法|勞動基準法)?第"
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('✅ 修復完成！');
console.log('執行: git add . && git commit -m "修復收藏筆記連結" && git push');