
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Sistem Absensi SMP Digital",
    icon: path.join(__dirname, 'icon.png'), // Opsional: Tambahkan file icon.png
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Untuk build exe, biasanya arahkan ke file index.html hasil build
  win.loadFile('index.html');
  
  // Sembunyikan menu bar default agar terlihat seperti aplikasi modern
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
