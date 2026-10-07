// Scene renderers. Each factory builds SVG once; draw(t) sets every attribute from absolute time t.
(() => {
  const { el, set, show, at, pop, fade, prog, clamp, lerp, ease } = window.L;
  const C = { pub: '#f5a524', broker: '#2dd4bf', sub: '#8b7cf6', warn: '#f87171', ok: '#4ade80', sky: '#60a5fa',
              ink: '#eef3fa', muted: '#9db0c8', dim: '#5f7391', panel: '#16233a', panel2: '#1c2c48', line: '#2b3d5a', bg: '#0d1524' };

  // ---------- geometry ----------
  function quad(p0, c, p1) {
    return {
      d: `M${p0[0]},${p0[1]} Q${c[0]},${c[1]} ${p1[0]},${p1[1]}`,
      at: k => { const u = 1 - k; return [u * u * p0[0] + 2 * u * k * c[0] + k * k * p1[0], u * u * p0[1] + 2 * u * k * c[1] + k * k * p1[1]]; },
    };
  }
  const line = (p0, p1) => quad(p0, [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], p1);
  // dashed path that "draws on" from 0..1
  function drawOn(path, k, len = 1400) { set(path, { 'stroke-dasharray': `${len}`, 'stroke-dashoffset': `${(1 - clamp(k)) * len}` }); }

  // ---------- icons (all centred on 0,0) ----------
  const icon = {
    sensor(g, color = C.pub) {
      el('rect', { x: -86, y: -58, width: 172, height: 116, rx: 16, fill: C.panel2, stroke: color, 'stroke-width': 4 }, g);
      el('rect', { x: -60, y: -32, width: 56, height: 56, rx: 6, fill: '#0b1220', stroke: color, 'stroke-width': 2 }, g);
      el('text', { x: -32, y: 6, 'text-anchor': 'middle', class: 't mono', 'font-size': 16, fill: color, text: 'ESP32' }, g);
      for (let i = 0; i < 6; i++) el('rect', { x: -78 + i * 28, y: 50, width: 8, height: 16, fill: C.dim }, g);
      // thermometer
      el('rect', { x: 26, y: -36, width: 18, height: 52, rx: 9, fill: 'none', stroke: C.ink, 'stroke-width': 3 }, g);
      el('circle', { cx: 35, cy: 26, r: 14, fill: C.warn }, g);
      el('rect', { x: 31, y: -14, width: 8, height: 34, fill: C.warn }, g);
    },
    broker(g) {
      el('circle', { r: 124, fill: '#0f2a2e', stroke: C.broker, 'stroke-width': 5 }, g);
      el('circle', { r: 100, fill: 'none', stroke: C.broker, 'stroke-width': 1.5, 'stroke-dasharray': '6 10', opacity: .7 }, g);
      el('text', { y: -6, 'text-anchor': 'middle', class: 't', 'font-size': 46, 'font-weight': 800, fill: C.broker, text: 'Broker' }, g);
      el('text', { y: 38, 'text-anchor': 'middle', class: 't', 'font-size': 26, fill: C.ink, text: '訊息代理人' }, g);
    },
    phone(g, screen) {
      el('rect', { x: -52, y: -90, width: 104, height: 180, rx: 18, fill: C.panel2, stroke: C.sub, 'stroke-width': 4 }, g);
      el('rect', { x: -40, y: -70, width: 80, height: 130, rx: 6, fill: '#0b1220' }, g);
      el('circle', { cx: 0, cy: 74, r: 6, fill: C.dim }, g);
      return el('text', { y: 4, 'text-anchor': 'middle', class: 't', 'font-size': 26, 'font-weight': 700, fill: C.ink, text: screen || '' }, g);
    },
    web(g) {
      el('rect', { x: -100, y: -68, width: 200, height: 136, rx: 12, fill: C.panel2, stroke: C.sub, 'stroke-width': 4 }, g);
      el('rect', { x: -100, y: -68, width: 200, height: 26, rx: 12, fill: '#24365a' }, g);
      for (let i = 0; i < 3; i++) el('circle', { cx: -82 + i * 16, cy: -55, r: 5, fill: [C.warn, C.pub, C.ok][i] }, g);
      const chart = el('polyline', { points: '-80,40 -50,22 -20,30 10,6 40,14', fill: 'none', stroke: C.sub, 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
      const dot = el('circle', { cx: 72, cy: -14, r: 8, fill: C.broker }, g);
      return { chart, dot };
    },
    fan(g) {
      el('circle', { r: 62, fill: C.panel2, stroke: C.sub, 'stroke-width': 4 }, g);
      const blades = el('g', {}, g);
      for (let i = 0; i < 3; i++) el('ellipse', { cx: 0, cy: -26, rx: 13, ry: 28, fill: C.muted, transform: `rotate(${i * 120})` }, blades);
      el('circle', { r: 9, fill: C.ink }, g);
      return blades;
    },
  };

  // message packet: pill with topic + payload
  function packet(parent, topic, payload, color = C.pub) {
    const g = el('g', {}, parent);
    const w = Math.max(220, topic.length * 13 + 40);
    el('rect', { x: -w / 2, y: -38, width: w, height: 76, rx: 18, fill: '#1b1608', stroke: color, 'stroke-width': 3 }, g);
    el('text', { y: -6, 'text-anchor': 'middle', class: 't mono', 'font-size': 22, fill: color, text: topic }, g);
    el('text', { y: 26, 'text-anchor': 'middle', class: 't', 'font-size': 24, 'font-weight': 700, fill: C.ink, text: payload }, g);
    return g;
  }
  function chip(parent, txt, color, size = 22) {
    const g = el('g', {}, parent);
    // CJK / full-width glyphs are ~1em wide, Latin ~0.6em
    const w = [...txt].reduce((a, ch) => a + (/[⺀-￯]/.test(ch) ? 1.02 : .62), 0) * size + 32;
    el('rect', { x: -w / 2, y: -size, width: w, height: size * 2, rx: size, fill: C.bg, stroke: color, 'stroke-width': 2.5 }, g);
    el('text', { y: size * .36, 'text-anchor': 'middle', class: 't mono', 'font-size': size, fill: color, text: txt }, g);
    return g;
  }
  function label(parent, x, y, main, sub, color = C.ink, anchor = 'middle') {
    const g = el('g', {}, parent);
    el('text', { x, y, 'text-anchor': anchor, class: 't lbl', fill: color, text: main }, g);
    if (sub) el('text', { x, y: y + 32, 'text-anchor': anchor, class: 't sm', text: sub }, g);
    return g;
  }
  const box = (id, x, y, w, h, extra = {}) => ({ id, x, y, width: w, height: h, container: 'stage', ...extra });

  window.SCENES = {
    // ===== 原理 1：發布／訂閱 =====
    pubsub(root, scene) {
      const m = scene.marks;
      const P = [360, 500], B = [960, 500];
      const SUBS = [
        { id: 'phone', pos: [1500, 300], name: '手機', topic: 'school/room101/temp', match: true },
        { id: 'web', pos: [1500, 530], name: '網頁', topic: 'school/room101/temp', match: true },
        { id: 'fan', pos: [1500, 760], name: '風扇', topic: 'school/room101/fan', match: false },
      ];
      const wires = el('g', {}, root);
      const wPB = el('path', { d: line([P[0] + 90, P[1]], [B[0] - 128, B[1]]).d, fill: 'none', stroke: C.line, 'stroke-width': 5 }, wires);
      const subWires = SUBS.map(s => {
        const q = quad([B[0] + 118, B[1] + (s.pos[1] - B[1]) * .25], [B[0] + 300, s.pos[1]], [s.pos[0] - 110, s.pos[1]]);
        return { q, path: el('path', { d: q.d, fill: 'none', stroke: C.line, 'stroke-width': 5 }, wires) };
      });
      // publisher
      const pub = el('g', {}, root); icon.sensor(pub);
      const pubLbl = label(root, P[0], P[1] + 106, '發布者 Publisher', '溫度感測器', C.pub);
      const topicChip = chip(root, '主題：school/room101/temp', C.pub, 20);
      // broker + table
      const broker = el('g', {}, root); icon.broker(broker);
      const ring = el('circle', { cx: B[0], cy: B[1], r: 124, fill: 'none', stroke: C.broker, 'stroke-width': 6 }, root);
      const table = el('g', {}, root);
      el('rect', { x: 740, y: 662, width: 440, height: 186, rx: 14, fill: '#0b1a22', stroke: C.broker, 'stroke-width': 2 }, table);
      el('text', { x: 762, y: 698, class: 't', 'font-size': 22, 'font-weight': 700, fill: C.broker, text: '訂閱清單 Subscriptions' }, table);
      const rows = SUBS.map((s, i) => {
        const g = el('g', {}, table);
        const hl = el('rect', { x: 752, y: 712 + i * 44, width: 416, height: 38, rx: 8, fill: C.broker, opacity: 0 }, g);
        el('text', { x: 768, y: 739 + i * 44, class: 't', 'font-size': 22, 'font-weight': 700, fill: C.sub, text: s.name }, g);
        el('text', { x: 836, y: 739 + i * 44, class: 't mono', 'font-size': 22, fill: C.ink, text: s.topic }, g);
        return { g, hl };
      });
      // subscribers
      const subs = SUBS.map(s => {
        const g = el('g', {}, root);
        let screen = null, web = null, blades = null;
        if (s.id === 'phone') screen = icon.phone(g, '--');
        if (s.id === 'web') web = icon.web(g);
        if (s.id === 'fan') blades = icon.fan(g);
        const lbl = label(root, s.pos[0] + 130, s.pos[1] - 4, s.name, '訂閱者 Subscriber', C.sub, 'start');
        const req = chip(root, 'SUBSCRIBE', C.sub, 18);
        const no = el('text', { x: s.pos[0] + 130, y: s.pos[1] + 66, class: 't', 'font-size': 22, fill: C.dim, text: '✕ 沒訂閱這個主題' }, root);
        return { ...s, g, screen, web, blades, lbl, req, no };
      });
      const reqPaths = SUBS.map((s, i) => quad([s.pos[0] - 120, s.pos[1] + 40], [1290, 731 + i * 44], [1080, 731 + i * 44]));
      const msg = packet(root, 'school/room101/temp', '26.5 °C');
      const copies = [0, 1].map(() => packet(root, 'school/room101/temp', '26.5 °C'));
      // decoupling overlay
      const dq = quad([P[0] + 80, P[1] - 62], [930, 170], [1440, 260]);
      const direct = el('path', { d: dq.d, fill: 'none', stroke: C.warn, 'stroke-width': 4, opacity: .85 }, root);
      const directLbl = el('g', {}, root);
      el('text', { x: 1010, y: 328, 'text-anchor': 'middle', class: 't', 'font-size': 30, 'font-weight': 700, fill: C.warn, text: '直接連線？' }, directLbl);
      el('text', { x: 1010, y: 364, 'text-anchor': 'middle', class: 't', 'font-size': 24, fill: C.warn, text: '要知道對方位址？' }, directLbl);
      const cross = el('g', {}, root);
      el('path', { d: 'M-26,-26 L26,26 M26,-26 L-26,26', stroke: C.warn, 'stroke-width': 9, 'stroke-linecap': 'round' }, cross);
      const okLbl = el('text', { x: P[0], y: P[1] + 186, 'text-anchor': 'middle', class: 't', 'font-size': 28, 'font-weight': 700, fill: C.ok, text: '✓ 只需要認識 Broker' }, root);
      // optional intro words (full lesson only): 發布 ⇄ 訂閱, then a hint under the Broker
      const intro = el('g', {}, root);
      el('text', { x: 760, y: 530, 'text-anchor': 'end', class: 't', 'font-size': 96, 'font-weight': 800, fill: C.pub, text: '發布' }, intro);
      el('text', { x: 960, y: 524, 'text-anchor': 'middle', class: 't', 'font-size': 70, fill: C.muted, text: '⇄' }, intro);
      el('text', { x: 1160, y: 530, 'text-anchor': 'start', class: 't', 'font-size': 96, 'font-weight': 800, fill: C.sub, text: '訂閱' }, intro);
      el('text', { x: 960, y: 610, 'text-anchor': 'middle', class: 't', 'font-size': 34, fill: C.muted, text: 'Publish / Subscribe' }, intro);
      const hint = el('text', { x: B[0], y: B[1] + 180, 'text-anchor': 'middle', class: 't', 'font-size': 28, fill: C.broker, text: '所有裝置都只連到 Broker' }, root);

      return {
        draw(t) {
          const ik = m.intro === undefined ? 0 : fade(t, m.intro, .5) * (1 - fade(t, m.broker - .3, .3));
          show(intro, ik); at(intro, 0, (1 - fade(t, m.intro ?? -9, .5)) * 20);
          show(hint, m.hint === undefined ? 0 : fade(t, m.hint) * (1 - fade(t, m.subscribe, .3)));
          const pp = pop(t, m.pub), bp = pop(t, m.broker);
          show(pub, pp.o); at(pub, P[0], P[1], pp.s); show(pubLbl, fade(t, m.pub + .2));
          show(broker, bp.o); at(broker, B[0], B[1], bp.s);
          show(wPB, fade(t, m.broker + .3));
          // topic chip floats above the publisher
          const tc = fade(t, m.topic, .5); show(topicChip, tc * (1 - fade(t, m.publish, .3))); at(topicChip, P[0] + 40, P[1] - 104 - (1 - tc) * 20);
          // subscribers stagger in
          subs.forEach((s, i) => {
            const sp = pop(t, m.subs + i * .25);
            show(s.g, sp.o); at(s.g, s.pos[0], s.pos[1], sp.s); show(s.lbl, fade(t, m.subs + i * .25 + .15));
            show(subWires[i].path, fade(t, m.subs + i * .25 + .2));
            // SUBSCRIBE chip flies from the subscriber into its row of the Broker's table, then the row appears
            const k = ease.inOut(prog(t, m.subscribe + i * .45, 1.0));
            const [x, y] = reqPaths[i].at(k);
            show(s.req, k > 0 && k < 1 ? 1 - prog(k, .8, .2) : 0); at(s.req, x, y, lerp(1, .8, k));
            show(rows[i].g, fade(t, m.subscribe + i * .45 + 1.0, .3));
            if (s.blades) s.blades.setAttribute('transform', `rotate(${(t * 40) % 360})`);
            show(s.no, s.match ? 0 : fade(t, m.fanout + .2) * (1 - fade(t, m.decouple, .4)));
          });
          show(table, fade(t, m.subscribe + .6, .4));
          // publish: packet publisher -> broker
          const k1 = ease.inOut(prog(t, m.publish, 1.3));
          const [mx, my] = line([P[0] + 90, P[1]], [B[0] - 60, B[1]]).at(k1);
          // the packet is "absorbed" by the Broker over the last 20% so it never sits on the Broker label
          const absorb = prog(k1, .8, .2);
          show(msg, k1 > 0 && k1 < 1 ? 1 - absorb : 0); at(msg, mx, my - 70 * Math.sin(Math.PI * k1) * .4, lerp(.9, 1, k1) * (1 - .6 * absorb));
          // broker reaction: squash anticipation + ring pulse + matching rows
          const arr = m.publish + 1.3;
          const pulse = prog(t, arr, .7);
          set(ring, { r: 124 + pulse * 60, opacity: pulse > 0 && pulse < 1 ? (1 - pulse).toFixed(3) : 0 });
          const squash = t >= m.fanout - .35 && t < m.fanout ? Math.sin(Math.PI * prog(t, m.fanout - .35, .35)) : 0;
          at(broker, B[0], B[1], bp.s * (1 - .06 * squash));
          rows.forEach((r, i) => set(r.hl, { opacity: (SUBS[i].match ? .22 * fade(t, arr, .3) * (1 - fade(t, m.decouple, .5)) : 0).toFixed(3) }));
          // fan-out copies
          [0, 1].forEach(i => {
            const k = ease.inOut(prog(t, m.fanout + i * .12, 1.1));
            const [x, y] = subWires[i].q.at(k);
            show(copies[i], k > 0 && k < 1 ? 1 : 0); at(copies[i], x, y - 50, .82);
          });
          const got = t >= m.fanout + 1.1;
          subs[0].screen.textContent = got ? '26.5°C' : '--';
          show(subs[1].web.dot, got ? 1 : .25);
          // decoupling
          const dk = ease.inOut(prog(t, m.decouple, .9));
          show(direct, dk > 0 ? 1 : 0); drawOn(direct, dk, 1300);
          show(directLbl, fade(t, m.decouple + .5));
          const cp = pop(t, m.decouple + 1.1, .4); show(cross, cp.o); at(cross, 935, 250, cp.s);
          show(okLbl, fade(t, m.decouple + 1.4));
        },
        bounds(t) {
          const out = [box('publisher', P[0] - 90, P[1] - 60, 180, 120), box('broker', B[0] - 124, B[1] - 124, 248, 248),
                       box('sub-table', 740, 662, 440, 186)];
          SUBS.forEach(s => out.push(box('sub-' + s.id, s.pos[0] - 104, s.pos[1] - 92, 208, 184)));
          return out;
        },
      };
    },

    // ===== 片尾 =====
    credit(root) {
      const g = el('g', {}, root);
      el('rect', { x: 560, y: 330, width: 800, height: 380, rx: 36, fill: '#12223a', stroke: C.broker, 'stroke-width': 2, opacity: .9 }, g);
      el('text', { x: 960, y: 450, 'text-anchor': 'middle', class: 't', 'font-size': 30, fill: C.broker, 'letter-spacing': 10, text: '感謝觀看' }, g);
      const name = el('text', { x: 960, y: 580, 'text-anchor': 'middle', class: 't', 'font-size': 96, 'font-weight': 800, 'letter-spacing': 12, fill: C.ink, text: '李振偉老師' }, g);
      return {
        draw(t, s) { const k = ease.out(prog(t, s.start, .8)); at(g, 0, (1 - k) * 30); show(g, k); },
        bounds() { return [box('credit', 560, 330, 800, 380)]; },
      };
    },
  };
  window.SCENE_UTIL = { C, quad, line, icon, packet, chip, label, box, drawOn };
})();
