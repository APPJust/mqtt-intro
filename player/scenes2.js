// Scenes for the full lesson. Timing comes from real narration cues: T('d2.3') = start of that subtitle cue.
(() => {
  const { el, set, show, at, pop, fade, prog, clamp, lerp, ease } = window.L;
  const { C, quad, line, icon, packet, chip, label, box, drawOn } = window.SCENE_UTIL;
  const timer = project => id => {
    const v = id.includes('.') ? project.cue_index[id] : project.seg_index[id];
    if (v === undefined) throw Error('Unknown cue ' + id);
    return v;
  };
  const txt = (parent, x, y, s, size, attrs = {}) => el('text', { x, y, class: 't', 'font-size': size, text: s, ...attrs }, parent);
  const out = (t, start, dur = .4) => 1 - fade(t, start, dur);

  function db(g, color = C.sub) {
    el('ellipse', { cx: 0, cy: -48, rx: 70, ry: 20, fill: C.panel2, stroke: color, 'stroke-width': 4 }, g);
    el('path', { d: 'M-70,-48 V48 A70,20 0 0 0 70,48 V-48', fill: C.panel2, stroke: color, 'stroke-width': 4 }, g);
    el('path', { d: 'M-70,0 A70,20 0 0 0 70,0', fill: 'none', stroke: color, 'stroke-width': 3, opacity: .6 }, g);
  }
  // arrow with partial drawing and optional label
  function arrow(parent, color, labelText = '', size = 20, width = 4) {
    const g = el('g', {}, parent);
    const ln = el('line', { stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' }, g);
    const hd = el('polygon', { fill: color }, g);
    const lb = labelText ? el('text', { class: 't mono', 'font-size': size, fill: color, 'text-anchor': 'middle', text: labelText }, g) : null;
    return {
      g, lb,
      update(x1, y1, x2, y2, k, o = 1, dy = -12) {
        k = clamp(k);
        show(g, k > 0 ? o : 0);
        const x = lerp(x1, x2, k), y = lerp(y1, y2, k), a = Math.atan2(y2 - y1, x2 - x1), L = 16;
        set(ln, { x1, y1, x2: x - Math.cos(a) * L * .6, y2: y - Math.sin(a) * L * .6 });
        const p = [[x, y], [x - L * Math.cos(a - .45), y - L * Math.sin(a - .45)], [x - L * Math.cos(a + .45), y - L * Math.sin(a + .45)]];
        set(hd, { points: p.map(q => q.join(',')).join(' ') });
        if (lb) { set(lb, { x: (x1 + x2) / 2, y: (y1 + y2) / 2 + dy }); lb.setAttribute('opacity', clamp((k - .2) * 3).toFixed(3)); }
      },
    };
  }
  function sensorTile(parent, color) {
    const g = el('g', {}, parent);
    const r = el('rect', { x: -28, y: -28, width: 56, height: 56, rx: 12, fill: C.panel2, stroke: C.dim, 'stroke-width': 3 }, g);
    const d = el('circle', { r: 9, fill: C.dim }, g);
    return { g, r, d, color };
  }
  function satellite(g) {
    el('rect', { x: -30, y: -22, width: 60, height: 44, rx: 8, fill: C.panel2, stroke: C.ink, 'stroke-width': 3 }, g);
    for (const s of [-1, 1]) {
      el('rect', { x: s > 0 ? 40 : -120, y: -18, width: 80, height: 36, fill: '#1e3a8a', stroke: C.sky, 'stroke-width': 2 }, g);
      el('line', { x1: s * 30, y1: 0, x2: s * 40, y2: 0, stroke: C.ink, 'stroke-width': 3 }, g);
      for (let i = 1; i < 4; i++) el('line', { x1: (s > 0 ? 40 : -120) + i * 20, y1: -18, x2: (s > 0 ? 40 : -120) + i * 20, y2: 18, stroke: C.sky, 'stroke-width': 1 }, g);
    }
    el('path', { d: 'M0,22 L0,36 M-14,46 A16,10 0 0 0 14,46', stroke: C.ink, 'stroke-width': 3, fill: 'none' }, g);
  }
  function building(g) {
    el('rect', { x: -70, y: -60, width: 140, height: 110, rx: 6, fill: C.panel2, stroke: C.muted, 'stroke-width': 3 }, g);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) el('rect', { x: -52 + c * 38, y: -42 + r * 40, width: 26, height: 24, fill: '#facc1555' }, g);
    el('path', { d: 'M-20,-60 L-20,-90 M-20,-90 a22,12 0 0 1 40,0', stroke: C.muted, 'stroke-width': 3, fill: 'none' }, g);
  }
  function battery(g, level, color) {
    el('rect', { x: -32, y: -16, width: 60, height: 32, rx: 5, fill: 'none', stroke: color, 'stroke-width': 3 }, g);
    el('rect', { x: 28, y: -7, width: 6, height: 14, fill: color }, g);
    el('rect', { x: -27, y: -11, width: 50 * level, height: 22, fill: color }, g);
  }
  function badge(parent, x, y, big, small, color) {
    const g = el('g', {}, parent);
    el('circle', { cx: 0, cy: 0, r: 62, fill: C.bg, stroke: color, 'stroke-width': 4 }, g);
    txt(g, 0, big.length > 1 ? 4 : 14, big, big.length > 1 ? 34 : 44, { 'text-anchor': 'middle', 'font-weight': 800, fill: color });
    txt(g, 0, 98, small, 22, { 'text-anchor': 'middle', fill: C.muted });
    return { g, x, y };
  }
  function warnIcon(parent, x, y, color = C.pub) {
    const g = el('g', {}, parent);
    el('circle', { cx: x, cy: y, r: 20, fill: 'none', stroke: color, 'stroke-width': 3 }, g);
    txt(g, x, y + 9, '!', 28, { 'text-anchor': 'middle', 'font-weight': 800, fill: color });
    return g;
  }

  Object.assign(window.SCENES, {
    // ===== 開場：蜘蛛網 =====
    web(root, scene, project) {
      const T = timer(project);
      const types = [{ n: '溫度', c: C.warn }, { n: '濕度', c: C.sky }, { n: 'CO2', c: C.ok }];
      const tiles = [];
      for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) {
        const s = sensorTile(root, types[(r * 5 + c) % 3].c); s.x = 170 + c * 92; s.y = 290 + r * 92; tiles.push(s);
      }
      const legend = el('g', {}, root);
      types.forEach((ty, i) => {
        el('rect', { x: 150 + i * 150, y: 210, width: 24, height: 24, rx: 6, fill: ty.c }, legend);
        txt(legend, 184 + i * 150, 231, ty.n, 26, { fill: C.ink, 'font-weight': 700 });
      });
      const counterLbl = txt(root, 30 + 150, 862, '30 個感測器', 26, { fill: C.muted });
      const RX = [{ id: 'phone', y: 320, n: '手機' }, { id: 'web', y: 545, n: '網頁' }, { id: 'db', y: 770, n: '資料庫' }];
      const lines = el('g', {}, root);
      const paths = [];
      tiles.forEach((s, i) => RX.forEach((r, j) => {
        const p = el('path', { fill: 'none', stroke: '#3b5272', 'stroke-width': 2 }, lines);
        paths.push({ p, s, r, i, j, order: (i * 3 + j) });
      }));
      const rx = RX.map(r => {
        const g = el('g', {}, root);
        if (r.id === 'phone') icon.phone(g, '');
        if (r.id === 'web') icon.web(g);
        if (r.id === 'db') db(g);
        const l = txt(root, 1640, r.y + 10, r.n, 32, { fill: C.sub, 'font-weight': 700 });
        return { ...r, g, l };
      });
      const count = txt(root, 1010, 250, '', 40, { 'text-anchor': 'middle', 'font-weight': 800, fill: C.ink });
      const more = txt(root, 1010, 300, '每多一個接收端，就要再多 30 條線', 28, { 'text-anchor': 'middle', fill: C.warn });
      const q = el('g', {}, root);
      el('circle', { r: 90, fill: C.bg, stroke: C.pub, 'stroke-width': 6 }, q);
      txt(q, 0, 40, '?', 120, { 'text-anchor': 'middle', 'font-weight': 800, fill: C.pub });
      return {
        draw(t) {
          const a11 = T('a1.1'), a12 = T('a1.2'), a13 = T('a1.3'), a21 = T('a2.1'), a22 = T('a2.2'), a23 = T('a2.3');
          tiles.forEach((s, i) => {
            const p = pop(t, a11 + .1 + i * .05, .35); show(s.g, p.o); at(s.g, s.x, s.y, p.s);
            const k = fade(t, a12 + (i % 3) * .25, .4);
            set(s.r, { stroke: k > .5 ? s.color : C.dim }); set(s.d, { fill: k > .5 ? s.color : C.dim, r: 9 + 3 * Math.sin(Math.PI * k) });
          });
          show(legend, fade(t, a12)); show(counterLbl, fade(t, a11 + 1));
          rx.forEach((r, j) => { const p = pop(t, a13 + .2 + j * .35); show(r.g, p.o); at(r.g, 1500, r.y, p.s); show(r.l, fade(t, a13 + .4 + j * .35)); });
          const tangle = fade(t, a22, .8);
          let n = 0;
          paths.forEach(o => {
            const k = ease.out(prog(t, a21 + o.order * .028, .5));
            if (k > 0) n++;
            const x0 = o.s.x + 30, y0 = o.s.y, x1 = 1390, y1 = o.r.y;
            const wob = tangle * 60 * Math.sin(o.i * 1.7 + o.j * 2.3 + t * 1.3);
            const cx = (x0 + x1) / 2 + wob, cy = (y0 + y1) / 2 + tangle * 90 * Math.sin(o.i * .9 + o.j);
            set(o.p, { d: `M${x0},${y0} Q${cx},${cy} ${lerp(x0, x1, k)},${lerp(y0, y1, k)}`,
                       stroke: tangle > .2 ? '#a3485a' : '#3b5272', opacity: (k > 0 ? (.55 + .3 * tangle) * (1 - .6 * fade(t, a23 + .2)) : 0).toFixed(3) });
          });
          count.textContent = n ? `連線數：${n} 條` : '';
          show(count, n ? 1 : 0); show(more, fade(t, a22 + .6) * out(t, a23 + .1));
          const qp = pop(t, a23 + .15, .5); show(q, qp.o); at(q, 1010, 545, qp.s);
        },
        bounds() { return [box('sensor-grid', 142, 262, 424, 516), box('receivers', 1400, 230, 420, 620)]; },
      };
    },

    // ===== 起源 =====
    origin(root, scene, project) {
      const T = timer(project);
      const A = el('g', {}, root);                       // phase A: story
      const word = txt(A, 480, 340, 'MQTT', 132, { 'text-anchor': 'middle', 'font-weight': 800, fill: C.broker, 'letter-spacing': 6 });
      const year = txt(A, 480, 500, '1999', 150, { 'text-anchor': 'middle', 'font-weight': 800, fill: C.pub });
      const cards = ['Andy Stanford-Clark｜IBM', 'Arlen Nipper｜Arcom'].map((s, i) => {
        const g = el('g', {}, A);
        el('rect', { x: 170, y: 560 + i * 82, width: 620, height: 64, rx: 14, fill: C.panel, stroke: C.line, 'stroke-width': 2 }, g);
        txt(g, 480, 603 + i * 82, s, 30, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink });
        return g;
      });
      const badges = [badge(A, 260, 640, '輕', 'Lightweight', C.broker), badge(A, 480, 640, '省', 'Efficient', C.pub), badge(A, 700, 640, '可靠', 'Reliable', C.ok)];
      // illustration
      const pipe = el('g', {}, A);
      el('rect', { x: 900, y: 742, width: 920, height: 34, rx: 17, fill: '#334155', stroke: '#64748b', 'stroke-width': 3 }, pipe);
      for (let i = 0; i < 8; i++) el('rect', { x: 930 + i * 115, y: 736, width: 14, height: 46, fill: '#64748b' }, pipe);
      txt(pipe, 1360, 820, '石油管線', 24, { 'text-anchor': 'middle', fill: C.muted });
      const station = el('g', {}, A); icon.sensor(station);
      const sat = el('g', {}, A); satellite(sat);
      const center = el('g', {}, A); building(center);
      const centerLbl = txt(A, 1700, 720, '控制中心', 24, { 'text-anchor': 'middle', fill: C.muted });
      const up = el('path', { d: 'M1060,610 L1400,330', stroke: C.broker, 'stroke-width': 3, 'stroke-dasharray': '10 10', fill: 'none' }, A);
      const down = el('path', { d: 'M1400,330 L1700,570', stroke: C.broker, 'stroke-width': 3, 'stroke-dasharray': '10 10', fill: 'none' }, A);
      const pk = el('circle', { r: 11, fill: C.broker }, A);
      const costTag = chip(A, '$ 頻寬昂貴', C.pub, 24);
      const flaky = chip(A, '連線不穩', C.warn, 24);
      const bat = el('g', {}, A); battery(bat, .22, C.warn);
      const batLbl = txt(A, 1060, 500, '電力有限', 24, { 'text-anchor': 'middle', fill: C.warn, 'font-weight': 700 });
      // phase B: timeline
      const B = el('g', {}, root);
      const axis = el('line', { x1: 200, y1: 540, x2: 1720, y2: 540, stroke: C.line, 'stroke-width': 6, 'stroke-linecap': 'round' }, B);
      const fill = el('line', { x1: 260, y1: 540, x2: 260, y2: 540, stroke: C.broker, 'stroke-width': 6, 'stroke-linecap': 'round' }, B);
      const NODES = [
        { x: 260, y: '1999', a: 'IBM × Arcom 發明', b: '衛星監控石油管線', cue: null },
        { x: 620, y: '2010', a: 'MQTT 3.1 規格', b: '免權利金公開', cue: 'b3.1' },
        { x: 980, y: '2014', a: 'MQTT 3.1.1', b: 'OASIS 標準（10/29）', cue: 'b3.2' },
        { x: 1340, y: '2016', a: 'ISO/IEC 20922', b: '國際標準', cue: 'b3.3' },
        { x: 1680, y: '2019', a: 'MQTT 5.0', b: 'OASIS 標準（3/7）', cue: 'b3.4' },
      ].map(n => {
        const g = el('g', {}, B);
        const dot = el('circle', { cx: n.x, cy: 540, r: 18, fill: C.bg, stroke: C.dim, 'stroke-width': 5 }, g);
        const yr = txt(g, n.x, 470, n.y, 56, { 'text-anchor': 'middle', 'font-weight': 800, fill: C.dim });
        const a = txt(g, n.x, 610, n.a, 28, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink });
        const b = txt(g, n.x, 648, n.b, 24, { 'text-anchor': 'middle', fill: C.muted });
        return { ...n, g, dot, yr, a, b };
      });
      return {
        draw(t) {
          const sw = T('b3.1') - .6;                    // story -> timeline switch
          const aO = out(t, sw, .5), bO = fade(t, sw + .3, .5);
          show(A, aO); show(B, bO);
          if (aO > 0) {
            const w = pop(t, T('b1.1') - .2, .5); show(word, w.o); at(word, 0, 0); word.setAttribute('transform', `translate(480,300) scale(${w.s}) translate(-480,-300)`);
            const y = pop(t, T('b1.2'), .5); show(year, y.o); year.setAttribute('transform', `translate(480,450) scale(${y.s}) translate(-480,-450)`);
            cards.forEach((c, i) => { const k = fade(t, T(i ? 'b1.3' : 'b1.2') + .3, .4); show(c, k * out(t, T('b2.3') - .3)); at(c, (1 - k) * -30, 0); });
            badges.forEach((b, i) => { const p = pop(t, T('b2.3') + .3 + i * .45); show(b.g, p.o); at(b.g, b.x, b.y, p.s); });
            const il = fade(t, T('b1.4'), .5);
            show(pipe, il); const sp = pop(t, T('b1.4') + .1); show(station, sp.o); at(station, 1060, 660, sp.s * .9);
            const sa = pop(t, T('b1.4') + .5); show(sat, sa.o); at(sat, 1400, 300 + 8 * Math.sin(t * 1.5), sa.s);
            const ce = pop(t, T('b1.4') + .8); show(center, ce.o); at(center, 1700, 630, ce.s); show(centerLbl, fade(t, T('b1.4') + 1));
            const flick = t > T('b2.1') + 1.2 ? (Math.sin(t * 9) > .2 ? 1 : .15) : 1;
            show(up, fade(t, T('b1.4') + 1) * flick); show(down, fade(t, T('b1.4') + 1.2) * flick);
            const cyc = ((t - T('b1.4') - 1.4) % 2.2 + 2.2) % 2.2 / 2.2;
            const pos = cyc < .5 ? [lerp(1060, 1400, cyc * 2), lerp(610, 330, cyc * 2)] : [lerp(1400, 1700, cyc * 2 - 1), lerp(330, 570, cyc * 2 - 1)];
            show(pk, t > T('b1.4') + 1.4 ? flick : 0); set(pk, { cx: pos[0], cy: pos[1] });
            const ct = pop(t, T('b2.1') + .2); show(costTag, ct.o); at(costTag, 1560, 420, ct.s);
            const fl = pop(t, T('b2.1') + 1.2); show(flaky, fl.o); at(flaky, 1220, 520, fl.s);
            const bp = pop(t, T('b2.2') + .2); show(bat, bp.o); at(bat, 1060, 548, bp.s); show(batLbl, fade(t, T('b2.2') + .4));
          }
          // timeline
          let last = 260;
          NODES.forEach(n => {
            const on = n.cue ? fade(t, T(n.cue), .4) : 1;
            if (on > 0) last = n.cue ? lerp(last, n.x, ease.inOut(prog(t, T(n.cue) - .4, .6))) : n.x;
            set(n.dot, { stroke: on > .5 ? C.broker : C.dim, fill: on > .5 ? C.broker : C.bg, r: 18 + 6 * Math.sin(Math.PI * on) });
            set(n.yr, { fill: on > .5 ? (n.y === '1999' ? C.pub : C.ink) : C.dim });
            show(n.a, .25 + .75 * on); show(n.b, .25 + .75 * on);
          });
          set(fill, { x2: last });
        },
        bounds(t) {
          return t < T('b3.1') - .6 ? [box('origin-text', 160, 200, 640, 560), box('origin-illustration', 900, 220, 920, 610)] : [box('timeline', 160, 400, 1660, 270)];
        },
      };
    },

    // ===== 原理②：Topic 與萬用字元 =====
    topics(root, scene, project) {
      const T = timer(project);
      const ROOMS = ['room101', 'room102', 'room103'], LEAVES = ['temp', 'humid', 'fan'];
      const levelLbl = el('g', {}, root);
      [['第 1 層', '學校', 300], ['第 2 層', '教室', 760], ['第 3 層', '感測項目', 1200]].forEach(([a, b, x]) => {
        txt(levelLbl, x, 222, `${a}｜${b}`, 26, { 'text-anchor': 'middle', fill: C.muted, 'font-weight': 700 });
      });
      const edges = el('g', {}, root);
      const node = (x, y, s, w) => {
        const g = el('g', {}, root);
        const r = el('rect', { x: -w / 2, y: -24, width: w, height: 48, rx: 12, fill: C.panel2, stroke: C.line, 'stroke-width': 3 }, g);
        const tx = txt(g, 0, 9, s, 24, { 'text-anchor': 'middle', class: 't mono', fill: C.ink });
        at(g, x, y); return { g, r, tx, x, y, w };
      };
      const rootN = node(300, 539, 'school', 150);
      const rooms = ROOMS.map((r, i) => ({ ...node(760, 341 + i * 198, r, 170), name: r }));
      const leaves = [];
      ROOMS.forEach((r, i) => LEAVES.forEach((l, j) => {
        const y = 275 + (i * 3 + j) * 66;
        const n = node(1200, y, l, 130);
        const full = txt(root, 1290, y + 8, `school/${r}/${l}`, 22, { class: 't mono', fill: C.dim });
        const mark = txt(root, 1560, y + 9, '✓', 28, { fill: C.ok, 'font-weight': 800 });
        leaves.push({ ...n, room: i, leaf: l, full, mark, topic: `school/${r}/${l}` });
      }));
      const e1 = rooms.map(r => el('path', { d: `M375,539 C560,539 560,${r.y} 675,${r.y}`, fill: 'none', stroke: C.line, 'stroke-width': 3 }, edges));
      const e2 = leaves.map(l => { const r = rooms[l.room]; return el('path', { d: `M845,${r.y} C1010,${r.y} 1010,${l.y} 1135,${l.y}`, fill: 'none', stroke: C.line, 'stroke-width': 3 }, edges); });
      // filter box (bottom-left)
      const fb = el('g', {}, root);
      el('rect', { x: 110, y: 718, width: 560, height: 130, rx: 16, fill: '#0b1a22', stroke: C.broker, 'stroke-width': 2 }, fb);
      txt(fb, 134, 756, '訂閱條件 Topic Filter', 22, { fill: C.broker, 'font-weight': 700 });
      const ftext = txt(fb, 390, 815, '', 38, { 'text-anchor': 'middle', class: 't mono', fill: C.ink });
      const bad = el('g', {}, root);
      el('rect', { x: 110, y: 640, width: 560, height: 60, rx: 14, fill: '#2a1215', stroke: C.warn, 'stroke-width': 2 }, bad);
      txt(bad, 390, 680, '✕ school/#/temp　# 不能放中間', 26, { 'text-anchor': 'middle', class: 't mono', fill: C.warn });
      const slashes = txt(root, 300, 640, 'school / room101 / temp', 30, { 'text-anchor': 'middle', class: 't mono', fill: C.pub });
      const match = (filter, topic) => {
        const f = filter.split('/'), p = topic.split('/');
        for (let i = 0; i < f.length; i++) { if (f[i] === '#') return true; if (f[i] !== '+' && f[i] !== p[i]) return false; }
        return f.length === p.length;
      };
      return {
        draw(t) {
          const d11 = T('d1.1'), d12 = T('d1.2'), d22 = T('d2.2'), d23 = T('d2.3'), d24 = T('d2.4'), d31 = T('d3.1'), d32 = T('d3.2'), d33 = T('d3.3');
          // build the tree left -> right
          const rp = pop(t, d11 + .1); show(rootN.g, rp.o); at(rootN.g, 300, 539, rp.s);
          rooms.forEach((r, i) => { const p = pop(t, d11 + .8 + i * .15); show(r.g, p.o); at(r.g, r.x, r.y, p.s); drawOn(e1[i], prog(t, d11 + .5 + i * .15, .5), 600); });
          const leafPop = leaves.map((l, i) => { const p = pop(t, d11 + 1.6 + i * .08); at(l.g, l.x, l.y, p.s); drawOn(e2[i], prog(t, d11 + 1.4 + i * .08, .4), 500); return p.o; });
          show(levelLbl, fade(t, d12));
          show(slashes, fade(t, d11 + 1) * out(t, d22 - .3));
          // filters over time
          let filter = '';
          if (t >= d22) filter = 'school/+/temp';
          if (t >= d31) filter = 'school/room101/#';
          const shownFilter = t >= d22 && t < d23 ? '+' : filter;
          ftext.textContent = shownFilter;
          show(fb, fade(t, T('d2.1')));
          const showMatch = (t >= d24 - .2 && t < d31) || t >= d33 - .2;
          const active = showMatch ? filter : '';
          // + sweep across rooms while explaining; # highlights subtree
          const sweep = t >= d22 && t < d24 ? Math.floor(((t - d22) * 2.2) % 3) : -1;
          rooms.forEach((r, i) => {
            const hot = sweep === i || (active === 'school/+/temp') || (active === 'school/room101/#' && i === 0);
            set(r.r, { stroke: hot ? C.broker : C.line, fill: hot ? '#123a3a' : C.panel2 });
          });
          set(rootN.r, { stroke: active ? C.broker : C.line });
          leaves.forEach((l, i) => {
            const m = active && match(active, l.topic);
            set(l.r, { stroke: m ? C.ok : C.line, fill: m ? '#123a24' : C.panel2 });
            set(l.full, { fill: m ? C.ok : C.dim });
            show(l.full, fade(t, d12 + .3 + i * .05));
            show(l.mark, m ? fade(t, (active.includes('#') ? d33 : d24) - .2 + l.room * .1 + (i % 3) * .05, .3) : 0);
            show(l.g, leafPop[i] * (active && !m ? .45 : 1));
            set(e2[i], { stroke: m ? C.ok : C.line });
          });
          rooms.forEach((r, i) => set(e1[i], { stroke: active === 'school/+/temp' || (active.includes('#') && i === 0) ? C.broker : C.line }));
          const bp = pop(t, d32 + .1); show(bad, bp.o * out(t, d33 + 1.5)); at(bad, 0, (1 - bp.s) * 20);
        },
        bounds() { return [box('topic-root', 225, 515, 150, 48), box('topic-rooms', 675, 317, 170, 444), box('topic-leaves', 1135, 251, 450, 576), box('filter-box', 110, 718, 560, 130)]; },
      };
    },

    // ===== 原理③：QoS =====
    qos(root, scene, project) {
      const T = timer(project);
      const X0 = 440, X1 = 1360;
      const LANES = [
        { y: 300, h: 90, q: 'QoS 0', a: '最多一次', color: C.sky },
        { y: 500, h: 90, q: 'QoS 1', a: '至少一次', color: C.pub },
        { y: 728, h: 130, q: 'QoS 2', a: '剛好一次', color: C.ok },
      ].map(L => {
        const g = el('g', {}, root);
        el('line', { x1: X0, y1: L.y, x2: X1, y2: L.y, stroke: C.line, 'stroke-width': 3, 'stroke-dasharray': '8 10' }, g);
        txt(g, 120, L.y - 4, L.q, 46, { 'font-weight': 800, fill: L.color });
        txt(g, 120, L.y + 36, L.a, 30, { fill: C.ink, 'font-weight': 700 });
        el('rect', { x: X0 - 64, y: L.y - L.h / 2, width: 64, height: L.h, rx: 12, fill: C.panel2, stroke: L.color, 'stroke-width': 3 }, g);
        el('rect', { x: X1, y: L.y - L.h / 2, width: 64, height: L.h, rx: 12, fill: C.panel2, stroke: L.color, 'stroke-width': 3 }, g);
        txt(g, X0 - 32, L.y + L.h / 2 + 28, '送出端', 22, { 'text-anchor': 'middle', fill: C.muted });
        txt(g, X1 + 32, L.y + L.h / 2 + 28, '接收端', 22, { 'text-anchor': 'middle', fill: C.muted });
        return { ...L, g };
      });
      const note = txt(root, 1830, 222, '示意：每一段連線（發布者→Broker、Broker→訂閱者）各自套用 QoS', 22, { 'text-anchor': 'end', fill: C.muted });
      const msg = (color, s) => {
        const g = el('g', {}, root);
        const w = Math.max(110, s.length * 15 + 30);
        el('rect', { x: -w / 2, y: -26, width: w, height: 52, rx: 12, fill: '#111827', stroke: color, 'stroke-width': 3 }, g);
        txt(g, 0, 9, s, 24, { 'text-anchor': 'middle', class: 't mono', fill: color });
        return g;
      };
      const mark = (x, y, s, color) => txt(root, x, y, s, 30, { 'text-anchor': 'middle', fill: color, 'font-weight': 800 });
      // lane 0: one delivered, one lost on the way
      const q0a = msg(C.sky, 'MSG'), q0b = msg(C.sky, 'MSG');
      const ok0 = txt(root, X1 + 80, 310, '✓ 收到', 30, { fill: C.ok, 'font-weight': 800 }), lost = mark(900, 384, '✕ 遺失', C.warn);
      // lane 1: A delivered + acked; B acked-lost -> resent -> duplicate
      const pA = msg(C.pub, 'PUB A'), ackA = msg(C.ok, 'PUBACK'), pB = msg(C.pub, 'PUB B'), ackB = msg(C.ok, 'PUBACK'), pB2 = msg(C.pub, 'PUB B 重送');
      const ackX = mark(900, 548, '✕', C.warn);
      const dup = txt(root, X1 + 80, 492, 'B ×2', 30, { fill: C.pub, 'font-weight': 800 });
      const dupLbl = txt(root, X1 + 80, 526, '可能重複', 22, { fill: C.pub });
      // lane 2: four-step handshake, labels alternate left/right so they never collide
      const steps = ['PUBLISH', 'PUBREC', 'PUBREL', 'PUBCOMP'].map((n, i) => ({ n, dir: i % 2 ? -1 : 1, a: arrow(root, C.ok), c: chip(root, `${i + 1} ${n}`, C.ok, 18) }));
      const once = txt(root, X1 + 80, 720, '×1', 30, { fill: C.ok, 'font-weight': 800 });
      const onceLbl = txt(root, X1 + 80, 754, '剛好一次', 22, { fill: C.ok });
      // cost bars
      const cost = el('g', {}, root);
      txt(cost, 1590, 262, '往返訊息數', 24, { fill: C.muted, 'font-weight': 700 });
      const bars = LANES.map((L, i) => {
        const n = [1, 2, 4][i];
        const r = el('rect', { x: 1590, y: L.y - 16, width: 0, height: 32, rx: 6, fill: L.color }, cost);
        txt(cost, 1590, L.y + 50, `${n} 則／每筆`, 22, { fill: C.ink });
        return { r, n };
      });
      const use = LANES.map((L, i) => chip(root, ['適合：感測數值', '適合：開關指令', '適合：計費紀錄'][i], L.color, 19));
      const travel = (node, k, x0, x1, y) => { show(node, k > 0 && k < 1 ? 1 : 0); at(node, lerp(x0, x1, ease.inOut(k)), y); };
      return {
        draw(t) {
          const e11 = T('e1.1'), e21 = T('e2.1'), e22 = T('e2.2'), e31 = T('e3.1'), e32 = T('e3.2'), e41 = T('e4.1'), e42 = T('e4.2'), e43 = T('e4.3');
          LANES.forEach((L, i) => { const k = fade(t, e11 + .4 + i * .3); show(L.g, k); at(L.g, (1 - k) * -40, 0); });
          show(note, fade(t, e11 + 1.5));
          const A = X0 + 70, Z = X1 - 70;
          // lane 0
          travel(q0a, prog(t, e21 + .3, 1.5), A, Z, 300);
          show(ok0, fade(t, e21 + 1.8) * out(t, e22, .3));
          const k0b = ease.in(prog(t, e22, .9)), fall = prog(t, e22 + .6, .6);
          show(q0b, k0b > 0 && fall < 1 ? 1 - fall : 0); at(q0b, lerp(A, 900, k0b), 300 + ease.in(fall) * 70, 1, fall * 35);
          show(lost, fade(t, e22 + 1));
          // lane 1
          travel(pA, prog(t, e31 + .2, 1.1), A, Z, 500);
          travel(ackA, prog(t, e31 + 1.4, 1.0), Z, A, 548);
          travel(pB, prog(t, e32 - .7, 1.0), A, Z, 500);
          const kb = prog(t, e32 + .4, .8); show(ackB, kb > 0 && kb < 1 ? 1 : 0); at(ackB, lerp(Z, 900, ease.out(kb)), 548);
          show(ackX, fade(t, e32 + 1.1) * out(t, e41 - .3));
          travel(pB2, prog(t, e32 + 1.6, 1.1), A, Z, 500);
          show(dup, fade(t, e32 + 2.7)); show(dupLbl, fade(t, e32 + 2.9));
          // lane 2
          steps.forEach((s, i) => {
            const k = ease.inOut(prog(t, e41 + .3 + i * .85, .7));
            const y = 686 + i * 28;
            if (s.dir > 0) s.a.update(X0 + 8, y, X1 - 8, y, k); else s.a.update(X1 - 8, y, X0 + 8, y, k);
            const cx = lerp(X0, X1, i % 2 ? .68 : .32);
            show(s.c, k > .35 ? 1 : 0); at(s.c, cx, y);
          });
          show(once, fade(t, e41 + 3.8)); show(onceLbl, fade(t, e41 + 4));
          show(cost, fade(t, e42 - .2));
          bars.forEach((b, i) => { const k = ease.out(prog(t, e42 + i * .25, .6)); set(b.r, { width: 52 * b.n * k }); });
          use.forEach((u, i) => { const p = pop(t, e43 + .2 + i * .3); show(u, p.o); at(u, 1700, LANES[i].y + 92, p.s); });
        },
        bounds() { return [box('lanes', 110, 236, 1350, 620), box('cost', 1580, 236, 250, 620)]; },
      };
    },

    // ===== 原理④：保留訊息與遺囑 =====
    retain(root, scene, project) {
      const T = timer(project);
      const panel = (x, title, color) => {
        const g = el('g', {}, root);
        el('rect', { x, y: 200, width: 840, height: 650, rx: 24, fill: '#101b2e', stroke: C.line, 'stroke-width': 2 }, g);
        txt(g, x + 40, 256, title, 34, { 'font-weight': 800, fill: color });
        return g;
      };
      const L = panel(100, '保留訊息 Retained', C.broker), R = panel(980, '遺囑訊息 Last Will', C.warn);
      // left: sensor -> broker memory -> late phone
      const sL = el('g', {}, root); icon.sensor(sL);
      const bL = el('g', {}, root); el('circle', { r: 80, fill: '#0f2a2e', stroke: C.broker, 'stroke-width': 4 }, bL); txt(bL, 0, 10, 'Broker', 32, { 'text-anchor': 'middle', 'font-weight': 800, fill: C.broker });
      const mem = el('g', {}, root);
      el('rect', { x: 330, y: 650, width: 380, height: 92, rx: 14, fill: C.bg, stroke: C.broker, 'stroke-width': 2, 'stroke-dasharray': '8 6' }, mem);
      txt(mem, 520, 684, '記住最後一筆（retain）', 22, { 'text-anchor': 'middle', fill: C.muted });
      const memVal = txt(mem, 520, 722, 'school/room101/temp = 26.5', 22, { 'text-anchor': 'middle', class: 't mono', fill: C.broker });
      const pubPk = packet(root, 'room101/temp', '26.5 °C · retain');
      const phoneL = el('g', {}, root); const phoneScr = icon.phone(phoneL, '');
      const lateLbl = txt(root, 790, 312, '晚到的手機', 24, { 'text-anchor': 'middle', fill: C.sub, 'font-weight': 700 });
      const copyL = packet(root, 'room101/temp', '26.5 °C');
      // right: device with will -> broker -> dashboard
      const dev = el('g', {}, root); icon.sensor(dev, C.pub);
      const will = chip(root, '遺囑：status = offline', C.warn, 20);
      const bR = el('g', {}, root); el('circle', { r: 80, fill: '#0f2a2e', stroke: C.broker, 'stroke-width': 4 }, bR); txt(bR, 0, 10, 'Broker', 32, { 'text-anchor': 'middle', 'font-weight': 800, fill: C.broker });
      const cable = el('path', { d: 'M1180,500 L1330,500', stroke: C.muted, 'stroke-width': 6 }, root);
      const cable2 = el('path', { d: 'M1330,500 L1420,500', stroke: C.muted, 'stroke-width': 6 }, root);
      const spark = el('g', {}, root);
      for (let i = 0; i < 6; i++) el('line', { x1: 0, y1: 0, x2: 30 * Math.cos(i * 1.05), y2: 30 * Math.sin(i * 1.05), stroke: C.pub, 'stroke-width': 4, 'stroke-linecap': 'round' }, spark);
      const dash = el('g', {}, root);
      el('rect', { x: 1640, y: 640, width: 150, height: 120, rx: 12, fill: C.panel2, stroke: C.sub, 'stroke-width': 3 }, dash);
      txt(dash, 1715, 676, '儀表板', 20, { 'text-anchor': 'middle', fill: C.muted });
      const stDot = el('circle', { cx: 1672, cy: 718, r: 12, fill: C.ok }, dash);
      const stTxt = txt(dash, 1735, 726, '在線', 24, { 'text-anchor': 'middle', 'font-weight': 800, fill: C.ok });
      const willPk = packet(root, 'room101/status', '已離線 offline', C.warn);
      return {
        draw(t) {
          const f11 = T('f1.1'), f12 = T('f1.2'), f13 = T('f1.3'), f21 = T('f2.1'), f22 = T('f2.2'), f23 = T('f2.3');
          const lk = fade(t, f11 + .2), rk = fade(t, f21 - .3);
          show(L, lk); show(R, rk);
          const s1 = pop(t, f11 + .5); show(sL, s1.o); at(sL, 230, 470, s1.s * .8);
          const b1 = pop(t, f11 + .7); show(bL, b1.o); at(bL, 520, 470, b1.s);
          const k = ease.inOut(prog(t, f12 + .2, 1.2)); show(pubPk, k > 0 && k < 1 ? 1 : 0); at(pubPk, lerp(250, 500, k), 380, .8);
          show(mem, fade(t, f12 + 1.4)); show(memVal, fade(t, f12 + 1.6));
          const ph = ease.out(prog(t, f13 - .2, .7)); show(phoneL, ph); at(phoneL, lerp(960, 790, ph), 450, .9); show(lateLbl, ph);
          const kc = ease.inOut(prog(t, f13 + 1.0, 1.0)); show(copyL, kc > 0 && kc < 1 ? 1 : 0); at(copyL, lerp(560, 760, kc), 560, .7);
          phoneScr.textContent = t >= f13 + 2.0 ? '26.5°C' : '';
          // right
          const d = pop(t, f21 + .1); show(dev, d.o); at(dev, 1110, 500, d.s * .8);
          const b2 = pop(t, f21 + .3); show(bR, b2.o); at(bR, 1500, 500, b2.s);
          show(cable, fade(t, f21 + .4)); show(cable2, fade(t, f21 + .4));
          const wk = ease.inOut(prog(t, f21 + 1.6, 1.2)); show(will, fade(t, f21 + 1.0)); at(will, lerp(1110, 1500, wk), lerp(380, 620, wk), lerp(1, .85, wk));
          const brk = prog(t, f22 + .6, .3);
          cable2.setAttribute('transform', `translate(${(brk * 8).toFixed(2)},${(brk * 6).toFixed(2)}) rotate(${(brk * 25).toFixed(2)} 1420 500)`);
          set(cable2, { stroke: brk > 0 ? C.warn : C.muted });
          const spk = prog(t, f22 + .6, .5); show(spark, spk > 0 && spk < 1 ? 1 - spk : 0); at(spark, 1330, 500, .6 + spk);
          show(dash, fade(t, f21 + .6));
          const kw = ease.inOut(prog(t, f22 + 1.6, 1.1)); show(willPk, kw > 0 && kw < 1 ? 1 : 0); at(willPk, lerp(1540, 1700, kw), lerp(560, 600, kw), .62);
          const off = t >= f22 + 2.7;
          set(stDot, { fill: off ? C.warn : C.ok }); stTxt.textContent = off ? '離線' : '在線'; set(stTxt, { fill: off ? C.warn : C.ok });
        },
        bounds() { return [box('retain-panel', 100, 200, 840, 650), box('will-panel', 980, 200, 840, 650)]; },
      };
    },

    // ===== 比較：HTTP vs MQTT =====
    compare(root, scene, project) {
      const T = timer(project);
      const D = el('g', {}, root);   // diagrams
      const col = (x1, x2, title, color, a, b) => {
        txt(D, (x1 + x2) / 2, 226, title, 30, { 'text-anchor': 'middle', 'font-weight': 800, fill: color });
        for (const [x, n] of [[x1, a], [x2, b]]) {
          el('rect', { x: x - 70, y: 248, width: 140, height: 44, rx: 10, fill: C.panel2, stroke: color, 'stroke-width': 2 }, D);
          txt(D, x, 278, n, 22, { 'text-anchor': 'middle', fill: C.ink, 'font-weight': 700 });
          el('line', { x1: x, y1: 292, x2: x, y2: 850, stroke: C.line, 'stroke-width': 3, 'stroke-dasharray': '6 8' }, D);
        }
      };
      col(230, 770, 'HTTP：請求／回應（輪詢）', C.sky, '手機', '伺服器');
      col(1150, 1690, 'MQTT：發布／訂閱（推送）', C.broker, '手機', 'Broker');
      el('line', { x1: 960, y1: 210, x2: 960, y2: 850, stroke: C.line, 'stroke-width': 2 }, D);
      const polls = [];
      for (let i = 0; i < 7; i++) polls.push({ q: arrow(D, C.sky, 'GET 有新資料嗎？', 21), r: arrow(D, C.muted, i === 3 ? '200 有：26.5' : '沒有新資料', 21) });
      const hdr = el('g', {}, D);
      el('rect', { x: 300, y: 560, width: 400, height: 180, rx: 12, fill: '#0b1220', stroke: C.sky, 'stroke-width': 2 }, hdr);
      ['GET /api/temp HTTP/1.1', 'Host: example.school', 'User-Agent: Mozilla/5.0 …', 'Accept: application/json', 'Accept-Language: zh-TW …'].forEach((s, i) => txt(hdr, 318, 592 + i * 32, s, 20, { class: 't mono', fill: C.sky }));
      const conn = arrow(D, C.broker, 'CONNECT + SUBSCRIBE', 18);
      const live = el('rect', { x: 1150, y: 360, width: 540, height: 470, fill: C.broker, 'fill-opacity': .07 }, D);
      const liveLbl = txt(D, 1420, 400, '一條長連線保持開著', 22, { 'text-anchor': 'middle', fill: C.broker });
      const pushes = [0, 1, 2].map(i => arrow(D, C.broker, `PUBLISH ${['26.5', '26.8', '27.1'][i]}`, 18));
      const fixed = el('g', {}, D);
      el('rect', { x: 1240, y: 690, width: 64, height: 56, rx: 8, fill: C.broker }, fixed);
      el('rect', { x: 1310, y: 690, width: 64, height: 56, rx: 8, fill: C.broker }, fixed);
      txt(fixed, 1272, 726, '0x30', 18, { 'text-anchor': 'middle', class: 't mono', fill: C.bg });
      txt(fixed, 1342, 726, '0x0F', 18, { 'text-anchor': 'middle', class: 't mono', fill: C.bg });
      txt(fixed, 1394, 728, '固定標頭最小 2 bytes', 24, { fill: C.broker, 'font-weight': 700 });
      // summary table
      const S = el('g', {}, root);
      const rows = [['', 'HTTP/1.1', 'MQTT 3.1.1'], ['通訊模式', '請求／回應', '發布／訂閱'], ['連線方式', '每次詢問一來一回', '維持一條長連線'],
                    ['新資料通知', '用戶端反覆詢問', 'Broker 主動推送'], ['標頭', '文字標頭，較長', '固定標頭最小 2 bytes'], ['適合', '網頁、檔案、API', 'IoT：低頻寬、多裝置、即時']];
      const rowEls = rows.map((r, i) => {
        const g = el('g', {}, S);
        el('rect', { x: 220, y: 230 + i * 96, width: 1480, height: 84, rx: 12, fill: i === 0 ? 'none' : C.panel }, g);
        txt(g, 260, 282 + i * 96, r[0], 30, { fill: C.muted, 'font-weight': 700 });
        txt(g, 760, 282 + i * 96, r[1], i ? 30 : 34, { 'text-anchor': 'middle', fill: i ? C.ink : C.sky, 'font-weight': i ? 400 : 800 });
        txt(g, 1330, 282 + i * 96, r[2], i ? 30 : 34, { 'text-anchor': 'middle', fill: i ? C.ink : C.broker, 'font-weight': i ? 400 : 800 });
        return g;
      });
      const foot = txt(S, 1700, 848, '依協定規格比較，非實測效能數據', 20, { 'text-anchor': 'end', fill: C.dim });
      return {
        draw(t) {
          const g11 = T('g1.1'), g21 = T('g2.1'), g22 = T('g2.2'), g31 = T('g3.1'), g32 = T('g3.2'), g33 = T('g3.3'), g41 = T('g4.1');
          const sw = g41 - .5;
          show(D, fade(t, g11 + .2) * out(t, sw, .5)); show(S, fade(t, sw + .3, .5));
          polls.forEach((p, i) => {
            const st = g21 + .2 + i * 1.75, y = 330 + i * 76;
            p.q.update(240, y, 760, y, ease.inOut(prog(t, st, .6)), 1, -8);
            p.r.update(760, y + 30, 240, y + 30, ease.inOut(prog(t, st + .75, .6)), 1, -8);
          });
          show(hdr, fade(t, g22) * out(t, g31 + .5)); at(hdr, 0, (1 - fade(t, g22)) * 20);
          conn.update(1160, 330, 1680, 330, ease.inOut(prog(t, g31 + .2, .8)), 1, -8);
          show(live, fade(t, g31 + 1)); show(liveLbl, fade(t, g31 + 1.2));
          pushes.forEach((p, i) => { const y = 460 + i * 80; p.update(1680, y, 1160, y, ease.inOut(prog(t, g32 + .3 + i * 1.3, .6)), 1, -8); });
          show(fixed, fade(t, g33));
          rowEls.forEach((r, i) => { const k = fade(t, sw + .5 + i * .3); show(r, k); at(r, (1 - k) * 30, 0); });
          show(foot, fade(t, sw + 2.5));
        },
        bounds(t) { return t < T('g4.1') - .5 ? [box('http-col', 150, 200, 700, 650), box('mqtt-col', 1070, 200, 700, 650)] : [box('table', 220, 230, 1480, 620)]; },
      };
    },

    // ===== 應用 =====
    apply(root, scene, project) {
      const T = timer(project);
      // phase A: real case
      const A = el('g', {}, root);
      el('rect', { x: 360, y: 240, width: 1200, height: 520, rx: 28, fill: C.panel, stroke: C.line, 'stroke-width': 2 }, A);
      chip(A, '真實案例', C.ok, 22).setAttribute('transform', 'translate(500,300)');
      const ph = el('g', {}, A); icon.phone(ph, ''); ph.setAttribute('transform', 'translate(560,520) scale(1.5)');
      const bubbles = [0, 1, 2].map(i => { const g = el('g', {}, A); el('rect', { x: 0, y: 0, width: 46, height: 16, rx: 8, fill: i % 2 ? C.sky : C.ok }, g); return g; });
      txt(A, 760, 420, '2011｜Facebook Messenger', 46, { 'font-weight': 800, fill: C.ink });
      txt(A, 760, 490, '以 MQTT 在手機上維持長連線', 32, { fill: C.broker, 'font-weight': 700 });
      txt(A, 760, 545, '兼顧即時送達與電池續航', 28, { fill: C.muted });
      txt(A, 760, 690, '來源：Facebook Engineering〈Building Facebook Messenger〉2011-08-12', 20, { fill: C.dim });
      // phase B: demo classroom
      const B = el('g', {}, root);
      chip(B, '示範情境（非真實部署）', C.pub, 20).setAttribute('transform', 'translate(300,226)');
      const rooms = [0, 1, 2].map(i => {
        const y = 270 + i * 196;
        const g = el('g', {}, B);
        el('rect', { x: 110, y, width: 640, height: 172, rx: 16, fill: '#101b2e', stroke: C.line, 'stroke-width': 2 }, g);
        txt(g, 136, y + 40, `${101 + i} 教室`, 28, { 'font-weight': 800, fill: C.ink });
        const s = el('g', {}, g); icon.sensor(s); s.setAttribute('transform', `translate(230,${y + 108}) scale(.6)`);
        const ac = el('g', {}, g);
        el('rect', { x: 470, y: y + 66, width: 180, height: 56, rx: 10, fill: C.panel2, stroke: C.muted, 'stroke-width': 3 }, ac);
        txt(ac, 560, y + 102, '冷氣', 22, { 'text-anchor': 'middle', fill: C.muted });
        const air = el('g', {}, g);
        for (let k = 0; k < 3; k++) el('path', { d: `M${500 + k * 50},${y + 132} q10,14 0,28`, stroke: C.sky, 'stroke-width': 4, fill: 'none' }, air);
        const temp = txt(g, 330, y + 118, `${[26.5, 27.8, 25.9][i]}°C`, 30, { 'font-weight': 800, fill: C.warn });
        const off = txt(g, 690, y + 40, '離線', 24, { 'text-anchor': 'end', 'font-weight': 800, fill: C.warn });
        return { y, g, air, temp, off, acRect: ac.firstChild };
      });
      const broker = el('g', {}, B);
      el('circle', { r: 100, fill: '#0f2a2e', stroke: C.broker, 'stroke-width': 5 }, broker);
      txt(broker, 0, 12, 'Broker', 38, { 'text-anchor': 'middle', 'font-weight': 800, fill: C.broker });
      broker.setAttribute('transform', 'translate(1080,560)');
      const tele = el('g', {}, B);
      el('rect', { x: 1440, y: 260, width: 360, height: 580, rx: 34, fill: C.panel2, stroke: C.sub, 'stroke-width': 4 }, tele);
      el('rect', { x: 1462, y: 300, width: 316, height: 500, rx: 12, fill: '#0b1220' }, tele);
      txt(tele, 1620, 340, '老師的手機', 22, { 'text-anchor': 'middle', fill: C.muted });
      const subChip = txt(tele, 1620, 384, '訂閱 school/+/temp', 22, { 'text-anchor': 'middle', class: 't mono', fill: C.broker });
      const rowsP = [0, 1, 2].map(i => {
        const g = el('g', {}, tele);
        const y = 420 + i * 110;
        el('rect', { x: 1478, y, width: 284, height: 92, rx: 12, fill: C.panel }, g);
        txt(g, 1496, y + 36, `${101 + i}`, 26, { 'font-weight': 800, fill: C.ink });
        const v = txt(g, 1496, y + 74, '', 24, { fill: C.warn, 'font-weight': 700 });
        const btn = el('rect', { x: 1660, y: y + 22, width: 84, height: 48, rx: 24, fill: C.dim }, g);
        const bt = txt(g, 1702, y + 54, 'OFF', 20, { 'text-anchor': 'middle', fill: C.ink, 'font-weight': 700 });
        return { g, v, btn, bt };
      });
      const pubs = [0, 1, 2].map(() => chip(B, 'temp · QoS 0', C.pub, 16));
      const lost = txt(B, 900, 300, '少一筆：沒關係', 22, { 'text-anchor': 'middle', fill: C.muted });
      const cmd = chip(B, 'ac/set ON · QoS 1', C.sky, 16);
      const ack = txt(B, 930, 444, '✓ PUBACK', 20, { 'text-anchor': 'middle', fill: C.ok, 'font-weight': 700 });
      const lwt = chip(B, 'room103/status：offline', C.warn, 16);
      // phase C: limitations
      const Cg = el('g', {}, root);
      el('rect', { x: 300, y: 230, width: 1320, height: 600, rx: 28, fill: '#1a1410', stroke: C.pub, 'stroke-width': 2 }, Cg);
      txt(Cg, 360, 300, '限制與注意事項', 38, { 'font-weight': 800, fill: C.pub });
      const lim = [['Broker 是集中點', '一旦故障全部中斷 → 需要備援或叢集'], ['公開測試 Broker 任何人都能訂閱', '不可傳送私密或個人資料'], ['正式使用要加上安全機制', '帳號密碼＋TLS 加密（常用埠 8883）']].map(([a, b], i) => {
        const g = el('g', {}, Cg);
        warnIcon(g, 390, 384 + i * 140);
        txt(g, 430, 394 + i * 140, a, 34, { 'font-weight': 700, fill: C.ink });
        txt(g, 430, 440 + i * 140, b, 28, { fill: C.muted });
        return g;
      });
      return {
        draw(t) {
          const h01 = T('h0.1'), h11 = T('h1.1'), h12 = T('h1.2'), h13 = T('h1.3'), h21 = T('h2.1'), h22 = T('h2.2'), h31 = T('h3.1'), h32 = T('h3.2'), h41 = T('h4.1'), h42 = T('h4.2'), h43 = T('h4.3');
          show(A, fade(t, h01) * out(t, h11 - .4)); at(A, 0, (1 - fade(t, h01)) * 20);
          bubbles.forEach((b, i) => { const k = fade(t, h01 + 1.2 + i * .9); show(b, k); b.setAttribute('transform', `translate(${i % 2 ? 556 : 516},${430 + i * 34 - (1 - k) * 10})`); });
          const bk = fade(t, h11 - .1) * out(t, h41 - .5); show(B, bk);
          if (bk > 0) {
            rooms.forEach((r, i) => {
              const ki = fade(t, h11 + .2 + i * .2); show(r.g, ki);
              const on = i === 0 && t >= h21 + 2.3;
              show(r.air, on ? .6 + .4 * Math.sin(t * 6) : 0);
              set(r.acRect, { stroke: on ? C.sky : C.muted });
              const offline = i === 2 && t >= h22 + .8;
              show(r.off, offline ? 1 : 0); show(r.temp, offline ? .3 : 1);
            });
            // periodic publishes (every 2.2s, staggered) from h1.2
            pubs.forEach((p, i) => {
              const ph = t - (h12 + i * .5);
              const cyc = ph < 0 ? -1 : (ph % 2.4) / 1.4;
              const dead = (i === 1 && ph > 2.4 && ph < 4.8) || (i === 2 && t >= h22 + .8);
              const yy = rooms[i].y + 100;
              const k = ease.inOut(clamp(cyc));
              show(p, cyc >= 0 && cyc < 1 && !dead ? 1 - prog(k, .8, .2) : 0);   // absorbed before reaching the Broker label
              at(p, lerp(440, 960, k), lerp(yy - 44, 560, k), 1 - .5 * prog(k, .8, .2));
            });
            show(lost, fade(t, h13) * out(t, h21));
            const kc1 = ease.inOut(prog(t, h21 + .2, 1)), kc2 = ease.inOut(prog(t, h21 + 1.2, 1));
            show(cmd, (kc1 > 0 && kc1 < 1) || (kc2 > 0 && kc2 < 1) ? 1 : 0);
            if (kc1 < 1) at(cmd, lerp(1440, 1180, kc1), lerp(450, 520, kc1)); else at(cmd, lerp(980, 650, kc2), lerp(520, 360, kc2));
            show(ack, fade(t, h21 + 2.4) * out(t, h22 + .5));
            const kl = ease.inOut(prog(t, h22 + 1, 1.2)); show(lwt, kl > 0 && kl < 1 ? 1 : 0); at(lwt, lerp(1170, 1440, kl), lerp(600, 680, kl));
            show(subChip, fade(t, h31));
            rowsP.forEach((r, i) => {
              const shown = t >= h31 + 1 + i * .25;
              const offline = i === 2 && t >= h22 + 2.2;
              r.v.textContent = offline ? '離線' : shown ? `${[26.5, 27.8, 25.9][i]}°C` : (i === 2 && t >= h22 + 2.2 ? '離線' : '');
              if (i === 2 && t >= h22 + 2.2 && t < h31 + 1) r.v.textContent = '離線';
              const acOn = i === 0 && t >= h21 + .2;
              set(r.btn, { fill: acOn ? C.sky : C.dim }); r.bt.textContent = acOn ? 'ON' : 'OFF';
              show(r.g, i === 2 || i === 0 || t >= h31 + 1 ? 1 : .35);
            });
          }
          show(Cg, fade(t, h41 - .3));
          lim.forEach((g, i) => { const k = fade(t, [h41, h42, h43][i] + .1); show(g, k); at(g, (1 - k) * 30, 0); });
        },
        bounds(t) {
          if (t < T('h1.1') - .4) return [box('case-card', 360, 240, 1200, 520)];
          if (t < T('h4.1') - .5) return [box('classrooms', 110, 270, 640, 564), box('broker', 980, 460, 200, 200), box('teacher-phone', 1440, 260, 360, 580)];
          return [box('limits', 300, 230, 1320, 600)];
        },
      };
    },

    // ===== 展望 =====
    outlook(root, scene, project) {
      const T = timer(project);
      const card = (x, tag, tagColor, title, lines, foot) => {
        const g = el('g', {}, root);
        el('rect', { x, y: 220, width: 530, height: 420, rx: 24, fill: C.panel, stroke: tagColor, 'stroke-width': 2 }, g);
        const c = chip(g, tag, tagColor, 20); c.setAttribute('transform', `translate(${x + 30 + tag.length * 7 + 20},270)`);
        txt(g, x + 32, 350, title, 36, { 'font-weight': 800, fill: C.ink });
        lines.forEach((s, i) => { el('circle', { cx: x + 44, cy: 400 + i * 52, r: 6, fill: tagColor }, g); txt(g, x + 62, 409 + i * 52, s, 28, { fill: C.ink }); });
        txt(g, x + 32, 616, foot, 20, { fill: C.dim });
        return g;
      };
      const c1 = card(120, '已發布 2019', C.broker, 'MQTT 5.0', ['原因碼 Reason Codes', '共享訂閱 Shared Subs', '訊息到期 Expiry'], 'OASIS 標準，2019-03-07');
      const c2 = card(695, '已標準化 2023', C.ok, 'Sparkplug 3.0', ['建立在 MQTT 之上', '工業設備隨插即用', 'ISO/IEC 20237'], 'Eclipse Foundation 公告，2023-11');
      const c3 = card(1270, '實驗中', C.pub, 'MQTT over QUIC', ['以 QUIC 取代 TCP', '弱網路下更快重連', '尚非 OASIS 標準'], 'EMQX 5 文件標示為實驗功能');
      const band = el('g', {}, root);
      el('rect', { x: 120, y: 670, width: 1680, height: 170, rx: 24, fill: '#14101e', stroke: C.sub, 'stroke-width': 2 }, band);
      const dots = el('g', {}, band);
      for (let i = 0; i < 120; i++) el('circle', { cx: 160 + (i % 30) * 22, cy: 705 + Math.floor(i / 30) * 30, r: 6, fill: C.sub, opacity: .5 + .5 * ((i * 37) % 7) / 7 }, dots);
      txt(band, 880, 745, '待解挑戰：數以百萬計的裝置', 36, { 'font-weight': 800, fill: C.ink });
      txt(band, 880, 798, '安全（身分、加密、權限）與大規模管理', 28, { fill: C.muted });
      const asof = txt(root, 1800, 222 - 30, '資料截至 2026-10', 20, { 'text-anchor': 'end', fill: C.dim });
      return {
        draw(t) {
          [[c1, 'i1.1'], [c2, 'i2.1'], [c3, 'i3.1']].forEach(([c, id]) => { const k = fade(t, T(id) - .1, .5); show(c, k); at(c, 0, (1 - ease.out(k)) * 40); });
          show(band, fade(t, T('i3.3'))); show(dots, fade(t, T('i3.3') + .3));
          show(asof, fade(t, T('i1.1') + 1));
        },
        bounds() { return [box('cards', 120, 220, 1680, 420), box('challenge', 120, 670, 1680, 170)]; },
      };
    },

    // ===== 總結 =====
    recap(root, scene, project) {
      const T = timer(project);
      const P = [380, 470], B = [960, 470], S = [1540, 470];
      const g = el('g', {}, root);
      el('line', { x1: P[0] + 100, y1: P[1], x2: B[0] - 125, y2: B[1], stroke: C.line, 'stroke-width': 5 }, g);
      el('line', { x1: B[0] + 125, y1: B[1], x2: S[0] - 70, y2: S[1], stroke: C.line, 'stroke-width': 5 }, g);
      const pub = el('g', {}, g); icon.sensor(pub);
      const bro = el('g', {}, g); icon.broker(bro);
      const sub = el('g', {}, g); icon.phone(sub, '26.5°C');
      const kws = [[P, '發布者', '送到主題', C.pub], [B, 'Broker', '負責轉交', C.broker], [S, '訂閱者', '只收關心的', C.sub]].map(([p, a, b, c]) => {
        const k = el('g', {}, root);
        txt(k, p[0], p[1] + 190, a, 38, { 'text-anchor': 'middle', 'font-weight': 800, fill: c });
        txt(k, p[0], p[1] + 236, b, 30, { 'text-anchor': 'middle', fill: C.ink });
        return k;
      });
      const pk = packet(root, 'topic', 'data');
      const final = txt(root, 960, 270, '這，就是 MQTT', 64, { 'text-anchor': 'middle', 'font-weight': 800, fill: C.broker });
      return {
        draw(t) {
          const j11 = T('j1.1'), j12 = T('j1.2'), j13 = T('j1.3');
          show(g, fade(t, scene.start + .1));
          at(pub, P[0], P[1]); at(bro, B[0], B[1]); at(sub, S[0], S[1]);
          const times = [j11 + 1.2, j12, j12 + 1.6];
          kws.forEach((k, i) => { const p = fade(t, times[i]); show(k, p); at(k, 0, (1 - p) * 20); });
          const k1 = ease.inOut(prog(t, j11 + 1.4, 1.4)), k2 = ease.inOut(prog(t, j12 + .2, 1.4));
          show(pk, (k1 > 0 && k1 < 1) || (k2 > 0 && k2 < 1) ? 1 : 0);
          if (k1 < 1) at(pk, lerp(P[0] + 60, B[0] - 60, k1), P[1] - 90, .7); else at(pk, lerp(B[0] + 60, S[0] - 60, k2), P[1] - 90, .7);
          const fp = pop(t, j13, .6); show(final, fp.o); final.setAttribute('transform', `translate(960,250) scale(${fp.s}) translate(-960,-250)`);
        },
        bounds() { return [box('recap', 280, 360, 1360, 360)]; },
      };
    },
  });
})();
