const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Board persistence
  notify: (title, body) => ipcRenderer.send('notify', { title, body }),
  loadBoard: () => ipcRenderer.invoke('load-board'),
  saveBoard: (data) => ipcRenderer.invoke('save-board', data),

  // Task execution
  executeTask: (taskId, agentId) => ipcRenderer.invoke('execute-task', taskId, agentId),
  cancelTask: (taskId) => ipcRenderer.invoke('cancel-task', taskId),
  sendTaskInput: (taskId, text) => ipcRenderer.invoke('send-task-input', taskId, text),

  // Task execution events (streaming)
  onTaskOutput: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('task-output', handler)
    return () => ipcRenderer.removeListener('task-output', handler)
  },
  onTaskFinished: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('task-finished', handler)
    return () => ipcRenderer.removeListener('task-finished', handler)
  },
  onTaskWaitingInput: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('task-waiting-input', handler)
    return () => ipcRenderer.removeListener('task-waiting-input', handler)
  },

  // Directory selection
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  // Model listing
  getModels: (executor) => ipcRenderer.invoke('get-models', executor),

  // Agent file generation
  generateAgentFile: (executor, description, mode, tools) =>
    ipcRenderer.invoke('generate-agent-file', executor, description, mode, tools),
})
