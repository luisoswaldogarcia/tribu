const { app, BrowserWindow, Notification, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = process.env.VITE_DEV_SERVER_URL
const dataPath = path.join(app.getPath('userData'), 'tribu-data.json')

function loadData() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    }
  } catch {}
  return null
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

ipcMain.on('notify', (_event, { title, body }) => {
  new Notification({ title, body }).show()
})

ipcMain.handle('load-board', () => {
  return loadData()
})

ipcMain.handle('save-board', (_event, data) => {
  saveData(data)
  return true
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
