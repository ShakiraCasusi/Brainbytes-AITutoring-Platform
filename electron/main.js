const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // In production, load the running web app. In development, point to the dev server.
  // Legacy static export target:
  // const startUrl = process.env.NODE_ENV === 'development'
  //   ? 'http://localhost:3000'
  //   : url.format({
  //       pathname: path.join(__dirname, '../out/index.html'),
  //       protocol: 'file:',
  //       slashes: true
  //     });
  const startUrl =
    process.env.FRONTEND_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'http://localhost:8080');

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
