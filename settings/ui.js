function setLoading(isLoading, settings) {
    (isLoading) ? settings.loading.style.display = '' : settings.loading.style.display = 'none';
}

function parseConfig(settings, settingsForm) {
    if (!settings) return;

    console.log(settings);

    settingsForm.hostname.value = settings.hostname || "";
    settingsForm.port.value = settings.port || "3000";
    settingsForm.autoConnect.checked = settings.autoConnect || false;
    settingsForm.reconnectTimeout.value = settings.reconnectTimeout || "10000";
    settingsForm.debug.checked = settings.debug || false;
    settingsForm.info.checked = settings.logLevel.info || false;
    settingsForm.error.checked = settings.logLevel.error || false;
    settingsForm.server.checked = settings.logLevel.server || false;
}

function showPopup(message, modal) {
    console.log(modal);
    modal.content.innerHTML = message;
    $('.ui.basic.modal').modal('show');
}

function showModal(toastClass, message) {
    $('body')
        .toast({
            class: toastClass,
            message: message,
            position: 'bottom right',
            compact: false
        })
    ;
}

module.exports = {setLoading, parseConfig, showPopup, showModal};