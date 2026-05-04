const b=document.getElementById("letter-stats"),a=document.getElementById("letter-list"),s=document.getElementById("letter-error");function i(t){return t?new Date(t).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"—"}function o(t,r){return`<div style="background: var(--db-surface); border: 1px solid var(--db-border); border-radius: 10px; padding: 14px 16px;">
        <div style="font-size: 11px; color: var(--db-text-muted); text-transform: uppercase; letter-spacing: 0.12em;">${t}</div>
        <div style="font-size: 24px; font-weight: 600; margin-top: 6px;">${r}</div>
      </div>`}function x(t){if(b.innerHTML=[o("Total",t.stats.total??0),o("Confirmed",t.stats.confirmed??0),o("Pending",t.stats.pending??0),o("Unsubscribed",t.stats.unsubscribed??0)].join(""),!t.subscribers.length){a.innerHTML='<div style="background: var(--db-surface); border: 1px solid var(--db-border); border-radius: 10px; padding: 32px; text-align: center; color: var(--db-text-muted);">No subscribers yet. The signup form is live in the footer and on the Journal page.</div>';return}const r=t.subscribers.sort((e,d)=>(d.created??"").localeCompare(e.created??"")).map(e=>{const d=e.status==="confirmed"?"var(--db-accent)":e.status==="pending"?"#c8a24a":"var(--db-text-muted)";return`<tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid var(--db-border);">${e.email}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid var(--db-border); color: ${d}; text-transform: capitalize; font-size: 13px;">${e.status}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid var(--db-border); color: var(--db-text-muted); font-size: 13px;">${i(e.created)}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid var(--db-border); color: var(--db-text-muted); font-size: 13px;">${i(e.confirmed)}</td>
          </tr>`}).join("");a.innerHTML=`<div style="background: var(--db-surface); border: 1px solid var(--db-border); border-radius: 10px; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: rgba(0,0,0,0.2);">
              <th style="padding: 10px 16px; text-align: left; font-size: 11px; color: var(--db-text-muted); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 500;">Email</th>
              <th style="padding: 10px 16px; text-align: left; font-size: 11px; color: var(--db-text-muted); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 500;">Status</th>
              <th style="padding: 10px 16px; text-align: left; font-size: 11px; color: var(--db-text-muted); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 500;">Signed up</th>
              <th style="padding: 10px 16px; text-align: left; font-size: 11px; color: var(--db-text-muted); text-transform: uppercase; letter-spacing: 0.12em; font-weight: 500;">Confirmed</th>
            </tr>
          </thead>
          <tbody>${r}</tbody>
        </table>
      </div>`}async function u(){try{const t=await fetch("/dashboard/newsletter-data.php",{credentials:"include"});if(!t.ok)throw new Error(`HTTP ${t.status}`);const r=await t.json();x(r)}catch(t){s.style.display="block",s.textContent="Could not load subscribers. "+(t instanceof Error?t.message:"")}}async function m(){const t=document.getElementById("letter-campaigns");try{const d=(await(await fetch("/dashboard/campaigns-data.php",{credentials:"include"})).json()).campaigns??[];if(!d.length){t.innerHTML="";return}const l=d.slice(0,10).map(n=>{const p=n.sentAt?new Date(n.sentAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}):"—",c=n.failed>0?` · <span style="color: var(--db-danger);">${n.failed} failed</span>`:"";return`<div style="background: var(--db-surface); border: 1px solid var(--db-border); border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 14px; font-weight: 500;">${n.subject}</div>
              <div style="font-size: 12px; color: var(--db-text-muted); margin-top: 2px;">Sent ${p} · ${n.recipients} delivered${c}</div>
            </div>
          </div>`}).join("");t.innerHTML=`<h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--db-text-muted); margin: 0 0 12px;">Recent sends</h2>
          <div style="display: flex; flex-direction: column; gap: 8px;">${l}</div>`}catch{}}u();m();
