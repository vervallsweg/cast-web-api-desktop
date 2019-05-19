// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { clipboard, ipcRenderer, shell } = require('electron');
const ui = require('./ui');

let latestStatus = [];
let init = {};

const home = {
    loading: document.getElementById('loading'),
    content: document.getElementById('content')
};

const hero = {
    all: document.getElementById('hero'),
    version: document.getElementById('version'),
    status: document.getElementById('status'),
    address: document.getElementById('address'),
    statusImg: document.getElementById('status-img'),
    addressPopup: {
        copy: document.getElementById('address-copy'),
        open: document.getElementById('address-open')
    }
};

const controls = {
    all: document.getElementById('controls'),
    start: document.getElementById('start'),
    stop: document.getElementById('stop'),
    autostart: document.getElementById('autostart'),
    unautostart: document.getElementById('unautostart'),
    configDir: document.getElementById('config-dir'),
    logsDir: document.getElementById('logs-dir'),
    openLogs: document.getElementById('open-logs'),
    swagger: document.getElementById('swagger')
};

const bottomMenuLeft = {
    all: document.getElementById('bottom-menu-left'),
    donate: document.getElementById('donate'),
    help: document.getElementById('help')
};

const bottomMenuRight = {
    all: document.getElementById('bottom-menu-right'),
    refresh: document.getElementById('refresh'),
    settings: document.getElementById('settings')
};

const modal = {
    content: document.getElementById('modal-content'),
    openLogs: document.getElementById('error-openLogs')
};

ipcRenderer.on('init', (event, newInit) => {
    init = newInit;

    if (init.autostart) ipcRenderer.send('control-start');
    else ipcRenderer.send('bottom-menu-refresh');
});

ipcRenderer.on('did-finish-load', () => {
    ui.setLoading(false, home);
});

ipcRenderer.on('did-start-load', () => {
    ui.setLoading(true, home);
});

ipcRenderer.on('status-received', (event, status) => {
    latestStatus = status;
    ui.parseStatus(status, hero, controls);
});

ipcRenderer.on('error-received', (event, error) => {
    console.error(error);
    if (latestStatus && latestStatus.logPath) {
        let path = latestStatus.logPath;
        modal.openLogs.addEventListener('click', () => {
            shell.openItem(path);
        });
    }

    ui.showPopup(error.message, modal);
});

ipcRenderer.on('autostart-received', (event, autostart) => {
    ui.setAutoStart(autostart, controls);
});

controls.start.addEventListener('click', () => {
    ipcRenderer.send('control-start');
});

controls.stop.addEventListener('click', () => {
    ipcRenderer.send('control-stop');
});

controls.autostart.addEventListener('click', () => {
    ipcRenderer.send('control-set-autostart', !ui.getAutoStart(controls) );
});

controls.configDir.addEventListener('click', () => {
    if (init.configDir) {
        shell.openItem(init.configDir);
    }
});

controls.logsDir.addEventListener('click', () => {
    if (init.logsDir) {
        shell.openItem(init.logsDir);
    }
});

controls.openLogs.addEventListener('click', () => {
    if (latestStatus && latestStatus.logPath) {
        shell.openItem(latestStatus.logPath);
    }
});

bottomMenuRight.refresh.addEventListener('click', () => {
    ipcRenderer.send('bottom-menu-refresh');
});

bottomMenuRight.settings.addEventListener('click', () => {
    ipcRenderer.send('bottom-menu-settings');
});

bottomMenuLeft.donate.addEventListener('click', () => {
    shell.openExternal('https://www.paypal.me/vervallsweg');
});

bottomMenuLeft.help.addEventListener('click', () => {
    shell.openExternal('https://vervallsweg.github.io/cast-web/help/');
});

hero.addressPopup.copy.addEventListener('click', () => {
    clipboard.writeText(latestStatus.address);
});

hero.addressPopup.open.addEventListener('click', () => {
    shell.openExternal(latestStatus.address);
});