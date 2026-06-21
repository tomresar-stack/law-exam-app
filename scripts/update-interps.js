
const https = require('https');
const fs = require('fs');

const TOTAL = 813;
const BASE_ID = 310181;

function get(url) {
  return new Promise((ok, no) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, r => {
      if ([301,302,307].includes(r.statusCode)) return get(r.headers.location).then(ok).catch(no);
      if (r.statusCode !== 200) { r.resume(); no(new Error('HTTP '+r.statusCode)); return; }
      let d = ''; r.setEncoding('utf8');
      r.on('data', c => d += c); r.on('end', () => ok(d)); r.on('error', no);
    }).on('error', no);
  });
}

function clean(h) {
  return h.replace(/<br\s*\/?>/gi,'\n').replace(/<\/p>/gi,'\n').replace(/<[^>]+>/g,'')
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/\r\n/g,'\n').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
}

function parseInterp(html) {
  const text = clean(html);
  const bi = text.indexOf('回列表');
  if (bi === -1) return { date:'', issue:'', mainText:'', reasoning:'' };
  const content = text.slice(bi);
  let date = '';
  const dm = content.match(/中華民國\s*(\d{2,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (dm) date = '民國 '+dm[1]+'年'+dm[2].padStart(2,'0')+'月'+dm[3].padStart(2,'0')+'日';
  const ii = content.indexOf('解釋爭點');
  const mi = content.indexOf('解釋文', ii > -1 ? ii + 4 : 0);
  const ri = content.indexOf('理由書', mi > -1 ? mi + 3 : 0);
  const ends = ['意見書','聲請書','確定終局裁判','解釋摘要','相關法令','其他公開','大法官會議主席'];
  function fe(s) { let e = content.length; for (const m of ends) { const p = content.indexOf(m, s); if (p > s && p < e) e = p; } return e; }
  let issue = '', mainText = '', reasoning = '';
  if (ii > -1 && mi > ii) issue = content.slice(ii+4, mi).trim();
  if (mi > -1) { mainText = content.slice(mi+3, ri > mi ? ri : fe(mi+3)).trim().replace(/^\s*\d+\s*/,'').trim(); }
  if (ri > -1) reasoning = content.slice(ri+3, fe(ri+3)).trim();
  if (!reasoning && mainText) {
    const di = mainText.indexOf('大法官會議主席');
    if (di > -1) mainText = mainText.slice(0, di).trim();
  }
  if (mainText.length > 4000) mainText = mainText.slice(0,4000)+'\n...（僅前4000字）';
  if (reasoning.length > 10000) reasoning = reasoning.slice(0,10000)+'\n...（僅前10000字）';
  return { date, issue, mainText, reasoning };
}

async function main() {
  console.log('📥 更新釋字資料...');
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync('interpretations.json', 'utf8')); } catch(e) {}
  const goodNums = new Set(existing.filter(e => e.mainText && e.mainText.length > 20).map(e => e.num));
  let results = [...existing.filter(e => e.mainText && e.mainText.length > 20)];
  let ok = goodNums.size, fail = 0;
  
  for (let num = 1; num <= TOTAL; num++) {
    if (goodNums.has(num)) continue;
    try {
      process.stdout.write('  第'+num+'號...');
      const html = await get('https://cons.judicial.gov.tw/docdata.aspx?fid=100&id='+(BASE_ID+num));
      const p = parseInterp(html);
      results.push({ num, date: p.date, issue: p.issue, mainText: p.mainText, reasoning: p.reasoning });
      if (p.mainText.length > 20) { ok++; process.stdout.write(' ✅\n'); }
      else process.stdout.write(' ⚠️\n');
    } catch(e) { 
      process.stdout.write(' ❌\n'); fail++;
      if (fail % 5 === 0) await new Promise(r => setTimeout(r, 15000));
    }
    if (num % 50 === 0) {
      results.sort((a,b) => a.num - b.num);
      fs.writeFileSync('interpretations.json', JSON.stringify(results, null, 2), 'utf8');
      console.log('  💾 已存 '+results.length+' 筆');
    }
    await new Promise(r => setTimeout(r, 500));
  }
  results.sort((a,b) => a.num - b.num);
  fs.writeFileSync('interpretations.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('🎉 釋字: '+ok+'/'+TOTAL+' 筆有內容');
}

main().catch(e => console.error(e));
