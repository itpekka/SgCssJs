<!-- SCRIPT 23.2.26 klo 8 --->

<script> 

// Alustukset - nämä toiminnot suoritetaan aina latauksen yhteydessä

(function () {
  var initializedFor = null;

  function initOnce() {
    var article = document.getElementById("article");
    if (!article) return;

    // estä tuplainit samaan DOM-instanssiin
    if (initializedFor === article) return;
    initializedFor = article;

    // täällä: rakenna napit/paneeli, lisää eventit jne.
    // console.log("SG init on article", Date.now());
  }

  // aja heti ja vielä vähän myöhemmin (varmistus)
  initOnce();
  setTimeout(initOnce, 500);
  setTimeout(initOnce, 2500);

  // seuraa DOM-muutoksia ja init uudelleen tarvittaessa
  var mo = new MutationObserver(function () {
    initOnce();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();

(function initDefaultsSafe() {
  // Voi olla että script ajetaan ennen <body>:ä, joten varmistetaan
  function apply() {
    if (!document.body) return;

    var list = document.body.classList;

    if (localStorage.getItem("modeIS") === "dark-mode") {
      list.remove("white-mode");
      list.add("dark-mode");
    } else {
      list.remove("dark-mode");
      list.add("white-mode");
    }

    // resetoi searchPanel-tila
    try {
      localStorage.removeItem("searchPanel");
      localStorage.setItem("searchPanel", "searchOff");
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();

(function forceWhiteInEditor() {
  function apply() {
    if (!document.body) return;
    if (document.getElementsByClassName("editor-padding").length > 0) {
      var list = document.body.classList;
      list.remove("dark-mode");
      list.add("white-mode");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();


(function addDefaultClasses() {
  function apply() {
    if (!document.body) return;
    var list = document.body.classList;
    list.add("mobile-menu-nobar");
    list.add("mobile-menu-look");
    list.add("home-icon");
    list.add("no-category-events");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();

// 🛑 estä lomakkeen submit (ilman optional chainingia)

(function bindFormSubmitGuard() {
  if (!input) return;
  var form = null;
  if (input.closest) form = input.closest("form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
  });
})();

// ⌨️ manuaalinen syöttö → ENTER
(function bindInputHandlers() {
  if (!input) return;

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      startSearch();
    }
  });

  // 📋 datalist-valinta (ei käytössä startSearch:ille tässä versiossa)
  input.addEventListener("change", function () {
    // jos haluat automaattisen startSearchin, avaa tästä
    // if (input.value && input.value.replace(/^\s+|\s+$/g, "")) startSearch();
  });
})();

// oman selauslistan käsittely

(function () {

  var INPUT_SELECTOR = ".search-panel .omainput, .omainput";
  var DATALIST_ID = "searcList";
  var MAX_ITEMS = 100;   // kuinka monta max näytetään

  function qs(sel) { return document.querySelector(sel); }

  function disableNative(input) {
    if (!input) return;
    if (input.getAttribute("list")) input.removeAttribute("list");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("inputmode", "search");
  }

  function createBox() {
    var box = document.getElementById("sg-datalist");
    if (box) return box;

    box = document.createElement("div");
    box.id = "sg-datalist";

    box.style.position = "fixed";
    box.style.zIndex = "999999";
    box.style.maxHeight = "60vh";
    box.style.overflowY = "auto";
    box.style.webkitOverflowScrolling = "touch";
    box.style.display = "none";

    document.body.appendChild(box);
    return box;
  }

  function readOptions() {
    var dl = document.getElementById(DATALIST_ID);
    if (!dl) return [];

    var opts = dl.querySelectorAll("option");
    var out = [];

    for (var i=0;i<opts.length;i++) {
      var v = opts[i].value || "";
      var kw = opts[i].getAttribute("data-keywords") || "";
      out.push({
        value: v,
        hay: (v + " " + kw).toLowerCase()
      });
    }

    return out;
  }

  function dispatch(el,name) {
    try {
      el.dispatchEvent(new Event(name,{bubbles:true}));
    } catch(e) {
      var ev=document.createEvent("Event");
      ev.initEvent(name,true,true);
      el.dispatchEvent(ev);
    }
  }

  function dispatchEnter(el) {
    try {
      el.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",keyCode:13,which:13,bubbles:true}));
      el.dispatchEvent(new KeyboardEvent("keyup",{key:"Enter",keyCode:13,which:13,bubbles:true}));
    } catch(e){}
  }

  function startSearch() {
    if (window.searchStart) return window.searchStart();
    if (window.startSearchPanel) return window.startSearchPanel();
    if (window.openSearchPanel) return window.openSearchPanel();
  }

  function bind(input) {

    if (input.__sgBound) return;
    input.__sgBound=true;

    disableNative(input);

    var box=createBox();
    var all=readOptions();

    var open=false;
    var items=[];

    function close() {
      box.style.display="none";
      open=false;
    }

    function place() {
      var panel = input.closest(".search-panel");
      if (!panel) panel = input;

      var pr = panel.getBoundingClientRect();
      var ir = input.getBoundingClientRect();

      box.style.left  = (pr.left + 8) + "px";
      box.style.width = Math.max(0, pr.width - 16) + "px";
      box.style.top   = (ir.bottom + 10) + "px";
    }

    function render(text) {

      disableNative(input);

      var f=(text||"").toLowerCase();

      items=[];

      for (var i=0;i<all.length;i++) {
        if (!f || all[i].hay.indexOf(f)>=0)
          items.push(all[i].value);
        if (items.length>=MAX_ITEMS) break;
      }

      if (!items.length) { close(); return; }

      var html="";

      for (var i=0;i<items.length;i++)
        html+='<div class="sg-datalist__item" data-i="'+i+'">'+items[i]+'</div>';

      box.innerHTML=html;

      place();

      box.style.display="block";
      open=true;
    }

    function pick(i) {

      input.value=items[i];

      close();

      dispatch(input,"input");
      dispatch(input,"change");

      dispatchEnter(input);

      startSearch();

      setTimeout(function(){input.blur();},50);
    }

    // desktop click
    box.addEventListener("mousedown",function(e){

      var el=e.target.closest(".sg-datalist__item");
      if (!el) return;

      e.preventDefault();

      pick(parseInt(el.dataset.i));

    });

    // mobile scroll-safe tap
    var startY=0,moved=false,target=null;

    box.addEventListener("touchstart",function(e){
      moved=false;
      target=e.target;
      startY=e.touches[0].clientY;
    },{passive:true});

    box.addEventListener("touchmove",function(e){
      if (Math.abs(e.touches[0].clientY-startY)>8)
        moved=true;
    },{passive:true});

    box.addEventListener("touchend",function(e){

      if (moved) return;

      var el=target.closest(".sg-datalist__item");
      if (!el) return;

      e.preventDefault();

      pick(parseInt(el.dataset.i));

    });

    input.addEventListener("focus",function(){render(input.value);});
    input.addEventListener("input",function(){render(input.value);});
    input.addEventListener("blur",function(){setTimeout(close,150);});

  }

  function init() {

    var input=qs(INPUT_SELECTOR);

    if (!input) return false;

    bind(input);

    return true;
  }

  // init now + retry (Wise render)
  init();
  setTimeout(init,300);
  setTimeout(init,1000);
  setTimeout(init,3000);

  new MutationObserver(init)
    .observe(document.documentElement,{childList:true,subtree:true});

})();

// sen loppu


//   Yleiset toiminnot (dark mode, scroll, menu, search - näillä oma ulkoinen button)  
    
function searchPanel() {
    var searchMode = localStorage.getItem("searchPanel");
    if (searchMode === "searchOn") {
        localStorage.setItem("searchPanel","searchOff");  
        endSearch();
        } 
    else {
        localStorage.setItem("searchPanel","searchOn");
        document.getElementById("SearchPanel").style.display = "flex";

        // avaa lista varmasti (2 framea varmistaa että layout on laskettu)
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
            if (window.SG_OpenSearchList) window.SG_OpenSearchList();
            });
        });
        }
    }

function darkFunction() {
  var currentMode = localStorage.getItem("modeIS");
  var list = document.body ? document.body.classList : null;
  if (!list) return;

  if (currentMode === "dark-mode") {
    list.remove("dark-mode");
    list.add("white-mode");
    localStorage.setItem("modeIS", "white-mode");
  } else {
    list.remove("white-mode");
    list.add("dark-mode");
    localStorage.setItem("modeIS", "dark-mode");
  }
}

function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

function displayFunction() {
  var element = document.getElementById("article");
  if (element && element.scrollIntoView) element.scrollIntoView();
}

function submenuFunction() {
  var currentMode = localStorage.getItem("submenu");
  var list = document.body ? document.body.classList : null;
  if (!list) return;

  if (currentMode === "mobile-menu-nobar") {
    list.remove("mobile-menu-nobar");
    list.remove("search-theme");
    list.add("mobile-menu-showbar");
    list.add("mobile-noheader-text");
    localStorage.setItem("submenu", "mobile-menu-showbar");
    displayFunction();
  } else {
    list.remove("mobile-menu-showbar");
    list.remove("mobile-menu-nobar");
    list.remove("search-theme");
    list.add("mobile-menu-showbar");
    list.add("mobile-noheader-text");
    localStorage.setItem("submenu", "mobile-menu-nobar");
    displayFunction();
  }
}

// ulkoisista funktioista kutsutus alifunkiot

function startSearch() {
    
  var inputEl = document.getElementById("searchInput");
  if (!inputEl) {
    return;
  }

  // Varmista että se on oikeasti input/textarea
  var tag = (inputEl.tagName || "").toLowerCase();
  if (tag !== "input" && tag !== "textarea") {
    return;
  }

  var term = "";
  try {
    term = String(inputEl.value || "");
    term = term.replace(/^\s+|\s+$/g, ""); // trim ES5-varmasti
  } catch (err) {
    return;
  }

  if (!term) return;

  var article = document.getElementById("article");
  if (!article) return;

  clearSearchArtifacts(article);

  var terms = getSearchTerms(term);
  for (var i = 0; i < terms.length; i++) {
    highlightTermAppend(article, terms[i]);
  }

  matches = Array.prototype.slice.call(
    article.querySelectorAll("mark.search-highlight")
  );

  currentIndex = -1;
  updateCounter();
  inputEl.value = "";

  var panel = document.getElementById("SearchPanel");
  if (panel) panel.style.display = "flex";

  requestAnimationFrame(function () {
    nextMatch();
  });
    
}

function handleDatalistSelect(e) {
    
  if (!e || !e.target) return;
  var inp = e.target;

  var listId = inp.getAttribute("list");
  if (!listId) return;

  var options = document.querySelectorAll("#" + listId + " option");
  var isFromDatalist = false;

  for (var i = 0; i < options.length; i++) {
    if (options[i].value === inp.value) {
      isFromDatalist = true;
      break;
    }
  }

  if (!isFromDatalist) return;

  startSearch();

  if (isIOSsg) return;

  requestAnimationFrame(function () {
    try {
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    } catch (err) {}
  });
}

function nextMatch() {
    
  if (!matches || !matches.length) return;

  // poista vanha current
  var currents = document.querySelectorAll("mark.search-highlight.current");
  for (var i = 0; i < currents.length; i++) currents[i].classList.remove("current");

  var tries = 0;
  var idx = currentIndex;

  while (tries < matches.length) {
    idx = (idx + 1) % matches.length;
    var candidate = matches[idx];

    var ok = (typeof isMatchNavigable === "function")
      ? isMatchNavigable(candidate)
      : isElementVisible(candidate);

    if (ok) {
      currentIndex = idx;
      break;
    }
    tries++;
  }

  if (tries >= matches.length) {
    updateCounter();
    return;
  }

  var el = matches[currentIndex];

  // avaa tab ennen scrollia (jos osuma tabissa)
  if (el && el.closest) {
    var pane = el.closest(".tab-pane");
    if (pane) activateTabByPane(pane);

    // varmuuden vuoksi tab-otsikko
    var tabLink = el.closest(".nav-tabs a, .nav-tabs li a");
    if (tabLink) {
      var href = tabLink.getAttribute("href");
      if (href && href.indexOf("#") === 0) openTabSilentlyById(href.slice(1));
    }
  }

  el.classList.add("current");

  requestAnimationFrame(function () {
    if (el.scrollIntoView) el.scrollIntoView({ block: "center" });

    // iPad-fix: fokus osumaan
    try {
      el.setAttribute("tabindex", "-1");
      if (el.focus) el.focus({ preventScroll: true });
    } catch (err) {}

    updateCounter();
  });
}

function prevMatch() {
    
  if (!matches || !matches.length) return;

  var currents = document.querySelectorAll("mark.search-highlight.current");
  for (var i = 0; i < currents.length; i++) currents[i].classList.remove("current");

  var tries = 0;
  var idx = currentIndex;

  while (tries < matches.length) {
    idx = (idx - 1 + matches.length) % matches.length;
    var candidate = matches[idx];

    var ok = (typeof isMatchNavigable === "function")
      ? isMatchNavigable(candidate)
      : isElementVisible(candidate);

    if (ok) {
      currentIndex = idx;
      break;
    }
    tries++;
  }

  if (tries >= matches.length) {
    updateCounter();
    return;
  }

  var el = matches[currentIndex];

  if (el && el.closest) {
    var pane = el.closest(".tab-pane");
    if (pane) activateTabByPane(pane);

    var tabLink = el.closest(".nav-tabs a, .nav-tabs li a");
    if (tabLink) {
      var href = tabLink.getAttribute("href");
      if (href && href.indexOf("#") === 0) openTabSilentlyById(href.slice(1));
    }
  }

  el.classList.add("current");

  requestAnimationFrame(function () {
    if (el.scrollIntoView) el.scrollIntoView({ block: "center" });

    try {
      el.setAttribute("tabindex", "-1");
      if (el.focus) el.focus({ preventScroll: true });
    } catch (err) {}

    updateCounter();
  });
}

function endSearch() {
    
  var article = document.getElementById("article");
  if (article) clearSearchArtifacts(article);   // ✅ tärkein

  // nollaa tila
  matches = [];
  currentIndex = -1;

  // poista current-luokka varmuuden vuoksi
  document.querySelectorAll("mark.search-highlight.current")
    .forEach(function(m){ m.classList.remove("current"); });

  // piilota paneeli
  var panel = document.getElementById("SearchPanel");
  if (panel) panel.style.display = "none";

  localStorage.setItem("searchPanel", "searchOff");
  if (typeof updateCounter === "function") updateCounter();
}

function updateCounter() {
    
  var counter = document.getElementById("counter");
  if (!counter) return;

  var nav = getNavigableMatches();
  var total = nav.length;

  if (!total) {
    counter.textContent = "0 / 0";
    return;
  }

  var currentEl = matches[currentIndex];
  var pos = indexOfNode(nav, currentEl);

  if (pos === -1) {
    for (var i = 0; i < matches.length; i++) {
      var idx = (currentIndex + i + matches.length) % matches.length;
      var cand = matches[idx];
      pos = indexOfNode(nav, cand);
      if (pos !== -1) break;
    }
    if (pos === -1) pos = 0;
  }

  counter.textContent = String(pos + 1) + " / " + String(total);
}

function indexOfNode(arr, node) {
    
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === node) return i;
  }
  return -1;
}

function getNavigableMatches() {
  var out = [];
  for (var i = 0; i < matches.length; i++) {
    if (isMatchNavigable(matches[i])) out.push(matches[i]);
  }
  return out;
}

function isElementVisible(el) {
  if (!el) return false;

  // isConnected ei aina ole olemassa vanhoissa ympäristöissä
  if (typeof el.isConnected !== "undefined" && !el.isConnected) return false;

  var node = el;
  while (node) {
    var style = getComputedStyle(node);
    if (style.display === "none") return false;
    if (style.visibility === "hidden") return false;
    if (style.opacity === "0") return false;
    node = node.parentElement;
  }
  return true;
}

function removeAllMarks(root) {
    
  root = root || document;
  var list = root.querySelectorAll("mark");
  for (var i = 0; i < list.length; i++) {
    var mark = list[i];
    var text = document.createTextNode(mark.textContent);
    if (mark.parentNode) {
      mark.parentNode.replaceChild(text, mark);
      mark.parentNode.normalize();
    }
  }
}

function clearSearch() {
    
  var article = document.getElementById("article");
  if (!article) return;

  var marks = article.querySelectorAll("mark");
  for (var i = 0; i < marks.length; i++) {
    var m = marks[i];
    if (m.parentNode) m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
  }

  matches = [];
  currentIndex = -1;
}

/* =========================================================
   Tab-avaus
   ========================================================= */

function openTabByTitle(titleText) {
  var target = normalizeText(titleText);
  var tabs = document.querySelectorAll('.nav-tabs a[data-toggle="tab"]');

  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    var tabTitle = normalizeText(tab.textContent || "");
    if (tabTitle === target) {
      if (tab.parentElement && tab.parentElement.classList.contains("active")) return;
      showTab(tab);
      return;
    }
  }
}

function normalizeText(str) {
  str = String(str || "");
  return str
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\s+|\s+$/g, "")
    .toLowerCase();
}

function showTab(tab) {
  var href = tab.getAttribute("href");
  if (href && href.indexOf("#") === 0) {
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {}
  }

  // Bootstrap 5
  if (window.bootstrap && bootstrap.Tab && bootstrap.Tab.getOrCreateInstance) {
    bootstrap.Tab.getOrCreateInstance(tab).show();
    return;
  }

  // Bootstrap 3/4
  if (typeof jQuery !== "undefined" && jQuery.fn && typeof jQuery.fn.tab === "function") {
    jQuery(tab).tab("show");
    return;
  }

  // fallback click
  try {
    tab.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  } catch (e) {
    tab.click();
  }
}

function activateTabByPaneId(paneId) {
  if (!paneId) return;

  // EI template literal / EI CSS.escape -> suora selektori (oletus: id ei sisällä erikoismerkkejä)
  var tabLink = document.querySelector('.nav-tabs a[href="#' + paneId + '"]');
  if (!tabLink) return;

  // Bootstrap 5
  if (window.bootstrap && bootstrap.Tab && bootstrap.Tab.getOrCreateInstance) {
    bootstrap.Tab.getOrCreateInstance(tabLink).show();
  } else if (window.jQuery && jQuery(tabLink).tab) {
    // Bootstrap 3/4
    jQuery(tabLink).tab("show");
  } else {
    tabLink.click();
  }

  // Päivitä hash ilman URL-olion käyttöä (editor-safe)
  try {
    history.replaceState(null, "", "#" + paneId);
  } catch (e) {}
}

function activateTabByPane(pane) {
  if (!pane) return;
  var paneId = pane.id;
  if (!paneId) return;

  var tabLink = document.querySelector('.nav-tabs a[href="#' + paneId + '"]');
  if (!tabLink) return;

  if (window.jQuery && jQuery(tabLink).tab) {
    jQuery(tabLink).tab("show");
    return;
  }

  tabLink.click();
}

function openTabSilentlyById(panelId) {
  var tabLink = document.querySelector('.nav-tabs a[href="#' + panelId + '"]');
  if (!tabLink) return;

  if (typeof jQuery !== "undefined" && jQuery(tabLink).tab) {
    jQuery(tabLink).tab("show");
  } else {
    tabLink.click();
  }
}

/* =========================================================
   Highlight / search
   ========================================================= */

function highlightTermAppend(root, term) {
  if (!root || !term) return [];

  var localMatches = [];
  var safeTerm = String(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var regex = new RegExp(safeTerm, "gi");

  var textNodes = [];
  var walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue.replace(/^\s+|\s+$/g, "")) return NodeFilter.FILTER_REJECT;

        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        // älä koske jo korostettuun
        if (parent.closest && parent.closest("mark")) return NodeFilter.FILTER_REJECT;

        // älä koske näihin
        if (parent.closest && parent.closest("script,style,iframe,.article-menu-button,.element-survey,form,input,textarea,select,option,button,label,.ala-nayta,.no-search,.article-date, .article-aligned")) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  while (walker.nextNode()) {
    var node = walker.currentNode;
    if (regex.test(node.nodeValue)) textNodes.push(node);
    regex.lastIndex = 0;
  }

  for (var i = 0; i < textNodes.length; i++) {
    var tn = textNodes[i];
    var span = document.createElement("span");
    span.className = "search-wrap";

    // EI nuolifunktioita / EI template literal
    span.innerHTML = tn.nodeValue.replace(regex, function (m) {
      return '<mark class="search-highlight">' + m + "</mark>";
    });

    tn.parentNode.replaceChild(span, tn);

    var marks = span.querySelectorAll("mark.search-highlight");
    for (var j = 0; j < marks.length; j++) localMatches.push(marks[j]);
  }

  return localMatches;
}

function getSearchTerms(inputValue) {
  var list = document.getElementById("searcList");
  if (!list) return [inputValue];

  var options = list.querySelectorAll("option");
  for (var i = 0; i < options.length; i++) {
    var opt = options[i];
    if (opt.value === inputValue) {
      var kw = (opt.getAttribute("data-keywords") || "").replace(/^\s+|\s+$/g, "");
      if (kw) return parseKeywords(kw);
      return [opt.value];
    }
  }

  return [inputValue];
}

function clearSearchArtifacts(root) {
  if (!root) return;

  var marks = root.querySelectorAll("mark");
  for (var i = 0; i < marks.length; i++) {
    var mark = marks[i];
    if (mark.closest && mark.closest(".element-survey")) continue;
    if (mark.parentNode) mark.parentNode.replaceChild(document.createTextNode(mark.textContent), mark);
  }

  var wraps = root.querySelectorAll("span.search-wrap");
  for (i = 0; i < wraps.length; i++) {
    var span = wraps[i];
    if (span.closest && span.closest(".element-survey")) continue;
    if (span.parentNode) span.parentNode.replaceChild(document.createTextNode(span.textContent), span);
  }

  root.normalize();
}

function parseKeywords(str) {
  var result = [];
  var regex = /"([^"]+)"|(\S+)/g;
  var match;

  while ((match = regex.exec(str)) !== null) {
    result.push(match[1] || match[2]);
  }
  return result;
}

function isMobilePortrait480() {
  return window.matchMedia && window.matchMedia("(max-width: 480px) and (orientation: portrait)").matches;
}

function isLaptopLike() {
  return window.matchMedia && window.matchMedia("(min-width: 1024px) and (hover: hover)").matches;
}

function isHiddenByMobileClasses(el) {
  if (!isMobilePortrait480()) return false;
  if (!el || !el.closest) return false;

  // #article .no-mobile-text-p .small-article-delete { display:none; }
  if (el.closest("#article .no-mobile-text-p .small-article-delete")) return true;
    
  if (el.closest("#article .no-mobile-text .tab-content .element-text")) return true;

  // #article .no-mobile-text .tab-content .active .element-text:first-child { display:none; }
  var et = el.closest("#article .no-mobile-text .tab-content .active .element-text");
  if (et && et.matches && et.matches(":first-child")) return true;

  return false;
}

function isMatchNavigable(el) {
  if (!el) return false;
  if (typeof el.isConnected !== "undefined" && !el.isConnected) return false;

  // mobiilissa piilossa
  if (isHiddenByMobileClasses(el)) return false;

  // läppärissä piilossa olevat
  if (isLaptopLike() && el.closest && el.closest(".no-laptop")) return false;

  // ei no-leadä mukaan
  if (el.closest && el.closest("#article .small-article-laptop .tab-content .no-lead")) return false;

  // tabin sisällä -> navigoitava (tab voidaan avata)
  if (el.closest && el.closest(".tab-pane")) return true;

  return isElementVisible(el);
}

function injectSearchPanel() {

    // estä tuplalisäys
    if (document.getElementById("SearchPanel")) return;

    var panelHTML =
        '<div id="SearchPanel" class="search-panel">' +
            '<span class="linssi-painike"></span>' +

            '<input ' +
                'class="omainput" ' +
                'list="searcList" ' +
                'id="searchInput" ' +
                'placeholder="Klikkaa -->" ' +
                'autocomplete="off" ' +
                'autocorrect="off" ' +
                'autocapitalize="off" ' +
                'spellcheck="false">' +

            '<span class="dropdown-arrow">▾</span>' +

            '<button class="search-painike" id="prevBtn">◀</button>' +
            '<button class="search-painike" id="nextBtn">▶</button>' +

            '<span id="counter">0 / 0</span>' +

            '<button class="close-painike" id="closeBtn">X</button>' +

        '</div>';

    document.body.insertAdjacentHTML("beforeend", panelHTML);


    // lisää eventit
    var input = document.getElementById("searchInput");

    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            startSearch();
        }
    });

    input.addEventListener("input", handleDatalistSelect);

    document.getElementById("prevBtn").addEventListener("click", prevMatch);
    document.getElementById("nextBtn").addEventListener("click", nextMatch);
    document.getElementById("closeBtn").addEventListener("click", endSearch);
}


