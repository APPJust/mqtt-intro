// Topic 萬用字元實驗室: type a subscription filter, see which topics would be delivered.
(() => {
  const lab = document.getElementById('lab');
  if (!lab || document.body.classList.contains('export')) return;
  const TOPICS = [
    'school/room101/temp', 'school/room101/humid', 'school/room101/fan', 'school/room101/temp/raw',
    'school/room102/temp', 'school/room102/humid', 'school/room102/fan',
    'school/room103/temp', 'school/room103/humid', 'school/room103/fan',
    'school/office/temp', 'home/livingroom/temp',
  ];
  const CHALLENGES = [
    { q: '收每一間教室的電扇狀態（fan）', target: t => /^school\/[^/]+\/fan$/.test(t) },
    { q: '收 101 教室底下的所有資料（包含更深層的 raw）', target: t => t.startsWith('school/room101/') },
    { q: '收學校裡所有的溫度（含 office，但不要 raw 與 home）', target: t => /^school\/[^/]+\/temp$/.test(t) },
  ];
  lab.innerHTML = `
    <h2 id="lab-title">互動實驗：Topic 萬用字元實驗室</h2>
    <p>輸入訂閱條件（Topic Filter），看看 Broker 會把哪些主題的訊息送給你。<code>+</code> 代表任意「一層」，<code>#</code> 代表「這一層以下全部」且只能放最後。</p>
    <div class="lab-row">
      <label for="lab-input">訂閱條件</label>
      <input id="lab-input" type="text" value="school/room101/temp" spellcheck="false" autocomplete="off" aria-describedby="lab-feedback">
      <div class="lab-quick" role="group" aria-label="快速範例">
        <button type="button" data-f="school/+/temp">school/+/temp</button>
        <button type="button" data-f="school/room101/#">school/room101/#</button>
        <button type="button" data-f="school/#">school/#</button>
        <button type="button" data-f="school/#/temp">school/#/temp</button>
        <button type="button" data-f="+/+/temp">+/+/temp</button>
      </div>
    </div>
    <p id="lab-feedback" role="status" aria-live="polite"></p>
    <ul id="lab-topics" aria-label="主題清單"></ul>
    <div id="lab-challenge">
      <h3>小挑戰 <span id="lab-score"></span></h3>
      <p id="lab-q"></p>
      <div class="lab-row"><button type="button" id="lab-check">檢查我的條件</button><button type="button" id="lab-next">下一題</button></div>
      <p id="lab-result" role="status" aria-live="polite"></p>
    </div>`;
  const style = document.createElement('style');
  style.textContent = `
    #lab code{background:#0b1220;padding:1px 6px;border-radius:6px;color:var(--pub)}
    .lab-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0}
    #lab-input{flex:1 1 260px;min-width:0;font-size:20px;padding:10px 14px;border-radius:10px;border:1px solid var(--line);background:#0b1220;color:var(--ink);font-weight:700;letter-spacing:.5px}
    .lab-quick{display:flex;flex-wrap:wrap;gap:6px}
    .lab-quick button{font-size:14px;padding:6px 10px}
    #lab-feedback{font-size:17px;color:var(--ink);min-height:1.4em}
    #lab-feedback.bad{color:var(--warn)}
    #lab-topics{list-style:none;padding:0;margin:8px 0 0;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
    #lab-topics li{padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:var(--panel);font-weight:700;font-size:15px;color:var(--dim);overflow-wrap:anywhere}
    #lab-topics li.hit{border-color:var(--ok);color:var(--ok);background:#123a24}
    #lab-topics li.hit::before{content:"✓ "}
    #lab-challenge{margin-top:18px;padding-top:12px;border-top:1px solid var(--line)}
    #lab-challenge h3{margin:0 0 4px;font-size:20px}
    #lab-result.ok{color:var(--ok)} #lab-result.bad{color:var(--warn)}`;
  document.head.appendChild(style);
  const $ = id => document.getElementById(id);

  // MQTT 3.1.1 §4.7 rules for topic filters
  function validate(f) {
    if (!f) return '請輸入訂閱條件。';
    if (f.includes(' ')) return '主題中不建議使用空白。';
    const lv = f.split('/');
    for (let i = 0; i < lv.length; i++) {
      if (lv[i].includes('#') && (lv[i] !== '#' || i !== lv.length - 1)) return '「#」必須單獨佔一層，而且只能放在最後。';
      if (lv[i].includes('+') && lv[i] !== '+') return '「+」必須單獨佔一層，例如 school/+/temp。';
    }
    return '';
  }
  function matches(f, t) {
    const fl = f.split('/'), tl = t.split('/');
    for (let i = 0; i < fl.length; i++) {
      if (fl[i] === '#') return true;
      if (i >= tl.length) return false;
      if (fl[i] !== '+' && fl[i] !== tl[i]) return false;
    }
    return fl.length === tl.length;
  }
  const items = TOPICS.map(t => { const li = document.createElement('li'); li.textContent = t; $('lab-topics').append(li); return { t, li }; });
  function update() {
    const f = $('lab-input').value.trim();
    const err = validate(f);
    const fb = $('lab-feedback');
    if (err) {
      fb.textContent = '✕ 不合法：' + err; fb.className = 'bad';
      items.forEach(i => i.li.classList.remove('hit'));
      return null;
    }
    const hits = items.filter(i => matches(f, i.t));
    items.forEach(i => i.li.classList.toggle('hit', hits.includes(i)));
    fb.className = '';
    fb.textContent = hits.length
      ? `會收到 ${hits.length} 個主題的訊息${f.includes('#') ? '（# 包含更深的層級）' : f.includes('+') ? '（+ 只匹配剛好一層）' : ''}。`
      : '合法，但目前沒有任何主題符合；Broker 不會送訊息給你。';
    return hits.map(h => h.t);
  }
  let idx = 0, solved = new Set();
  function showQ() { $('lab-q').textContent = `第 ${idx + 1} 題：${CHALLENGES[idx].q}`; $('lab-result').textContent = ''; $('lab-score').textContent = `（已完成 ${solved.size}／${CHALLENGES.length}）`; }
  $('lab-check').onclick = () => {
    const hits = update(); const r = $('lab-result');
    if (!hits) { r.textContent = '先修正訂閱條件的寫法喔。'; r.className = 'bad'; return; }
    const want = TOPICS.filter(CHALLENGES[idx].target);
    const extra = hits.filter(h => !want.includes(h)), miss = want.filter(w => !hits.includes(w));
    if (!extra.length && !miss.length) { solved.add(idx); r.textContent = '✓ 正確！剛好收到需要的主題。'; r.className = 'ok'; }
    else { r.className = 'bad'; r.textContent = `還差一點：${miss.length ? `漏掉 ${miss.join('、')}` : ''}${miss.length && extra.length ? '；' : ''}${extra.length ? `多收了 ${extra.join('、')}` : ''}`; }
    $('lab-score').textContent = `（已完成 ${solved.size}／${CHALLENGES.length}）`;
  };
  $('lab-next').onclick = () => { idx = (idx + 1) % CHALLENGES.length; showQ(); };
  $('lab-input').addEventListener('input', update);
  lab.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { $('lab-input').value = b.dataset.f; update(); });
  update(); showQ();
})();
