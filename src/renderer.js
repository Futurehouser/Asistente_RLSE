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

  const input1 = document.getElementById('input1');
  const input2 = document.getElementById('input2');
  const output = document.getElementById('output');

  document.getElementById('generateBtn').addEventListener('click', () => {
    output.value = TEMPLATE
      .replace('[INPUT 1]', () => input1.value)
      .replace('[INPUT 2]', () => input2.value);
  });

  const copyBtn = document.getElementById('copyBtn');
  copyBtn.addEventListener('click', async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
    } catch {
      output.select();
      document.execCommand('copy');
    }
    copyBtn.textContent = '¡Copiado!';
    setTimeout(() => (copyBtn.textContent = 'Copiar'), 1500);
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