function loadArticleClass() {
  if (!document.body) return;
  var style = window.getComputedStyle(document.body);
  var luokat = (style.getPropertyValue("--articleClass") || "").replace(/^\s+|\s+$/g, "");
  if (!luokat) return;

  // jos useita luokkia, lisää yksi kerrallaan
  var parts = luokat.split(/\s+/);
  for (var i = 0; i < parts.length; i++) {
    if (parts[i]) document.body.classList.add(parts[i]);
  }
}

function replaceFunction() {
  var element = document.getElementById("Kalenteri");
  if (!element) return;

  element.innerHTML = element.innerHTML.replace(/Golfkoulu/g, "Tehokurssit");
}

function scrollToWithOffset(el, offsetPx) {
  var y = el.getBoundingClientRect().top + window.pageYOffset - offsetPx;
  window.scrollTo({ top: y, behavior: "smooth" });
}
 

/* =========================================================
   iOS-tunnistus (editor-safe)
   ========================================================= */
var isIOSsg = false;
try {
  var ua = navigator.userAgent || "";
  isIOSsg = (ua.indexOf("iPad") > -1) || (ua.indexOf("iPhone") > -1) || (ua.indexOf("iPod") > -1);
} catch (e) {
  isIOSsg = false;
}

try {
  localStorage.setItem("searchPanel", "searchOff");
} catch (e) {}

