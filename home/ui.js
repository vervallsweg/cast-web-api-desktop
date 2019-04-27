function setLoading(isLoading, home) {
    (isLoading) ? home.loading.classList.value = 'ui active dimmer' : home.loading.classList.value = 'ui disabled dimmer';
}

function parseStatus(status, hero, controls) {
    if (!status) return;

    hero.status.innerHTML = status.status || '-';
    hero.address.innerHTML = status.address || '-';
    (status.logPath) ? controls.openLogs.classList.value = 'item fluid ui button' : controls.openLogs.classList.value = 'item fluid ui button disabled';
    setStatusImg(status.status, hero);
}

function showPopup(message, modal) {
    console.log(modal);
    modal.content.innerHTML = message;
    $('.ui.basic.modal').modal('show');
}

function setStatusImg(status, hero) {
    let css = 'status offline';
    if (status === 'online') css = 'status online';
    hero.statusImg.classList.value = css;
}

module.exports = {setLoading, parseStatus, showPopup};