/* Synchronised "video + agent log" player.
 *
 *   TAPlayer.mount(containerEl, "data/sim/<id>", {comingSoonTitle})  -> Promise<TAPlayer|null>
 *
 * Loads <dir>/episode.json (schema in README.md). Media is either a video ("video": "video.mp4")
 * or a frame sequence ("frames": [{t, src}]). Paths are relative to <dir>.
 * If episode.json is missing, a "Coming soon" card is rendered instead (no error thrown).
 */
(function () {
  "use strict";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (t) => {
    t = Math.max(0, t || 0);
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  // Heuristic: a result string reports failure if it carries a non-OK code / ok:false / all_pass:false.
  function resultOk(step) {
    if (typeof step.result_ok === "boolean") return step.result_ok;
    const r = String(step.result || "");
    if (/"all_pass"\s*:\s*false|"ok"\s*:\s*false/.test(r)) return false;
    const codes = [...r.matchAll(/"code"\s*:\s*"([A-Z_]+)"/g)].map((m) => m[1]);
    return !codes.some((c) => c !== "OK");
  }

  function prettyCall(raw) {
    try {
      const c = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (c && c.name) return { name: c.name, args: JSON.stringify(c.arguments ?? {}, null, 0) };
    } catch (e) { /* fall through */ }
    return { name: "", args: String(raw ?? "") };
  }

  const prettyResult = (raw) => String(raw ?? "");

  class FrameClock {
    constructor(duration, onTick) {
      this.t = 0; this.duration = duration; this.rate = 1; this.playing = false; this.onTick = onTick;
      this._last = 0; this._raf = null;
    }
    play() {
      if (this.t >= this.duration - 0.05) this.t = 0;
      this.playing = true; this._last = performance.now();
      const loop = (now) => {
        if (!this.playing) return;
        this.t = Math.min(this.duration, this.t + ((now - this._last) / 1000) * this.rate);
        this._last = now;
        if (this.t >= this.duration) this.playing = false;
        this.onTick();
        if (this.playing) this._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
      this.onTick();
    }
    pause() { this.playing = false; if (this._raf) cancelAnimationFrame(this._raf); this.onTick(); }
    seek(t) { this.t = Math.max(0, Math.min(this.duration, t)); this.onTick(); }
    setRate(r) { this.rate = r; }
    destroy() { this.pause(); }
  }

  class VideoClock {
    constructor(video, onTick) {
      this.v = video; this.onTick = onTick;
      ["timeupdate", "play", "pause", "seeked", "loadedmetadata", "ended"].forEach((ev) => video.addEventListener(ev, onTick));
      // timeupdate fires ~4 Hz; poll faster while playing for a smoother progress bar.
      const loop = () => { if (!this.v.paused) onTick(); this._raf = requestAnimationFrame(loop); };
      this._raf = requestAnimationFrame(loop);
    }
    get t() { return this.v.currentTime || 0; }
    get duration() { return isFinite(this.v.duration) ? this.v.duration : 0; }
    get playing() { return !this.v.paused && !this.v.ended; }
    play() { this.v.play().catch(() => {}); }
    pause() { this.v.pause(); }
    seek(t) { this.v.currentTime = t; }
    setRate(r) { this.v.playbackRate = r; }
    destroy() { cancelAnimationFrame(this._raf); this.v.pause(); }
  }

  class TAPlayer {
    constructor(root, ep, base, opts = {}) {
      this.root = root; this.ep = ep; this.base = base.replace(/\/$/, "") + "/"; this.opts = opts;
      this.steps = (ep.steps || []).slice().sort((a, b) => a.t_start - b.t_start);
      this.frames = (ep.frames || []).slice().sort((a, b) => a.t - b.t);
      this.active = -1; this.userScrollUntil = 0;
      this._build();
    }

    static async mount(container, dir, opts = {}) {
      container.innerHTML = "";
      let ep = null;
      // accept either a folder or a direct path to an episode .json
      const file = /\.json$/i.test(dir) ? dir : dir.replace(/\/$/, "") + "/episode.json";
      dir = file.replace(/\/[^/]*$/, "") || ".";
      try {
        const r = await fetch(file, { cache: "no-cache" });
        if (r.ok) ep = await r.json();
      } catch (e) { ep = null; }
      if (!ep) {
        container.appendChild(TAPlayer.comingSoon(opts.comingSoonTitle || "Episode", opts.comingSoonText));
        return null;
      }
      const p = new TAPlayer(container, ep, dir, opts);
      if (opts.autoplay) p.clock.play();
      return p;
    }

    static comingSoon(title, text) {
      const c = el("div", "tap-soon");
      c.innerHTML = `<div class="tap-soon-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg></div>
        <div class="tap-soon-title">${esc(title)}</div>
        <div class="tap-soon-text">${esc(text || "Coming soon")}</div>`;
      return c;
    }

    _src(p) { return /^(https?:)?\/\//.test(p) || p.startsWith("/") ? p : this.base + p; }

    _build() {
      const ep = this.ep, root = this.root;
      root.innerHTML = "";
      const wrap = el("div", "tap" + (this.opts.compact ? " compact" : ""));
      const outcome = ep.outcome === "success" ? "success" : "";   // demo page: no failure badge

      // header
      const head = el("div", "tap-head");
      head.innerHTML = `
        <div class="tap-chips">
          ${ep.benchmark ? `<span class="chip">${esc(ep.benchmark)}</span>` : ""}
          ${ep.split ? `<span class="chip chip-soft">${esc(ep.split)}</span>` : ""}
          <span class="chip chip-model">${esc(ep.model || "TinyAstral-4B")}</span>
          ${outcome ? `<span class="chip chip-${outcome}">✅ success</span>` : ""}
        </div>
        ${ep.title ? `<div class="tap-title">${esc(ep.title)}</div>` : ""}
        ${ep.instruction ? `<div class="tap-instr"><span>Instruction</span> “${esc(ep.instruction)}”</div>` : ""}`;
      wrap.appendChild(head);

      const body = el("div", "tap-body");
      // media column
      const media = el("div", "tap-media");
      const stage = el("div", "tap-stage");
      if (ep.video) {
        const v = el("video");
        v.src = this._src(ep.video); v.playsInline = true; v.muted = true; v.preload = "metadata";
        if (ep.poster) v.poster = this._src(ep.poster);
        stage.appendChild(v);
        this.video = v;
      } else {
        this.img = el("img", "tap-frame");
        this.img.alt = "agent camera frame";
        this.img.decoding = "async";
        if (this.frames.length) this.img.src = this._src(this.frames[0].src);
        stage.appendChild(this.img);
        // warm the cache so frame switches do not flicker
        this.frames.forEach((f) => { const i = new Image(); i.src = this._src(f.src); });
      }
      this.stepTag = el("div", "tap-steptag");
      this.rateTag = el("div", "tap-ratetag");
      this.badge = el("div", `tap-badge ${outcome}`, outcome === "success" ? "✅ Success" : "");
      this.bigPlay = el("button", "tap-bigplay", `<svg viewBox="0 0 24 24" width="30" height="30"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`);
      this.bigPlay.setAttribute("aria-label", "Play");
      stage.append(this.stepTag, this.rateTag, this.badge, this.bigPlay);
      media.appendChild(stage);

      // controls + timeline
      const ctr = el("div", "tap-controls");
      this.btn = el("button", "tap-btn", "");
      this.btn.setAttribute("aria-label", "Play / pause");
      this.timeEl = el("span", "tap-time", "0:00");
      const rate = el("select", "tap-rate");
      [0.5, 1, 1.5, 2].forEach((r) => { const o = el("option", "", r + "×"); o.value = r; if (r === 1) o.selected = true; rate.appendChild(o); });
      rate.setAttribute("aria-label", "Playback speed");
      const tl = el("div", "tap-timeline");
      this.track = el("div", "tap-track");
      this.fill = el("div", "tap-fill");
      this.knob = el("div", "tap-knob");
      this.track.append(this.fill, this.knob);
      tl.appendChild(this.track);
      ctr.append(this.btn, tl, this.timeEl, rate);
      media.appendChild(ctr);
      if (ep.playback_note) media.appendChild(el("div", "tap-note", esc(ep.playback_note)));
      body.appendChild(media);

      // log column: telemetry + filter + steps
      const log = el("div", "tap-log");
      const bar = el("div", "tap-logbar");
      this.tele = el("div", "tap-tele");
      const filt = el("div", "tap-filter");
      filt.setAttribute("role", "group");
      filt.setAttribute("aria-label", "Filter log");
      [["all", "All"], ["think", "Think"], ["call", "Tool calls"]].forEach(([k, lbl]) => {
        const b = el("button", "", lbl);
        b.type = "button"; b.dataset.f = k; b.setAttribute("aria-pressed", k === "all");
        b.addEventListener("click", () => {
          filt.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
          list.classList.remove("f-think", "f-call");
          if (k !== "all") list.classList.add("f-" + k);
        });
        filt.appendChild(b);
      });
      bar.append(this.tele, filt);
      log.appendChild(bar);
      const list = el("ol", "tap-steps");
      list.setAttribute("aria-label", "Agent steps");
      this.cards = this.steps.map((s, i) => this._card(s, i));
      this.cards.forEach((c) => list.appendChild(c));
      if (outcome) {
        const end = el("li", `tap-end ${outcome}`, `✅ Task succeeded${ep.end_reason ? ` <span>(${esc(ep.end_reason)})</span>` : ""}`);
        list.appendChild(end);
      }
      this.list = list;
      ["wheel", "touchmove"].forEach((ev) => list.addEventListener(ev, () => { this.userScrollUntil = performance.now() + 4000; }, { passive: true }));
      log.appendChild(list);
      body.appendChild(log);
      wrap.appendChild(body);
      root.appendChild(wrap);

      // clock
      const tick = () => this._render();
      const lastEnd = this.steps.length ? this.steps[this.steps.length - 1].t_end : 0;
      this.clock = this.video ? new VideoClock(this.video, tick) : new FrameClock(ep.duration || lastEnd + 2, tick);

      // markers need the duration; for video wait for metadata
      const placeMarkers = () => this._markers();
      if (this.video) this.video.addEventListener("loadedmetadata", placeMarkers); else placeMarkers();

      // events
      const toggle = () => (this.clock.playing ? this.clock.pause() : this.clock.play());
      this.btn.addEventListener("click", toggle);
      this.bigPlay.addEventListener("click", toggle);
      stage.addEventListener("click", (e) => { if (e.target === stage || e.target === this.img || e.target === this.video) toggle(); });
      rate.addEventListener("change", () => {
        const r = parseFloat(rate.value);
        this.clock.setRate(r);
        this.rateTag.textContent = r === 1 ? "" : `${r}× speed`;
        this.rateTag.classList.toggle("show", r !== 1);
      });
      const seekFromEvent = (e) => {
        const r = this.track.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
        this.clock.seek((Math.max(0, Math.min(r.width, x)) / r.width) * (this.clock.duration || 0));
      };
      let dragging = false;
      this.track.addEventListener("pointerdown", (e) => { if (e.target.classList.contains("tap-mark")) return; dragging = true; this.track.setPointerCapture(e.pointerId); seekFromEvent(e); });
      this.track.addEventListener("pointermove", (e) => dragging && seekFromEvent(e));
      this.track.addEventListener("pointerup", () => (dragging = false));
      this._render();
    }

    _card(s, i) {
      const li = el("li", "tap-step");
      const ok = resultOk(s);
      const call = prettyCall(s.tool_call);
      const wall = s.wall_t_start != null ? `<span class="tap-wall" title="wall-clock time in the original run">${s.wall_t_start.toFixed ? s.wall_t_start.toFixed(1) : s.wall_t_start} s</span>` : "";
      const thumb = s.image && this.video ? `<img class="tap-thumb" loading="lazy" src="${esc(this._src(s.image))}" alt="">` : "";
      const think = s.think
        ? `<div class="tap-think"><div class="tap-lbl">think</div><div class="tap-think-txt">${esc(s.think)}</div><button class="tap-more" type="button">show all</button></div>`
        : s.think_note ? `<div class="tap-think tap-think-none"><div class="tap-lbl">think</div><div class="tap-muted">${esc(s.think_note)}</div></div>` : "";
      li.innerHTML = `
        <div class="tap-step-head">
          <span class="tap-k">#${i + 1}</span>
          <span class="tap-tool">${esc(call.name || "call")}</span>
          <span class="tap-dot ${ok ? "ok" : "nt"}" title="${ok ? "tool returned OK" : "tool result"}"></span>
          ${wall}
        </div>
        ${s.input ? `<div class="tap-input">${thumb}<div><div class="tap-lbl">input</div><div class="tap-input-txt">${esc(s.input)}</div></div></div>` : thumb}
        ${think}
        <div class="tap-lbl">tool call</div>
        <pre class="tap-call"><b>${esc(call.name)}</b> ${esc(call.args)}</pre>
        ${s.result ? `<div class="tap-lbl">result</div><pre class="tap-res ${ok ? "ok" : "nt"}">${esc(prettyResult(s.result))}</pre>` : ""}`;
      li.addEventListener("click", (e) => {
        if (e.target.closest(".tap-more")) return;
        this.userScrollUntil = 0;
        this.clock.seek(s.t_start + 0.01);
      });
      const more = li.querySelector(".tap-more");
      if (more) {
        const txt = li.querySelector(".tap-think-txt");
        more.addEventListener("click", () => {
          const open = txt.classList.toggle("open");
          more.textContent = open ? "show less" : "show all";
        });
        // hide the toggle when the text already fits
        requestAnimationFrame(() => { if (txt.scrollHeight <= txt.clientHeight + 2) more.hidden = true; });
      }
      return li;
    }

    _markers() {
      this.track.querySelectorAll(".tap-mark, .tap-endmark").forEach((m) => m.remove());
      const d = this.clock.duration || 1;
      const oc = this.ep.outcome;
      if (oc === "success") {
        const last = this.steps.length ? this.steps[this.steps.length - 1].t_end : d;
        const em = el("span", `tap-endmark ${oc}`, "✓");
        em.style.left = `${(Math.min(last, d) / d) * 100}%`;
        em.title = oc;
        this.track.appendChild(em);
      }
      this.steps.forEach((s, i) => {
        const m = el("button", `tap-mark ${resultOk(s) ? "ok" : "nt"}`);
        m.style.left = `${(s.t_start / d) * 100}%`;
        const name = prettyCall(s.tool_call).name;
        m.title = `#${i + 1} ${name}`;
        m.setAttribute("aria-label", `Jump to step ${i + 1} ${name}`);
        m.addEventListener("click", (e) => { e.stopPropagation(); this.userScrollUntil = 0; this.clock.seek(s.t_start + 0.01); });
        this.track.appendChild(m);
      });
    }

    _render() {
      const t = this.clock.t, d = this.clock.duration || 0;
      const pct = d ? (t / d) * 100 : 0;
      this.fill.style.width = pct + "%";
      this.knob.style.left = pct + "%";
      this.timeEl.textContent = `${fmt(t)} / ${fmt(d)}`;
      const playing = this.clock.playing;
      this.btn.innerHTML = playing
        ? `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>`
        : `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
      this.bigPlay.classList.toggle("hide", playing || t > 0.05);

      // frame
      if (this.img && this.frames.length) {
        let f = this.frames[0];
        for (const fr of this.frames) { if (fr.t <= t + 1e-6) f = fr; else break; }
        const src = this._src(f.src);
        if (this._curSrc !== src) { this.img.src = src; this._curSrc = src; }
      }

      // active step
      let a = -1;
      for (let i = 0; i < this.steps.length; i++) if (this.steps[i].t_start <= t + 1e-6) a = i;
      const lastEnd = this.steps.length ? this.steps[this.steps.length - 1].t_end : 0;
      const atEnd = d > 0 && (t >= d - 0.05 || (lastEnd && t >= lastEnd));
      if (a !== this.active) {
        if (this.active >= 0) this.cards[this.active].classList.remove("active");
        this.active = a;
        if (a >= 0) {
          const c = this.cards[a];
          c.classList.add("active");
          if (performance.now() > this.userScrollUntil) {
            const top = c.offsetTop - 8; // .tap-steps is position:relative
            this.list.scrollTo({ top, behavior: "smooth" });
          }
        }
      }
      this.cards.forEach((c, i) => c.classList.toggle("done", i < a));
      const lim = this.ep.call_limit ? ` / ${this.ep.call_limit}` : "";
      const n = Math.max(0, a + 1);
      const st = a >= 0 ? this.steps[a] : null;
      const wall = st && st.wall_t_end != null ? `<span title="wall-clock seconds in the original evaluation run">${Number(st.wall_t_end).toFixed(1)} s elapsed</span>` : "";
      const teleHtml = `<span><b>${n}</b>${lim} calls</span>${wall}`;
      if (teleHtml !== this._tele) { this.tele.innerHTML = teleHtml; this._tele = teleHtml; }
      if (a >= 0 && !atEnd) {
        const s = this.steps[a];
        this.stepTag.innerHTML = `<b>#${a + 1}</b> ${esc(prettyCall(s.tool_call).name)}`;
        this.stepTag.classList.add("show");
      } else {
        this.stepTag.classList.remove("show");
      }
      this.badge.classList.toggle("show", !!atEnd && !!this.badge.textContent);
    }

    destroy() { this.clock.destroy(); this.root.innerHTML = ""; }
  }

  window.TAPlayer = TAPlayer;
})();
