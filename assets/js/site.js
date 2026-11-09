/* Ace Automation - shared site behaviour. No dependencies. */
(function(){
  "use strict";
  var d=document;

  /* 1. Old links: the previous site used overlays on the home page (#checkout, #legal-terms...) and Whop returned to /?wr=... */
  if(location.pathname==="/"||location.pathname==="/index.html"){
    var q=new URLSearchParams(location.search);
    if(q.has("wr")){ location.replace("/members/"+location.search); return; }
    var map={"#checkout":"/start/","#welcome":"/start/#details","#checker":"/members/","#success":"/members/?wr=1&status=succeeded",
             "#legal-terms":"/legal/terms/","#legal-risk":"/legal/risk/","#legal-privacy":"/legal/privacy/"};
    var alias={"#results":"#track-record","#partner":"#partnership","#engine":"#how-it-works","#setup":"#how-it-works",
               "#profiles":"#risk","#pricing":"#fees","#stories":"#clients","#why":"#how-it-works","#top":"#main"};
    if(map[location.hash]){ location.replace(map[location.hash]); return; }
    if(alias[location.hash]){ history.replaceState(null,"",alias[location.hash]); var t=d.querySelector(alias[location.hash]); if(t) t.scrollIntoView(); }
  }

  /* 2. Mobile menu */
  var mb=d.querySelector(".hdr__menu"), mn=d.getElementById("mnav");
  if(mb&&mn){
    var set=function(o){ mn.hidden=!o; mb.setAttribute("aria-expanded",o?"true":"false"); mb.setAttribute("aria-label",o?"Close menu":"Open menu"); };
    mb.addEventListener("click",function(){ set(mn.hidden); if(!mn.hidden){ var a=mn.querySelector("a"); if(a) a.focus(); } });
    mn.addEventListener("click",function(e){ if(e.target.closest("a")) set(false); });
    d.addEventListener("keydown",function(e){ if(e.key==="Escape"&&!mn.hidden){ set(false); mb.focus(); } });
    addEventListener("resize",function(){ if(innerWidth>980&&!mn.hidden) set(false); });
  }

  /* 3a. FAQ topics: without JS every topic is listed under its heading; with JS the topics become tabs and one answer opens at a time */
  var fq=d.querySelector("[data-faq]");
  if(fq){
    var fnav=fq.querySelector(".faq__nav"), fpan=[].slice.call(fq.querySelectorAll("[data-faq-panel]"));
    if(fnav&&fpan.length){
      fq.classList.add("is-tabs"); fnav.hidden=false;
      fpan.forEach(function(p,i){ p.setAttribute("role","tabpanel"); p.setAttribute("aria-labelledby","faqtab-"+p.id.slice(4)); p.hidden=i>0; });
      fq.addEventListener("toggle",function(e){ var t=e.target; if(t.tagName==="DETAILS"&&t.open){ [].forEach.call(fq.querySelectorAll("details[open]"),function(x){ if(x!==t) x.open=false; }); } },true);
      var fgo=function(){ var p=/^#faq-[a-z]+$/.test(location.hash)&&d.getElementById(location.hash.slice(1)); if(p){ var t=d.getElementById("faqtab-"+p.id.slice(4)); if(t){ t.click(); d.getElementById("faq").scrollIntoView(); } } };
      addEventListener("hashchange",fgo); setTimeout(fgo,0);
    }
  }

  /* 3. Tabs (hero accounts, FAQ topics) - WAI-ARIA tabs pattern */
  [].forEach.call(d.querySelectorAll('[role="tablist"]'),function(list){
    var tabs=[].slice.call(list.querySelectorAll('[role="tab"]'));
    function sel(t){ tabs.forEach(function(x){ var on=x===t; x.setAttribute("aria-selected",on?"true":"false"); x.tabIndex=on?0:-1; var p=d.getElementById(x.getAttribute("aria-controls")); if(p) p.hidden=!on; }); }
    tabs.forEach(function(t,i){
      t.addEventListener("click",function(){ sel(t); });
      t.addEventListener("keydown",function(e){ var k=e.key, n=null; if(k==="ArrowRight"||k==="ArrowDown") n=tabs[(i+1)%tabs.length]; if(k==="ArrowLeft"||k==="ArrowUp") n=tabs[(i-1+tabs.length)%tabs.length]; if(k==="Home") n=tabs[0]; if(k==="End") n=tabs[tabs.length-1]; if(n){ e.preventDefault(); sel(n); n.focus(); } });
    });
  });

  /* 4. Scenario calculator (rates from the R1/R2 Myfxbook figures, written in at build time) */
  var calc=d.querySelector("[data-calc]");
  if(calc){
    var R={ r1:{name:"R1 (standard risk)",m:+calc.dataset.r1M,dd:+calc.dataset.r1Dd}, r2:{name:"R2 (higher risk)",m:+calc.dataset.r2M,dd:+calc.dataset.r2Dd} };
    var bal=d.getElementById("calc-bal"), out=function(k){ return calc.querySelector('[data-out="'+k+'"]'); };
    var gbp=function(n){ return "$"+Math.round(n).toLocaleString("en-US"); };
    var pct=function(n){ return (n*100).toFixed(2)+"%"; };
    var run=function(){
      var n=parseFloat(String(bal.value).replace(/[^0-9.]/g,""))||0;
      var a=R[(calc.querySelector('input[name="calc-acct"]:checked')||{}).value||"r1"];
      var mo=+((calc.querySelector('input[name="calc-months"]:checked')||{}).value||3);
      if(n<10000){ out("end").textContent="—"; out("caption").textContent="Enter a starting balance of $10,000 or more."; out("profit").textContent=out("fee").textContent=out("dip").textContent="—"; out("dipnote").textContent=""; return; }
      var v=n, fee=0; for(var i=0;i<mo;i++){ var g=v*a.m, f=g*0.2; fee+=f; v+=g-f; }
      out("end").textContent=gbp(v);
      out("caption").textContent="After "+mo+" month"+(mo>1?"s":"")+" on "+a.name+" from "+gbp(n)+", if every month matched the average month to date.";
      out("profit").textContent="+"+gbp(v-n); out("fee").textContent=gbp(fee); out("dip").textContent=gbp(n*(1-a.dd));
      out("dipnote").textContent="If a drawdown as deep as "+a.name.split(" ")[0]+"'s largest so far (-"+pct(a.dd)+") came early on, a "+gbp(n)+" account could stand at about "+gbp(n*(1-a.dd))+" for a time. Both accounts later reached new highs, which is not guaranteed to happen again.";
    };
    calc.addEventListener("input",run); calc.addEventListener("change",run);
    bal.addEventListener("blur",function(){ var n=parseFloat(String(bal.value).replace(/[^0-9.]/g,"")); if(n) bal.value=Math.round(n).toLocaleString("en-US"); });
    run();
  }

  /* 5. Click-to-play video (nothing loads from YouTube etc. until play is pressed) */
  var initVideo=function(v){
    if(v.querySelector(".video__facade")) return;
    var raw=(v.getAttribute("data-video")||"").trim(); if(!raw) return;
    var lbl=v.getAttribute("data-label")||"Video", m, src=null, poster="", file=false;
    var st=(raw.match(/[?&#](?:t|start)=(\d+)/)||[])[1];
    if((m=raw.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/))){ src="https://www.youtube-nocookie.com/embed/"+m[1]+"?autoplay=1&rel=0&modestbranding=1&playsinline=1"+(st?"&start="+st:""); poster="https://i.ytimg.com/vi/"+m[1]+"/hqdefault.jpg"; }
    else if((m=raw.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/))){ src="https://player.vimeo.com/video/"+m[1]+"?autoplay=1&dnt=1"+(m[2]?"&h="+m[2]:""); }
    else if((m=raw.match(/loom\.com\/(?:share|embed)\/(\w+)/))){ src="https://www.loom.com/embed/"+m[1]+"?autoplay=1"; }
    else if(/\.(mp4|webm|mov)(\?|$)/i.test(raw)){ src=raw; file=true; }
    if(!src) return;
    var fig=v.closest(".story"); if(fig) fig.classList.remove("is-empty");
    var b=d.createElement("button"); b.type="button"; b.className="video__facade"; b.setAttribute("aria-label","Play: "+lbl);
    if(poster) b.style.backgroundImage="url('"+poster+"')";
    b.innerHTML='<span class="video__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>';
    b.addEventListener("click",function(){
      var el;
      if(file){ el=d.createElement("video"); el.src=src; el.controls=true; el.autoplay=true; el.playsInline=true; }
      else { el=d.createElement("iframe"); el.src=src; el.title=lbl; el.setAttribute("allow","autoplay; encrypted-media; picture-in-picture; fullscreen"); el.setAttribute("allowfullscreen",""); el.setAttribute("referrerpolicy","strict-origin-when-cross-origin"); }
      b.replaceWith(el); try{ el.focus(); }catch(e){}
    });
    var empty=v.querySelector(".video__empty"); if(empty) empty.remove();
    v.appendChild(b);
  };
  [].forEach.call(d.querySelectorAll(".video[data-video]"),initVideo);
  /* used by the proposal: stop a playing video and show its poster again */
  window.aceVideoReset=function(v){ var m=v.querySelector("iframe,video"); if(m){ m.remove(); initVideo(v); } };

  /* 6. Cookie notice (essential storage only today; analytics would load only after "Accept") */
  var ck=d.getElementById("cookie"), K="ace.cookies.consent";
  if(ck){
    var seen=null; try{ seen=localStorage.getItem(K); }catch(e){}
    if(!seen) ck.hidden=false;
    [].forEach.call(ck.querySelectorAll("[data-consent]"),function(b){ b.addEventListener("click",function(){ try{ localStorage.setItem(K,b.getAttribute("data-consent")); }catch(e){} ck.hidden=true; }); });
  }
})();
