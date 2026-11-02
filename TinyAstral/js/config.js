// Site configuration. Flip ANON to false for the public (camera-ready / arXiv) version.
window.SITE_CONFIG = {
  ANON: false,

  title: "TinyAstral",
  subtitle: "Transferring Self-Evolving Harnesses to Tiny Generalist Manipulation Agents",
  venue_anon: "",
  venue_public: "",

  // Public author list (from the arXiv branch of the paper). Only shown when ANON === false.
  authors: [
    { name: "Kehong Gong", aff: [1], url: "" },
    { name: "Xiaoxu Zheng", aff: [1], url: "" },
    { name: "Guanli Hou", aff: [2], url: "" },
    { name: "Seunghun Lee", aff: [1], url: "" },
    { name: "Mengqi Guo", aff: [1], url: "", br: true },   // line break after this name, as in the paper
    { name: "Runjia Tan", aff: [3], url: "" },
    { name: "Zhengyu Wen", aff: [2], url: "" },
    { name: "Qi Wang", aff: [2], url: "" },
    { name: "Xiaoyu He", aff: [2], url: "" },
    { name: "Mingyuan Zhang", aff: [2], url: "", corresponding: true },
    { name: "Michael Bi Mi", aff: [1], url: "" },
  ],
  affiliations: { 1: "Huawei Technologies Co., Ltd", 2: "Huawei Noah Research Institute", 3: "Independent Researcher" },
  SHOW_BIBTEX: true,

  // Links. "#" = placeholder. In ANON mode, arXiv / Code / Weights are rendered as disabled "coming soon".
  links: {
    paper: "https://arxiv.org/pdf/2610.41216",
    arxiv: "https://arxiv.org/abs/2610.41216",
    code: "https://github.com/Garfield-kh/TinyAstral",
    gitcode: "https://gitcode.com/cann/cann-recipes-embodied-ai",
    weights: "https://huggingface.co/kehong/TinyAstral-weights",
    data: "https://huggingface.co/datasets/kehong/TinyAstral-SFT",
  },

  // Legacy real-robot slots (TAPlayer episode.json); used only if data/real/index.json is missing.
  real: [
    { dir: "data/real/real_01", title: "Real robot · episode 1" },
    { dir: "data/real/real_02", title: "Real robot · episode 2" },
  ],

  // Acknowledgements (public version only; the anonymous version shows a withheld note).
  ack: "",

  // Rendered dashboard videos (sim / story / compare / real) are listed in data/dash/index.json (renderer output);
  // data/real/index.json adds real-robot entries and "Coming soon" slots. Both are optional.
  dash_index: "data/dash/index.json",
  real_index: "data/real/index.json",

  sim_index: "data/sim/index.json",
};