/* =========================================================
   Search panel -tila
   ========================================================= */

var matches = [];
var currentIndex = -1;
var originalHTML = null;        // jos tarvitset myöhemmin
var searchPanelActive = false;  // jos käytät ulko-klikkausta
var originalArticleHTML = null;

var input = document.getElementById("searchInput");


// EventListener toiminnot

document.addEventListener("DOMContentLoaded", function () {
  originalHTML = document.body ? document.body.innerHTML : null;

  var article = document.getElementById("article");
  if (article) originalArticleHTML = article.innerHTML;
});

document.addEventListener("DOMContentLoaded", function() {
    injectSearchPanel();
});


document.addEventListener("click", function (e) {
  if (!e || !e.target) return;
  if (!e.target.closest) return;

  var btn = e.target.closest(".tabclick");
  if (!btn) return;

  var href = btn.getAttribute("href");
  if (!href || href.indexOf("#") === -1) return;

  var hash = href.split("#")[1];
  if (!hash) return;

  e.preventDefault(); // ⬅️ TÄMÄ ON PAKOLLINEN

  activateTabByPaneId(hash);

  try {
    history.pushState({ tab: hash }, "", "#" + hash);
  } catch (err) {}

  requestAnimationFrame(function () {
    var target = document.getElementById(hash);
    if (target && target.scrollIntoView) target.scrollIntoView({ block: "start" });
    });
});

