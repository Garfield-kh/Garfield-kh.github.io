// Site configuration. Flip ANON to false for the public (camera-ready / arXiv) version.
window.SITE_CONFIG = {
  ANON: false,

  title: "TinyAstral",
  subtitle: "Transferring Self-Evolving Harnesses to Tiny Generalist Manipulation Agents",
  venue_anon: "",
  venue_public: "",

  // Public author list lives outside site/ (../public_authors.js.txt); paste it back here for the public version.
  authors: [],
  affiliations: { 1: "Huawei Technologies Co., Ltd", 2: "Huawei Noah Research Institute" },
  SHOW_BIBTEX: false,   // until the arXiv version exists

  // Links. "#" = placeholder. In ANON mode, arXiv / Code / Weights are rendered as disabled "coming soon".
  links: {
    paper: "#",
    arxiv: "#",
    code: "#",
    gitcode: "https://gitcode.com/cann/cann-recipes-embodied-ai",
    weights: "#",
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
