
const https = require('https');
const fs = require('fs');

const LAWS = [
  { p: 'A0000001', n: '憲法' }, { p: 'A0000002', n: '憲法增修條文' },
  { p: 'B0000001', n: '民法' }, { p: 'C0000001', n: '刑法' },
  { p: 'B0010001', n: '民事訴訟法' }, { p: 'C0010001', n: '刑事訴訟法' },
  { p: 'A0030055', n: '行政程序法' }, { p: 'A0030154', n: '行政訴訟法' },
  { p: 'I0020004', n: '國家賠償法' }, { p: 'A0030010', n: '訴願法' },
  { p: 'A0030023', n: '行政執行法' }, { p: 'S0010034', n: '公務人員任用法' },
  { p: 'N0030001', n: '勞動基準法' }, { p: 'D0120132', n: '家庭暴力防治法' },
  { p: 'J0070017', n: '著作權法' }, { p: 'J0070001', n: '商標法' },
  { p: 'J0070007', n: '專利法' }, { p: 'J0080028', n: '營業秘密法' },
  { p: 'K0060044', n: '通訊保障及監察法' }, { p: 'C0000007', n: '貪污治罪條例' },
  { p: 'B0010004', n: '強制執行法' }, { p: 'A0030210', n: '行政罰法' },
];

function get(url) {
  return new Promise((ok, no) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      if ([301,302,307].includes(r.statusCode)) return get(r.headers.location).then(ok).catch(no);
      if (r.statusCode !== 200) { r.resume(); no(new Error('HTTP ' + r.statusCode)); return; }
      let d = ''; r.setEncoding('utf8');
      r.on('data', c => d += c); r.on('end', () => ok(d)); r.on('error', no);
    }).on('error', no);
  });
}

function sn(n) { return {'中華民國憲法':'憲法','中華民國憲法增修條文':'憲法增修條文','中華民國刑法':'刑法'}[n]||n; }

function parseContent(c) {
  if (!c || !c.trim()) return [{ item: '本文', text: '', indent: 0 }];
  let t = c.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const ls = t.split('\n').filter(l => l.trim());
  const nn = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五'];
  if (ls.length === 1) return [{ item: '本文', text: t.trim(), indent: 0 }];
  const isK = l => /^[一二三四五六七八九十]+、/.test(l.trim());
  const hasK = ls.some(l => isK(l));
  if (!hasK) return ls.map((l, i) => ({ item: '第' + (nn[i]||(i+1)) + '項', text: l.trim(), indent: 0 }));
  const result = [];
  let xc = 0;
  const xt = ls.filter(l => !isK(l)).length;
  for (const l of ls) {
    const t2 = l.trim();
    if (!t2) continue;
    if (isK(t2)) {
      const km = t2.match(/^([一二三四五六七八九十]+)、/);
      result.push({ item: '第' + (km?km[1]:'') + '款', text: t2, indent: 1 });
    } else {
      xc++;
      result.push({ item: xt===1 ? '本文' : '第'+(nn[xc-1]||xc)+'項', text: t2, indent: 0 });
    }
  }
  return result.length ? result : [{ item: '本文', text: t, indent: 0 }];
}

function kwx(c) {
  const ks = [];
  const ps = [[/損害賠償/,'損害賠償'],[/侵權行為/,'侵權行為'],[/意思表示/,'意思表示'],[/無效/,'無效'],[/撤銷/,'撤銷'],[/故意/,'故意'],[/過失/,'過失'],[/平等/,'平等權'],[/財產權/,'財產權'],[/比例原則/,'比例原則'],[/行政處分/,'行政處分'],[/信賴保護/,'信賴保護'],[/強制執行/,'強制執行'],[/訴願/,'訴願'],[/消滅時效/,'消滅時效']];
  for (const [p, k] of ps) if (p.test(c) && !ks.includes(k)) ks.push(k);
  return ks.slice(0, 5);
}

async function main() {
  console.log('📥 更新法規資料...');
  let all = [], ok = 0;
  for (const { p, n } of LAWS) {
    try {
      process.stdout.write('  ' + n + '...');
      const raw = await get('https://kong0107.github.io/mojLawSplitJSON/FalVMingLing/' + p + '.json');
      const data = JSON.parse(raw);
      const lawName = sn(data['法規名稱'] || n);
      const items = data['法規內容'] || [];
      let cnt = 0, ch = '';
      for (const item of items) {
        if (item['編章節']) { ch = item['編章節'].trim(); continue; }
        const no = (item['條號'] || '').trim();
        const ct = (item['條文內容'] || '').trim();
        if (!no || !ct || ct.includes('（刪除）') || ct === '刪除') continue;
        all.push({ id: p+'-'+no.replace(/[^0-9\-]/g,''), lawName, chapter: ch, section: '', articleNum: no, paragraphs: parseContent(ct), keywords: kwx(ct), relatedCases: [] });
        cnt++;
      }
      console.log(' ✅ ' + cnt + ' 條');
      ok++;
    } catch (e) { console.log(' ❌ ' + e.message); }
    await new Promise(r => setTimeout(r, 300));
  }
  fs.writeFileSync('laws.json', JSON.stringify(all, null, 2), 'utf8');
  console.log('🎉 ' + ok + ' 部法規，共 ' + all.length + ' 條');
}

main().catch(e => console.error(e));