window.addEventListener("popstate", function () {
  var h = location.hash || "";
  if (!h) return;
  if (h.charAt(0) !== "#") h = "#" + h;

  var paneId = h.slice(1);
  activateTabByPaneId(paneId);

  requestAnimationFrame(function () {
    var target = document.getElementById(paneId);
    if (target && target.scrollIntoView) target.scrollIntoView({ block: "start" });
    });
});

window.SG_OpenSearchList = function () {
  try {
    // etsi aina uudelleen, koska Wise voi vaihtaa elementin julkaisussa
    var input = document.querySelector(".search-panel .omainput, .omainput");
    if (!input) return false;

    // pakota fokus ja input-eventti -> meidän render() reagoi
    input.focus();

    // jos input-eventti ei laukaise, laukaistaan itse
    input.dispatchEvent(new Event("input", { bubbles: true }));

    return true;
  } catch (e) {
    return false;
  }
};


/* =========================================================
   Export: Inline-HTML kutsuu näitä suoraan
   ========================================================= */

window.loadArticleClass = loadArticleClass;
window.darkFunction = darkFunction;
window.topFunction = topFunction;
window.displayFunction = displayFunction;
window.submenuFunction = submenuFunction;
window.replaceFunction = replaceFunction;
window.startSearch = startSearch;
window.nextMatch = nextMatch;
window.prevMatch = prevMatch;
window.endSearch = endSearch;
window.handleDatalistSelect = handleDatalistSelect;

/* === SG aliases (compat) === */

</script>
