// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer, shell } = require('electron');
const ui = require('./ui');

let latestStatus = [];

const home = {
    loading: document.getElementById('loading'),
    content: document.getElementById('content')
};

const hero = {
    all: document.getElementById('hero'),
    version: document.getElementById('version'),
    status: document.getElementById('status'),
    address: document.getElementById('address'),
    statusImg: document.getElementById('status-img')
};

const controls = {
    all: document.getElementById('controls'),
    start: document.getElementById('start'),
    stop: document.getElementById('stop'),
    autostart: document.getElementById('autostart'),
    unautostart: document.getElementById('unautostart'),
    fixPerm: document.getElementById('fix-perm'),
    openLogs: document.getElementById('open-logs'),
    swagger: document.getElementById('swagger')
};

const bottomMenu = {
    all: document.getElementById('bottom-menu'),
    refresh: document.getElementById('refresh'),
    settings: document.getElementById('settings')
};

const modal = {
    content: document.getElementById('modal-content')
};

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
    let message = `${error.stdout}</br>${error.stderr}`;
    if (error.error && error.error.message) message = `${error.error.message}</br></br>${message}`;
    ui.showPopup(message, modal);
});

controls.start.addEventListener('click', () => {
    ipcRenderer.send('control-start');
});

controls.stop.addEventListener('click', () => {
    ipcRenderer.send('control-stop');
});

controls.autostart.addEventListener('click', () => {
    ipcRenderer.send('control-startup');
});

controls.unautostart.addEventListener('click', () => {
    ipcRenderer.send('control-unstartup');
});

controls.fixPerm.addEventListener('click', () => {
    ipcRenderer.send('control-fix-perm');
});

controls.openLogs.addEventListener('click', () => {
    if (latestStatus[0] && latestStatus[0].pm2_env && latestStatus[0].pm2_env.pm_out_log_path) {
        shell.openItem(latestStatus[0].pm2_env.pm_out_log_path);
    }
});

bottomMenu.refresh.addEventListener('click', () => {
    ipcRenderer.send('bottom-menu-refresh');
});

bottomMenu.settings.addEventListener('click', () => {
    ipcRenderer.send('bottom-menu-settings');
});

ipcRenderer.send('bottom-menu-refresh');