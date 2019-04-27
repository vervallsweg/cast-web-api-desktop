const {app, BrowserWindow, ipcMain} = require('electron');
const { fork } = require('child_process');
const config = require('cast-web-api/lib/config/config');
const fs = require('fs');
const path = require('path');
const ga = require('google-assistant');

console.log(ga);

let windows = new Map();
let proc;

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

    mainWindow.webContents.openDevTools();

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

function start() {
    return new Promise(resolve => {
        if (!proc) {
            let logPath = path.join(app.getPath('logs'), Date.now()+".log" ).normalize();
            let logStream = fs.createWriteStream(logPath);

            proc = fork(require.resolve('cast-web-api/api'), {detached: false, stdio: 'pipe', env: {ELECTRON_RUN_AS_NODE: 0}});
            proc.logPath = logPath;

            proc.stdout.pipe(logStream);
            proc.stderr.pipe(logStream);

            proc.stdout.once('data', () => {
                resolve({status: 'online', address: proc.address, logPath: proc.logPath});
            });

            listeners();
        } else {
            resolve({status: 'online', address: proc.address, logPath: proc.logPath});
        }
    });
}

function stop() {
    return new Promise(resolve => {
        if (proc) {
            proc.kill();

            proc.once('close', (code) => {
                console.log(`child process exited with code ${code}`);
                resolve({status: 'offline'});
                proc = null;
            });
        } else {
            resolve({status: 'offline'});
        }
    });
}

function status() {
    return new Promise(resolve => {
        if (proc) resolve({status: 'online', address: proc.address, logPath: proc.logPath});
        else resolve({status: 'offline'});
    });
}

function listeners() {
    proc.on('close', (code) => {
        sendMainWindowStatus({status: 'offline'});
        proc = null;
    });

    proc.on('error', (error) => {
        // console.log(`child process error ${error}`); //TODO: maybe display err output if fork fails couple of seconds after start
    });

    proc.stdout.on('data', (data) => {
        if (data.includes('running at http://')) { //TODO: stop listening after we got ip
            proc.address = 'http://'+(data.toString().split('http://'))[1].trim();
            sendMainWindowStatus({status: 'online', address: proc.address, logPath: proc.logPath});
        }
    });
}

function sendMainWindowStatus(status) {
    if (windows.has('main')) {
        let mainWindow = windows.get('main');
        mainWindow.webContents.send('status-received', status);
    }
}

function getInit() {
    return new Promise(resolve => {
        resolve({configDir: path.join(path.dirname(require.resolve('cast-web-api')), 'config').normalize(), logsDir: app.getPath('logs')});
    });
}