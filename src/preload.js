const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('pdfFasi', {
  version: '0.1.0',
});
