---
permalink: /
title: "About me"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

<div class="intro" markdown="1">

I am a **Senior Staff Engineer** at **Huawei Singapore Research Center**. I received my **Ph.D. in Electrical and Computer Engineering** from the **National University of Singapore (NUS)**, advised by Prof. Jiashi Feng and Prof. Xinchao Wang, and my **B.Eng. (Honours)** in Engineering Science from NUS.

My research interests:

* **Motion capture & generation:** 3D human pose estimation, dance generation, and unified motion capture & retargeting for arbitrary skeletons (the *MoCapAnything* series).
* **Video generation & world models:** joint audio–video generation, motion- and physics-aware video generation, and world models for interactive simulation; a recent direction I am exploring.
* **Multimodal LLMs & VLMs:** multimodal understanding and reasoning, unifying understanding and generation, grounding vision–language models in 3D, motion, and embodied tasks; and efficient, deployable foundation models.

</div>

<h1 id="news" style="border-bottom:2px solid #eee;padding-bottom:.3em;margin-top:1.5em;">News</h1>

<div class="news" markdown="1">

* **[2026]** Started research on video generation and world models
* **[2026]** *MoCapAnything V2* released on arXiv
* **[2026]** *MoCapAnything* accepted to **CVPR 2026**
* **[2025]** *MoCapAnything* and *SWiT-4D* released on arXiv
* **[2025]** Worked on the virtual-pet project
* **[2024]** Worked on LLM/VLM inference acceleration (quantization, sparsification, attention)
* **[2024]** *MotionMix* accepted to **AAAI 2024**
* **[2023]** On-device LLM for smart-home terminals released at the **China Mobile Global Partners Conference 2023**
* **[2023]** *TM2D* and *Priority-centric* accepted to **ICCV 2023**
* **[2023]** *PoseAug* journal extension published in **IEEE TPAMI**
* **[2022]** *PoseTriplet* accepted to **CVPR 2022** (Oral)
* **[2021]** *PoseAug* accepted to **CVPR 2021** (Oral, Best Paper Candidate)

</div>


<style>
html{scroll-padding-top:70px;}
.intro{font-size:.9em;line-height:1.55;}
.intro ul{margin:.3em 0 .6em;}
.intro li{margin-bottom:.2em;}
.news{font-size:.9em;line-height:1.5;}
.news ul{margin:.3em 0 .6em;}
.news li{margin-bottom:.25em;}
.pub-row{margin:0 0 1.6em;}
.pub-main{display:flex;gap:1.1em;align-items:flex-start;}
.pub-thumb{flex:0 0 300px;}
.pub-thumb img,.pub-thumb video{width:300px;height:auto;border-radius:6px;border:1px solid #e6e6e6;display:block;}
.pub-info{flex:1;min-width:0;}
.pub-featured{padding:0 0 1.2em;border-bottom:1px solid #eee;margin-bottom:1.6em;}
.pub-banner{display:block;margin-bottom:.9em;}
.pub-banner img{width:100%;height:auto;border-radius:6px;border:1px solid #e6e6e6;display:block;}
.pub-title{font-weight:700;font-size:1.05em;line-height:1.3;margin-bottom:.2em;}
.pub-title a{color:#1a1a1a;}
.pub-authors{font-size:.92em;margin-bottom:.1em;}
.pub-venue{font-size:.9em;color:#777;font-style:italic;margin-bottom:.4em;}
.pub-links a{display:inline-flex;align-items:center;gap:.4em;font-size:.8em;padding:.14em .65em;margin:0 .35em .3em 0;border:1px solid var(--c,#2f7f93);border-radius:12px;color:var(--c,#2f7f93);text-decoration:none;transition:background .15s,color .15s;}
.pub-links a:hover{background:var(--c,#2f7f93);color:#fff;text-decoration:none;}
.pub-links a i{font-size:.95em;line-height:1;}
.pub-link-paper{--c:#b31b1b;}
.pub-link-project{--c:#2f7f93;}
.pub-link-demo{--c:#d97706;}
.pub-link-code{--c:#333;}
.pub-link-slides{--c:#7c3aed;}
.pub-link-bibtex{--c:#557;}
@media (max-width:600px){.pub-main{flex-direction:column;}.pub-thumb,.pub-thumb img,.pub-thumb video{width:100%;flex-basis:auto;}}
</style>

<h1 id="publications" style="border-bottom:2px solid #eee;padding-bottom:.3em;margin-top:1.5em;">Publications</h1>

{% if site.author.googlescholar %}
<p>You can also find my articles on <a href="{{site.author.googlescholar}}">my Google Scholar profile</a>.</p>
{% endif %}

{% for post in site.publications reversed %}
{% include pub-entry.html %}
{% endfor %}


<h1 id="cv" style="border-bottom:2px solid #eee;padding-bottom:.3em;margin-top:1.5em;">CV</h1>

<a href="/files/CV_Kehong_Gong.pdf" class="btn btn--primary">📄 Download CV (PDF)</a>

### Education
* Ph.D. in Electrical and Computer Engineering, National University of Singapore, 2019–2022
  * Dissertation: *Deep Learning in Human Pose Generation and Its Application*
  * Supervisors: Asst. Prof. Jiashi Feng and Assoc. Prof. Xinchao Wang
* B.Eng. (Honours), Engineering Science Programme, National University of Singapore, 2013–2017

### Professional experience
* Dec 2022 – Present: Senior Staff Engineer, Huawei International Pte. Ltd.
  * 2026–present: Pre-research on video generation models (world models, joint audio–video generation).
  * 2025: Unified 3D motion capture for arbitrary skeletons from monocular videos; deployed in the virtual-pet feature of Huawei smartphones (*MoCapAnything* series).
  * 2024: LLM/VLM inference & training acceleration: low-bit quantization, sparse/efficient attention, and model compression.
  * 2023: Led low-level vision model development and on-device deployment; our on-device LLM for smart-home terminals was released at the China Mobile Global Partners Conference 2023.

### Honors & awards
* Best Paper Candidate, CVPR 2021 (PoseAug)
* Oral Presentation, CVPR 2021 & CVPR 2022

### Academic service
* Reviewer: CVPR, ECCV, NeurIPS, AAAI, ACM MM, Pattern Recognition, Robotics and Autonomous Systems

<script>
// Keep publication-thumbnail videos reliably playing: browsers throttle/pause
// autoplay videos when many share a page or scroll out of view. Play each video
// when it enters the viewport, pause it when it leaves.
(function () {
  function tryPlay(v) {
    v.muted = true;          // property (not just attribute) — required for autoplay
    v.playsInline = true;
    var p = v.play();
    if (p && p.catch) { p.catch(function () {}); }
  }
  function setup() {
    var vids = document.querySelectorAll('.pub-thumb video');
    vids.forEach(tryPlay);   // kick them off immediately

    // Fallback: some Chrome setups (Energy Saver / autoplay-blocker extensions)
    // block muted autoplay. Chrome always allows play() after a user gesture, so
    // start playback on the first interaction, then stop listening.
    var EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove', 'wheel'];
    function onFirstInteraction() {
      vids.forEach(tryPlay);
      EVENTS.forEach(function (ev) { window.removeEventListener(ev, onFirstInteraction); });
    }
    EVENTS.forEach(function (ev) { window.addEventListener(ev, onFirstInteraction, { passive: true }); });

    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { tryPlay(e.target); }
        else { e.target.pause(); }
      });
    }, { threshold: 0.1 });
    vids.forEach(function (v) { io.observe(v); });
  }
  if (document.readyState !== 'loading') setup();
  else document.addEventListener('DOMContentLoaded', setup);
})();
</script>
