const f="oakfox_contract_draft",a=e=>document.getElementById(e),t={ref:a("c-ref"),date:a("c-date"),clName:a("cl-name"),clSignatory:a("cl-signatory"),clEmail:a("cl-email"),clAddress:a("cl-address"),clCompanyNo:a("cl-company-no"),pTitle:a("p-title"),pScope:a("p-scope"),tStart:a("t-start"),tEnd:a("t-end"),fType:a("f-type"),fAmount:a("f-amount"),fSchedule:a("f-schedule"),clIp:a("cl-ip"),clConf:a("cl-conf"),clTerm:a("cl-term"),clLiab:a("cl-liab"),clLaw:a("cl-law"),extraTerms:a("extra-terms")},m=a("deliverables-list"),h=a("preview-frame"),g=a("contract-status");let i=[];function c(e,n=""){g.textContent=e,g.style.color=n==="error"?"var(--db-danger)":n==="ok"?"var(--db-accent)":"var(--db-text-muted)",e&&setTimeout(()=>{g.textContent===e&&(g.textContent="")},4e3)}function y(){const e=new Date,n=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),o=String(e.getDate()).padStart(2,"0"),b=Math.floor(Math.random()*900+100);return`CON-${n}${r}${o}-${b}`}function v(){t.ref.value||(t.ref.value=y()),t.date.value||(t.date.value=new Date().toISOString().split("T")[0])}function d(){if(i.length===0){m.innerHTML='<p style="color: var(--db-text-muted); font-size: 13px; padding: 8px 0;">No deliverables yet. Add one to get started.</p>',p();return}m.innerHTML=i.map((e,n)=>`
        <div class="del-row" style="display: grid; grid-template-columns: 1fr 40px; gap: 8px; margin-bottom: 8px; align-items: start;">
          <input type="text" class="db-input del-text" value="${e.replace(/"/g,"&quot;")}" placeholder="e.g. Homepage design in Figma" data-i="${n}" />
          <button type="button" class="db-btn del-del" data-i="${n}" style="padding: 6px 10px; color: var(--db-danger);" aria-label="Remove">&times;</button>
        </div>
      `).join(""),m.querySelectorAll(".del-text").forEach(e=>{e.addEventListener("input",()=>{i[Number(e.dataset.i)]=e.value,p()})}),m.querySelectorAll(".del-del").forEach(e=>{e.addEventListener("click",()=>{i.splice(Number(e.dataset.i),1),d()})}),p()}function l(e){return(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function s(e){return l(e).split(/\n\s*\n/).filter(Boolean).map(n=>`<p style="margin: 0 0 10px;">${n.replace(/\n/g,"<br>")}</p>`).join("")}function u(e){if(!e)return"—";const[n,r,o]=e.split("-");return`${o} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(r,10)-1]} ${n}`}function x(){const e=t.fType.value,n=parseFloat(t.fAmount.value)||0,r="£"+n.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});return n?e==="fixed"?`${r} fixed fee, excluding VAT unless stated.`:e==="hourly"?`${r} per hour, excluding VAT unless stated. Work is billed to the nearest quarter-hour.`:e==="retainer"?`${r} per calendar month, excluding VAT unless stated. The retainer renews monthly until terminated in accordance with this Agreement.`:r:"—"}function p(){const e=i.length?`<ol style="margin: 8px 0 0 20px; padding: 0;">${i.filter(o=>o.trim()).map(o=>`<li style="margin: 0 0 6px; line-height: 1.6;">${l(o)}</li>`).join("")}</ol>`:'<p style="margin: 8px 0 0; color: rgba(26,29,23,0.4); font-style: italic;">To be agreed in writing between the parties.</p>',n=`
        <strong>${l(t.clName.value)||"[Client legal name]"}</strong>${t.clCompanyNo.value?` (company no. ${l(t.clCompanyNo.value)})`:""}<br>
        ${l(t.clAddress.value)||"[Registered address]"}
      `,r=`<!doctype html><html><head><meta charset="utf-8"><title>Services Agreement ${l(t.ref.value)}</title>
<style>
  @page { size: A4; margin: 22mm 18mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px; background: #FAF7F2; font-family: Georgia, 'Times New Roman', serif; color: #1A1D17; font-size: 12.5px; line-height: 1.65; }
  .sheet { max-width: 720px; margin: 0 auto; background: #FAF7F2; padding: 48px 64px; border: 1px solid rgba(26,29,23,0.08); border-radius: 8px; }
  .brand img { height: 40px; width: auto; display: block; }
  .label { font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #1A5C12; }
  h1 { font-family: Georgia, serif; font-size: 28px; font-weight: 500; color: #1A1D17; margin: 24px 0 4px; letter-spacing: -0.01em; }
  h2 { font-family: Georgia, serif; font-size: 15px; font-weight: 600; color: #1A1D17; margin: 28px 0 10px; padding-top: 14px; border-top: 1px solid rgba(26,29,23,0.12); }
  h2:first-of-type { border-top: none; padding-top: 0; }
  .clause-num { display: inline-block; width: 32px; color: rgba(26,29,23,0.45); font-weight: 500; font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 11px; }
  .sig-table { width: 100%; margin-top: 56px; border-collapse: collapse; }
  .sig-table td { padding: 0 16px; vertical-align: top; width: 50%; }
  .sig-line { border-bottom: 1px solid #1A1D17; height: 48px; margin-bottom: 8px; }
  @media print { body { padding: 0; background: #fff; } .sheet { border: none; border-radius: 0; padding: 0; max-width: none; } h2 { page-break-after: avoid; } p { orphans: 3; widows: 3; } }
</style>
</head>
<body>
<div class="sheet">
  <div class="brand" style="margin-bottom: 20px;"><a href="https://oakfox.co.uk" style="text-decoration: none;"><img src="/images/site/logo.png" alt="OakFox" /></a></div>

  <p class="label">Services Agreement · Ref ${l(t.ref.value)||"—"}</p>
  <h1>${l(t.pTitle.value)||"[Project title]"}</h1>
  <p style="margin: 6px 0 0; color: rgba(26,29,23,0.6); font-size: 12px;">Effective ${u(t.date.value)}</p>

  <h2><span class="clause-num">1.</span>Parties</h2>
  <p style="margin: 0;">This Agreement is made between:</p>
  <p style="margin: 10px 0 0;"><strong>OakFox Limited</strong> (company no. 17118912), a company registered in England with its registered office at Martland Mill, Mart Ln, Burscough, Ormskirk L40 0SD ("<strong>OakFox</strong>"); and</p>
  <p style="margin: 10px 0 0;">${n} (the "<strong>Client</strong>").</p>
  ${t.clSignatory.value?`<p style="margin: 10px 0 0; color: rgba(26,29,23,0.7); font-size: 12px;">Client signatory: ${l(t.clSignatory.value)}${t.clEmail.value?` (${l(t.clEmail.value)})`:""}.</p>`:""}

  <h2><span class="clause-num">2.</span>Scope of Work</h2>
  ${t.pScope.value?s(t.pScope.value):'<p style="margin: 0; color: rgba(26,29,23,0.4); font-style: italic;">[Scope of work to be inserted]</p>'}

  <h2><span class="clause-num">3.</span>Deliverables</h2>
  ${e}

  <h2><span class="clause-num">4.</span>Timeline</h2>
  <p style="margin: 0;">Work shall commence on ${u(t.tStart.value)}${t.tEnd.value?` and the target completion date is ${u(t.tEnd.value)}`:""}. Timelines are dependent on timely Client input, approvals, and the provision of content where applicable.</p>

  <h2><span class="clause-num">5.</span>Fees and Payment</h2>
  <p style="margin: 0;">${l(x())}</p>
  ${t.fSchedule.value?`<div style="margin: 10px 0 0;">${s(t.fSchedule.value)}</div>`:""}

  <h2><span class="clause-num">6.</span>Intellectual Property</h2>
  ${t.clIp.value?s(t.clIp.value):""}

  <h2><span class="clause-num">7.</span>Confidentiality</h2>
  ${t.clConf.value?s(t.clConf.value):""}

  <h2><span class="clause-num">8.</span>Termination</h2>
  ${t.clTerm.value?s(t.clTerm.value):""}

  <h2><span class="clause-num">9.</span>Limitation of Liability</h2>
  ${t.clLiab.value?s(t.clLiab.value):""}

  <h2><span class="clause-num">10.</span>Governing Law</h2>
  ${t.clLaw.value?s(t.clLaw.value):""}

  ${t.extraTerms.value?`<h2><span class="clause-num">11.</span>Additional Terms</h2>${s(t.extraTerms.value)}`:""}

  <h2>Signatures</h2>
  <p style="margin: 0 0 20px;">The parties accept the terms of this Agreement as of the effective date above.</p>
  <table class="sig-table">
    <tr>
      <td>
        <div class="sig-line"></div>
        <p style="margin: 0; font-family: Georgia, serif; font-size: 12px;"><strong>Nathan James Entwistle</strong><br>
        <span style="color: rgba(26,29,23,0.6);">Director, OakFox Limited</span></p>
        <p style="margin: 10px 0 0; color: rgba(26,29,23,0.5); font-size: 11px;">Date: ______________________</p>
      </td>
      <td>
        <div class="sig-line"></div>
        <p style="margin: 0; font-family: Georgia, serif; font-size: 12px;"><strong>${l(t.clSignatory.value)||"[Client signatory name]"}</strong><br>
        <span style="color: rgba(26,29,23,0.6);">for and on behalf of ${l(t.clName.value)||"[Client legal name]"}</span></p>
        <p style="margin: 10px 0 0; color: rgba(26,29,23,0.5); font-size: 11px;">Date: ______________________</p>
      </td>
    </tr>
  </table>

  <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid rgba(26,29,23,0.1);">
    <p style="margin: 0; font-size: 10px; color: rgba(26,29,23,0.4); font-family: 'SFMono-Regular', Menlo, Consolas, monospace;">
      OakFox Limited · Registered in England, Companies House 17118912 · Agreement ref ${l(t.ref.value)||"—"}
    </p>
  </div>
</div>
</body></html>`;h.srcdoc=r}Object.values(t).forEach(e=>{e.addEventListener("input",p),e.addEventListener("change",p)});a("add-deliverable").addEventListener("click",()=>{i.push(""),d()});a("save-draft").addEventListener("click",()=>{const e={deliverables:i};Object.entries(t).forEach(([n,r])=>{e[n]=r.value}),localStorage.setItem(f,JSON.stringify(e)),c("Draft saved.","ok")});a("load-draft").addEventListener("click",()=>{const e=localStorage.getItem(f);if(!e){c("No saved draft found.","error");return}try{const n=JSON.parse(e);Object.entries(t).forEach(([r,o])=>{o.value=n[r]??""}),i=Array.isArray(n.deliverables)?n.deliverables:[],d(),c("Draft loaded.","ok")}catch{c("Could not parse saved draft.","error")}});a("clear-all").addEventListener("click",()=>{confirm("Clear all contract fields? This does not delete any saved draft.")&&(Object.entries(t).forEach(([,e])=>{e.value=""}),i=[],v(),d(),c("Cleared.",""))});a("print-contract").addEventListener("click",()=>{const e=h.contentWindow;e&&(e.focus(),e.print())});v();d();
