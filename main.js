const { app, BrowserWindow, ipcMain, shell, clipboard } = require('electron');
const path = require('path');
const updater = require('./updater');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    minWidth: 600,
    minHeight: 500,
    title: 'Asistente deploy RLSE Aquaplus',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Los enlaces externos se abren en el navegador por defecto
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (/^https?:\/\//.test(url)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  win.webContents.once('did-finish-load', async () => {
    win.webContents.send('app-version', app.getVersion());
    const info = await updater.checkForUpdate();
    if (info) win.webContents.send('update-available', info);
  });
}

// Copia HTML + texto plano a la vez (para pegar en Outlook con hipervínculos)
ipcMain.handle('copy-rich', (_e, html, text) => {
  // Acentos como entidades HTML para que se peguen bien en cualquier programa
  const safeHtml = String(html).replace(/[^\x00-\x7f]/gu, (ch) => `&#${ch.codePointAt(0)};`);
  clipboard.write({ html: safeHtml, text: String(text) });
  return true;
});

ipcMain.handle('check-update', () => updater.checkForUpdateDetailed());

ipcMain.handle('install-update', async () => {
  return updater.downloadAndInstall((pct) => {
    if (win && !win.isDestroyed()) win.webContents.send('update-progress', pct);
  });
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
