const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pdfFasi', {
  version: '0.1.0',
  saveExport: (payload) => ipcRenderer.invoke('pdf-fasi:save-export', payload),
});
