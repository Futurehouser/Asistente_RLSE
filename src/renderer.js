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
  // [título, días respecto a la fecha de PRO, hora]
  const DATE_PLAN = [
    ['Fecha de inicio de despliegue a PRE', -2, '13:00:00'],
    ['Fecha de fin de despliegue a PRE', -2, '23:59:59'],
    ['Fecha de inicio del despliegue a PRO', 0, '09:00:00'],
    ['Fecha de fin del despliegue a PRO', 0, '23:59:59'],
    ['Fecha de inicio de Shakedown Técnico', 1, '09:00:00'],
    ['Fecha de fin de Shakedown Técnico', 1, '23:59:59'],
    ['Fecha de inicio de Shakedown Funcional', 2, '09:00:00'],
    ['Fecha de fin de Shakedown Funcional', 2, '23:59:59'],
    ['Fecha de inicio del Rollback', 0, '09:30:00'],
    ['Fecha de fin del Rollback', 0, '23:59:59'],
  ];

  const deployDate = document.getElementById('deployDate');
  const datesOut = document.getElementById('datesOut');
  const pad = (n) => String(n).padStart(2, '0');

  document.getElementById('datesBtn').addEventListener('click', () => {
    datesOut.innerHTML = '';
    if (!deployDate.value) {
      deployDate.focus();
      return;
    }
    const [y, m, d] = deployDate.value.split('-').map(Number);
    DATE_PLAN.forEach(([title, offset, time]) => {
      const dt = new Date(y, m - 1, d + offset); // fecha local: gestiona cambios de mes/año
      const value = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${time}`;
      const row = document.createElement('div');
      row.className = 'row';
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = title;
      const cell = document.createElement('input');
      cell.className = 'date-cell';
      cell.readOnly = true;
      cell.value = value;
      cell.title = 'Clic para seleccionar';
      cell.addEventListener('focus', () => cell.select());
      const copy = document.createElement('button');
      copy.className = 'btn btn-small btn-ghost';
      copy.textContent = 'Copiar';
      copy.addEventListener('click', () => copyText(value, copy));
      row.append(label, cell, copy);
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
