const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { Console } = require('console');

let api;
let logger;

console.log('let-api');

window.onerror = (error, url, line) => {
    console.error(error);
    setTimeout(()=>{ipcRenderer.send('api-error', error)}, 1000)
};

// window. TODO: investigate window api, maybe to reroute stdout/err more reliably

ipcRenderer.on('did-finish-load', (event, init) => {
    hookConsole(init.logsDir);
    try {
        api = require('cast-web-api/api');

        ipcRenderer.send('api-logPath', {
            logPath: logger.logPath
        });
    } catch (e) {
        ipcRenderer.send('api-error', e);
    }
});

function hookConsole(logsDir) {
    let logPath = path.join(logsDir, Date.now()+".log" ).normalize();
    let logStream = fs.createWriteStream(logPath);
    let readStream = fs.createReadStream(logPath);

    logger = new Console(logStream, logStream);
    logger.readStream = readStream;
    logger.logPath = logPath;

    console.log = logger.log;
    console.error = logger.error;

    logger.readStream.on('data', checkForAddress);

    module.exports = {console};
}

function checkForAddress(data) {
    if (data.includes('running at http://')) {
        let address = 'http://'+(data.toString().split('http://'))[1].trim();
        console.info('address: ' + address);
        ipcRenderer.send('api-address', {
            address: address,
            logPath: logger.logPath
        });
        logger.readStream.removeListener('data', checkForAddress);
        logger.readStream.destroy();
        delete logger.readStream;
    }
}