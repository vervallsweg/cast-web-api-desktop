const { ipcRenderer } = require('electron');
const ui = require('./ui');

const settings = {
    loading: document.getElementById('loading'),
    content: document.getElementById('content')
};

const settingsForm = {
    all: document.getElementById('settings-form'),
    hostname: document.getElementById('hostname'),
    port: document.getElementById('port'),
    autoConnect: document.getElementById('autoConnect'),
    reconnectTimeout: document.getElementById('reconnectTimeout'),
    debug: document.getElementById('debug'),
    info: document.getElementById('info'),
    error: document.getElementById('error'),
    server: document.getElementById('server'),
    saveButton: document.getElementById('save-button'),
};

const modal = {
    content: document.getElementById('modal-content')
};

ipcRenderer.on('did-finish-load', () => {
    ui.setLoading(false, settings);
});

ipcRenderer.on('did-start-load', () => {
    ui.setLoading(true, settings);
});

ipcRenderer.on('config-received', (event, config) => {
    ui.parseConfig(config, settingsForm);
});

ipcRenderer.on('config-saved', (event) => {
    ui.showModal('success', 'Saved');
    console.log('config-saved');
});

ipcRenderer.on('error-received', (event, error) => {
    console.error(error);
    ui.showPopup(error, modal);
});

settingsForm.saveButton.addEventListener('click', () => {
    ipcRenderer.send('save-config', {
        hostname: settingsForm.hostname.value,
        port: settingsForm.port.value,
        autoConnect: settingsForm.autoConnect.checked,
        reconnectTimeout: settingsForm.reconnectTimeout.value,
        debug: settingsForm.debug.checked,
        logLevel: {
            info: settingsForm.info.checked,
            error: settingsForm.error.checked,
            server: settingsForm.server.checked,
        }
    });
});