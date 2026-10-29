(function () {
  "use strict";
  const C = window.SITE_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmtT = (s) => { s = Math.max(0, s || 0); const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${m}:${String(r).padStart(2, "0")}`; };
  async function getJSON(url) {
    try { const r = await fetch(url, { cache: "no-cache" }); if (!r.ok) return null; return await r.json(); } catch (e) { return null; }
  }
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ICON = {
    play: '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z" fill="currentColor"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
  };

  /* =================== theme =================== */
  $("#theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("ta-theme", next); } catch (e) {}
  });

  /* =================== nav: top state + active section =================== */
  const nav = $(".topnav");
  const onScrollNav = () => nav.classList.toggle("at-top", window.scrollY < window.innerHeight * 0.6);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });
  const navLinks = $$("#navlinks a");
  const secIO = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("on", a.dataset.sec === en.target.id));
      const on = navLinks.find((a) => a.dataset.sec === en.target.id);
      if (on && on.scrollIntoView && window.innerWidth < 760) on.parentElement.scrollTo({ left: on.offsetLeft - 40, behavior: "smooth" });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["how", "real", "rsi", "benchmarks", "results", "bibtex"].forEach((id) => { const el = document.getElementById(id); if (el) secIO.observe(el); });
  $("#top") && new IntersectionObserver((e) => { if (e[0].isIntersecting) navLinks.forEach((a) => a.classList.remove("on")); }, { rootMargin: "-45% 0px -50% 0px" }).observe($("#top"));

  /* =================== scroll reveal (only ② and ④) =================== */
  const revIO = REDUCED ? null : new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); revIO.unobserve(en.target); } }), { rootMargin: "0px 0px -10% 0px" });
  function reveal(el) { if (!el || REDUCED) return; el.classList.add("reveal"); revIO.observe(el); }
  $$("#rsi .sec-head, #rsi .rsi-grid > *, #rsi .sub-h, .paper-figs").forEach(reveal);

  /* =================== lightbox =================== */
  const lb = $("#lightbox"), lbBody = $("#lb-body");
  let lbReturn = null;
  function openLightbox(src, t, poster, onClose) {
    lbBody.innerHTML = "";
    const v = document.createElement("video");
    v.src = src; v.controls = true; v.playsInline = true; v.autoplay = true; if (poster) v.poster = poster;
    v.addEventListener("loadedmetadata", () => { try { v.currentTime = t || 0; } catch (e) {} }, { once: true });
    lbBody.appendChild(v);
    lb.hidden = false; document.body.style.overflow = "hidden";
    lbReturn = onClose;
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
  }
  function closeLightbox() {
    const v = lbBody.querySelector("video"); const t = v ? v.currentTime : 0;
    lbBody.innerHTML = ""; lb.hidden = true; document.body.style.overflow = "";
    if (lbReturn) { lbReturn(t); lbReturn = null; }
  }
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb-close")) closeLightbox(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLightbox(); });

  /* =================== dashboard video index =================== */
  // Paths: a value with "/" is relative to the site root (e.g. data/real/x.mp4); a bare file name is relative to data/dash/.
  const resolve = (p, base) => (!p ? null : /^(https?:|\/|data\/|assets\/)/.test(p) ? p : (base || "data/dash/") + p);
  const pick = (o, keys) => { for (const k of keys) if (o[k] != null && o[k] !== "") return o[k]; return null; };
  function kindOf(c) {   // demo page: no failure kind (old "bad" values render as plain steps)
    if (c.kind) return c.kind === "bad" ? "step" : c.kind;
    const l = String(c.label || "");
    if (/recover|passed|success|done|fixed|✓/i.test(l)) return "good";
    return "step";
  }
  function normEntry(e) {
    const base = e._base || "data/dash/";
    const id = e.id;
    const hi = resolve(pick(e, ["video", "mp4", "file", "src", "video_1080", "mp4_1080"]), base) || (e.soon ? null : resolve(`${id}.mp4`, base));
    const lo = resolve(pick(e, ["video_960", "mp4_960", "file_960", "src_960", "web", "video_web"]), base) || (e.soon ? null : resolve(`${id}_960.mp4`, base));
    const poster = resolve(pick(e, ["poster", "jpg", "thumb", "image", "cover"]), base) || (e.soon ? null : resolve(`${id}.jpg`, base));
    const chapters = (Array.isArray(e.chapters) ? e.chapters : []).map((c) => ({ t: +c.t || 0, label: c.label || "", kind: kindOf(c), note: c.note || "" }));
    return { ...e, hi, lo, poster, chapters, type: e.type || "sim" };
  }
  async function loadIndex() {
    const [dash, real] = await Promise.all([getJSON(C.dash_index || "data/dash/index.json"), getJSON(C.real_index || "data/real/index.json")]);
    const list = [];
    const seen = new Set();
    const add = (arr, base) => (Array.isArray(arr) ? arr : (arr && Array.isArray(arr.items) ? arr.items : [])).forEach((e) => {
      if (!e || !e.id) return;
      if (seen.has(e.id)) {   // renderer entry wins; keep chapters from ours if theirs has none
        const old = list.find((x) => x.id === e.id);
        if (old && !old.chapters.length && e.chapters_file) old.chapters_file = e.chapters_file;
        return;
      }
      seen.add(e.id); list.push(normEntry({ ...e, _base: base }));
    });
    add(dash, "data/dash/");
    add(real, "data/real/");
    // chapters stored in a separate file
    await Promise.all(list.filter((e) => !e.chapters.length && e.chapters_file).map(async (e) => {
      const j = await getJSON(resolve(e.chapters_file, "data/"));
      const arr = Array.isArray(j) ? j : j && j.chapters;
      if (Array.isArray(arr)) e.chapters = arr.map((c) => ({ t: +c.t || 0, label: c.label || "", kind: kindOf(c), note: c.note || "" }));
    }));
    return list;
  }

  /* =================== DP: dashboard video player =================== */
  const players = new Set();
  function soonBox(title, text) {
    const d = document.createElement("div");
    d.className = "soon-box";
    d.innerHTML = `<div class="tap-soon-icon"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z"/></svg></div>
      <div class="tap-soon-title">${esc(title || "Video")}</div><div class="tap-soon-text">${esc(text || "Coming soon")}</div>`;
    return d;
  }
  function DP(container, e, opts = {}) {
    const root = document.createElement("div");
    root.className = "dp";
    const dur0 = +e.duration || 0;
    root.innerHTML = `
      ${opts.title ? `<div class="dp-title">${opts.title}</div>` : ""}
      <div class="dp-stage" title="Click to enlarge">
        <video muted playsinline preload="metadata" ${e.poster ? `poster="${esc(e.poster)}"` : ""}></video>
        ${e.speed ? `<span class="dp-speed">${esc(e.speed)}</span>` : ""}
        <button class="dp-zoom" type="button" aria-label="Enlarge video">${ICON.zoom}</button>
      </div>
      <div class="dp-ctrl">
        <button class="dp-btn dp-play" type="button" aria-label="Play / pause">${ICON.play}</button>
        <div class="dp-track" role="slider" aria-label="Seek" tabindex="0"><div class="dp-rail"></div><div class="dp-fill"></div><div class="dp-knob"></div></div>
        <span class="dp-time">0:00 / ${fmtT(dur0)}</span>
      </div>
      ${e.chapters.length ? `<div class="dp-chaps" role="list"></div><div class="dp-note"></div>` : ""}
      ${opts.caption ? `<div class="dp-cap">${opts.caption}</div>` : ""}`;
    container.appendChild(root);
    const v = root.querySelector("video"), stage = root.querySelector(".dp-stage"), btn = root.querySelector(".dp-play");
    const track = root.querySelector(".dp-track"), rail = root.querySelector(".dp-rail"), fill = root.querySelector(".dp-fill"), knob = root.querySelector(".dp-knob");
    const timeEl = root.querySelector(".dp-time"), chapBox = root.querySelector(".dp-chaps"), noteEl = root.querySelector(".dp-note");
    let userPaused = false, visible = false, dead = false, failed = false;
    const dur = () => (isFinite(v.duration) && v.duration > 0 ? v.duration : dur0 || 1);

    // sources: 1080 when the player is shown large (wide or high-DPI screens), else 960; fall back to the other, then opts.onMissing
    const wantHi = (container.clientWidth || 0) * (window.devicePixelRatio || 1) > 1000;
    const srcs = (wantHi ? [e.hi, e.lo] : [e.lo, e.hi]).filter(Boolean);
    let si = 0;
    v.addEventListener("error", () => {
      si++;
      if (si < srcs.length) { v.src = srcs[si]; return; }
      failed = true;
      root.remove(); players.delete(api);
      if (opts.onMissing) opts.onMissing(); else container.appendChild(soonBox(e.title, "Coming soon"));
    });
    if (srcs.length) v.src = srcs[0]; else { setTimeout(() => v.dispatchEvent(new Event("error")), 0); }
    // with opts.onEnded the section moves on to its next video; otherwise loop
    v.loop = !opts.onEnded;
    if (opts.onEnded) v.addEventListener("ended", () => { if (!dead) opts.onEnded(); });

    function buildChapters() {
      if (!e.chapters.length) return;
      const D = dur();
      rail.innerHTML = e.chapters.map((c, i) => {
        const a = c.t / D, b = (i + 1 < e.chapters.length ? e.chapters[i + 1].t : D) / D;
        return `<span class="dp-seg k-${c.kind}" style="left:${a * 100}%;width:${Math.max(0, b - a) * 100}%"></span>`;
      }).join("");
      chapBox.innerHTML = e.chapters.map((c, i) => `<button type="button" class="chap k-${c.kind}" data-i="${i}" role="listitem"><span class="ct">${fmtT(c.t)}</span><span class="cl2">${esc(c.label)}</span></button>`).join("");
      chapBox.querySelectorAll(".chap").forEach((b) => b.addEventListener("click", () => {
        const c = e.chapters[+b.dataset.i];
        v.currentTime = Math.min(c.t + 0.05, dur() - 0.1); userPaused = false; v.play().catch(() => {}); update();
      }));
    }
    let curChap = -1;
    function update() {
      const t = v.currentTime, D = dur();
      const p = clamp(t / D, 0, 1);
      fill.style.width = p * 100 + "%"; knob.style.left = p * 100 + "%";
      timeEl.textContent = `${fmtT(t)} / ${fmtT(D)}`;
      if (e.chapters.length) {
        let k = 0; e.chapters.forEach((c, i) => { if (t >= c.t - 0.01) k = i; });
        if (k !== curChap) {
          curChap = k;
          chapBox.querySelectorAll(".chap").forEach((b, i) => b.classList.toggle("on", i === k));
          const c = e.chapters[k];
          noteEl.innerHTML = c.note ? `<b>${esc(c.label)}</b> · ${esc(c.note)}` : `<b>${esc(c.label)}</b>`;
          const cb = chapBox.querySelector(`.chap[data-i="${k}"]`);
          if (cb && chapBox.scrollWidth > chapBox.clientWidth + 4) chapBox.scrollTo({ left: cb.offsetLeft - chapBox.clientWidth / 2 + cb.clientWidth / 2, behavior: "smooth" });
        }
      }
    }
    v.addEventListener("loadedmetadata", () => { buildChapters(); update(); if (opts.start) v.currentTime = opts.start; });
    v.addEventListener("timeupdate", update);
    v.addEventListener("play", () => (btn.innerHTML = ICON.pause));
    v.addEventListener("pause", () => (btn.innerHTML = ICON.play));
    if (e.chapters.length) buildChapters();
    btn.addEventListener("click", () => { if (v.paused) { userPaused = false; v.play().catch(() => {}); } else { userPaused = true; v.pause(); } });
    // seek
    const seekAt = (x) => { const r = track.getBoundingClientRect(); v.currentTime = clamp((x - r.left) / r.width, 0, 1) * dur(); update(); };
    let drag = false;
    track.addEventListener("pointerdown", (ev) => { drag = true; track.setPointerCapture(ev.pointerId); seekAt(ev.clientX); });
    track.addEventListener("pointermove", (ev) => { if (drag) seekAt(ev.clientX); });
    track.addEventListener("pointerup", () => (drag = false));
    track.addEventListener("keydown", (ev) => { if (ev.key === "ArrowRight") v.currentTime += 5; if (ev.key === "ArrowLeft") v.currentTime -= 5; });
    // enlarge
    const enlarge = () => {
      const wasPlaying = !v.paused; v.pause();
      openLightbox(e.hi || e.lo, v.currentTime, e.poster, (t) => { try { v.currentTime = t; } catch (x) {} if (wasPlaying && visible) v.play().catch(() => {}); });
    };
    stage.addEventListener("click", enlarge);
    // autoplay only while visible
    const io = new IntersectionObserver((ents) => {
      visible = ents[0].isIntersecting;
      if (dead || failed) return;
      if (visible && !userPaused && opts.autoplay !== false && !REDUCED) v.play().catch(() => {});
      else if (!visible) v.pause();
    }, { threshold: 0.35 });
    io.observe(stage);
    const api = { el: root, video: v, destroy() { dead = true; io.disconnect(); v.pause(); v.removeAttribute("src"); v.load(); root.remove(); players.delete(api); } };
    players.add(api);
    return api;
  }

  /* =================== ① hero =================== */
  function renderAuthors() {
    const box = $("#authors");
    { const v = C.ANON ? C.venue_anon : (C.venue_public || ""); $("#venue").textContent = v; $("#venue").hidden = !v; }
    if (C.ANON || !(C.authors || []).length) {   // no names yet: affiliations only
      box.innerHTML = (C.SHOW_AFF_WHEN_ANON || !C.ANON) && Object.keys(C.affiliations || {}).length
        ? `<div class="aff-line aff-only">${Object.values(C.affiliations).map((v) => `<span>${esc(v)}</span>`).join("")}</div>`
        : `<div class="author-line">Anonymous Authors</div>`;
      return;
    }
    const names = C.authors.map((a) => {
      const sup = a.aff.join(",") + (a.corresponding ? "*" : "");
      const n = a.url ? `<a href="${esc(a.url)}">${esc(a.name)}</a>` : esc(a.name);
      return `<span class="author">${n}<sup>${sup}</sup></span>`;
    }).join("");
    const affs = Object.entries(C.affiliations).map(([k, v]) => `<span><sup>${k}</sup>${esc(v)}</span>`).join("");
    box.innerHTML = `<div class="author-line">${names}</div><div class="aff-line">${affs}</div><div class="aff-note"><sup>*</sup>Corresponding author</div>`;
  }
  const LICON = {
    paper: '<path d="M6 2h9l5 5v15H6z M14 2v6h6" />',
    arxiv: '<path d="M4 4l16 16M20 4L4 20" />',
    code: '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6" />',
    gitcode: '<path d="M6 3v12M18 9a3 3 0 1 0 0-.01M6 21a3 3 0 1 0 0-.01M18 12c0 4-6 3-12 6" />',
    weights: '<path d="M12 3v12M6 9l6 6 6-6M4 21h16" />',
    bibtex: '<path d="M5 4h14v16H5zM9 8h6M9 12h6M9 16h3" />',
  };
  const live = (u) => !!u && u !== "#";
  function renderLinks(sel) {
    const defs = [
      ["paper", "Paper", C.links.paper, C.ANON ? false : !live(C.links.paper)],
      ["arxiv", "arXiv", C.links.arxiv, !live(C.links.arxiv)],
      ["code", "Code", C.links.code, !live(C.links.code)],
      ...(C.links.gitcode ? [["gitcode", "GitCode", C.links.gitcode, false]] : []),
      ["weights", "Weights", C.links.weights, !live(C.links.weights)],
      ...(C.SHOW_BIBTEX === false ? [] : [["bibtex", "BibTeX", "#bibtex", false]]),
    ];
    $(sel).innerHTML = defs.map(([k, label, href, disabled], i) => {
      const icon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${LICON[k]}</svg>`;
      if (disabled) return `<span class="btn btn-disabled" title="Coming soon">${icon}${label}<small>soon</small></span>`;
      return `<a class="btn${i === 0 ? " primary" : ""}" href="${esc(href)}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ""}>${icon}${label}</a>`;
    }).join("");
  }
  function countUp() {
    const box = $("#hero-stats");
    if (REDUCED) { box.classList.add("in"); return; }
    $$("[data-count]", box).forEach((el) => { const f = el.dataset.from != null ? +el.dataset.from : 0; el.textContent = (+f).toFixed(+el.dataset.dec); });
    requestAnimationFrame(() => box.classList.add("in"));
    $$("[data-count]", box).forEach((el) => {
      const to = +el.dataset.count, from = el.dataset.from != null ? +el.dataset.from : 0, dec = +el.dataset.dec;
      const d = +getComputedStyle(el.closest(".hstat")).getPropertyValue("--d") || 0;
      const delay = 350 + d * 350 + (el.dataset.from != null && el.previousElementSibling ? 500 : 0), T = 1400;
      const t0 = performance.now() + delay;
      const step = (now) => {
        const p = clamp((now - t0) / T, 0, 1), q = 1 - Math.pow(1 - p, 3);
        el.textContent = (from + (to - from) * q).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  function heroVideo(entry) {
    const v = $("#hero-video");
    if (!entry) return;
    if (entry.poster) v.poster = entry.poster;
    if (REDUCED) return;                       // static poster only
    v.src = entry.lo || entry.hi;
    const [a, b] = Array.isArray(entry.loop) ? entry.loop : [0, 0];
    v.addEventListener("loadedmetadata", () => { v.playbackRate = 0.5; if (a) v.currentTime = a; }, { once: true });   // slowed: calm backdrop
    if (b) v.addEventListener("timeupdate", () => { if (v.currentTime >= b) v.currentTime = a; });
    v.addEventListener("error", () => v.removeAttribute("src"));
    new IntersectionObserver((en) => { if (en[0].isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.05 }).observe($("#top"));
  }

  /* =================== ② how it works =================== */
  function initHow() {
    const track = $("#how-track"), stage = $("#how-stage");
    const panels = $$(".how-panel", stage), steps = $$(".how-step"), dots = $$("#how-dots i");
    const nodes = $$(".node", stage);
    const hv = $("#hv-label");
    const VER = ["harness H₁", "harness H₇", "harness H₁₆", "harness H*"];
    let cur = -1;
    const set = (k) => {
      if (k === cur) return; cur = k;
      stage.dataset.step = k;
      panels.forEach((p, i) => { p.classList.toggle("on", i === k); p.classList.toggle("done", i < k); });
      steps.forEach((s, i) => s.classList.toggle("on", i === k));
      dots.forEach((d, i) => d.classList.toggle("on", i === k));
    };
    if (REDUCED) { panels.forEach((p) => p.classList.add("on")); steps.forEach((s) => s.classList.add("on")); hv.textContent = "H₁ → H*"; return; }
    // auto-advance the three stages (loop) while the section is on screen; click a stage to jump
    const DUR = [6000, 4500, 4500];
    let timer = null, visible = false;
    const next = () => { clearTimeout(timer); if (!visible) return; timer = setTimeout(() => { set((cur + 1) % 3); next(); }, DUR[Math.max(0, cur)]); };
    set(0);
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) next(); else clearTimeout(timer); }, { threshold: 0.3 }).observe(stage);
    [...panels, ...steps].forEach((el, i) => { el.style.cursor = "pointer"; el.addEventListener("click", () => { set(i % 3); next(); }); });
    // RSI loop: one clock drives both the orbiting dot and the node highlight, so a node is lit while the dot passes over it
    // (nodes clockwise from the top: Paired A/B, Accept, Read, Propose); harness version ticks up at "Accept"
    const orbit = $(".orbit", stage), LAP = 6000;
    let lastIdx = -1, lap = 0, t0 = performance.now();
    const tick = (now) => {
      if (!document.hidden) {
        const ph = ((now - t0) % LAP) / LAP;
        if (orbit) orbit.setAttribute("transform", `rotate(${(ph * 360).toFixed(2)} 160 150)`);
        const idx = Math.floor(ph * 4 + 0.5) % 4;   // lit while the dot is within ±45° of the node
        if (idx !== lastIdx) {
          lastIdx = idx;
          nodes.forEach((nd, i) => nd.classList.toggle("hot", i === idx));
          if (idx === 1) { lap = (lap + 1) % VER.length; hv.textContent = VER[lap]; }
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* =================== ③ real robot =================== */
  const REAL_CAPTION_FALLBACK = "TinyAstral-4B closed loop on a real arm.";
  function renderReal(index) {
    const main = $("#real-main"), cards = $("#real-cards");
    let reals = index.filter((e) => e.type === "real");
    if (!reals.length) {   // legacy TAPlayer slots
      C.real.forEach((slot) => { const d = document.createElement("div"); main.appendChild(d); TAPlayer.mount(d, slot.dir, { comingSoonTitle: slot.title, comingSoonText: "Real-robot video — coming soon" }); });
      return;
    }
    reals = reals.filter((e) => !e.soon);   // only finished episodes; no "Coming soon" placeholders
    const playable = reals;
    cards.style.setProperty("--ncards", Math.max(1, reals.length));
    let player = null;
    const select = (e) => {
      cards.querySelectorAll(".rcard").forEach((c) => c.setAttribute("aria-selected", c.dataset.id === e.id));
      if (player) player.destroy();
      main.innerHTML = "";
      player = DP(main, e, { caption: esc(e.caption || REAL_CAPTION_FALLBACK), onMissing: () => main.appendChild(soonBox(e.title, "Video coming soon")),
        onEnded: playable.length > 1 ? () => select(playable[(playable.indexOf(e) + 1) % playable.length]) : null });
    };
    cards.innerHTML = reals.map((e) => e.soon
      ? `<div class="rcard soon" data-id="${esc(e.id)}"><div class="rsoon-img">Coming soon</div><div><b>${esc(e.title || "New real-robot episode")}</b><small>Coming soon</small></div></div>`
      : `<button type="button" class="rcard" role="tab" data-id="${esc(e.id)}"><img src="${esc(e.poster || "")}" alt="" loading="lazy"><div><b>${esc(e.title)}</b><small>${e.duration ? fmtT(e.duration) + " · " : ""}${e.chapters.length} chapters</small></div></button>`).join("");
    cards.querySelectorAll("button.rcard").forEach((b) => b.addEventListener("click", () => select(playable.find((x) => x.id === b.dataset.id))));
    if (playable.length) select(playable[0]); else main.appendChild(soonBox("Real robot", "Coming soon"));
  }

  /* =================== ④ RSI curve (drawn with scroll) =================== */
  // From Paper/latex/tables/tab_transfer.tex (Table 1): strict success (%) on the same 500 RoboTwin episodes.
  const VERS = ["H₁", "H₇", "H₁₆", "H*"];
  const SERIES = [
    { name: "Qwen3.8-Flash-Next teacher (~180B)", key: "teacher", v: [33.4, 49.4, 60.4, 63.6] },
    { name: "DeepSeek-V4.1-Flash (552B)", key: "ds", v: [32.8, 45.0, 57.6, 63.4], dash: "6 4" },
    { name: "Qwen3.5-4B, untrained", key: "base", v: [14.6, 28.6, 33.8, 41.2] },
    { name: "TinyAstral-4B (distilled per version)", key: "student", v: [36.2, 49.8, 60.0, 62.8], wide: true },
  ];
  function renderCurve() {
    const W = 600, H = 340, L = 44, R = 46, T = 16, B = 42;
    const x = (i) => L + (i * (W - L - R)) / (VERS.length - 1);
    const y = (v) => T + (1 - v / 70) * (H - T - B);
    let g = `<defs><clipPath id="rsiClip"><rect id="rsiClipR" x="0" y="0" width="${W}" height="${H}"/></clipPath><clipPath id="rsiLinkClip"><rect id="rsiLinkR" x="0" y="0" width="${W}" height="${H}"/></clipPath></defs>`;
    for (let v = 0; v <= 70; v += 10) g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="tick" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    VERS.forEach((vv, i) => (g += `<text class="tick vtick" data-i="${i}" x="${x(i)}" y="${H - B + 20}" text-anchor="middle">${vv}</text>`));
    g += `<text class="axis-lbl" x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">accepted harness version (Stage 1 RSI)</text>`;
    g += `<line class="ref" x1="${L}" x2="${W - R}" y1="${y(53.2)}" y2="${y(53.2)}"/><text class="ref-lbl" x="${L + 6}" y="${y(53.2) - 6}">GPT-6 Astra zero-shot (published) 53.2</text>`;
    g += `<g clip-path="url(#rsiClip)">`;
    const poly = (s, extra) => `<polyline class="ln ln-${s.key}${s.wide ? " wide" : ""}${extra}" points="${s.v.map((v, i) => `${x(i)},${y(v)}`).join(" ")}" ${s.dash ? `stroke-dasharray="${s.dash}"` : ""}/>`;
    // faint underlay shows the not-yet-reached part when the curve is linked to the star map
    g += `<g class="ln-under">${SERIES.map((s) => poly(s, " under")).join("")}</g>`;
    g += `<g clip-path="url(#rsiLinkClip)">${SERIES.map((s) => poly(s, "")).join("")}</g>`;
    g += `</g>`;
    SERIES.forEach((s) => s.v.forEach((v, i) => (g += `<circle class="pt pt-${s.key}" data-i="${i}" cx="${x(i)}" cy="${y(v)}" r="${s.wide ? 5 : 4}"><title>${s.name} · ${VERS[i]}: ${v}%</title></circle>`)));
    const endLbl = [["teacher", 63.6, -8, "63.6"], ["student", 62.8, 13, "62.8"], ["base", 41.2, 4, "41.2"]];
    endLbl.forEach(([k, v, dy, t]) => (g += `<text class="end-lbl lbl-${k}" data-i="3" x="${x(3) + 10}" y="${y(v) + dy}">${t}</text>`));
    g += `<text class="end-lbl lbl-teacher" data-i="0" x="${x(0) + 12}" y="${y(33.4) + 19}">33.4</text>`;
    g += `<text class="end-lbl lbl-student" data-i="0" x="${x(0) + 6}" y="${y(36.2) - 10}">36.2</text>`;
    $("#rsi-curve").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Success rate of four planners across harness versions H1 to H*">${g}</svg>`;
    $("#rsi-legend").innerHTML = SERIES.map((s) => `<span class="lg"><i class="sw sw-${s.key}${s.dash ? " dash" : ""}"></i>${s.name}</span>`).join("");
    const clipR = $("#rsiClipR"), card = $("#rsi-chart-card");
    const pts = $$("#rsi-curve .pt, #rsi-curve .end-lbl");
    const draw = (p) => {
      const edge = L + p * (W - L - R);
      clipR.setAttribute("width", edge + 6);
      pts.forEach((el) => el.classList.toggle("hide", x(+el.dataset.i) > edge + 0.5));
    };
    // linkage with the capability star map: phase key in which each version was accepted
    const VKEY = ["S3", "S5", "C5", "MERGE"];
    const linkR = $("#rsiLinkR"), svgC = $("#rsi-curve svg"), lnUnder = $("#rsi-curve .ln-under");
    const linkEls = $$("#rsi-curve .pt, #rsi-curve .end-lbl, #rsi-curve .vtick");
    let linked = VERS.length - 1;
    const pulse = (i) => {
      linkEls.filter((el) => +el.dataset.i === i).forEach((el) => { el.classList.remove("pulse"); void el.getBoundingClientRect(); el.classList.add("pulse"); });
    };
    window.addEventListener("caps-phase", (ev) => {
      const { key, order, silent } = ev.detail, at = order[key];
      let vi = -1;
      VKEY.forEach((k, i) => { if (order[k] != null && order[k] <= at) vi = i; });
      // the bright segment runs to the reached version; beyond it only the faint underlay is visible
      linkR.setAttribute("width", vi < 0 ? 0 : x(vi) + 6);
      lnUnder.classList.toggle("on", vi < VERS.length - 1);
      linkEls.forEach((el) => el.classList.toggle("dim", +el.dataset.i > vi));
      svgC.classList.toggle("linked", vi < VERS.length - 1);
      if (!silent && vi > linked && vi >= 0) pulse(vi);
      linked = vi;
    });
    if (REDUCED) { draw(1); return; }
    const onScroll = () => {
      const r = card.getBoundingClientRect(), vh = window.innerHeight;
      draw(clamp((vh * 0.95 - r.top) / (vh * 0.45), 0, 1));
    };
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", onScroll); onScroll();
  }

  /* =================== ④ capability star map =================== */
  const CATS = ["tool", "primitive", "perception", "memory", "protocol", "prompt", "infra"];
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
  async function renderCaps() {
    const box = $("#caps");
    const data = await getJSON("data/capabilities.json");
    if (!data) { box.appendChild(soonBox("Capability map", "Coming soon")); return; }
    const phases = data.phases, items = data.items;
    const pIdx = Object.fromEntries(phases.map((p, i) => [p.key, i]));
    const short = (p, i) => (p.label.startsWith("Phase") ? "P" + p.label.split(" ")[1] : p.label.startsWith("Cycle") ? "C" + p.label.split(" ")[1] : "M");
    // geometry: column width grows with the number of candidates in the phase
    const W = 620, LANE = 74, T = 6, laneH = 34, H = T + CATS.length * laneH + 24;
    const counts = phases.map((p) => items.filter((it) => it.phase === p.key).length);
    const wts = counts.map((c) => Math.max(1, Math.sqrt(c)));
    const sumW = wts.reduce((a, b) => a + b, 0), avail = W - LANE - 4;
    const colX = []; let acc = LANE;
    wts.forEach((w) => { colX.push(acc); acc += (w / sumW) * avail; });
    const colW = wts.map((w) => (w / sumW) * avail);
    // place stars: phyllotaxis inside each (phase, category) cell
    const cells = {};
    items.forEach((it, k) => { const key = it.phase + "|" + it.cat; (cells[key] = cells[key] || []).push(k); });
    const pos = new Array(items.length);
    Object.entries(cells).forEach(([key, ks]) => {
      const [ph, cat] = key.split("|");
      const pi = pIdx[ph], li = Math.max(0, CATS.indexOf(cat));
      const cx = colX[pi] + colW[pi] / 2, cy = T + li * laneH + laneH / 2;
      const maxR = Math.min(colW[pi], laneH) / 2 - 2.5;
      const s = ks.length > 1 ? Math.min(4.2, maxR / Math.sqrt(ks.length)) : 0;
      ks.sort((a, b) => (items[a].fate === "rejected") - (items[b].fate === "rejected"));
      ks.forEach((k, j) => {
        const r = s * Math.sqrt(j + 0.5), a = j * 2.39996 + hash(key) * 6.28;
        pos[k] = [cx + r * Math.cos(a) * (colW[pi] / Math.max(colW[pi], laneH)), cy + r * Math.sin(a)];
      });
    });
    const fateCls = (it) => it.fate === "adopted" ? (it.in_final ? "f-adopted" : "f-side") : "f-" + it.fate;
    const rad = (it) => it.fate === "adopted" || it.fate === "superseded" ? 2.4 : 1.5;
    let g = "";
    phases.forEach((p, i) => { g += `<rect class="sm-col" data-p="${i}" x="${colX[i]}" y="${T}" width="${colW[i]}" height="${CATS.length * laneH}" rx="3"/>`; });
    CATS.forEach((c, li) => {
      const yy = T + li * laneH;
      g += `<line class="sm-grid" x1="${LANE - 4}" x2="${W}" y1="${yy + laneH}" y2="${yy + laneH}"/>`;
      g += `<text class="sm-lane" x="0" y="${yy + laneH / 2 + 3}">${c}</text>`;
    });
    phases.forEach((p, i) => { g += `<text class="sm-ph" data-p="${i}" x="${colX[i] + colW[i] / 2}" y="${H - 8}">${short(p, i)}</text>`; });
    // lineage: connect consecutive adopted stars of the same category
    CATS.forEach((c) => {
      const ks = items.map((it, k) => k).filter((k) => items[k].cat === c && (items[k].fate === "adopted" || items[k].fate === "superseded") && items[k].in_final)
        .sort((a, b) => pIdx[items[a].phase] - pIdx[items[b].phase]);
      for (let j = 1; j < ks.length; j++) {
        const a = pos[ks[j - 1]], b = pos[ks[j]];
        if (pIdx[items[ks[j - 1]].phase] === pIdx[items[ks[j]].phase]) continue;
        g += `<line class="lineage star-l" data-p="${pIdx[items[ks[j]].phase]}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;
      }
    });
    items.forEach((it, k) => { g += `<circle class="star ${fateCls(it)}" data-k="${k}" data-p="${pIdx[it.phase]}" cx="${pos[k][0].toFixed(1)}" cy="${pos[k][1].toFixed(1)}" r="${rad(it)}"/>`; });

    box.innerHTML = `
      <div class="caps-top">
        <div class="caps-phase"><b id="caps-label"></b><div id="caps-desc" class="muted"></div></div>
        <div class="caps-stats" id="caps-stats"></div>
      </div>
      <div class="starmap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Capability star map: every candidate harness edit by phase and category">${g}</svg><div class="sm-tip" id="sm-tip"></div></div>
      <div class="caps-ctrl">
        <button class="dp-btn" id="caps-play" type="button" aria-label="Play / pause">${ICON.play}</button>
        <input type="range" id="caps-range" min="0" max="${phases.length - 1}" value="${phases.length - 1}" step="1" aria-label="RSI phase">
      </div>
      <div class="caps-legend"><span><i class="cl a"></i>adopted, in final harness</span><span><i class="cl s"></i>adopted, later superseded</span><span><i class="cl b"></i>adopted on a side branch</span><span><i class="cl r"></i>rejected / undecided</span></div>
      <div class="caps-foot">Each dot is one candidate edit. Over the whole run: 296 candidates, 121 adopted, 16 adopted and later superseded, 142 rejected, 17 undecided; the final harness holds 101.</div>`;
    const svg = box.querySelector("svg"), range = $("#caps-range"), tip = $("#sm-tip"), playB = $("#caps-play");
    const stars = $$(".star", svg), lines = $$(".star-l", svg), cols = $$(".sm-col", svg), phl = $$(".sm-ph", svg);
    const draw = () => {
      const k = +range.value, p = phases[k];
      $("#caps-label").textContent = p.label;
      $("#caps-desc").textContent = p.desc;
      stars.forEach((s) => { const pp = +s.dataset.p; s.classList.toggle("off", pp > k); s.classList.toggle("fresh", pp === k); });
      lines.forEach((l) => l.classList.toggle("off", +l.dataset.p > k));
      lines.forEach((l) => (l.style.opacity = +l.dataset.p > k ? 0 : ""));
      cols.forEach((c) => c.classList.toggle("cur", +c.dataset.p === k));
      phl.forEach((c) => c.classList.toggle("cur", +c.dataset.p === k));
      const upto = items.filter((it) => pIdx[it.phase] <= k);
      const n = (f) => upto.filter(f).length;
      window.dispatchEvent(new CustomEvent("caps-phase", { detail: { key: p.key, order: pIdx, silent: !!draw.silent } }));
      $("#caps-stats").innerHTML = `<div><b>${upto.length}</b><span>proposed</span></div><div class="s-ad"><b>${n((x) => x.fate === "adopted")}</b><span>adopted</span></div><div><b>${n((x) => x.fate === "superseded")}</b><span>superseded</span></div><div class="s-rj"><b>${n((x) => x.fate === "rejected")}</b><span>rejected</span></div><div class="s-rj"><b>${n((x) => x.fate === "undecided")}</b><span>undecided</span></div>`;
    };
    // autoplay loops: after the last phase hold 1.5 s, then restart from phase 0
    let timer = null, hold = null, userPaused = false, inView = false;
    const LAST = phases.length - 1;
    const stop = () => { clearInterval(timer); clearTimeout(hold); timer = hold = null; playB.innerHTML = ICON.play; };
    const tick = () => {
      if (+range.value >= LAST) {
        clearInterval(timer); timer = null;
        hold = setTimeout(() => { hold = null; range.value = 0; draw(); timer = setInterval(tick, 700); }, 1500);
        return;
      }
      range.value = +range.value + 1; draw();
    };
    const play = () => {
      stop(); if (+range.value >= LAST) { range.value = 0; draw(); }
      playB.innerHTML = ICON.pause;
      timer = setInterval(tick, 700);
    };
    const running = () => !!(timer || hold);
    range.addEventListener("input", () => { userPaused = true; stop(); draw(); });
    playB.addEventListener("click", () => { if (running()) { userPaused = true; stop(); } else { userPaused = false; play(); } });
    // tooltip
    svg.addEventListener("pointermove", (ev) => {
      const s = ev.target.closest && ev.target.closest(".star");
      if (!s || s.classList.contains("off")) { tip.classList.remove("show"); return; }
      const it = items[+s.dataset.k], ph = phases[pIdx[it.phase]];
      const fate = it.fate === "adopted" ? (it.in_final ? "adopted · in final harness" : "adopted · side branch") : it.fate === "superseded" ? "adopted · later superseded" : it.fate;
      tip.innerHTML = `<small>${esc(it.cat)} · ${esc(ph.label)} · ${esc(fate)}</small>${it.name ? esc(it.name) : `<span class="muted">${it.fate} candidate (name not listed)</span>`}`;
      const r = box.querySelector(".starmap").getBoundingClientRect();
      let lx = ev.clientX - r.left + 12, ly = ev.clientY - r.top + 12;
      if (lx > r.width - 250) lx = Math.max(0, ev.clientX - r.left - 262);
      tip.style.left = lx + "px"; tip.style.top = ly + "px"; tip.classList.add("show");
    });
    svg.addEventListener("pointerleave", () => tip.classList.remove("show"));
    draw.silent = true; draw(); draw.silent = false;
    // auto-play (looping) while the map is in view; pause off-screen; never autoplay with reduced motion
    if (!REDUCED && "IntersectionObserver" in window) {
      let started = false;
      const io = new IntersectionObserver((en) => {
        inView = en[0].isIntersecting;
        if (inView && !userPaused && !running()) {
          if (!started) { started = true; range.value = 0; draw(); setTimeout(() => { if (inView && !userPaused && !running()) play(); }, 400); }
          else play();
        } else if (!inView && running()) stop();
      }, { threshold: 0.5 });
      io.observe(svg);
    }
  }

  /* =================== ④ key evolution steps =================== */
  function md(src) {
    const inline = (t) => esc(t).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    const out = []; const lines = String(src || "").split("\n"); let i = 0, list = null, para = [];
    const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } if (list) { out.push(`<ul>${list.join("")}</ul>`); list = null; } };
    while (i < lines.length) {
      const l = lines[i];
      const f = l.match(/^```(\w*)/);
      if (f) {
        flush(); const lang = f[1]; const code = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
        i++;
        out.push(`<pre class="md-code">${code.map((c) => `<span class="${lang === "diff" ? (c.startsWith("+") ? "add" : c.startsWith("-") ? "del" : c.startsWith("@@") ? "hunk" : "") : ""}">${esc(c)}</span>`).join("\n")}</pre>`); continue;
      }
      const h = l.match(/^(#{1,4})\s+(.*)/);
      if (h) { flush(); out.push(`<h5>${inline(h[2])}</h5>`); i++; continue; }
      const li = l.match(/^\s*[-*]\s+(.*)/);
      if (li) { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } (list = list || []).push(`<li>${inline(li[1])}</li>`); i++; continue; }
      if (!l.trim()) { flush(); i++; continue; }
      para.push(l.trim()); i++;
    }
    flush();
    return out.join("");
  }
  async function renderStories(index) {
    const tabs = $("#story-tabs"), body = $("#story-body");
    const stories = await getJSON("data/rsi_stories/stories.json");
    if (!Array.isArray(stories) || !stories.length) { body.appendChild(soonBox("Key evolution steps", "Coming soon")); return; }
    const SR = (u) => (!u || /^(data\/|https?:|\/)/.test(u)) ? u : "data/rsi_stories/" + u;
    stories.forEach((st) => { st.before = SR(st.before); st.after = SR(st.after); st.diff = SR(st.diff); });
    const compares = index.filter((e) => e.type === "compare" || e.type === "story").sort((a, b) => (a.type === "compare" ? 0 : 1) - (b.type === "compare" ? 0 : 1));
    const findCompare = (st, i) => compares.find((e) => e.id === st.id || e.story === st.id || (e.id && e.id.indexOf(st.id) >= 0) || (st.id && st.id.indexOf(e.id) >= 0 && e.id.length > 3));
    let live = [];
    const select = (i) => {
      tabs.querySelectorAll(".tab").forEach((t, j) => t.setAttribute("aria-selected", j === i));
      const tb = tabs.querySelectorAll(".tab")[i];
      if (tb && tabs.scrollWidth > tabs.clientWidth) tabs.scrollTo({ left: Math.max(0, tb.offsetLeft - tabs.offsetLeft - 24), behavior: REDUCED ? "auto" : "smooth" });
      live.forEach((p) => p && p.destroy && p.destroy()); live = [];
      const st = stories[i];
      body.innerHTML = `<div class="story-row">
          <div class="story-media"></div>
          <div class="panel story-card">
            <span class="ver">${esc(st.version_from || "")} → ${esc(st.version_to || "")}</span>
            <h4>${esc(st.title || "")}</h4>
            ${st.capability ? `<div class="story-cap">${esc(st.capability)}</div>` : ""}
            ${st.summary ? `<p>${esc(st.summary)}</p>` : ""}
            ${st.evidence ? `<div class="story-ev"><b>Paired evidence:</b> ${esc(st.evidence)}</div>` : ""}
            ${st.diff ? `<details class="story-diff"><summary>Show the harness change</summary><div class="md">Loading…</div></details>` : ""}
          </div></div>`;
      const media = body.querySelector(".story-media");
      const fallback = () => {
        media.innerHTML = `<div class="story-pair"><div><div class="story-lbl">Before · ${esc(st.version_from || "parent")}</div><div class="sb"></div></div><div><div class="story-lbl good">After · ${esc(st.version_to || "child")}</div><div class="sa"></div></div></div>`;
        if (st.before) TAPlayer.mount(media.querySelector(".sb"), st.before, { compact: true, comingSoonTitle: "Parent-harness episode" }).then((p) => live.push(p));
        if (st.after) TAPlayer.mount(media.querySelector(".sa"), st.after, { compact: true, comingSoonTitle: "Child-harness episode" }).then((p) => live.push(p));
      };
      const cmp = findCompare(st, i);
      if (cmp) live.push(DP(media, cmp, { onMissing: fallback, onEnded: stories.length > 1 ? () => select((i + 1) % stories.length) : null }));
      else fallback();
      const det = body.querySelector(".story-diff");
      if (det) det.addEventListener("toggle", async () => {
        const box = det.querySelector(".md");
        if (!det.open || box.dataset.loaded) return;
        try { const r = await fetch(st.diff, { cache: "no-cache" }); box.innerHTML = r.ok ? md(await r.text()) : "Not available."; } catch (e) { box.textContent = "Not available."; }
        box.dataset.loaded = "1";
      });
    };
    tabs.innerHTML = stories.map((st, i) => `<button type="button" class="tab" role="tab" data-i="${i}"><span class="tv">${esc(st.version_from)} → ${esc(st.version_to)}</span><span class="tt">${esc(st.title)}</span></button>`).join("");
    tabs.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => select(+t.dataset.i)));
    select(0);
  }

  /* =================== ⑤ benchmarks =================== */
  // TinyAstral-4B and teacher numbers from tab_main.tex (Table 2), final harness H*.
  const BENCH = [
    { key: "RoboTwin", name: "RoboTwin-50", split: "t", val: "62.8", teacher: "63.6", sub: "500 episodes" },
    { key: "Guava", name: "Guava", split: "t", val: "93.6", teacher: "94.7", sub: "450 episodes" },
    { key: "LIBERO-PRO", name: "LIBERO-PRO", split: "t", val: "78.3", teacher: "80.0", sub: "300 episodes" },
    { key: "SimplerEnv", name: "SimplerEnv", split: "z", val: "66.6 / 88.5", teacher: "69.2 / 92.7", sub: "Google VM / WidowX" },
    { key: "VLABench", name: "VLABench", split: "z", val: "41.2", teacher: "46.2", sub: "500 episodes" },
    { key: "EB-Manipulation", name: "EB-Manipulation", split: "z", val: "27.6", teacher: "32.0", sub: "228 episodes" },
  ];
  const benchMatch = (b, name) => { const a = norm(b), c = norm(name); return a === c || (a.startsWith("eb") && c.startsWith("eb")) || a.startsWith(c) || c.startsWith(a); };
  async function renderBench(index) {
    const cards = $("#bench-cards"), stage = $("#bench-stage");
    const sim = (await getJSON(C.sim_index)) || [];
    const dashSims = index.filter((e) => e.type === "sim");
    const eps = {};
    BENCH.forEach((b) => {
      const list = [];
      sim.filter((e) => benchMatch(e.benchmark, b.key)).forEach((e) => list.push({ ...e, dash: dashSims.find((d) => d.id === e.id) || null }));
      dashSims.filter((d) => benchMatch(d.benchmark, b.key) && !list.some((x) => x.id === d.id)).forEach((d) => list.push({ id: d.id, title: d.title, outcome: d.outcome || "success", dash: d }));
      eps[b.key] = list;
    });
    const LBL = { 0: `<div class="bgroup-lbl t">Training · used for RSI and distillation</div>`, 3: `<div class="bgroup-lbl z">Zero-shot · never used for RSI or training</div>` };
    let html = BENCH.map((b, i) => (LBL[i] || "") + `<button type="button" class="bcard ${b.split}" data-i="${i}" aria-selected="false">
        <span class="bsplit">${b.split === "t" ? "training" : "zero-shot"}</span>
        <img class="bthumb" alt="" loading="lazy" data-bench="${esc(b.key)}">
        <span class="binfo"><span class="bname">${esc(b.name)}</span>
          <span class="bval" ${b.val.length > 6 ? 'style="font-size:1.12rem"' : ""}>${b.val}<small>%</small></span>
          <span class="bsub">TinyAstral-4B · teacher ${b.teacher}</span><span class="bsub">${esc(b.sub)}</span></span>
      </button>`).join("");
    cards.innerHTML = html;
    // thumbnails: rendered poster if any, else a mid-episode agent frame
    BENCH.forEach(async (b) => {
      const img = cards.querySelector(`img[data-bench="${b.key}"]`);
      const e = eps[b.key][0];
      if (!e) { img.alt = "coming soon"; return; }
      if (e.dir) frameThumb();                                        // single agent-camera frame (clearer than the dashboard poster)
      else if (e.dash && e.dash.poster) img.src = e.dash.poster;
      async function frameThumb() {
        if (!e.dir) return;
        const ep = await getJSON(e.dir + "/episode.json");
        if (ep && Array.isArray(ep.frames) && ep.frames.length) img.src = e.dir + "/" + ep.frames[Math.floor(ep.frames.length / 2)].src;
        else if (ep && ep.poster) img.src = e.dir + "/" + ep.poster;
      }
    });
    let live = null;
    const showEp = (box, e, onEnded) => {
      if (live && live.destroy) live.destroy(); live = null; box.innerHTML = "";
      const fb = () => { if (e.dir) TAPlayer.mount(box, e.dir, { autoplay: false, comingSoonTitle: e.title }).then((p) => (live = p)); else box.appendChild(soonBox(e.title, "Coming soon")); };
      if (e.dash) live = DP(box, e.dash, { onMissing: fb, onEnded }); else fb();
    };
    const select = (i, scroll) => {
      cards.querySelectorAll(".bcard").forEach((c) => c.setAttribute("aria-selected", +c.dataset.i === i));
      const b = BENCH[i], list = eps[b.key];
      stage.innerHTML = `<div class="panel bench-panel"><div class="ep-tabs" role="tablist"></div><div class="ep-box"></div></div>`;
      const tabsEl = stage.querySelector(".ep-tabs"), box = stage.querySelector(".ep-box");
      if (!list.length) { box.appendChild(soonBox(b.name, "Coming soon")); return; }
      tabsEl.innerHTML = list.map((e, j) => {
        const mk = e.outcome === "success" ? `<em class="mk mk-ok">success</em>` : "";
        return `<button type="button" class="ep-tab" role="tab" data-j="${j}">${esc(e.title)}${mk}</button>`;
      }).join("");
      const playEp = (j) => {
        tabsEl.querySelectorAll(".ep-tab").forEach((x) => x.setAttribute("aria-selected", +x.dataset.j === j));
        // when an episode ends: next episode of this benchmark, then the next benchmark
        showEp(box, list[j], () => (j + 1 < list.length ? playEp(j + 1) : select((i + 1) % BENCH.length, false)));
      };
      tabsEl.querySelectorAll(".ep-tab").forEach((t) => t.addEventListener("click", () => playEp(+t.dataset.j)));
      playEp(0);
      if (scroll) stage.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "nearest" });
    };
    cards.querySelectorAll(".bcard").forEach((c) => c.addEventListener("click", () => select(+c.dataset.i, true)));
    select(0, false);
  }

  /* =================== ⑥ results =================== */
  // Hand-copied from Paper/latex/tables/tab_main.tex (Table 2). Y = condition satisfied, N = not satisfied.
  const COLS = ["RoboTwin-50<br><small>500 ep.</small>", "Guava<br><small>450 ep.</small>", "LIBERO-PRO<br><small>300 ep.</small>",
    "SimplerEnv<br><small>Google VM</small>", "SimplerEnv<br><small>WidowX</small>", "VLABench<br><small>500 ep.</small>", "EB-Manip.<br><small>228 ep.</small>"];
  const COND = ["Open", "No closed LLM", "No succ. signal", "No ICL demo", "No expert demo"];
  const ROWS = [
    { group: "Published results (their protocols and episodes)" },
    { m: "GPT-6 Astra, one-shot", c: "NNNNY", v: ["73.6", "–", "–", "–", "–", "–", "–"] },
    { m: "PyRUA-Lean, GPT-6 Astra", c: "NNNYN", v: ["69.2", "–", "–", "–", "–", "–", "–"] },
    { m: "GPT-6 Astra, zero-shot", c: "NNNYY", v: ["53.2", "–", "–", "–", "–", "–", "–"] },
    { m: "GPT-5.4, Guava harness", c: "NNYYY", v: ["–", "90.4", "–", "–", "–", "–", "–"] },
    { m: "MotorMind, GPT-6 Sol", c: "NNNYY", v: ["–", "–", "83.3<sup>a</sup>", "–", "–", "–", "–"] },
    { m: "World Action Agent, Gemini 3.7 Flash", c: "NNNYN", v: ["–", "–", "75.6<sup>f</sup>", "–", "–", "–", "–"] },
    { m: "World Action Agent, Qwen3.5-9B student", c: "NNNYN", v: ["–", "–", "43.3<sup>f</sup>", "–", "–", "–", "–"] },
    { m: "SoFar, GPT-4o", c: "NNYYY", v: ["–", "–", "–", "74.9", "58.3", "–", "–"] },
    { m: "π<sub>0</sub>-FAST, fine-tuned", c: "YYYYN", v: ["–", "–", "–", "61.9", "32.1", "43.1", "–"] },
    { m: "GPT-4o, EmbodiedBench<sup>b</sup>", c: "NNYNY", v: ["–", "–", "–", "–", "–", "–", "28.9"] },
    { group: "Same episodes, competitors’ official harnesses, run by us" },
    { sub: "Open 4B agents" },
    { m: "PyRUA-Lean-4B", c: "YYYYN", n: ["64/500", "", "53/300"], v: ["12.8", "–", "17.7<sup>e</sup>", "–", "–", "–", "–"] },
    { m: "Guava-4B", c: "YYYYY", n: ["", "380/450", ""], v: ["–", "84.4", "–", "–", "–", "–", "–"] },
    { sub: "Same model as our teacher (Qwen3.8-Flash-Next), competitors’ harnesses" },
    { m: "MotorMind + Qwen3.8-Flash-Next<sup>c</sup>", c: "YYNYY", n: ["", "", "172/300"], v: ["–", "–", "57.3", "–", "–", "–", "–"] },
    { m: "PyRUA-Lean + Qwen3.8-Flash-Next", c: "YYYYN", n: ["91/500", "", "159/300"], v: ["18.2", "–", "53.0", "–", "–", "–", "–"] },
    { m: "Guava harness + Qwen3.8-Flash-Next", c: "YYYYY", n: ["", "355/450", ""], v: ["–", "78.9", "–", "–", "–", "–", "–"] },
    { sub: "Open harness-RSI model" },
    { m: "SenseNova-RoboRSI-27B<sup>d</sup>", c: "YYNYY", n: ["", "", "211/300"], v: ["–", "–", "70.3", "–", "–", "–", "–"] },
    { group: "Ours (same harness H*, strict protocol)" },
    { m: "Qwen3.5-4B, untrained", c: "YYYYY", n: ["206/500", "338/450", "109/300"], v: ["41.2<sup>†</sup>", "75.1", "36.3<sup>†</sup>", "56.6", "86.5", "27.6", "21.9"] },
    { m: "Teacher: Qwen3.8-Flash-Next (180B)", c: "YYYYY", n: ["318/500", "426/450", "240/300"], v: ["63.6", "94.7", "80.0", "69.2", "92.7", "46.2", "32.0"], cls: "teacher" },
    { m: "DeepSeek-V4.1-Flash (552B)", c: "YYYYY", n: ["317/500", "", "211/300"], v: ["63.4", "–", "70.3<sup>†</sup>", "68.0", "86.5", "38.8", "29.8"] },
    { m: "TinyAstral-0.8B", c: "YYYYY", n: ["309/500", "422/450", "164/300"], v: ["61.8", "93.8", "54.7", "64.0", "87.5", "40.4", "24.6"], cls: "ours-small" },
    { m: "TinyAstral-2B", c: "YYYYY", n: ["299/500", "396/450", "207/300"], v: ["59.8", "88.0", "69.0", "65.4", "88.5", "42.0", "25.0"], cls: "ours-small" },
    { m: "TinyAstral-4B", c: "YYYYY", n: ["314/500", "421/450", "235/300"], v: ["62.8", "93.6", "78.3", "66.6", "88.5", "41.2", "27.6"], cls: "ours" },
  ];
  // Compact (default) view: our block plus the strongest competitor run per training benchmark
  // (same episodes, their official harnesses). The full table is one click away.
  const KEY_BASELINES = ["Guava-4B", "PyRUA-Lean + Qwen3.8-Flash-Next", "SenseNova-RoboRSI-27B<sup>d</sup>"];
  function renderTable() {
    const n = 1 + COND.length + COLS.length;
    const zc = (i) => (i >= 3 ? "zs" : "") + (i === 3 ? " split" : "");
    const head = `<thead>
      <tr><th rowspan="2" class="left">Method</th><th colspan="${COND.length}" class="grp">Evaluation conditions</th>
          <th colspan="3" class="grp tr">Training benchmarks <small>(<i>S</i> unless noted)</small></th><th colspan="4" class="grp zs split">Zero-shot benchmarks <small>(official measure)</small></th></tr>
      <tr>${COND.map((c) => `<th class="cond"><span>${c}</span></th>`).join("")}${COLS.map((c, i) => `<th class="bh ${zc(i)}">${c}</th>`).join("")}</tr></thead>`;
    const row = (r, vis) => {
      if (r.group) return `<tr class="row-group ${vis}"><td colspan="${n}">${r.group}</td></tr>`;
      if (r.sub) return `<tr class="row-sub ${vis}"><td colspan="${n}">${r.sub}</td></tr>`;
      const cond = [...r.c].map((x) => (x === "Y" ? `<td class="c y" aria-label="yes">✓</td>` : `<td class="c n" aria-label="no">✗</td>`)).join("");
      const vals = r.v.map((x, i) => `<td class="num ${zc(i)}">${x}${r.n && r.n[i] ? `<small class="nn">${r.n[i]}</small>` : ""}</td>`).join("");
      return `<tr class="${r.cls || ""} ${vis}"><td class="left">${r.m}</td>${cond}${vals}</tr>`;
    };
    const oursAt = ROWS.findIndex((r) => r.group && r.group.startsWith("Ours"));
    const others = ROWS.slice(0, oursAt), ours = ROWS.slice(oursAt);
    const keyRows = KEY_BASELINES.map((m) => ROWS.find((r) => r.m === m)).filter(Boolean);
    const hiddenCount = others.filter((r) => r.m).length - keyRows.length;
    const body = row({ group: "Strongest competitor run per training benchmark (same episodes, their official harnesses, run by us)" }, "x-compact")
      + keyRows.map((r) => row(r, "x-compact")).join("")
      + others.map((r) => row(r, "x-full")).join("")
      + ours.map((r) => row(r, "")).join("");
    const t = $("#main-table");
    t.innerHTML = head + `<tbody>${body}</tbody>`;
    const btn = $("#table-toggle");
    if (!btn) return;
    const label = (open) => (open ? "Show key rows only" : `Show published results and competitor runs (${hiddenCount} more rows)`);
    const set = (open) => {
      t.classList.toggle("expanded", open);
      btn.setAttribute("aria-expanded", String(open));
      $(".tt-label", btn).textContent = label(open);
    };
    set(false);
    btn.addEventListener("click", () => set(btn.getAttribute("aria-expanded") !== "true"));
  }
  // From Paper/latex/tables/tab_cost.tex
  const COST = [
    { m: "TinyAstral-4B", gpus: "1 accelerator, bf16", v: 25.3, x: "1.0×", key: "student" },
    { m: "Qwen3.8-Flash-Next teacher", gpus: "4 accelerators, FP8 + spec. decoding", v: 123.8, x: "4.9×", key: "teacher" },
    { m: "DeepSeek-V4.1-Flash", gpus: "8 accelerators + spec. decoding", v: 249.6, x: "9.9×", key: "ds" },
  ];
  function renderCost() {
    $("#cost-bars").innerHTML = COST.map((c) => `
      <div class="cost-row"><div class="cost-name">${c.m}<small>${c.gpus}</small></div>
        <div class="cost-bar"><span class="bar bar-${c.key}" style="width:${(c.v / 249.6) * 100}%"></span></div>
        <div class="cost-val">${c.v.toFixed(1)}<small> accel·s · ${c.x}</small></div></div>`).join("");
  }
  const BENCH7 = ["RoboTwin-50", "Guava", "LIBERO-PRO", "SimplerEnv Google VM", "SimplerEnv WidowX", "VLABench", "EB-Manip."];
  const SIZE = { "0.8B": [61.8, 93.8, 54.7, 64.0, 87.5, 40.4, 24.6], "2B": [59.8, 88.0, 69.0, 65.4, 88.5, 42.0, 25.0], "4B": [62.8, 93.6, 78.3, 66.6, 88.5, 41.2, 27.6] };
  const TEACH7 = [63.6, 94.7, 80.0, 69.2, 92.7, 46.2, 32.0];
  function renderSize() {
    const sizes = Object.keys(SIZE);
    const W = 150, H = 120, L = 30, R = 10, T = 14, B = 24;
    $("#size-chart").innerHTML = BENCH7.map((b, j) => {
      const vals = sizes.map((k) => SIZE[k][j]).concat([TEACH7[j]]);
      let lo = Math.floor((Math.min(...vals) - 4) / 5) * 5, hi = Math.ceil((Math.max(...vals) + 2) / 5) * 5;
      if (hi - lo < 15) lo = hi - 15;
      const x = (i) => L + (i * (W - L - R)) / (sizes.length - 1);
      const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
      let g = `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(lo)}" y2="${y(lo)}"/><line class="grid" x1="${L}" x2="${W - R}" y1="${y(hi)}" y2="${y(hi)}"/>`;
      g += `<text class="tick" x="${L - 4}" y="${y(lo) + 4}" text-anchor="end">${lo}</text><text class="tick" x="${L - 4}" y="${y(hi) + 4}" text-anchor="end">${hi}</text>`;
      g += `<line class="teach-line" x1="${L}" x2="${W - R}" y1="${y(TEACH7[j])}" y2="${y(TEACH7[j])}"><title>Teacher ${TEACH7[j]}</title></line>`;
      g += `<text class="teach-lbl" x="${W - R}" y="${y(TEACH7[j]) - 4}" text-anchor="end">teacher ${TEACH7[j]}</text>`;
      g += `<polyline class="ln ln-student" points="${sizes.map((k, i) => `${x(i)},${y(SIZE[k][j])}`).join(" ")}"/>`;
      sizes.forEach((k, i) => {
        g += `<circle class="pt pt-student" cx="${x(i)}" cy="${y(SIZE[k][j])}" r="3.6"><title>TinyAstral-${k}: ${SIZE[k][j]}</title></circle>`;
        g += `<text class="tick" x="${x(i)}" y="${H - 6}" text-anchor="middle">${k}</text>`;
      });
      g += `<text class="end-lbl lbl-student" x="${x(2) - 6}" y="${y(SIZE["4B"][j]) + 14}" text-anchor="end">${SIZE["4B"][j]}</text>`;
      return `<figure class="mini"><figcaption${j >= 3 ? ' class="c-purple" title="zero-shot"' : ""}>${b}</figcaption><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${b}: success of 0.8B, 2B, 4B students vs teacher">${g}</svg></figure>`;
    }).join("");
  }

  /* =================== ⑦ BibTeX + ack =================== */
  function renderBib() {
    if (C.SHOW_BIBTEX === false) {   // hide the BibTeX section and its nav link until there is a citable version
      const sec = $("#bibtex"); if (sec) sec.hidden = true;
      $$('a[href="#bibtex"]').forEach((a) => (a.hidden = true));
      return;
    }
    const author = C.ANON ? "Anonymous Authors" : C.authors.map((a) => { const p = a.name.split(" "); const last = p.pop(); return `${last}, ${p.join(" ")}`; }).join(" and ");
    const bib = C.ANON
      ? `@misc{tinyastral,\n  title  = {TinyAstral: Transferring Self-Evolving Harnesses to Tiny Generalist Manipulation Agents},\n  author = {${author}}\n}`
      : `@article{tinyastral2026,\n  title   = {TinyAstral: Transferring Self-Evolving Harnesses to Tiny Generalist Manipulation Agents},\n  author  = {${author}},\n  journal = {arXiv preprint arXiv:XXXX.XXXXX},\n  year    = {2026}\n}`;
    $("#bibtex-code").textContent = bib;
    $("#bib-copy").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(bib); $("#bib-copy").textContent = "Copied"; }
      catch (e) { const r = document.createRange(); r.selectNodeContents($("#bibtex-code")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $("#bib-copy").textContent = "Selected"; }
      setTimeout(() => ($("#bib-copy").textContent = "Copy"), 1600);
    });
    $("#ack").innerHTML = C.ANON ? `<h3>Acknowledgements</h3><p>Withheld for anonymous review.</p>`
      : (C.ack ? `<h3>Acknowledgements</h3><p>${esc(C.ack)}</p>` : "");
  }

  /* =================== boot =================== */
  renderAuthors(); renderLinks("#links"); renderLinks("#links2"); renderBib(); countUp();
  initHow(); renderCurve(); renderTable(); renderCost(); renderSize(); renderCaps();
  loadIndex().then((index) => {
    heroVideo(index.find((e) => e.type === "real" && !e.soon));
    renderReal(index); renderStories(index); renderBench(index);
  });
})();
