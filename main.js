const {app, BrowserWindow, ipcMain} = require('electron');
const manager = require('cast-web-api/manager');
const config = require('cast-web-api/lib/config/config');

let windows = new Map();

function createMainWindow () {
    // Create the main browser window.
    let mainWindow = new BrowserWindow({
        width: 450,
        height: 450,
        minWidth: 380,
        minHeight: 450,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile('home/index.html');

    // Emitted when the main window is closed.
    mainWindow.on('closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        } else {
            windows.delete('main');
        }
    });

    windows.set('main', mainWindow);
}

function createSettingsWindow() {
    let settingsWindow = new BrowserWindow({
        width: 400,
        height: 600,
        minHeight: 450,
        minWidth: 320,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true
        }
    });

    settingsWindow.loadFile('settings/index.html');

    settingsWindow.on('closed', () => {
        windows.delete('settings');
    });

    windows.set('settings', settingsWindow);
}

app.on('ready', createMainWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (windows === null || (windows != null && windows.size < 1)) {
        createMainWindow();
    }
});

//home
ipcMain.on('control-start', (event) => {
    event.sender.send('did-start-load');
    manager.start()
        .then(
            success => {
                event.sender.send('status-received', success);
            },
            error => {
                event.sender.send('error-received', error);
            }
        )
        .finally(()=>{
            event.sender.send('did-finish-load');
        });
});

ipcMain.on('control-stop', (event) => {
    event.sender.send('did-start-load');
    manager.stop()
        .then(
            success => {
                event.sender.send('status-received', success);
            },
            error => {
                event.sender.send('error-received', error);
            }
        )
        .finally(()=>{
            event.sender.send('did-finish-load');
        });
});

ipcMain.on('control-startup', (event) => {
    event.sender.send('did-start-load');
    manager.startup()
        .then(
            success => {
                event.sender.send('status-received', success);
            },
            error => {
                event.sender.send('error-received', error);
            }
        )
        .finally(()=>{
            event.sender.send('did-finish-load');
        });
});

ipcMain.on('control-unstartup', (event) => {
    event.sender.send('did-start-load');
    manager.unstartup()
        .then(
            success => {
                event.sender.send('status-received', success);
            },
            error => {
                event.sender.send('error-received', error);
            }
        )
        .finally(()=>{
            event.sender.send('did-finish-load');
        });
});

ipcMain.on('control-fix-perm', (event) => {
    event.sender.send('did-start-load');
    manager.fixPermission()
        .then(
            success => {
                event.sender.send('status-received', success);
            },
            error => {
                event.sender.send('error-received', error);
            }
        )
        .finally(()=>{
            event.sender.send('did-finish-load');
        });
});

ipcMain.on('bottom-menu-refresh', (event) => {
    event.sender.send('did-start-load');
    manager.status()
        .then(
            success => {
                event.sender.send('status-received', success);
            },
            error => {
                event.sender.send('error-received', error);
            }
        )
        .finally(()=>{
            event.sender.send('did-finish-load');
        });
});

//settings
ipcMain.on('bottom-menu-settings', (event) => {
    if (windows.has('settings')) {
        windows.get('settings').show();
    } else {
        createSettingsWindow();
    }
});

ipcMain.on('get-config', (event) => {
    event.sender.send('did-start-load');
    new Promise((resolve => {
        resolve(config.readFS());
    }))
        .then(
            success => {
                event.sender.send('config-received', success);
            },
            error => {
                event.sender.send('error-received', error);
            }
        )
        .finally(() => {
            event.sender.send('did-finish-load');
        });
});

ipcMain.on('save-config', (event, newConfig) => {
    event.sender.send('did-start-load');
    new Promise((resolve => {
        if (newConfig.hostname === "") delete newConfig.hostname;
        resolve(config.writeFS(newConfig));
    }))
        .then(
            success => {
                event.sender.send('config-saved');
            },
            error => {
                event.sender.send('error-received', error);
            }
        )
        .finally(() => {
            event.sender.send('did-finish-load');
        });
});