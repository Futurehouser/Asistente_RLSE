// Auto-actualización para la versión portable (.exe) a partir de GitHub Releases.
// 1) Consulta la última release del repo.
// 2) Si su versión es mayor que la actual, avisa a la interfaz.
// 3) Al aceptar, descarga el nuevo .exe y un script .bat sustituye el ejecutable
//    portable original cuando la app se cierra, y la vuelve a abrir.
const { app } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const REPO = 'Futurehouser/Asistente_RLSE';
const ASSET_NAME = 'Asistente_RLSE.exe';

let latest = null;

function parseVersion(v) {
  return String(v).replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
}

function isNewer(remote, local) {
  const a = parseVersion(remote);
  const b = parseVersion(local);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0;
    const y = b[i] || 0;
    if (x !== y) return x > y;
  }
  return false;
}

async function checkForUpdate() {
  // Solo tiene sentido en el ejecutable portable empaquetado
  if (!app.isPackaged || !process.env.PORTABLE_EXECUTABLE_FILE) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Asistente-RLSE-Updater' },
    });
    if (!res.ok) return null;
    const rel = await res.json();
    const asset = (rel.assets || []).find((a) => a.name === ASSET_NAME);
    if (!asset || !isNewer(rel.tag_name, app.getVersion())) return null;
    latest = { version: rel.tag_name.replace(/^v/i, ''), url: asset.browser_download_url, size: asset.size };
    return { version: latest.version, current: app.getVersion() };
  } catch {
    return null;
  }
}

async function downloadAndInstall(onProgress) {
  if (!latest) return { ok: false, error: 'No hay actualización disponible' };
  const target = process.env.PORTABLE_EXECUTABLE_FILE;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asistente-rlse-'));
  const newExe = path.join(tmpDir, ASSET_NAME);

  try {
    const res = await fetch(latest.url, { headers: { 'User-Agent': 'Asistente-RLSE-Updater' } });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
    const total = Number(res.headers.get('content-length')) || latest.size || 0;
    const out = fs.createWriteStream(newExe);
    let received = 0;
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (!out.write(Buffer.from(value))) await new Promise((r) => out.once('drain', r));
      if (total) onProgress(Math.round((received / total) * 100));
    }
    await new Promise((resolve, reject) => out.end((err) => (err ? reject(err) : resolve())));

    // Script que espera a que la app se cierre, reemplaza el exe y la relanza
    const bat = path.join(tmpDir, 'update.bat');
    const script = [
      '@echo off',
      'chcp 65001 >nul',
      `set "SRC=${newExe}"`,
      `set "DST=${target}"`,
      ':retry',
      'timeout /t 1 /nobreak >nul',
      'copy /y "%SRC%" "%DST%" >nul 2>&1',
      'if errorlevel 1 goto retry',
      'start "" "%DST%"',
      'del "%SRC%" >nul 2>&1',
      '(goto) 2>nul & del "%~f0"',
    ].join('\r\n');
    fs.writeFileSync(bat, script, 'utf8');

    spawn('cmd.exe', ['/c', bat], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    setTimeout(() => app.quit(), 300);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

module.exports = { checkForUpdate, downloadAndInstall, isNewer };
