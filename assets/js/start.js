/* Onboarding form (ported unchanged from the previous site, scroll behaviour adapted) */
(function(){
  var form=document.getElementById("onboardForm");if(!form)return;
  var steps=[].slice.call(form.querySelectorAll(".onboard-step")),phases=[].slice.call(document.querySelectorAll(".onboard-phase")),fill=document.getElementById("onboardProgressFill"),cur=1,max=steps.length,view=document.getElementById("welcome");
  function show(n){cur=n;steps.forEach(function(s){s.classList.toggle("is-active",+s.getAttribute("data-step")===n);});phases.forEach(function(p){var pn=+p.getAttribute("data-phase");p.classList.toggle("is-on",pn<=n);p.classList.toggle("is-current",pn===n);});if(fill)fill.style.width=(n/max*100)+"%";var fe=document.getElementById("details");if(fe&&fe.getBoundingClientRect().top<0)fe.scrollIntoView({block:"start"});}
  function valid(stepEl){var ok=true;[].slice.call(stepEl.querySelectorAll("input[required]")).forEach(function(i){if(i.offsetParent!==null&&!i.checkValidity()){ok=false;i.reportValidity();}});return ok;}
  var radios=form.querySelectorAll('input[name="has_broker"]'),vantage=document.getElementById("vantageCard"),s1=document.getElementById("step1Next");
  [].slice.call(radios).forEach(function(r){r.addEventListener("change",function(){if(vantage)vantage.hidden=(r.value!=="no");if(s1)s1.disabled=false;});});
  var vd=document.getElementById("vantageDone");if(vd)vd.addEventListener("click",function(){show(2);});
  if(s1)s1.addEventListener("click",function(){show(2);});
  [].slice.call(form.querySelectorAll("[data-onboard-next]")).forEach(function(b){b.addEventListener("click",function(){if(valid(steps[cur-1]))show(cur+1);});});
  [].slice.call(form.querySelectorAll("[data-onboard-back]")).forEach(function(b){b.addEventListener("click",function(){show(Math.max(1,cur-1));});});
  form.addEventListener("submit",function(e){e.preventDefault();if(!valid(steps[cur-1]))return;var data=new URLSearchParams(new FormData(form)).toString();var sb=document.getElementById("onboardSubmit");if(sb){sb.disabled=true;sb.textContent="Sending...";}fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:data}).then(function(r){if(!r.ok)throw new Error(r.status);show(4);}).catch(function(){if(sb){sb.disabled=false;sb.innerHTML="Submit &amp; finish &rarr;";}alert("Sorry, that did not go through. Please try again, or message us on WhatsApp at us on WhatsApp and we will connect you directly.");});});
})();
