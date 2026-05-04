const v="oakfox_invoice_draft",a=t=>document.getElementById(t),e={ref:a("q-ref"),date:a("q-date"),due:a("q-due"),quoteRef:a("q-quote"),cName:a("c-name"),cCompany:a("c-company"),cEmail:a("c-email"),cAddress:a("c-address"),pTitle:a("p-title"),bName:a("b-name"),bSort:a("b-sort"),bAccount:a("b-account"),bRefInstruction:a("b-ref-instruction"),tNotes:a("t-notes"),vatOn:a("vat-on")},p=a("lines-list"),S=a("subtotal"),w=a("vat"),E=a("total"),y=a("preview-frame"),b=a("invoice-status");let r=[];function d(t){return"£"+t.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2})}function g(t,n=""){b.textContent=t,b.style.color=n==="error"?"var(--db-danger)":n==="ok"?"var(--db-accent)":"var(--db-text-muted)",t&&setTimeout(()=>{b.textContent===t&&(b.textContent="")},4e3)}function q(){const t=new Date,n=t.getFullYear(),o=String(t.getMonth()+1).padStart(2,"0"),l=String(t.getDate()).padStart(2,"0"),s=Math.floor(Math.random()*900+100);return`INV-${n}${o}${l}-${s}`}function h(){if(e.ref.value||(e.ref.value=q()),e.date.value||(e.date.value=new Date().toISOString().split("T")[0]),!e.due.value){const t=new Date;t.setDate(t.getDate()+14),e.due.value=t.toISOString().split("T")[0]}e.bRefInstruction.value||(e.bRefInstruction.value="Please use the invoice number as the payment reference.")}function m(){if(r.length===0){p.innerHTML='<p style="color: var(--db-text-muted); font-size: 13px; text-align: center; padding: 24px 0;">No items yet. Click "Add item" to start.</p>',c();return}p.innerHTML=r.map((t,n)=>`
        <div class="line-row" data-i="${n}" style="display: grid; grid-template-columns: 1fr 80px 100px 40px; gap: 8px; margin-bottom: 8px; align-items: start;">
          <input type="text" class="db-input line-desc" value="${t.description.replace(/"/g,"&quot;")}" placeholder="Description of work" data-i="${n}" />
          <input type="number" class="db-input line-qty" value="${t.qty}" min="0" step="1" placeholder="Qty" data-i="${n}" />
          <input type="number" class="db-input line-price" value="${t.unitPrice}" min="0" step="0.01" placeholder="Price" data-i="${n}" />
          <button type="button" class="db-btn line-del" data-i="${n}" style="padding: 6px 10px; color: var(--db-danger);" aria-label="Remove line">&times;</button>
        </div>
      `).join(""),p.querySelectorAll(".line-desc").forEach(t=>{t.addEventListener("input",()=>{r[Number(t.dataset.i)].description=t.value,c()})}),p.querySelectorAll(".line-qty").forEach(t=>{t.addEventListener("input",()=>{r[Number(t.dataset.i)].qty=parseFloat(t.value)||0,c()})}),p.querySelectorAll(".line-price").forEach(t=>{t.addEventListener("input",()=>{r[Number(t.dataset.i)].unitPrice=parseFloat(t.value)||0,c()})}),p.querySelectorAll(".line-del").forEach(t=>{t.addEventListener("click",()=>{r.splice(Number(t.dataset.i),1),m()})}),c()}function $(){const t=r.reduce((l,s)=>l+s.qty*s.unitPrice,0),n=e.vatOn.checked?t*.2:0,o=t+n;return{subtotal:t,vat:n,total:o}}function c(){const{subtotal:t,vat:n,total:o}=$();S.textContent=d(t),w.textContent=d(n),E.textContent=d(o),z()}function i(t){return(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function f(t){return i(t).replace(/\n/g,"<br>")}function x(t){if(!t)return"—";const[n,o,l]=t.split("-");return`${l} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(o,10)-1]} ${n}`}function z(){const{subtotal:t,vat:n,total:o}=$(),l=r.length?r.map(u=>`
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid rgba(26,29,23,0.08); vertical-align: top;">${f(u.description)||'<span style="color:rgba(26,29,23,0.3)">—</span>'}</td>
            <td style="padding: 14px 8px; border-bottom: 1px solid rgba(26,29,23,0.08); text-align: right; vertical-align: top; font-variant-numeric: tabular-nums;">${u.qty}</td>
            <td style="padding: 14px 8px; border-bottom: 1px solid rgba(26,29,23,0.08); text-align: right; vertical-align: top; font-variant-numeric: tabular-nums;">${d(u.unitPrice)}</td>
            <td style="padding: 14px 0 14px 8px; border-bottom: 1px solid rgba(26,29,23,0.08); text-align: right; vertical-align: top; font-variant-numeric: tabular-nums; white-space: nowrap;">${d(u.qty*u.unitPrice)}</td>
          </tr>
        `).join(""):'<tr><td colspan="4" style="padding: 24px 0; text-align: center; color: rgba(26,29,23,0.4); font-style: italic;">No line items</td></tr>',s=[e.cName.value&&`<strong>${i(e.cName.value)}</strong>`,e.cCompany.value&&i(e.cCompany.value),e.cEmail.value&&i(e.cEmail.value),e.cAddress.value&&i(e.cAddress.value)].filter(Boolean).join("<br>"),k=e.bName.value||e.bSort.value||e.bAccount.value,A=`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${i(e.ref.value)}</title>
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
        <p class="label" style="margin: 0;">Invoice</p>
        <p style="margin: 6px 0 0; font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 13px; color: #1A1D17;">${i(e.ref.value)||"—"}</p>
        <p style="margin: 16px 0 0; font-size: 11px; color: rgba(26,29,23,0.6);">
          Issued ${x(e.date.value)}<br>
          <strong style="color: #1A1D17;">Due ${x(e.due.value)}</strong>
          ${e.quoteRef.value?`<br>Re: quote ${i(e.quoteRef.value)}`:""}
        </p>
      </td>
    </tr>
  </table>

  <p class="label">Bill to</p>
  <p style="margin: 8px 0 0; line-height: 1.6;">${s||'<span style="color:rgba(26,29,23,0.3)">—</span>'}</p>

  <h1>${i(e.pTitle.value)||"Invoice"}</h1>

  <h2>Line items</h2>
  <table>
    <thead>
      <tr>
        <th style="text-align: left; padding: 0 0 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(26,29,23,0.5); font-weight: 500; border-bottom: 1px solid rgba(26,29,23,0.15);">Description</th>
        <th style="text-align: right; padding: 0 8px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(26,29,23,0.5); font-weight: 500; border-bottom: 1px solid rgba(26,29,23,0.15); width: 60px;">Qty</th>
        <th style="text-align: right; padding: 0 8px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(26,29,23,0.5); font-weight: 500; border-bottom: 1px solid rgba(26,29,23,0.15); width: 90px;">Unit</th>
        <th style="text-align: right; padding: 0 0 8px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(26,29,23,0.5); font-weight: 500; border-bottom: 1px solid rgba(26,29,23,0.15); width: 100px;">Amount</th>
      </tr>
    </thead>
    <tbody>${l}</tbody>
  </table>

  <table class="totals" style="margin-top: 24px; max-width: 320px; margin-left: auto;">
    <tr><td style="color: rgba(26,29,23,0.6);">Subtotal</td><td style="text-align: right; font-variant-numeric: tabular-nums;">${d(t)}</td></tr>
    ${e.vatOn.checked?`<tr><td style="color: rgba(26,29,23,0.6);">VAT (20%)</td><td style="text-align: right; font-variant-numeric: tabular-nums;">${d(n)}</td></tr>`:""}
    <tr class="grand"><td>Amount due</td><td style="text-align: right; font-variant-numeric: tabular-nums;">${d(o)}</td></tr>
  </table>

  ${k?`
  <h2>Payment details</h2>
  <table style="margin: 8px 0 0; width: auto;">
    ${e.bName.value?`<tr><td style="padding: 4px 24px 4px 0; color: rgba(26,29,23,0.5); font-size: 12px;">Account name</td><td style="padding: 4px 0; font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 13px;">${i(e.bName.value)}</td></tr>`:""}
    ${e.bSort.value?`<tr><td style="padding: 4px 24px 4px 0; color: rgba(26,29,23,0.5); font-size: 12px;">Sort code</td><td style="padding: 4px 0; font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 13px;">${i(e.bSort.value)}</td></tr>`:""}
    ${e.bAccount.value?`<tr><td style="padding: 4px 24px 4px 0; color: rgba(26,29,23,0.5); font-size: 12px;">Account no.</td><td style="padding: 4px 0; font-family: 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 13px;">${i(e.bAccount.value)}</td></tr>`:""}
  </table>
  ${e.bRefInstruction.value?`<p style="margin: 10px 0 0; color: rgba(26,29,23,0.7); font-size: 12px;">${i(e.bRefInstruction.value)}</p>`:""}
  `:""}

  ${e.tNotes.value?`<h2>Notes</h2><p style="margin: 8px 0 0; color: rgba(26,29,23,0.8); max-width: 60ch;">${f(e.tNotes.value)}</p>`:""}

  <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid rgba(26,29,23,0.1);">
    <p style="margin: 0; font-size: 11px; color: rgba(26,29,23,0.4);">
      OakFox Limited · Registered in England, Companies House 17118912 · oakfox.co.uk
    </p>
  </div>
</div>
</body></html>`;y.srcdoc=A}Object.values(e).forEach(t=>{t.addEventListener("input",c),t.addEventListener("change",c)});a("add-line").addEventListener("click",()=>{r.push({description:"",qty:1,unitPrice:0}),m()});a("save-draft").addEventListener("click",()=>{const t={lines:r};Object.entries(e).forEach(([n,o])=>{t[n]=o.type==="checkbox"?o.checked:o.value}),localStorage.setItem(v,JSON.stringify(t)),g("Draft saved.","ok")});a("load-draft").addEventListener("click",()=>{const t=localStorage.getItem(v);if(!t){g("No saved draft found.","error");return}try{const n=JSON.parse(t);Object.entries(e).forEach(([o,l])=>{const s=n[o];l.type==="checkbox"?l.checked=!!s:l.value=s??""}),r=Array.isArray(n.lines)?n.lines:[],m(),g("Draft loaded.","ok")}catch{g("Could not parse saved draft.","error")}});a("clear-all").addEventListener("click",()=>{confirm("Clear all invoice fields? This does not delete any saved draft.")&&(Object.values(e).forEach(t=>{t.type==="checkbox"?t.checked=!1:t.value=""}),r=[],h(),m(),g("Cleared.",""))});a("print-invoice").addEventListener("click",()=>{const t=y.contentWindow;t&&(t.focus(),t.print())});h();r=[{description:"",qty:1,unitPrice:0}];m();
