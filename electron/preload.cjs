const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),
  loadBoard: () => ipcRenderer.invoke('load-board'),
  saveBoard: (data) => ipcRenderer.invoke('save-board', data),
  getModels: () => ipcRenderer.invoke('get-models'),
  executeTask: (params) => ipcRenderer.invoke('execute-task', params),
})
