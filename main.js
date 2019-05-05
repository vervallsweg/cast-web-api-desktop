const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron');
const config = require('cast-web-api/lib/config/config');
const path = require('path');

let windows = new Map();
let tray;

function createTray() {
    let icPath = path.join(__dirname, 'img/icon/icon-small.png').normalize();
    if (process.platform === 'darwin') {
        icPath = path.join(__dirname, 'img/icon/icon-smallTemplate.png').normalize();
    }
    tray = new Tray(icPath);

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open', type: 'normal', click: activate },
        { label: 'Quit', type: 'normal', role: 'quit' }
    ]);

    tray.setToolTip('cast-web-api-desktop');
    tray.setContextMenu(contextMenu);
}

function createMainWindow () {
    // Create the main browser window.
    let mainWindow = new BrowserWindow({
        width: 450,
        height: 470,
        minWidth: 380,
        minHeight: 470,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true
        }
    });

    mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadFile('home/index.html');

    mainWindow.on('closed', () => {
        windows.delete('main');
        checkClose();
    });

    mainWindow.webContents.on('did-finish-load', () => {
        getInit()
            .then( success => {
                mainWindow.webContents.send('init', success);
            });
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

    settingsWindow.setMenu(null);

    settingsWindow.loadFile('settings/index.html');

    settingsWindow.on('closed', () => {
        windows.delete('settings');
        checkClose();
    });

    settingsWindow.webContents.on('did-finish-load', () => {
        getConfig()
            .then( success => {
                settingsWindow.webContents.send('config-received', success);
            })
            .finally(() => {
                settingsWindow.webContents.send('did-finish-load');
            });
    });

    windows.set('settings', settingsWindow);
}

function createApiWindow() {
    let apiWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    apiWindow.loadFile('background/index.html');

    apiWindow.webContents.openDevTools();

    apiWindow.on('closed', () => {
        windows.delete('api');
    });

    apiWindow.webContents.on('did-finish-load', () => {
        getInit()
            .then( success => {
                apiWindow.webContents.send('did-finish-load', success);
            });
    });

    windows.set('api', apiWindow);
}

app.on('ready', () => {
    createMainWindow();
    createTray();
});

app.on('window-all-closed', checkClose);

function checkClose() {
    if (process.platform === 'darwin') {
        if (!windows.has('main') && !windows.has('settings')) {
            app.dock.hide();
        }
    }
    if (process.platform === 'win32') {
        let settingsWindow = windows.get('settings'); //this prevents nullpointer coz, this is triggered twice when closing the main window
        if (!windows.has('main') && settingsWindow) {
            windows.delete('settings'); //and we need to delete the reference immediately, otherwise on the second call it wouldn't be deleted yet
            settingsWindow.close(); //otherwise this would close the tray? Seems like garbage collection, but why? the tray variable should still be set
        }
    }
    //TODO: check linux behaviour
}

// And show icon again if window reopened.
app.on('browser-window-created', () => {
    if (process.platform === 'darwin') {
        app.dock.show();
    } else {
        //TODO: check linux behaviour
    }
});

app.on('activate', activate);

function activate() {
    if (windows === null || (windows != null && !windows.has('main'))) {
        createMainWindow();
    }
}

app.on('before-quit', () => {
    stop();
});

//home
ipcMain.on('init', (event) => {
    event.sender.send('did-start-load');

    getInit()
        .then(
            success => {
                event.sender.send('init', success);
            }
        );
});

ipcMain.on('control-start', (event) => {
    event.sender.send('did-start-load');

    start()
        .then(
            success => {
                event.sender.send('status-received', success);
            }
        )
        .finally(() => {
            event.sender.send('did-finish-load');
        });
});

ipcMain.on('control-stop', (event) => {
    event.sender.send('did-start-load');

    stop()
        .then(
            success => {
                event.sender.send('status-received', success);
            }
        )
        .finally(() => {
            event.sender.send('did-finish-load');
        });
});

ipcMain.on('control-startup', (event) => {

});

ipcMain.on('control-unstartup', (event) => {

});

ipcMain.on('control-fix-perm', (event) => {

});

ipcMain.on('bottom-menu-refresh', (event) => {
    event.sender.send('did-start-load');
    status()
        .then(
            success => {
                event.sender.send('status-received', success);
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

    getConfig()
        .then(
            success => {
                event.sender.send('config-received', success);
            },
            // error => {
            //     event.sender.send('error-received', error);
            // }
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

function getConfig() {
    return new Promise(resolve => {
        resolve(config.readFS());
    });
}

//API-background
ipcMain.on('api-address', (event, address) => {
    let apiWindow = windows.get('api') || {logPath: null};
    apiWindow.address = address.address;
    sendMainWindowStatus({status: 'online', address: address.address, logPath: apiWindow.logPath});
});

ipcMain.on('api-error', (event, error) => {
    sendMainWindowError(error);
    stop().then((stop)=>{event.sender.send('status-received', stop)});
});

function start() {
    return new Promise(resolve => {
        if (!windows.has('api')) {
            createApiWindow();

            ipcMain.once('api-logPath', (event, logPath) => {
                windows.get('api').logPath = logPath.logPath;
                resolve({status: 'online', logPath: logPath.logPath, address: windows.get('api').address});
            });

            setTimeout(() => {
                let apiWindow = windows.get('api') || {};
                if (!apiWindow.logPath || !apiWindow.address) {
                    sendMainWindowError({message: "API doesn't respond. Check the log file to see the error message."});
                    stop().then(() => {sendMainWindowStatus({status: 'offline'})});
                }
            }, 5000);
        } else {
            resolve({status: 'online', address: proc.address, logPath: proc.logPath});
        }
    });
}

function stop() {
    return new Promise(resolve => {
        if (windows.has('api')) {
            let apiWindow = windows.get('api');

            apiWindow.once('closed', () => {
                resolve({status: 'offline'});
            });

            apiWindow.close();
        } else {
            resolve({status: 'offline'});
        }
    });
}

function status() {
    return new Promise(resolve => {
        let apiWindow = windows.get('api') || {logPath: null, address: null};
        if (windows.has('api')) resolve({status: 'online', address: apiWindow.address, logPath: apiWindow.logPath});
        else resolve({status: 'offline'});
    });
}

function sendMainWindowStatus(status) {
    if (windows.has('main')) {
        let mainWindow = windows.get('main');
        mainWindow.webContents.send('status-received', status);
    }
}

function sendMainWindowError(err) {
    if (windows.has('main')) {
        let mainWindow = windows.get('main');
        mainWindow.webContents.send('error-received', err);
    }
}

function getInit() {
    return new Promise(resolve => {
        resolve({configDir: path.join(path.dirname(require.resolve('cast-web-api')), 'config').normalize(), logsDir: app.getPath('logs')});
    });
}