const b="oakfox_quote_draft",n=t=>document.getElementById(t),e={ref:n("q-ref"),date:n("q-date"),valid:n("q-valid"),cName:n("c-name"),cCompany:n("c-company"),cEmail:n("c-email"),cAddress:n("c-address"),pTitle:n("p-title"),pScope:n("p-scope"),tPayment:n("t-payment"),tNotes:n("t-notes"),vatOn:n("vat-on")},p=n("lines-list"),S=n("subtotal"),E=n("vat"),w=n("total"),y=n("preview-frame"),f=n("quote-status");let r=[];function l(t){return"£"+t.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2})}function g(t,a=""){f.textContent=t,f.style.color=a==="error"?"var(--db-danger)":a==="ok"?"var(--db-accent)":"var(--db-text-muted)",t&&setTimeout(()=>{f.textContent===t&&(f.textContent="")},4e3)}function A(){const t=new Date,a=t.getFullYear(),o=String(t.getMonth()+1).padStart(2,"0"),s=String(t.getDate()).padStart(2,"0"),c=Math.floor(Math.random()*900+100);return`OAK-${a}${o}${s}-${c}`}function h(){if(e.ref.value||(e.ref.value=A()),e.date.value||(e.date.value=new Date().toISOString().split("T")[0]),!e.valid.value){const t=new Date;t.setDate(t.getDate()+30),e.valid.value=t.toISOString().split("T")[0]}}function m(){if(r.length===0){p.innerHTML='<p style="color: var(--db-text-muted); font-size: 13px; text-align: center; padding: 24px 0;">No items yet. Click "Add item" to start.</p>',d();return}p.innerHTML=r.map((t,a)=>`
        <div class="line-row" data-i="${a}" style="display: grid; grid-template-columns: 1fr 80px 100px 40px; gap: 8px; margin-bottom: 8px; align-items: start;">
          <input type="text" class="db-input line-desc" value="${t.description.replace(/"/g,"&quot;")}" placeholder="Description of work" data-i="${a}" />
          <input type="number" class="db-input line-qty" value="${t.qty}" min="0" step="1" placeholder="Qty" data-i="${a}" />
          <input type="number" class="db-input line-price" value="${t.unitPrice}" min="0" step="0.01" placeholder="Price" data-i="${a}" />
          <button type="button" class="db-btn line-del" data-i="${a}" style="padding: 6px 10px; color: var(--db-danger);" aria-label="Remove line">&times;</button>
        </div>
      `).join(""),p.querySelectorAll(".line-desc").forEach(t=>{t.addEventListener("input",()=>{r[Number(t.dataset.i)].description=t.value,d()})}),p.querySelectorAll(".line-qty").forEach(t=>{t.addEventListener("input",()=>{r[Number(t.dataset.i)].qty=parseFloat(t.value)||0,d()})}),p.querySelectorAll(".line-price").forEach(t=>{t.addEventListener("input",()=>{r[Number(t.dataset.i)].unitPrice=parseFloat(t.value)||0,d()})}),p.querySelectorAll(".line-del").forEach(t=>{t.addEventListener("click",()=>{r.splice(Number(t.dataset.i),1),m()})}),d()}function $(){const t=r.reduce((s,c)=>s+c.qty*c.unitPrice,0),a=e.vatOn.checked?t*.2:0,o=t+a;return{subtotal:t,vat:a,total:o}}function d(){const{subtotal:t,vat:a,total:o}=$();S.textContent=l(t),E.textContent=l(a),w.textContent=l(o),N()}function i(t){return(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function v(t){return i(t).replace(/\n/g,"<br>")}function x(t){if(!t)return"—";const[a,o,s]=t.split("-");return`${s} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(o,10)-1]} ${a}`}function N(){const{subtotal:t,vat:a,total:o}=$(),s=r.length?r.map(u=>`
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid rgba(26,29,23,0.08); vertical-align: top;">${v(u.description)||'<span style="color:rgba(26,29,23,0.3)">—</span>'}</td>
            <td style="padding: 14px 8px; border-bottom: 1px solid rgba(26,29,23,0.08); text-align: right; vertical-align: top; font-variant-numeric: tabular-nums;">${u.qty}</td>
            <td style="padding: 14px 8px; border-bottom: 1px solid rgba(26,29,23,0.08); text-align: right; vertical-align: top; font-variant-numeric: tabular-nums;">${l(u.unitPrice)}</td>
            <td style="padding: 14px 0 14px 8px; border-bottom: 1px solid rgba(26,29,23,0.08); text-align: right; vertical-align: top; font-variant-numeric: tabular-nums; white-space: nowrap;">${l(u.qty*u.unitPrice)}</td>
          </tr>
        `).join(""):'<tr><td colspan="4" style="padding: 24px 0; text-align: center; color: rgba(26,29,23,0.4); font-style: italic;">No line items</td></tr>',c=[e.cName.value&&`<strong>${i(e.cName.value)}</strong>`,e.cCompany.value&&i(e.cCompany.value),e.cEmail.value&&i(e.cEmail.value),e.cAddress.value&&i(e.cAddress.value)].filter(Boolean).join("<br>"),k=`<!doctype html><html><head><meta charset="utf-8"><title>Quote ${i(e.ref.value)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 40px; background: #FAF7F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1A1D17; font-size: 13px; line-height: 1.6; }
  .sheet { max-width: 720px; margin: 0 auto; background: #FAF7F2; padding: 48px 56px; border: 1px solid rgba(26,29,23,0.08); border-radius: 8px; }
  .brand img { height: 40px; width: auto; display: block; }
  .label { font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #1A5C12; }
  h1 { font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 500; color: #1A1D17; margin: 24px 0 8px; letter-spacing: -0.01em; }
  h2 { font-family: Georgia, serif; font-size: 17px; font-weight: 500; color: #1A1D17; margin: 32px 0 12px; }
  table { width: 100%; border-collapse: collapse; }
  .totals td { padding: 4px 0; font-size: 13px; }
  .totals .grand { font-size: 16px; font-weight: 600; border-top: 2px solid #1A1D17; padding-top: 10px; }
  a { color: #1A5C12; text-decoration: none; }
  @media print { body { padding: 0; background: #fff; } .sheet { border: none; border-radius: 0; padding: 0; max-width: none; } }
</style>
</head>
<body>
<div class="sheet">
  <table style="margin-bottom: 32px;">
    <tr>
      <td style="vertical-align: top;">
        <div class="brand"><a href="https://oakfox.co.uk"><img src="/images/site/logo.png" alt="OakFox" /></a></div>
        <p style="margin: 14px 0 0; font-size: 11px; color: rgba(26,29,23,0.6); line-height: 1.5;">
          OakFox Limited<br>
          Martland Mill, Mart Ln<br>
          Burscough, Ormskirk L40 0SD<br>
          nathan@oakfox.co.uk · oakfox.co.uk
        </p>
      </td>
      <td style="vertical-align: top; text-align: right;">
        <p class="label" style="margin: 0;">Quote</p>
        <p style="margin: 6px 0 0; font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 13px; color: #1A1D17;">${i(e.ref.value)||"—"}</p>
        <p style="margin: 16px 0 0; font-size: 11px; color: rgba(26,29,23,0.6);">
          Issued ${x(e.date.value)}<br>
          Valid until ${x(e.valid.value)}
        </p>
      </td>
    </tr>
  </table>

  <p class="label">Prepared for</p>
  <p style="margin: 8px 0 0; line-height: 1.6;">${c||'<span style="color:rgba(26,29,23,0.3)">—</span>'}</p>

  <h1>${i(e.pTitle.value)||"Project quote"}</h1>
  ${e.pScope.value?`<p style="margin: 16px 0 0; color: rgba(26,29,23,0.8); max-width: 60ch;">${v(e.pScope.value)}</p>`:""}

  <h2>Scope & pricing</h2>
  <table>
    <thead>
      <tr>
        <th style="text-align: left; padding: 0 0 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(26,29,23,0.5); font-weight: 500; border-bottom: 1px solid rgba(26,29,23,0.15);">Description</th>
        <th style="text-align: right; padding: 0 8px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(26,29,23,0.5); font-weight: 500; border-bottom: 1px solid rgba(26,29,23,0.15); width: 60px;">Qty</th>
        <th style="text-align: right; padding: 0 8px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(26,29,23,0.5); font-weight: 500; border-bottom: 1px solid rgba(26,29,23,0.15); width: 90px;">Unit</th>
        <th style="text-align: right; padding: 0 0 8px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(26,29,23,0.5); font-weight: 500; border-bottom: 1px solid rgba(26,29,23,0.15); width: 100px;">Amount</th>
      </tr>
    </thead>
    <tbody>${s}</tbody>
  </table>

  <table class="totals" style="margin-top: 24px; max-width: 320px; margin-left: auto;">
    <tr><td style="color: rgba(26,29,23,0.6);">Subtotal</td><td style="text-align: right; font-variant-numeric: tabular-nums;">${l(t)}</td></tr>
    ${e.vatOn.checked?`<tr><td style="color: rgba(26,29,23,0.6);">VAT (20%)</td><td style="text-align: right; font-variant-numeric: tabular-nums;">${l(a)}</td></tr>`:""}
    <tr class="grand"><td>Total</td><td style="text-align: right; font-variant-numeric: tabular-nums;">${l(o)}</td></tr>
  </table>

  <h2>Payment terms</h2>
  <p style="margin: 8px 0 0; color: rgba(26,29,23,0.8); max-width: 60ch;">${v(e.tPayment.value)||'<span style="color:rgba(26,29,23,0.3)">—</span>'}</p>

  ${e.tNotes.value?`<h2>Notes</h2><p style="margin: 8px 0 0; color: rgba(26,29,23,0.8); max-width: 60ch;">${v(e.tNotes.value)}</p>`:""}

  <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid rgba(26,29,23,0.1);">
    <p style="margin: 0; font-size: 11px; color: rgba(26,29,23,0.45); line-height: 1.6;">
      Acceptance of this quote may be confirmed by reply email referencing ${i(e.ref.value)||"this quote reference"}. Prices are in GBP and exclude third-party costs (hosting, stock assets, domains) unless specified. Quote valid until ${x(e.valid.value)}.
    </p>
    <p style="margin: 16px 0 0; font-size: 11px; color: rgba(26,29,23,0.4);">
      OakFox Limited · Registered in England, Companies House 17118912 · oakfox.co.uk
    </p>
  </div>
</div>
</body></html>`;y.srcdoc=k}Object.values(e).forEach(t=>{t.addEventListener("input",d),t.addEventListener("change",d)});n("add-line").addEventListener("click",()=>{r.push({description:"",qty:1,unitPrice:0}),m()});n("save-draft").addEventListener("click",()=>{const t={ref:e.ref.value,date:e.date.value,valid:e.valid.value,cName:e.cName.value,cCompany:e.cCompany.value,cEmail:e.cEmail.value,cAddress:e.cAddress.value,pTitle:e.pTitle.value,pScope:e.pScope.value,tPayment:e.tPayment.value,tNotes:e.tNotes.value,vatOn:e.vatOn.checked,lines:r};localStorage.setItem(b,JSON.stringify(t)),g("Draft saved.","ok")});n("load-draft").addEventListener("click",()=>{const t=localStorage.getItem(b);if(!t){g("No saved draft found.","error");return}try{const a=JSON.parse(t);e.ref.value=a.ref??"",e.date.value=a.date??"",e.valid.value=a.valid??"",e.cName.value=a.cName??"",e.cCompany.value=a.cCompany??"",e.cEmail.value=a.cEmail??"",e.cAddress.value=a.cAddress??"",e.pTitle.value=a.pTitle??"",e.pScope.value=a.pScope??"",e.tPayment.value=a.tPayment??"",e.tNotes.value=a.tNotes??"",e.vatOn.checked=!!a.vatOn,r=Array.isArray(a.lines)?a.lines:[],m(),g("Draft loaded.","ok")}catch{g("Could not parse saved draft.","error")}});n("clear-all").addEventListener("click",()=>{confirm("Clear all quote fields? This does not delete any saved draft.")&&(Object.values(e).forEach(t=>{t instanceof HTMLInputElement&&t.type==="checkbox"?t.checked=!1:t.value=""}),r=[],h(),m(),g("Cleared.",""))});n("print-quote").addEventListener("click",()=>{const t=y.contentWindow;t&&(t.focus(),t.print())});h();r=[{description:"",qty:1,unitPrice:0}];m();
