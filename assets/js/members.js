/* Member pricing: Whop loader + price checker (billing logic ported unchanged) */
/* Whop returns here with ?wr=1&status=...: show the confirmation for a successful payment. */
(function(){var q=new URLSearchParams(location.search);if(!q.has("wr"))return;var ok=q.get("status")==="succeeded",s=document.getElementById("success"),c=document.getElementById("checker");if(ok&&s){s.hidden=false;if(c)c.hidden=true;}try{history.replaceState(null,"",location.pathname);}catch(e){}})();
/* Whop Elements: only the existing-member price page (#checker) uses it, so it loads on demand there. */
window.axLoadWhop=(function(){var st=0,q=[];function flush(){var f;while((f=q.shift())){try{f();}catch(e){}}}
  return function(cb){if(window.WhopElements){if(cb)cb();return;}if(cb)q.push(cb);if(st)return;st=1;
    var s=document.createElement("script");s.src="https://cdn.whop.com/elements/amber/elements.js";s.async=true;s.setAttribute("data-whop-elements","");
    s.onload=flush;s.onerror=function(){st=0;flush();};document.head.appendChild(s);};})();
/* this page exists for the checkout, so start loading Whop straight away */
window.axLoadWhop();
(function(){
  "use strict";
  var TIERS=[
    {min:0,max:2499,name:"Starter",price:"£49.99",url:"https://whop.com/checkout/plan_NVHjN8HdtyVi9",oncePrice:"£64.99",onceUrl:"https://whop.com/checkout/plan_dejBM1psLuNoa"},
    {min:2500,max:4999,name:"Core",price:"£99.99",url:"https://whop.com/checkout/plan_Y0LHDDt1E8plm",oncePrice:"£99.99",onceUrl:"https://whop.com/checkout/plan_cw6dKal3PzHcp"},
    {min:5000,max:9999,name:"Growth",price:"£149.99",url:"https://whop.com/checkout/plan_IlbgmgJ5O4Bge",oncePrice:"£149.99",onceUrl:"https://whop.com/checkout/plan_VbJF1PFtcjQee"},
    {min:10000,max:19999,name:"Advanced",price:"£299.99",url:"https://whop.com/checkout/plan_HsYygm1VSVSqP",oncePrice:"£299.99",onceUrl:"https://whop.com/checkout/plan_PXuug3rd2wNDD"},
    {min:20000,max:49999,name:"Professional",price:"£649.99",url:"https://whop.com/checkout/plan_Gt6k0Jt0MRRPz",oncePrice:"£649.99",onceUrl:"https://whop.com/checkout/plan_VcuwUY9grhB6i"},
    {min:50000,max:79999,name:"Elite",price:"£999.99",url:"https://whop.com/checkout/plan_ruflSusNtQSUN"}
  ];
  var MIN_SIZE=0,BESPOKE_FROM=80000,CONTACT_URL="https://wa.me/447446978735?text=Hi%2C%20I%27m%20interested%20in%20Ace%20Automation.%20Please%20can%20you%20send%20me%20the%20steps%20to%20get%20set%20up%3F";
  var form=document.getElementById("chkForm"); if(!form) return;
  var input=document.getElementById("chkSize"),errorEl=document.getElementById("chkError"),resultEl=document.getElementById("chkResult");
  /* GATE RETIRED 2026-08-10: plans changed - existing members activate their subscription NOW
     (July waived; activation deadline 15 Aug 2026 23:59 UK). UNLOCK_UTC is set to a past instant
     so the checker always renders the LIVE recurring checkout. The one-time "cover this month"
     bridge + countdown code below is DORMANT - set UNLOCK_UTC to a future Date.UTC to re-enable. */
  var UNLOCK_UTC=Date.UTC(2026,7,1,0,0,0);
  var cdIv=null,lastN=null;
  function locked(){return Date.now()<UNLOCK_UTC;}
  function pad2(x){return String(x).length<2?"0"+x:String(x);}
  function tickCd(){
    if(!locked()){
      if(cdIv){clearInterval(cdIv);cdIv=null;}
      if(lastN!=null)renderResult(lastN);
      return;
    }
    var s=Math.floor((UNLOCK_UTC-Date.now())/1000);
    var v={d:pad2(Math.floor(s/86400)),h:pad2(Math.floor(s%86400/3600)),m:pad2(Math.floor(s%3600/60)),s:pad2(s%60)};
    ["d","h","m","s"].forEach(function(k){
      var els=document.querySelectorAll(".cdv-"+k);
      for(var i=0;i<els.length;i++)els[i].textContent=v[k];
    });
  }
  function startCd(){if(locked()){tickCd();if(!cdIv)cdIv=setInterval(tickCd,1000);}}
  function parseAmount(raw){var s=String(raw).trim().toLowerCase();s=s.replace(/[£$€,\s]/g,"");var mult=1;if(s.charAt(s.length-1)==="k"){mult=1000;s=s.slice(0,-1);}if(s===""||!/^\d*\.?\d+$/.test(s))return null;var n=Number(s)*mult;if(!isFinite(n)||n<0)return null;return n;}
  function gbp(n){return n.toLocaleString("en-GB");}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function show(h){resultEl.innerHTML=h;resultEl.hidden=false;var ph=document.getElementById("chkPlaceholder");if(ph)ph.style.display="none";}
  function tierFor(n){for(var i=0;i<TIERS.length;i++){if(n>=TIERS[i].min&&n<=TIERS[i].max)return TIERS[i];}return null;}
  function renderResult(nv){
    lastN=nv;
    var t=tierFor(nv); if(!t)return;
    var head='<div class="chk-head"><div class="chk-eyebrow">Your tier</div><div class="chk-tier">'+esc(t.name)+'</div><div class="chk-band">'+bandLabel(t)+' accounts</div><div class="chk-size">Based on a £'+gbp(nv)+' account</div><div class="chk-warn"><span class="chk-warn-ico" aria-hidden="true">&#9888;</span><div class="chk-warn-body"><strong>This must match your real account size</strong> - your total balance including any trading credit bonuses. If it does not, the system may not mark you as subscribed and <strong>you can be disconnected</strong>. Whenever you <strong>deposit more funds</strong> or your account size changes, you must message <a href="https://wa.me/447446978735?text=Hi%2C%20I%27m%20interested%20in%20Ace%20Automation.%20Please%20can%20you%20send%20me%20the%20steps%20to%20get%20set%20up%3F" target="_blank" rel="noopener">us on WhatsApp</a> so we keep you on the correct tier - if your band changes, your <strong>next month\'s billing is updated</strong>. We assess your tier on your <strong>average balance across the billing month</strong>, so dipping under a threshold before renewal changes nothing. If you do not tell us and you have moved tiers, <strong>you can be disconnected</strong>.</div></div></div>';
    if(locked()&&t.onceUrl){
      var oncePlan=t.onceUrl.split("/").pop();
      show(head
        +'<div class="chk-options">'
        +'<div class="chk-opt"><div class="chk-opt-head"><span class="chk-opt-tag chk-opt-tag--live">Available now</span><span class="chk-opt-price">'+esc(t.oncePrice)+' <em>one-time</em></span></div>'
        +'<div class="chk-opt-name">Cover the rest of this month</div>'
        +'<p class="chk-opt-sub">Pay a one-off for this month and get connected now. No recurring charge - then set up your subscription when it opens.</p>'
        +'<p class="chk-agree">By proceeding with payment you agree to our <a href="#legal-terms">Terms &amp; Conditions</a> and <a href="#legal-risk">Risk Disclosure</a>.</p>'
        +'<div class="whop-mount"><a class="chk-btn" href="'+t.onceUrl+'" target="_blank" rel="noopener">Pay '+esc(t.oncePrice)+' one-time &rarr;</a></div>'
        +'<p class="chk-fine">One-time payment for this month only. Software access only, Ace Automation does not hold client funds. <a href="'+t.onceUrl+'" target="_blank" rel="noopener" style="color:var(--c-fg-faint);text-decoration:underline;">Checkout not loading? Open it here.</a></p></div>'
        +'<div class="chk-opt chk-opt--locked"><div class="chk-opt-head"><span class="chk-opt-tag">Opens 1 September</span><span class="chk-opt-price">'+esc(t.price)+' <em>/month</em></span></div>'
        +'<div class="chk-opt-name">Monthly subscription</div>'
        +'<p class="chk-opt-sub">Opens at 00:00 UK time on 1 September. After covering this month, come back here and set up your subscription.</p>'
        +'<div class="checker-cd checker-cd--sm"><div class="checker-cd-cell"><span class="checker-cd-num cdv-d">--</span><span class="checker-cd-lbl">Days</span></div><div class="checker-cd-cell"><span class="checker-cd-num cdv-h">--</span><span class="checker-cd-lbl">Hours</span></div><div class="checker-cd-cell"><span class="checker-cd-num cdv-m">--</span><span class="checker-cd-lbl">Minutes</span></div><div class="checker-cd-cell"><span class="checker-cd-num cdv-s">--</span><span class="checker-cd-lbl">Seconds</span></div></div></div>'
        +'</div>');
    } else {
      var planId=t.url.split("/").pop();
      show(head
        +'<div class="chk-single">'
        +'<div class="chk-price">'+esc(t.price)+'<span class="chk-per">per month</span></div>'
        +'<div class="chk-chips"><span>&#10003; Cancel any time</span><span>&#10003; No performance fee</span><span>&#10003; Keep 100% of your profits</span></div>'
        +'<div class="chk-gate2"><div class="chk-gate2-t">Before you pay, confirm each of the following</div>'
        +'<label class="chk-tick"><input type="checkbox" data-unlock> <span>I will <strong>not manually trade</strong> on the account connected to Ace Automation, and I understand any profits from manual trading on it are payable to Ace Automation.</span></label>'
        +'<label class="chk-tick"><input type="checkbox" data-unlock> <span>The account size I entered is my <strong>real total balance including any trading credit bonuses</strong>, and whenever I deposit more funds or my account size changes I will report it on WhatsApp so my tier and next month\'s billing can be updated - otherwise I may not be marked as subscribed and can be disconnected. I understand tiers are assessed on my average balance across the billing period.</span></label>'
        +'<label class="chk-tick"><input type="checkbox" data-unlock> <span>I understand trading carries <strong>real risk of loss</strong>, profits are never guaranteed, past performance does not guarantee future results, and Ace Automation is software, not financial advice.</span></label>'
        +'<label class="chk-tick"><input type="checkbox" data-unlock> <span>I understand my account is only monitored while my subscription is active: if I cancel or my subscription lapses, my account is disconnected and <strong>any open trades are closed automatically</strong> - during a drawdown this realises open losses, and the impact on my account can be significant. If I decide to leave, I will <strong>message Ace Automation first</strong> so my account can be wound down properly.</span></label>'
        +'<label class="chk-tick"><input type="checkbox" data-unlock> <span>I have read and agree to the <a href="#legal-terms">Terms &amp; Conditions</a> and <a href="#legal-risk">Risk Disclosure</a>.</span></label>'
        +'</div>'
        +'<div class="chk-paybox" id="chkPaybox"><div class="chk-paybox-hint">Tick all five boxes above to unlock your secure checkout</div></div>'
        +'<p class="chk-fine">Billed monthly. Software access only - Ace Automation does not hold client funds.</p>'
        +'<div class="chk-cancel"><div class="chk-cancel-t"><span aria-hidden="true">&#9888;</span> Before you ever cancel</div><ul>'
        +'<li>Cancelling ends your access at the end of your current billing period, and your account is only monitored while your subscription is active.</li>'
        +'<li>When your account is disconnected, <strong>any open trades are closed automatically</strong>. During a drawdown this locks in open losses, and the impact on your account can be significant.</li>'
        +'<li>Cancelling a discounted or promotional rate may mean losing that pricing permanently - rejoining later may be at the latest available price.</li>'
        +'<li><strong>Thinking of leaving?</strong> Message <a href="https://wa.me/447446978735?text=Hi%2C%20I%27m%20interested%20in%20Ace%20Automation.%20Please%20can%20you%20send%20me%20the%20steps%20to%20get%20set%20up%3F" target="_blank" rel="noopener">us on WhatsApp</a> first - with notice we can manage your account in anticipation and close everything properly, instead of trades being cut off the moment Whop disconnects you.</li>'
        +'</ul></div>'
        +'</div>');
      var boxes=[].slice.call(resultEl.querySelectorAll('[data-unlock]')),pb=document.getElementById('chkPaybox'),whopHandle=null,payMounted=false;
      var GATE_HINT='<div class="chk-paybox-hint">Tick all five boxes above to unlock your secure checkout</div>';
      /* Whop Elements embed (migrated Oct 2026 - legacy js.whop.com loader retired 21 Oct 2026). */
      function mountPay(){
        payMounted=true;
        pb.innerHTML='<div class="whop-mount" id="whopMount"></div><p class="chk-fine"><a href="'+t.url+'" target="_blank" rel="noopener" style="color:var(--c-fg-faint);text-decoration:underline;">Checkout not loading? Open it here.</a></p>';
        var go=function(){
          if(!payMounted||whopHandle)return;
          try{
            whopHandle=window.WhopElements().checkout.create({
              plan:planId,
              appearance:{theme:{appearance:"dark"}},
              returnUrl:location.origin+location.pathname+"?wr=1"
            });
            whopHandle.create("checkout").mount("#whopMount");
          }catch(err){
            whopHandle=null;
            var mEl=document.getElementById('whopMount');
            if(mEl)mEl.innerHTML='<a class="chk-btn" href="'+t.url+'" target="_blank" rel="noopener">Open secure checkout &rarr;</a>';
          }
        };
        if(window.WhopElements)go();else if(window.axLoadWhop)window.axLoadWhop(go);else go();
      }
      function unmountPay(){
        if(whopHandle){try{whopHandle.destroy();}catch(e2){}}
        whopHandle=null;payMounted=false;
        pb.innerHTML=GATE_HINT;
      }
      function syncGate(){
        var all=true,i2;
        for(i2=0;i2<boxes.length;i2++){if(!boxes[i2].checked)all=false;}
        if(all&&!payMounted){
          mountPay();
        } else if(!all&&payMounted){
          unmountPay();
        }
      }
      boxes.forEach(function(b){b.addEventListener('change',syncGate);});
    }
    scrollToResult();
    markLadder(nv);
    startCd();
  }
  form.addEventListener("submit",function(e){
    e.preventDefault();
    var nv=parseAmount(input.value);
    if(nv===null){lastN=null;errorEl.hidden=false;resultEl.hidden=true;resultEl.innerHTML="";var ph=document.getElementById("chkPlaceholder");if(ph)ph.style.display="";markLadder(null);return;}
    errorEl.hidden=true;
    if(nv<MIN_SIZE){lastN=null;show('<p class="chk-msg">Our minimum account size is £1,000.</p><a class="chk-contact" href="'+CONTACT_URL+'" target="_blank" rel="noopener">Get in touch</a>');return;}
    if(nv>=BESPOKE_FROM){lastN=null;show('<p class="chk-msg">Accounts at this size are handled directly. Get in touch and we\'ll set you up personally.</p><a class="chk-contact" href="'+CONTACT_URL+'" target="_blank" rel="noopener">Get in touch</a>');markLadder(nv);scrollToResult();return;}
    renderResult(nv);
  });
  var ladder=document.getElementById("chkLadder"),liveEl=document.getElementById("chkLive");
  function bandLabel(t){return t.min<=0?"Up to £"+gbp(t.max):"£"+gbp(t.min)+" to £"+gbp(t.max);}
  function scrollToResult(){
    if(resultEl.hidden)return;
    var top=resultEl.getBoundingClientRect().top;
    if(top>window.innerHeight*0.6||top<0){try{resultEl.scrollIntoView({behavior:"smooth",block:"start"});}catch(e){resultEl.scrollIntoView();}}
  }
  function buildLadder(){
    if(!ladder)return;
    var h="";
    for(var i=0;i<TIERS.length;i++){var t=TIERS[i];
      h+='<div class="chk-ladder-row"><span class="chk-ladder-info"><strong>'+esc(t.name)+'</strong><em>'+bandLabel(t)+'</em></span><span class="chk-ladder-price">'+esc(t.price)+'<em>/mo</em></span></div>';}
    h+='<div class="chk-ladder-row"><span class="chk-ladder-info"><strong>Fund / Bespoke</strong><em>£'+gbp(BESPOKE_FROM)+'+</em></span><span class="chk-ladder-price"><em>contact Ace Automation</em></span></div>';
    ladder.innerHTML=h;
  }
  function markLadder(nv){
    if(!ladder)return;
    var rows=ladder.querySelectorAll(".chk-ladder-row"),i;
    for(i=0;i<rows.length;i++)rows[i].classList.remove("is-hit");
    if(nv==null)return;
    if(nv>=BESPOKE_FROM){rows[rows.length-1].classList.add("is-hit");return;}
    var t=tierFor(nv);
    if(t)rows[TIERS.indexOf(t)].classList.add("is-hit");
  }
  input.addEventListener("input",function(){
    var nv=parseAmount(input.value);
    if(input.value.trim()===""||nv===null){if(liveEl)liveEl.hidden=true;markLadder(null);return;}
    if(liveEl){liveEl.hidden=false;
      liveEl.innerHTML=nv>=BESPOKE_FROM?"&rarr; Fund / Bespoke &middot; contact Ace Automation":(function(t){return "&rarr; "+esc(t.name)+" &middot; "+esc(t.price)+"/month";})(tierFor(nv));}
    markLadder(nv);
  });
  buildLadder();
})();
