const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs/promises');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 980,
    minWidth: 1200,
    minHeight: 820,
    backgroundColor: '#F4F6F8',
    title: 'PDF-Fasi',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'index.html'));
}

ipcMain.handle('pdf-fasi:save-export', async (_event, payload) => {
  const result = await dialog.showSaveDialog({
    defaultPath: payload.suggestedName,
    filters: payload.type === 'zip'
      ? [{ name: 'ZIP Archives', extensions: ['zip'] }]
      : [{ name: 'PDF Documents', extensions: ['pdf'] }],
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await fs.writeFile(result.filePath, Buffer.from(payload.bytes));
  return { canceled: false, filePath: result.filePath };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
