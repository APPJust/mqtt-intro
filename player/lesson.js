// Frame-driven lesson engine. Every visible state is a pure function of (frame, subtitle track, caption toggle).
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const exporting = params.get('export') === '1';
  if (exporting) document.body.classList.add('export');

  // ---------- animation helpers (shared with scenes.js) ----------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, start, dur) => dur <= 0 ? (t >= start ? 1 : 0) : clamp((t - start) / dur);
  const ease = {
    inOut: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
    out: x => 1 - Math.pow(1 - x, 3),
    in: x => x * x * x,
    back: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  };
  function el(tag, attrs = {}, parent) {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') node.textContent = v; else node.setAttribute(k, v);
    }
    if (parent) parent.appendChild(node);
    return node;
  }
  function set(node, attrs) { for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); return node; }
  function show(node, opacity) { node.setAttribute('opacity', clamp(opacity).toFixed(3)); node.style.display = opacity <= 0.001 ? 'none' : ''; }
  function at(node, x, y, s = 1, r = 0) { node.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${s.toFixed(4)})`); }
  // pop-in: 0 → 1 with slight overshoot; returns {o, s}
  function pop(t, start, dur = .45) { const k = prog(t, start, dur); return { o: clamp(k * 2.2), s: k <= 0 ? .6 : lerp(.6, 1, ease.back(k)) }; }
  function fade(t, start, dur = .4) { return ease.out(prog(t, start, dur)); }
  function pointOn(path, k) { const len = path.getTotalLength(); const p = path.getPointAtLength(clamp(k) * len); return [p.x, p.y]; }
  window.L = { NS, el, set, show, at, pop, fade, prog, clamp, lerp, ease, pointOn };

  // ---------- engine ----------
  let project, frame = 0, track = params.get('subs') || 'en', captionOn = params.get('captions') !== '0';
  let playing = false, last = 0, audio = new Audio(), audioReady = false;
  const built = new Map();
  const total = () => Math.round(project.duration * project.fps);

  function scale() {
    if (!project) return;
    const shell = $('viewport').parentElement, cs = getComputedStyle(shell);
    const inner = shell.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const s = exporting ? 1 : Math.min(1, inner / project.width);
    $('stage').style.transform = `scale(${s})`;
    $('viewport').style.width = project.width * s + 'px';
    $('viewport').style.height = project.height * s + 'px';
  }
  function sceneAt(t) { return project.scenes.find(s => t >= s.start && t < s.end) || project.scenes.at(-1); }
  // marks may be numbers or "cueId[+/-offset]" strings that follow the real narration timing
  function resolveMark(v) {
    if (typeof v === 'number') return v;
    const m = /^([a-z]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)?$/.exec(v);
    if (!m) throw Error('Bad mark ' + v);
    const base = m[1].includes('.') ? project.cue_index[m[1]] : project.seg_index[m[1]];
    if (base === undefined) throw Error('Unknown cue ' + m[1]);
    return base + (m[2] ? Number(m[2]) : 0);
  }
  function build() {
    const art = $('art');
    for (const scene of project.scenes) {
      if (scene.marks) for (const k of Object.keys(scene.marks)) scene.marks[k] = resolveMark(scene.marks[k]);
      const factory = window.SCENES[scene.kind || scene.id];
      if (!factory) throw Error('No scene renderer for ' + (scene.kind || scene.id));
      const root = el('g', { id: 'scene-' + scene.id }, art);
      root.style.display = 'none';
      built.set(scene.id, { root, api: factory(root, scene, project) });
    }
  }
  function chapters() {
    const select = $('chapters'); select.replaceChildren();
    for (const s of project.scenes) {
      if (s.chapter_menu === false) continue;
      const o = document.createElement('option'); o.value = s.start; o.textContent = s.menu || s.title || s.id; select.append(o);
    }
  }
  function draw() {
    const t = frame / project.fps, s = sceneAt(t);
    for (const scene of project.scenes) {
      const b = built.get(scene.id);
      const fadeIn = scene.fade_in ?? .35, fadeOut = scene.fade_out ?? .3;
      const active = t >= scene.start - 1e-6 && t < scene.end;
      if (!active) { b.root.style.display = 'none'; continue; }
      b.root.style.display = '';
      const o = Math.min(prog(t, scene.start, fadeIn), scene.end >= project.duration ? 1 : 1 - prog(t, scene.end - fadeOut, fadeOut));
      b.root.setAttribute('opacity', o.toFixed(3));
      b.api.draw(t, scene);
    }
    // heading
    const hk = ease.out(prog(t, s.start + .1, .5));
    $('chapter').textContent = s.chapter || '';
    $('heading').textContent = s.title || '';
    for (const id of ['chapter', 'heading']) {
      $(id).style.opacity = hk; $(id).style.transform = `translateY(${(1 - hk) * 18}px)`;
      $(id).style.display = (s.title || s.chapter) ? '' : 'none';
    }
    // captions
    const cues = project.subtitle_tracks[track].cues;
    const cue = cues.find(c => t >= c.start && t < c.end);
    const visible = !!cue && captionOn && s.section !== 'credit';
    $('caption').style.display = visible ? 'flex' : 'none';
    $('cap1').textContent = cue ? cue.text[0] : '';
    $('cap2').textContent = cue ? cue.text[1] : '';
    $('cap2').lang = track === 'vi' ? 'vi' : 'en';
    $('progress-mark').style.width = (100 * t / project.duration) + '%';
    $('seek').value = frame;
    $('time').textContent = `${t.toFixed(1)} / ${project.duration.toFixed(1)} s`;
    $('chapters').value = [...$('chapters').options].map(o => o.value).filter(v => Number(v) <= t + 1e-6).at(-1) ?? '';
  }
  async function seekToFrame(n, subs = track) {
    if (!project.subtitle_tracks[subs]) throw Error('Unknown subtitle track ' + subs);
    track = subs; $('subs').value = track;
    frame = Math.max(0, Math.min(total() - 1, Math.round(n)));
    draw();
    if (!exporting && audioReady && Math.abs(audio.currentTime - frame / project.fps) > .15) audio.currentTime = frame / project.fps;
    return frame;
  }
  function setAudio() {
    audioReady = !!project.mix;
    if (project.mix) { audio.src = new URL(project.mix, projectUrl).href; audio.preload = 'auto'; }
  }
  function pause() { playing = false; audio.pause(); $('play').textContent = '播放'; }
  async function play() {
    if (frame >= total() - 1) await seekToFrame(0);
    playing = true; last = performance.now(); $('play').textContent = '暫停'; $('status').textContent = '';
    if (audioReady) {
      // currentTime is ignored until metadata is loaded; wait so playback resumes at the chosen frame
      if (audio.readyState < 1) await new Promise(r => audio.addEventListener('loadedmetadata', r, { once: true }));
      audio.currentTime = frame / project.fps;
      try { await audio.play(); } catch { pause(); $('status').textContent = '音軌無法播放，請確認以本機伺服器開啟並允許播放聲音。'; return; }
    }
    requestAnimationFrame(tick);
  }
  function tick(now) {
    if (!playing) return;
    const next = audioReady ? audio.currentTime * project.fps : frame + (now - last) * project.fps / 1000;
    last = now;
    if (next >= total() - 1) { seekToFrame(total() - 1); pause(); return; }
    frame = next; draw(); requestAnimationFrame(tick);
  }
  audio.addEventListener('ended', () => { if (playing) { seekToFrame(total() - 1); pause(); } });

  function bounds() {
    const t = frame / project.fps, s = sceneAt(t), b = built.get(s.id);
    return b && b.api.bounds ? b.api.bounds(t) : [];
  }
  const projectUrl = new URL(params.get('project') || '../project.json', location.href);
  const loaded = (async () => {
    const res = await fetch(projectUrl); if (!res.ok) throw Error('Cannot load project.json');
    project = await res.json();
    if (!project.subtitle_tracks[track]) track = Object.keys(project.subtitle_tracks)[0];
    await Promise.all([document.fonts.load('700 40px "Lesson TC"'), document.fonts.load('400 40px "Lesson Latin"'), document.fonts.load('700 40px "Lesson Latin"')]);
    await document.fonts.ready;
    if (![...document.fonts].some(f => f.family.includes('Lesson TC') && f.status === 'loaded')) throw Error('Lesson TC font failed to load');
    $('seek').max = total() - 1;
    build(); chapters(); setAudio(); scale();
    await seekToFrame(0, track);
    window.dispatchEvent(new CustomEvent('lesson-loaded', { detail: project }));
  })();
  loaded.catch(e => { $('status').textContent = '載入失敗：' + e.message; console.error(e); });

  window.lesson = {
    ready: async () => { await loaded; await document.fonts.ready; },
    seekToFrame, bounds, getProject: () => project,
    setCaptions: on => { captionOn = !!on; draw(); },
  };
  $('play').onclick = () => playing ? pause() : play();
  $('replay').onclick = async () => { pause(); await seekToFrame(0); await play(); };
  $('seek').oninput = () => { pause(); seekToFrame(Number($('seek').value)); };
  $('subs').onchange = () => seekToFrame(frame, $('subs').value);
  $('chapters').onchange = () => { const wasPlaying = playing; pause(); seekToFrame(Number($('chapters').value) * project.fps).then(() => wasPlaying && play()); };
  $('captions').onclick = () => {
    captionOn = !captionOn;
    $('captions').textContent = captionOn ? '字幕開啟' : '字幕關閉';
    $('captions').setAttribute('aria-pressed', String(captionOn)); draw();
  };
  document.addEventListener('keydown', e => {
    if (e.target.closest('input[type=text],textarea,select')) return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    if (e.code === 'ArrowRight') { pause(); seekToFrame(frame + 5 * project.fps); }
    if (e.code === 'ArrowLeft') { pause(); seekToFrame(frame - 5 * project.fps); }
  });
  window.addEventListener('resize', scale);
  // the vertical scrollbar appears after the lab renders; re-fit whenever the shell width changes
  if (window.ResizeObserver) new ResizeObserver(() => scale()).observe($('shell'));
})();
