(() => {
  // ---------- Pasos (resaltado + navegación) ----------
  const steps = Array.from(document.querySelectorAll('.step'));
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const indicator = document.getElementById('stepIndicator');
  let current = 0;

  function showStep(i, scroll = true) {
    current = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, idx) => s.classList.toggle('active', idx === current));
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === steps.length - 1;
    indicator.textContent = `Paso ${current + 1} de ${steps.length}`;
    if (scroll) steps[current].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  prevBtn.addEventListener('click', () => showStep(current - 1));
  nextBtn.addEventListener('click', () => showStep(current + 1));
  showStep(0, false);

  // ---------- Generar descripción ----------
  const TEMPLATE = [
    '- High Level & Non-Technical Language Description Summary:',
    '',
    '[INPUT 1]',
    '',
    '- What BENEFIT will this change bring?:',
    '',
    'Historias de usuario de Jira:',
    '',
    '[INPUT 2]',
    '',
    'Adaptación de mallas para las ingestas nuevas: fase2',
    '',
    '- Services/Workstreams/Channels Impacted?: Aquaplus',
    '',
    '- Technologies Involved in the Change?: Control- M',
    '',
    '- Has this Type of Change been done before? [YES|NO]: YES',
    '',
    '- Have previous Deployments resulted in any issues? [YES|NO] (If YES explain what happened): NO',
    '',
    "- Any Dependencies with other Changes or it's Self-Contained? (If Dependencies, please add the Change Tickets ):NO",
    '',
    '- Impact on Live Service expected? [YES|NO] (If YES, provide Impact Statement): NO',
    '',
    '- Are we introducing a New Service or moving to New Infrastructure? [YES|NO] (If YES, has PFP (Permit For PRO) been achieved?): NO',
    '',
    '- Is the deployment time window critical? [YES|NO] (If YES, what is the exact time window? That window should include deployment, testing and backout activities ): NO',
    '',
    '- Any impact on Communications? [YES|NO]: NO',
    '',
    '- Any impact on Desktops? [YES|NO]: NO',
    '',
    '- Impacted Countries: Global España',
    '',
    '- Affects the DAILY Accounting Closing? [YES|NO]: NO',
    '',
    '- Affects the MONTHLY Accounting Closing? [YES|NO] : NO',
    '',
    '- Accounting Closing SHKD Contacts: (Only if 2 previous questions apply - MANDATORY to inform Name, Surname and Mobile Phone)',
    '',
    '- Accounting Closing SHKD Tests: (Only if previous question applies - Describe briefly)',
  ].join('\n');

  const TEMPLATE_JUSTIFICATION = [
    '- Reason? [Project|Incident Fix|Vulnerability|Regulatory|Regulatory Compliance|BAU] :',
    '',
    '[INPUT 1]',
    '',
    '- Business Rationale for the Change? (Why?, Value added?, etc...):',
    '',
    '[INPUT 2]',
    '',
    '- Impact of not carrying out the change?: En caso de error humano  los jobs por ejecutar se pueden lanzar de manera manual, los nuevos no tienen peso operativo.',
    'Examples:',
    'i.e.: Regulatory date is the 15/10/2022, if not in prod by them we will be breaching an Industry Regulation',
    'i.e.: Certificate expires on the 13/10/2022, if not implemented by them payments journey will be affected',
  ].join('\n');

  const input1 = document.getElementById('input1');
  const input2 = document.getElementById('input2');
  const output = document.getElementById('output');

  const output2 = document.getElementById('output2');
  const fill = (tpl) =>
    tpl.replace('[INPUT 1]', () => input1.value).replace('[INPUT 2]', () => input2.value);

  document.getElementById('generateBtn').addEventListener('click', () => {
    output.value = fill(TEMPLATE);
    output2.value = fill(TEMPLATE_JUSTIFICATION);
  });

  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const tmp = document.createElement('textarea');
      tmp.value = text;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      tmp.remove();
    }
    btn.textContent = '¡Copiado!';
    setTimeout(() => (btn.textContent = 'Copiar'), 1500);
  }

  const copyBtn = document.getElementById('copyBtn');
  copyBtn.addEventListener('click', () => {
    if (output.value) copyText(output.value, copyBtn);
  });
  const copyBtn2 = document.getElementById('copyBtn2');
  copyBtn2.addEventListener('click', () => {
    if (output2.value) copyText(output2.value, copyBtn2);
  });

  // ---------- Fechas de despliegue ----------
  const TEMPLATE_SHKD = [
    '- Post Production Implementation Testing (Describe briefly):',
    'Consulta en control-M de la ejecución automática de los jobs',
    '',
    '- SHKD Contacts Detail (MANDATORY to inform Name, Surname and Mobile Phone):',
    'Technical SHKD: [EMAIL] N/A',
    'Functional SHKD: [EMAIL]',
    'Functional SHKD Date:  [INPUT DATE]',
    'Specify Reason if Functional SHKD Date / Los cambios no se hacen efectivos hasta la mañana siguiente',
  ].join('\n');

  // title: título; offset: días respecto a la fecha de PRO; time: hora;
  // note: indicación que se añade al título; shkd: añade las salidas de SHKD;
  // imagesBefore: imágenes que se muestran justo encima de la fila
  const DATE_PLAN = [
    { title: 'Fecha de inicio de despliegue a PRE', offset: -2, time: '13:00:00',
      note: "(poner esta fecha en la pestaña Schedule, campo 'Preproduction proposed date' y en la tarea de 'Pre-production' también)" },
    { title: 'Fecha de fin de despliegue a PRE', offset: -2, time: '23:59:59',
      note: "(poner esta fecha en la tarea de 'Pre-production')" },
    { title: 'Fecha de inicio del despliegue a PRO', offset: 0, time: '09:00:00',
      note: "(poner esta fecha en la pestaña Schedule, campo 'Planned start date' y en la tarea de 'Production')" },
    { title: 'Fecha de fin del despliegue a PRO', offset: 0, time: '23:59:59',
      note: "(poner esta fecha en la tarea de 'Production')" },
    { title: 'Fecha de inicio de Shakedown Técnico', offset: 1, time: '09:00:00',
      note: "(poner esta fecha en la tarea de 'SKD TÉCNICO')" },
    { title: 'Fecha de fin de Shakedown Técnico', offset: 1, time: '23:59:59',
      note: "(poner esta fecha en la tarea de 'SKD TÉCNICO')" },
    { title: 'Fecha de inicio de Shakedown Funcional', offset: 2, time: '09:00:00',
      note: "(poner esta fecha en la tarea de 'SKD FUNCIONAL' y copia la primera descripción en 'Implementation plan' de la RLSE y copia la segunda descripción en 'Test plan' de la RLSE)",
      shkd: true },
    { title: 'Fecha de fin de Shakedown Funcional', offset: 2, time: '23:59:59',
      note: "(poner esta fecha en la tarea de 'SKD FUNCIONAL)",
      imagesBefore: [
        ['img/test-plan.jpg', 'Campo Test plan de la RLSE'],
        ['img/implementation-plan.jpg', 'Campo Implementation plan de la RLSE'],
      ] },
    { title: 'Fecha de inicio del Rollback', offset: 0, time: '09:30:00',
      note: '(poner esta fecha en ambas tareas de Rollback)' },
    { title: 'Fecha de fin del Rollback', offset: 0, time: '23:59:59',
      note: '(poner esta fecha en ambas tareas de Rollback)' },
  ];

  const deployDate = document.getElementById('deployDate');
  const datesOut = document.getElementById('datesOut');
  const datesIntro = document.getElementById('datesIntro');
  const pad = (n) => String(n).padStart(2, '0');

  // Correo de SHKD: se guarda en este equipo para no tener que reescribirlo
  const shkdEmail = document.getElementById('shkdEmail');
  try { shkdEmail.value = localStorage.getItem('shkdEmail') || ''; } catch {}
  const fillShkd = (date) =>
    TEMPLATE_SHKD.replace(/\[EMAIL\]/g, () => shkdEmail.value.trim()).replace('[INPUT DATE]', () => date);
  const shkdOutputs = []; // [textarea, fecha] para refrescar al cambiar el correo
  shkdEmail.addEventListener('input', () => {
    try { localStorage.setItem('shkdEmail', shkdEmail.value.trim()); } catch {}
    shkdOutputs.forEach(([ta, date]) => (ta.value = fillShkd(date)));
  });

  function makeCopyButton(getText) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-small btn-ghost';
    btn.textContent = 'Copiar';
    btn.addEventListener('click', () => copyText(getText(), btn));
    return btn;
  }

  function makeTextOutput(text) {
    const wrap = document.createElement('div');
    wrap.className = 'output-wrap';
    const ta = document.createElement('textarea');
    ta.readOnly = true;
    ta.rows = 8;
    ta.value = text;
    const btn = makeCopyButton(() => ta.value);
    btn.classList.add('copy-btn');
    wrap.append(ta, btn);
    return wrap;
  }

  document.getElementById('datesBtn').addEventListener('click', () => {
    datesOut.innerHTML = '';
    shkdOutputs.length = 0;
    if (!deployDate.value) {
      datesIntro.hidden = true;
      deployDate.focus();
      return;
    }
    datesIntro.hidden = false;
    const [y, m, d] = deployDate.value.split('-').map(Number);
    DATE_PLAN.forEach((item) => {
      const dt = new Date(y, m - 1, d + item.offset); // fecha local: gestiona cambios de mes/año
      const yyyy = dt.getFullYear();
      const mm = pad(dt.getMonth() + 1);
      const dd = pad(dt.getDate());
      const value = `${yyyy}-${mm}-${dd} ${item.time}`;

      (item.imagesBefore || []).forEach(([src, alt]) => {
        const img = document.createElement('img');
        img.className = 'guide-img';
        img.src = src;
        img.alt = alt;
        datesOut.appendChild(img);
      });

      const row = document.createElement('div');
      row.className = 'row';
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = `${item.title} ${item.note}`;
      const cell = document.createElement('input');
      cell.className = 'date-cell';
      cell.readOnly = true;
      cell.value = value;
      cell.title = 'Clic para seleccionar';
      cell.addEventListener('focus', () => cell.select());
      const group = document.createElement('div');
      group.className = 'date-row-item';
      group.append(cell, makeCopyButton(() => value));
      if (item.shkd) {
        // Fecha a la izquierda y las dos descripciones de SHKD a su derecha
        row.classList.add('row-shkd');
        const left = document.createElement('div');
        left.className = 'shkd-left';
        left.append(label, group);
        const extras = document.createElement('div');
        extras.className = 'extra-outputs';
        [`${yyyy}-${mm}-${dd}`, `${dd}/${mm}/${yyyy}`].forEach((date) => {
          const out = makeTextOutput(fillShkd(date));
          shkdOutputs.push([out.querySelector('textarea'), date]);
          extras.appendChild(out);
        });
        row.append(left, extras);
      } else {
        row.append(label, group);
      }
      datesOut.appendChild(row);
    });
  });

  // ---------- Modo día / noche ----------
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  function applyTheme(t) {
    root.dataset.theme = t;
    themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
    themeBtn.title = t === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche';
    try { localStorage.setItem('theme', t); } catch {}
  }
  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
  themeBtn.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  // ---------- Versión y actualizaciones ----------
  if (window.api) {
    window.api.onVersion((v) => (document.getElementById('version').textContent = `v${v}`));

    const banner = document.getElementById('updateBanner');
    const text = document.getElementById('updateText');
    const btn = document.getElementById('updateBtn');

    window.api.onUpdateAvailable(({ version, current }) => {
      text.textContent = `Nueva versión disponible: v${version} (actual v${current})`;
      banner.hidden = false;
      document.body.classList.add('has-banner');
    });

    window.api.onUpdateProgress((pct) => {
      text.textContent = `Descargando actualización… ${pct}%`;
    });

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      text.textContent = 'Descargando actualización…';
      const res = await window.api.installUpdate();
      if (res && res.ok) {
        text.textContent = 'Instalando y reiniciando…';
      } else {
        text.textContent = `Error al actualizar: ${(res && res.error) || 'desconocido'}`;
        btn.disabled = false;
      }
    });
  }
})();
