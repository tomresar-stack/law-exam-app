const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// 修復1: 法條跳轉 - 處理「之」（第153條之3 → 153-3）
h = h.replace(
  "var np=ref.replace(foundLaw,'').replace(/第/,'').replace(/條.*/,'');",
  "var zhi='';var zhiM=ref.match(/條之([\\d一二三四五六七八九十]+)/);if(zhiM)zhi='-'+cn2n(zhiM[1]);var np=ref.replace(foundLaw,'').replace(/第/,'').replace(/條.*/,'');"
);
h = h.replace(
  "np=cn2n(np);",
  "np=cn2n(np)+zhi;"
);

// 修復2: 手機滑軌 - 改用大按鈕
h = h.replace(
  '.rail span{font-size:9px;color:var(--pri);font-weight:700;cursor:pointer;padding:1px 0}',
  '.rail span{font-size:11px;color:var(--pri);font-weight:700;cursor:pointer;padding:4px 2px;min-height:16px;-webkit-tap-highlight-color:rgba(108,92,231,0.2)}'
);

// 修復3: 滑軌位置調整手機
h = h.replace(
  '.rail{width:36px;position:fixed;right:4px;top:170px;bottom:80px;',
  '.rail{width:44px;position:fixed;right:0;top:170px;bottom:20px;'
);

fs.writeFileSync('index.html', h, 'utf8');
console.log('✅ 修復完成！');