/* Ace Automation client proposal: personalisation (?for=&by=&contact=), affiliate tools (?affiliate) and PDF download. */
(function(){
  "use strict";
  var d = document, q = new URLSearchParams(location.search);
  var state = { "for": (q.get("for") || "").slice(0, 60), by: (q.get("by") || "").slice(0, 60), contact: (q.get("contact") || "").slice(0, 80) };
  var isAff = q.has("affiliate") || location.hash === "#affiliate";
  function $(id){ return d.getElementById(id); }
  if (!$("prepLine")) return;

  /* A contact typed as @handle, an email or a phone number becomes a link; anything else is shown as plain text. */
  function contactNode(c){
    var t = c.trim(), a;
    if (/^@[\w]{4,}$/.test(t)) { a = d.createElement("a"); a.href = "https://t.me/" + t.slice(1); a.target = "_blank"; a.rel = "noopener"; a.textContent = t + " on Telegram"; return a; }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) { a = d.createElement("a"); a.href = "mailto:" + t; a.textContent = t; return a; }
    if (/^\+?[\d\s()-]{7,}$/.test(t)) { a = d.createElement("a"); a.href = "tel:" + t.replace(/[^\d+]/g, ""); a.textContent = t; return a; }
    return d.createTextNode(t);
  }
  function render(){
    var hasBy = !!state.by.trim(), hasFor = !!state["for"].trim(), hasC = !!state.contact.trim();
    $("prepLine").hidden = !(hasBy || hasFor);
    $("prepFor").textContent = hasFor ? "for " + state["for"].trim() : "";
    $("prepBy").textContent = hasBy ? "by " + state.by.trim() + (hasC ? " · " + state.contact.trim() : "") : "";
    $("affContact").hidden = !hasBy;
    $("affWho").textContent = state.by.trim();
    var how = $("affHow"); how.textContent = "";
    if (hasC) { how.appendChild(d.createTextNode("Contact: ")); how.appendChild(contactNode(state.contact)); }
  }
  function clientUrl(){
    var p = new URLSearchParams();
    ["for", "by", "contact"].forEach(function(k){ if (state[k].trim()) p.set(k, state[k].trim()); });
    var s = p.toString(); return location.origin + location.pathname + (s ? "?" + s : "");
  }
  if (isAff) {
    var bar = $("affBar"), tg = $("affToggle");
    d.body.classList.add("aff-mode"); bar.hidden = false;
    var ins = { "for": $("inFor"), by: $("inBy"), contact: $("inContact") };
    Object.keys(ins).forEach(function(k){
      ins[k].value = state[k];
      ins[k].addEventListener("input", function(){
        state[k] = ins[k].value.slice(0, k === "contact" ? 80 : 60); render();
        var qs = clientUrl().split("?")[1] || ""; history.replaceState(null, "", location.pathname + "?" + (qs ? qs + "&" : "") + "affiliate");
      });
    });
    var setMin = function(m){ bar.classList.toggle("min", m); d.body.classList.toggle("aff-min", m); tg.setAttribute("aria-expanded", m ? "false" : "true"); $("affToggleTxt").textContent = m ? "Edit details" : "Hide details"; };
    tg.addEventListener("click", function(){ setMin(!bar.classList.contains("min")); });
    if (state.by.trim()) setMin(true);
    $("copyLink").addEventListener("click", function(){
      var u = clientUrl(), b = $("copyLink");
      var done = function(){ b.textContent = "Link copied"; setTimeout(function(){ b.textContent = "Copy client link"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(done, function(){ window.prompt("Copy this link:", u); });
      else window.prompt("Copy this link:", u);
    });
  }
  render();

  /* ---- Questions: one answer open at a time. On a phone it is an accordion; on a wide screen the questions sit on the
     left and the open answer (with its video, where there is one) on the right. Without JS every answer is simply listed. ---- */
  var qa = d.querySelector("[data-qa]");
  if (qa) {
    var qbtns = [].slice.call(qa.querySelectorAll(".qa__btn"));
    var openQ = function(b, fromUser){
      qbtns.forEach(function(x){
        var on = x === b, p = $(x.getAttribute("aria-controls"));
        x.setAttribute("aria-expanded", on ? "true" : "false"); x.parentNode.classList.toggle("is-current", on);
        if (!p) return;
        if (!on && !p.hidden && window.aceVideoReset) [].forEach.call(p.querySelectorAll(".video"), window.aceVideoReset);
        p.hidden = !on;
      });
      if (fromUser && window.matchMedia("(max-width:900px)").matches) b.scrollIntoView({ block: "nearest" });
    };
    qa.classList.add("is-on");
    qbtns.forEach(function(b, i){
      b.addEventListener("click", function(){ openQ(b, true); });
      b.addEventListener("keydown", function(e){
        var n = e.key === "ArrowDown" ? qbtns[(i + 1) % qbtns.length] : e.key === "ArrowUp" ? qbtns[(i - 1 + qbtns.length) % qbtns.length] : null;
        if (n) { e.preventDefault(); n.focus(); openQ(n, false); }
      });
    });
    /* a link such as /proposal/#qa-fees opens that answer */
    var fromHash = function(){
      var p = /^#qa-[a-z-]+$/.test(location.hash) && $(location.hash.slice(1)), b = p && $("qa-b-" + p.id.slice(3));
      if (b) { openQ(b, false); $("questions").scrollIntoView(); return true; }
      return false;
    };
    if (!fromHash()) openQ(qbtns[0], false);
    addEventListener("hashchange", fromHash);
  }

  /* ---- PDF: built in the browser. Each section is drawn at desktop width, cut between its blocks and laid onto A4 pages. ---- */
  var PDF_WIDTH = 1040, BG = "#000000";
  function loadScript(src){ return new Promise(function(res, rej){ var s = d.createElement("script"); s.src = src; s.onload = res; s.onerror = function(){ rej(new Error("load " + src)); }; d.head.appendChild(s); }); }
  var libs = null;
  function ensureLibs(){
    if (window.html2canvas && window.jspdf) return Promise.resolve();
    if (!libs) libs = Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
    ]);
    return libs;
  }
  function blocks(){ return [].slice.call(d.querySelectorAll("main > section")); }
  var SKIP = function(n){ return n.classList && n.classList.contains("no-pdf"); };
  var KEEP = ["sec-head", "subhead", "legend", "prop-kicker", "prop-logo"];
  var TAIL = ["note", "small"];   /* a closing note stays with the block before it */
  /* Draw one section and note where its top-level blocks sit, so it can be cut between them. */
  function renderBlock(el, idx, scale){
    var cuts = null;
    el.setAttribute("data-pdf-id", idx);
    return window.html2canvas(el, { backgroundColor: BG, scale: scale, windowWidth: PDF_WIDTH, useCORS: true, logging: false, ignoreElements: SKIP,
      onclone: function(doc){
        doc.documentElement.classList.add("is-pdf");
        /* answers are printed open: drop the shared name first (it lets only one stay open) and the +/x markers */
        [].forEach.call(doc.querySelectorAll("details"), function(x){ x.removeAttribute("name"); x.open = true; });
        [].forEach.call(doc.querySelectorAll('.faq summary [class*="pseudoelement"]'), function(n){ n.parentNode.removeChild(n); });
        [].forEach.call(doc.querySelectorAll("[data-qa]"), function(x){ x.classList.remove("is-on");
          [].forEach.call(x.querySelectorAll(".qa__panel"), function(pn){ pn.hidden = false; });
          [].forEach.call(x.querySelectorAll('.qa__btn [class*="pseudoelement"]'), function(n){ n.parentNode.removeChild(n); }); });
        var c = doc.querySelector('[data-pdf-id="' + idx + '"]'); if (!c) return;
        var wrap = c.querySelector(":scope > .wrap"); if (!wrap) return;
        var top = c.getBoundingClientRect().top;
        /* a very tall block (a long list) may be split between its rows so it does not leave a page half empty */
        var rowsOf = function(k){
          if (k.getBoundingClientRect().height < 600) return null;
          var out = [], cur = null;
          [].forEach.call(k.children, function(x){ var r = x.getBoundingClientRect(); if (!r.height) return;
            if (cur && (cur.glue || Math.abs(r.top - cur.t) < 2)) cur.b = Math.max(cur.b, r.bottom); else { cur = { t: r.top, b: r.bottom }; out.push(cur); }
            cur.glue = x.classList.contains("qa__h"); });
          return out.length > 1 ? out : null;
        };
        cuts = [];
        [].filter.call(wrap.children, function(k){ return !SKIP(k) && !k.hidden && k.getBoundingClientRect().height > 0; })
          .forEach(function(k){ var r = k.getBoundingClientRect(), rows = rowsOf(k);
            if (rows) { rows.forEach(function(w, i){ cuts.push({ top: (i ? w.t : r.top) - top, bottom: (i === rows.length - 1 ? r.bottom : w.b) - top, keep: false }); }); return; }
            cuts.push({ top: r.top - top, bottom: r.bottom - top, keep: KEEP.some(function(cl){ return k.classList.contains(cl); }), tail: TAIL.some(function(cl){ return k.classList.contains(cl); }) }); });
      }
    }).then(function(cv){ el.removeAttribute("data-pdf-id"); return { cv: cv, cuts: cuts }; });
  }
  function slice(cv, y0, y1){
    var c = d.createElement("canvas"); c.width = cv.width; c.height = Math.max(1, Math.round(y1 - y0));
    c.getContext("2d").drawImage(cv, 0, Math.round(y0), cv.width, c.height, 0, 0, cv.width, c.height); return c;
  }
  /* Returns the finished jsPDF document. Kept separate from saving so it can be checked without a download. */
  function buildPdf(){
    return ensureLibs().then(function(){ return d.fonts && d.fonts.ready; }).then(function(){
      var jsPDF = window.jspdf.jsPDF, pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      var PW = 210, PH = 297, MX = 6, MT = 10, MB = 14, CW = PW - MX * 2, AH = PH - MT - MB, SECGAP = 9;
      var scale = Math.min(2, Math.max(1.5, window.devicePixelRatio || 1));
      var pieces = [];
      return blocks().reduce(function(chain, el, idx){
        return chain.then(function(){ return renderBlock(el, idx, scale); }).then(function(r){
          var cv = r.cv, cuts = r.cuts;
          if (!cuts || !cuts.length) { pieces.push({ c: cv, start: true, keep: false }); return; }
          cuts.forEach(function(k, i){
            var y0 = Math.max(0, k.top - 4) * scale;
            var y1 = (i < cuts.length - 1 ? cuts[i + 1].top - 4 : k.bottom + 6) * scale;
            pieces.push({ c: slice(cv, y0, Math.min(y1, cv.height)), start: i === 0, keep: k.keep, tail: !!k.tail && i > 0 });
          });
        });
      }, Promise.resolve()).then(function(){
        var mmPerPx = CW / pieces[0].c.width, BOT = MT + AH, MINS = 0.8;
        function hOf(p){ return p.c.height * mmPerPx; }
        /* 1) group pieces: a heading, intro or legend travels with the piece after it */
        var groups = [], cur = null;
        pieces.forEach(function(p){
          if (p.tail && !cur && groups.length) { groups[groups.length - 1].items.push(p); return; }
          if (!cur) { cur = { items: [], start: p.start }; groups.push(cur); } cur.items.push(p); if (!p.keep) cur = null;
        });
        groups.forEach(function(g){ g.h = g.items.reduce(function(t, p){ return t + hOf(p); }, 0); });
        /* 2) lay groups onto pages; shrink a group (down to 80%) rather than leave a big gap */
        var pages = [[]], y = MT;
        groups.forEach(function(g){
          var gap = (g.start && y > MT) ? SECGAP : (y > MT ? 1.5 : 0), sc = 1, room = BOT - y - gap;
          if (g.h > room) {
            if (y > MT && room >= g.h * MINS) { sc = room / g.h; }
            else { if (y > MT) { pages.push([]); y = MT; } gap = 0; room = AH; if (g.h > room) sc = room / g.h; }
          }
          pages[pages.length - 1].push({ g: g, y: y + gap, sc: sc, gap: gap, line: g.start && gap === SECGAP });
          y += gap + g.h * sc;
        });
        /* 3) spread small leftovers on full pages between groups, so pages look balanced */
        pages.forEach(function(pg, pi){
          if (pi === pages.length - 1 || pg.length < 2) return;
          var last = pg[pg.length - 1], left = BOT - (last.y + last.g.h * last.sc);
          if (left <= 0 || left > AH * 0.3) return;
          var slots = pg.filter(function(it, i){ return i > 0 && it.line; });
          if (!slots.length) slots = pg.slice(1);
          var add = Math.min(left / slots.length, 22), shift = 0;
          pg.forEach(function(it){ if (slots.indexOf(it) >= 0) shift += add; it.y += shift; });
        });
        /* 4) draw */
        pages.forEach(function(pg, pi){
          if (pi > 0) pdf.addPage();
          pdf.setFillColor(5, 7, 6); pdf.rect(0, 0, PW, PH, "F");
          pg.forEach(function(it){
            if (it.line) { pdf.setDrawColor(40, 46, 44); pdf.setLineWidth(0.2); pdf.line(MX + 8, it.y - SECGAP / 2, PW - MX - 8, it.y - SECGAP / 2); }
            var yy = it.y, w = CW * it.sc, x = MX + (CW - w) / 2;
            it.g.items.forEach(function(p){ var h = hOf(p) * it.sc; pdf.addImage(p.c.toDataURL("image/jpeg", 0.9), "JPEG", x, yy, w, h, undefined, "FAST"); yy += h; });
          });
        });
        var n = pdf.getNumberOfPages(), who = state.by.trim() ? ("Prepared by " + state.by.trim() + (state.contact.trim() ? " · " + state.contact.trim() : "")) : "aceautomation.io";
        for (var i = 1; i <= n; i++) {
          pdf.setPage(i); pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); pdf.setTextColor(126, 137, 133);
          pdf.text("Ace Automation · Client proposal · " + who, MX + 8, PH - 6);
          pdf.text("Past results are not a guarantee of future returns.  " + i + " / " + n, PW - MX - 8, PH - 6, { align: "right" });
          if (i === n) pdf.text("Operated by Ace Automation · IFZA licence 87940 · aceautomation.io", MX + 8, PH - 10);
        }
        return pdf;
      });
    });
  }
  function makePdf(btns){
    btns.forEach(function(x){ x.disabled = true; x.dataset.label = x.textContent; x.textContent = "Preparing PDF..."; });
    var finish = function(){ btns.forEach(function(x){ x.disabled = false; x.textContent = x.dataset.label; }); };
    return buildPdf().then(function(pdf){
      var day = new Date().toISOString().slice(0, 10), nm = state["for"].trim().replace(/[^\w-]+/g, "-");
      pdf.save("Ace-Automation-proposal" + (nm ? "-" + nm : "") + "-" + day + ".pdf");
    }).then(finish, function(err){ finish(); alert("Sorry, the PDF could not be created on this device. Try again, or use your browser's Print > Save as PDF."); if (window.console) console.error(err); });
  }
  window.aceProposalPdf = buildPdf;
  [].forEach.call(d.querySelectorAll("[data-download]"), function(b){
    b.addEventListener("click", function(){ makePdf([].slice.call(d.querySelectorAll("[data-download]"))); });
  });
})();
