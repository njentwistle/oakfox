function s(){try{return JSON.parse(localStorage.getItem("oakfox_goals")||"[]")}catch{return[]}}function r(t){localStorage.setItem("oakfox_goals",JSON.stringify(t))}function p(){return localStorage.getItem("oakfox_agency")||"OakFox"}function b(t){return t==="In Progress"?"db-badge-in-progress":t==="Done"?"db-badge-done":"db-badge-not-started"}function f(t){return Math.ceil((new Date(t).getTime()-Date.now())/864e5)}let u=null;function i(){const t=p(),a=s().filter(l=>l.agency===t||!l.agency),d=a.filter(l=>l.status!=="Done").sort((l,m)=>l.targetDate?m.targetDate?new Date(l.targetDate).getTime()-new Date(m.targetDate).getTime():-1:1),e=a.filter(l=>l.status==="Done"),n=document.getElementById("active-goals"),o=document.getElementById("completed-goals"),c=document.getElementById("completed-section");d.length===0&&e.length===0?n.innerHTML=`<div class="db-card" style="text-align: center; padding: 48px 24px;">
          <p style="color: var(--db-text-muted); font-size: 14px;">No goals yet. Set your first one.</p>
        </div>`:n.innerHTML=d.map(l=>y(l)).join(""),e.length>0?(c.style.display="",document.getElementById("completed-label").textContent=`Completed (${e.length})`,o.innerHTML=e.map(l=>y(l)).join("")):c.style.display="none",v()}function y(t){const a=t.subtasks.length>0?Math.round(t.subtasks.filter(n=>n.done).length/t.subtasks.length*100):0,d=t.targetDate?f(t.targetDate):null,e=d!==null?d<0?`<span style="color: var(--db-danger);">${Math.abs(d)}d overdue</span>`:`<span style="color: var(--db-text-secondary);">${d}d left</span>`:"";return`
        <div class="db-card" style="margin-bottom: 12px;" data-goal-id="${t.id}">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
                <h3 style="font-size: 16px; font-weight: 600;">${t.title}</h3>
                <span class="db-badge ${b(t.status)}">${t.status}</span>
              </div>
              <div style="display: flex; gap: 12px; align-items: center; font-size: 12px; color: var(--db-text-muted);">
                ${t.category?`<span class="db-tag db-tag-client">${t.category}</span>`:""}
                ${t.targetDate?`<span class="db-mono">${t.targetDate}</span>`:""}
                ${e?`<span class="db-mono">${e}</span>`:""}
              </div>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="db-btn db-btn-ghost db-btn-sm goal-edit" data-id="${t.id}">Edit</button>
              <button class="db-btn db-btn-ghost db-btn-sm goal-delete" data-id="${t.id}" style="color: #c45a4a;">&times;</button>
            </div>
          </div>

          ${t.subtasks.length>0?`
            <div style="margin-top: 14px;">
              <div class="db-progress" style="margin-bottom: 8px;">
                <div class="db-progress-bar" style="width: ${a}%;"></div>
              </div>
              <span style="font-size: 11px; color: var(--db-text-muted);" class="db-mono">${a}% complete</span>
            </div>
          `:""}

          <!-- Subtasks -->
          <div style="margin-top: 12px;" class="subtask-list" data-goal-id="${t.id}">
            ${t.subtasks.map(n=>`
              <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--db-border);">
                <input type="checkbox" class="db-checkbox subtask-check" data-goal-id="${t.id}" data-subtask-id="${n.id}" ${n.done?"checked":""} />
                <span style="font-size: 13px; flex: 1; ${n.done?"text-decoration: line-through; opacity: 0.4;":""}">${n.title}</span>
                <button class="subtask-delete" data-goal-id="${t.id}" data-subtask-id="${n.id}" style="background: none; border: none; color: var(--db-text-muted); cursor: pointer; font-size: 14px; opacity: 0.5;">&times;</button>
              </div>
            `).join("")}
            <div style="margin-top: 8px; display: flex; gap: 6px;">
              <input type="text" class="db-input subtask-input" data-goal-id="${t.id}" placeholder="Add subtask..." style="flex: 1; font-size: 12px; padding: 6px 10px;" />
              <button class="db-btn db-btn-sm subtask-add" data-goal-id="${t.id}">+</button>
            </div>
          </div>
        </div>
      `}function v(){document.querySelectorAll(".subtask-check").forEach(t=>{t.addEventListener("change",()=>{const a=t.getAttribute("data-goal-id"),d=t.getAttribute("data-subtask-id"),e=s(),n=e.find(o=>o.id===a);if(n){const o=n.subtasks.find(c=>c.id===d);o&&(o.done=!o.done)}r(e),i()})}),document.querySelectorAll(".subtask-add").forEach(t=>{t.addEventListener("click",()=>{const a=t.getAttribute("data-goal-id"),e=document.querySelector(`.subtask-input[data-goal-id="${a}"]`).value.trim();if(!e)return;const n=s(),o=n.find(c=>c.id===a);o&&o.subtasks.push({id:crypto.randomUUID(),title:e,done:!1}),r(n),i()})}),document.querySelectorAll(".subtask-input").forEach(t=>{t.addEventListener("keydown",a=>{if(a.key==="Enter"){const d=t.getAttribute("data-goal-id");document.querySelector(`.subtask-add[data-goal-id="${d}"]`).click()}})}),document.querySelectorAll(".subtask-delete").forEach(t=>{t.addEventListener("click",()=>{const a=t.getAttribute("data-goal-id"),d=t.getAttribute("data-subtask-id"),e=s(),n=e.find(o=>o.id===a);n&&(n.subtasks=n.subtasks.filter(o=>o.id!==d)),r(e),i()})}),document.querySelectorAll(".goal-edit").forEach(t=>{t.addEventListener("click",()=>{const a=t.getAttribute("data-id"),e=s().find(n=>n.id===a);e&&(u=a,document.getElementById("goal-title").value=e.title,document.getElementById("goal-category").value=e.category,document.getElementById("goal-target-date").value=e.targetDate,document.getElementById("goal-status").value=e.status,document.getElementById("modal-heading").textContent="Edit Goal",document.getElementById("goal-modal").style.display="block")})}),document.querySelectorAll(".goal-delete").forEach(t=>{t.addEventListener("click",()=>{const a=t.getAttribute("data-id");confirm("Delete this goal?")&&(r(s().filter(d=>d.id!==a)),i())})})}document.getElementById("add-goal-btn").addEventListener("click",()=>{u=null,document.getElementById("goal-title").value="",document.getElementById("goal-category").value="",document.getElementById("goal-target-date").value="",document.getElementById("goal-status").value="Not Started",document.getElementById("modal-heading").textContent="Add Goal",document.getElementById("goal-modal").style.display="block",document.getElementById("goal-title").focus()});document.getElementById("goal-cancel").addEventListener("click",()=>{document.getElementById("goal-modal").style.display="none"});document.getElementById("goal-save").addEventListener("click",()=>{const t=document.getElementById("goal-title").value.trim();if(!t)return;const a=s();if(u){const d=a.find(e=>e.id===u);d&&(d.title=t,d.category=document.getElementById("goal-category").value.trim(),d.targetDate=document.getElementById("goal-target-date").value,d.status=document.getElementById("goal-status").value)}else a.push({id:crypto.randomUUID(),title:t,category:document.getElementById("goal-category").value.trim(),targetDate:document.getElementById("goal-target-date").value,status:document.getElementById("goal-status").value,subtasks:[],agency:p()});r(a),document.getElementById("goal-modal").style.display="none",i()});document.getElementById("goal-title").addEventListener("keydown",t=>{t.key==="Enter"&&document.getElementById("goal-save").click()});let g=!1;document.getElementById("completed-toggle").addEventListener("click",()=>{g=!g,document.getElementById("completed-goals").style.display=g?"":"none",document.getElementById("completed-chevron").style.transform=g?"rotate(90deg)":""});i();window.addEventListener("agencychange",()=>{i()});
