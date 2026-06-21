const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// 在 </script> 前面插入中文數字轉換 + 修復 or 函式
const fix = `
function cn2n(s){
  if(!s||/^\\d+$/.test(s))return s;
  var m={零:0,一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10,百:100};
  var r=0,c=0;
  for(var i=0;i<s.length;i++){var v=m[s[i]];if(v===undefined)continue;if(v===100){r+=(c||1)*100;c=0}else if(v===10){r+=(c||1)*10;c=0}else c=v}
  return String(r+c);
}
`;

// 替換 or 函式
const oldOr = h.indexOf('function or(');
if (oldOr > -1) {
  const end = h.indexOf('\n', h.indexOf('}', h.indexOf('if(f)ol(f.id)', oldOr)));
  const newOr = `function or(ref,ln){
var lm=ref.match(/^(\\S+法|\\S+條例)/);
var sl=lm?lm[1]:ln;
var np=ref.replace(/^(?:\\S+法|\\S+條例)/,'').replace(/第/,'').replace(/條.*$/,'');
np=cn2n(np);
var f=L.find(function(l){
  if(l.lawName!==sl)return false;
  var an=l.articleNum.replace(/[^0-9\\-]/g,'');
  return an===np||an===np.replace(/-/g,'-');
});
if(!f&&!lm){f=L.find(function(l){var an=l.articleNum.replace(/[^0-9\\-]/g,'');return an===np})}
if(f)ol(f.id);
}`;
  h = h.slice(0, oldOr) + newOr + h.slice(end + 1);
}

// 插入 cn2n 函式
h = h.replace('document.addEventListener', fix + 'document.addEventListener');

fs.writeFileSync('index.html', h, 'utf8');
console.log('✅ 法條連結修復完成！');