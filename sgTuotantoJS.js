<!-- SCRIPT 17.2.26 klo 18 --->

<script> 
    
// Source - https://stackoverflow.com/q/70821769
// Posted by brut65, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-05, License - CC BY-SA 4.0


//   Yleiset toiminnot (dark mode, scroll, menu)  

function darkFunction() {
  var currentMode = localStorage.getItem("modeIS");

  // jos body puuttuu vielä, käytä documentElement
  var el = document.body || document.documentElement;

  if (!currentMode) currentMode = "white-mode";

  // poista mahdolliset
  el.classList.remove("white-mode");
  el.classList.remove("dark-mode");

  // vaihda
  if (currentMode === "white-mode") {
    el.classList.add("dark-mode");
    localStorage.setItem("modeIS", "dark-mode");
  } else {
    el.classList.add("white-mode");
    localStorage.setItem("modeIS", "white-mode");
  }

  // varmista myös html
  try {
    var mode = localStorage.getItem("modeIS") || "white-mode";
    document.documentElement.classList.remove("white-mode");
    document.documentElement.classList.remove("dark-mode");
    document.documentElement.classList.add(mode);
  } catch (e) {}
}


// Scroll top
function topFunction() {
  try {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  } catch (e) {}
}


// ===== Search panel / highlight =====

var sgSearchState = {
  panelId: "SearchPanel",
  panelClass: "search-panel",
  inputClass: "omainput",
  counterId: "counter",
  isInitialized: false
};

function getSearchPanelEl() {
  return document.getElementById(sgSearchState.panelId) ||
         document.querySelector("." + sgSearchState.panelClass) ||
         null;
}

function ensureSearchPanelExists() {
  var panel = getSearchPanelEl();
  if (panel) return panel;

  // Jos panelia ei ole, luo se perusmuodossa (turvallinen fallback)
  panel = document.createElement("div");
  panel.id = sgSearchState.panelId;
  panel.className = sgSearchState.panelClass;
  panel.style.display = "none";

  // input
  var inp = document.createElement("input");
  inp.className = sgSearchState.inputClass;
  inp.type = "text";
  inp.placeholder = "Hae...";
  panel.appendChild(inp);

  // counter
  var c = document.createElement("div");
  c.id = sgSearchState.counterId;
  c.textContent = "0/0";
  panel.appendChild(c);

  document.body.appendChild(panel);
  return panel;
}

function initSearchPanelOnce() {
  if (sgSearchState.isInitialized) return true;

  var panel = ensureSearchPanelExists();
  if (!panel) return false;

  // lukitse inputin leveys ettei flex venytä
  try {
    var inp = panel.querySelector("input." + sgSearchState.inputClass);
    if (inp) {
      inp.style.flex = "0 0 126px";
      inp.style.width = "126px";
      inp.style.maxWidth = "126px";
      inp.style.minWidth = "0";
    }
  } catch (e) {}

  sgSearchState.isInitialized = true;
  return true;
}

// näyttää panelin
function searchPanel() {
  // odota että DOM on valmis + panel löytyy
  var tries = 0;
  var maxTries = 60; // ~3s

  function tick() {
    if (!document.body) {
      if (++tries >= maxTries) return;
      return setTimeout(tick, 50);
    }

    initSearchPanelOnce();
    var panel = getSearchPanelEl();
    if (!panel) {
      if (++tries >= maxTries) {
        console.warn("searchPanel: panel not found");
        return;
      }
      return setTimeout(tick, 50);
    }

    panel.style.display = "flex";
    panel.classList.add("search-active");
  }

  tick();
}


// --- Device flags (ei vain Apple) ---
(function () {
  function compute() {
    var ua = navigator.userAgent || "";
    var w = window.innerWidth || document.documentElement.clientWidth || 0;
    var h = window.innerHeight || document.documentElement.clientHeight || 0;

    var isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);

    var isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && isTouch); // iPadOS desktop mode

    var isPortrait = h >= w;
    var isMobilePortrait480 = isPortrait && w <= 480;

    return {
      ua: ua,
      w: w, h: h,
      isIOS: isIOS,
      isTouch: isTouch,
      isPortrait: isPortrait,
      isMobilePortrait480: isMobilePortrait480
    };
  }

  function apply() {
    window.SG = window.SG || {};
    window.SG.device = compute();
    window.isIOS = window.SG.device.isIOS;
    window.isMobilePortrait480 = window.SG.device.isMobilePortrait480;
  }

  apply();
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);
})();


// --- Export / alias (korjaa “not defined”) ---
(function () {
  window.SG = window.SG || {};
  window.SG.searchPanel = searchPanel;

  // vanhat nimet jos niitä on käytössä eri napeissa
  window.searchPanel = searchPanel;
  window.openSearchPanel = searchPanel;
  window.startSearchPanel = searchPanel;
  window.toggleSearchPanel = searchPanel;
})();

</script>
