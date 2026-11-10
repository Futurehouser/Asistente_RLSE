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

  const DEFAULT_HUS = [
    'Ajustamos el algoritmo de fondo de comercio en loan tape espejo (https://san-scib.atlassian.net/browse/SCIBAQAPLS-19530)',
    'componentes de planificacion controlM (https://san-scib.atlassian.net/browse/SCIBAQAPLS-19209)',
    'Cambiar origen de datos de Ratings Externos diarios en ATB espejo (https://san-scib.atlassian.net/browse/SCIBAQAPLS-18160)',
  ].join('\n');

  const input1 = document.getElementById('input1');
  const input2 = document.getElementById('input2');
  input2.value = DEFAULT_HUS;
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

  const TEMPLATE_IMPLEMENTATION = [
    '- Implementation Plan including Date, Time, Action and Owner for PRO (Please inform when the Post Implementation Testing is expected):',
    '[INPUT DATE] - Se resolverá el SHAKEDOWN FUNCIONAL, tras el despliegue a PRO vía GitHub Actions el día anterior.',
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
        ['img/implementation-plan.jpg', 'Campo Implementation plan de la RLSE'],
        ['img/test-plan.jpg', 'Campo Test plan de la RLSE'],
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
  const fillTemplate = (tpl, date) =>
    tpl.replace(/\[EMAIL\]/g, () => shkdEmail.value.trim()).replace('[INPUT DATE]', () => date);
  const shkdOutputs = []; // [textarea, plantilla, fecha] para refrescar al cambiar el correo
  shkdEmail.addEventListener('input', () => {
    try { localStorage.setItem('shkdEmail', shkdEmail.value.trim()); } catch {}
    shkdOutputs.forEach(([ta, tpl, date]) => (ta.value = fillTemplate(tpl, date)));
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
        // 1ª: Implementation plan (yyyy-mm-dd) · 2ª: Test plan (dd/mm/yyyy)
        [
          [TEMPLATE_IMPLEMENTATION, `${yyyy}-${mm}-${dd}`],
          [TEMPLATE_SHKD, `${dd}/${mm}/${yyyy}`],
        ].forEach(([tpl, date]) => {
          const out = makeTextOutput(fillTemplate(tpl, date));
          shkdOutputs.push([out.querySelector('textarea'), tpl, date]);
          extras.appendChild(out);
        });
        row.append(left, extras);
      } else {
        row.append(label, group);
      }
      datesOut.appendChild(row);
    });
  });

  // ---------- Email a Blanca ----------
  const TEMPLATE_EMAIL = [
    'Buenos días Blanca',
    '',
    'Solicitamos tu conformidad para desplegar la RLSE [RLSE CODE] para subir los desarrollos vinculados con las siguientes HU:',
    '',
    '[INPUT HUS]',
    '',
    'Se adjunta plan de pruebas.',
    '',
    'Muchas gracias,',
    '',
    '',
    'Saludos.',
  ].join('\n');

  const rlseCode = document.getElementById('rlseCode');
  const emailOut = document.getElementById('emailOut');
  const emailSubject = document.getElementById('emailSubject');
  const emailBody = document.getElementById('emailBody');

  document.getElementById('emailBtn').addEventListener('click', () => {
    const code = rlseCode.value.trim();
    if (!code) {
      rlseCode.focus();
      return;
    }
    emailSubject.value = `[Aquaplus] RLSE ${code}`;
    emailBody.value = TEMPLATE_EMAIL
      .replace('[RLSE CODE]', () => code)
      .replace('[INPUT HUS]', () => input2.value);
    emailOut.hidden = false;
  });

  const copySubject = document.getElementById('copySubject');
  copySubject.addEventListener('click', () => copyText(emailSubject.value, copySubject));
  const copyBody = document.getElementById('copyBody');
  copyBody.addEventListener('click', () => copyText(emailBody.value, copyBody));

  // ---------- Email a gestión del cambio ----------
  const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto',
    'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  const rlseUrl = document.getElementById('rlseUrl');
  const taskUrl = document.getElementById('taskUrl');
  const changeOut = document.getElementById('changeEmailOut');
  const changeError = document.getElementById('changeEmailError');
  const changeSubject = document.getElementById('changeSubject');
  const changeBody = document.getElementById('changeBody');
  let changeEmail = { html: '', text: '' };

  function buildChangeEmail(code, url, longDate, task) {
    const link = /^https?:\/\//i.test(url) ? url : '';
    const rlseHtml = link ? `<a href="${esc(link)}" target="_blank">${esc(code)}</a>` : esc(code);
    const taskHtml = /^https?:\/\//i.test(task)
      ? `<a href="${esc(task)}" target="_blank">${esc(task)}</a>` : esc(task);
    const html = [
      '<p>Buenos días,</p>',
      `<p>Solicitamos que se avance la RLSE ${rlseHtml} para su subida a PRO por nuestra parte (desde GitHub Actions por el equipo de Aquaplus), para este ${esc(longDate)}.</p>`,
      '<p>Se adjunta tanto la conformidad del Usuario de Negocio (Banco) en la propia RLSE, como el correo del RCB con el ok y el Waiver de vulnerabilidades.</p>',
      '<p>La tarea a acometer de deploy a PRO es la siguiente junto al grupo encargado de abordarla (una vez se nos pase la tarea de estado pending a open dentro de la ventana temporal de la tarea), por este orden:</p>',
      `<ul style="list-style-type:square"><li>${taskHtml}<ul style="list-style-type:disc"><li>&gt; SGT_AP_SCIB_AQUAPLUS N1</li></ul></li></ul>`,
      '<p>Quedamos a vuestra disposición por si hubiera algún dato o información mal consignados, de acuerdo con el último protocolo para la gestión de cambios fijado.</p>',
      '<p>Muchas gracias<br>Saludos</p>',
    ].join('\n');
    const text = [
      'Buenos días,',
      '',
      `Solicitamos que se avance la RLSE ${code}${link ? ` (${link})` : ''} para su subida a PRO por nuestra parte (desde GitHub Actions por el equipo de Aquaplus), para este ${longDate}.`,
      '',
      'Se adjunta tanto la conformidad del Usuario de Negocio (Banco) en la propia RLSE, como el correo del RCB con el ok y el Waiver de vulnerabilidades.',
      '',
      'La tarea a acometer de deploy a PRO es la siguiente junto al grupo encargado de abordarla (una vez se nos pase la tarea de estado pending a open dentro de la ventana temporal de la tarea), por este orden:',
      '',
      `▪ ${task}`,
      '    • > SGT_AP_SCIB_AQUAPLUS N1',
      '',
      'Quedamos a vuestra disposición por si hubiera algún dato o información mal consignados, de acuerdo con el último protocolo para la gestión de cambios fijado.',
      '',
      'Muchas gracias',
      'Saludos',
    ].join('\n');
    return { html, text };
  }

  document.getElementById('changeEmailBtn').addEventListener('click', () => {
    const code = rlseCode.value.trim();
    const problems = [];
    if (!code) problems.push('el código de la RLSE (paso 7)');
    if (!deployDate.value) problems.push('la fecha de despliegue a PRO (paso 3)');
    if (problems.length) {
      changeError.textContent = `Falta ${problems.join(' y ')}.`;
      changeError.hidden = false;
      changeOut.hidden = true;
      return;
    }
    changeError.hidden = true;
    const [y, m, d] = deployDate.value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const longDate = `${WEEKDAYS[date.getDay()]} ${pad(d)} de ${MONTHS[m - 1]}`;
    changeSubject.value = `SOLICITUD PARA PRO NORMAL [BANKING] - AQUAPLUS - ${code}-${pad(d)}-${pad(m)}-${y}`;
    changeEmail = buildChangeEmail(code, rlseUrl.value.trim(), longDate, taskUrl.value.trim());
    changeBody.innerHTML = changeEmail.html;
    changeOut.hidden = false;
  });

  const copyChangeSubject = document.getElementById('copyChangeSubject');
  copyChangeSubject.addEventListener('click', () => copyText(changeSubject.value, copyChangeSubject));

  // El contenido se copia como texto enriquecido (HTML) para conservar el hipervínculo al pegarlo en Outlook
  const copyChangeBody = document.getElementById('copyChangeBody');
  copyChangeBody.addEventListener('click', async () => {
    if (!changeEmail.text) return;
    try {
      if (window.api && window.api.copyRich) {
        await window.api.copyRich(changeEmail.html, changeEmail.text);
      } else {
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([changeEmail.html], { type: 'text/html' }),
          'text/plain': new Blob([changeEmail.text], { type: 'text/plain' }),
        })]);
      }
      copyChangeBody.textContent = '¡Copiado!';
      setTimeout(() => (copyChangeBody.textContent = 'Copiar'), 1500);
    } catch {
      copyText(changeEmail.text, copyChangeBody);
    }
  });

  // ---------- Modo día / noche ----------
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  function applyTheme(t, remember) {
    root.dataset.theme = t;
    themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
    themeBtn.title = t === 'dark' ? 'Cambiar a modo día' : 'Cambiar a modo noche';
    if (remember) {
      try { localStorage.setItem('themeChoice', t); } catch {}
    }
  }
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark', false);
  themeBtn.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));

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
