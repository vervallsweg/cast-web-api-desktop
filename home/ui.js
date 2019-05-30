function setLoading(isLoading, home) {
    (isLoading) ? home.loading.classList.value = 'ui active dimmer' : home.loading.classList.value = 'ui disabled dimmer';
}

function parseStatus(status, hero, controls) {
    if (!status) return;

    hero.status.innerHTML = status.status || '-';
    hero.address.innerHTML = status.address || '-';
    (status.logPath) ? controls.openLogs.classList.value = 'item fluid ui button' : controls.openLogs.classList.value = 'item fluid ui button disabled';
    setStatusImg(status.status, hero);
    setAddressPopup(status.address || '-', hero.addressPopup);
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

function setAddressPopup(address) {
    if (address === '-') {
        $('#address')
            .popup(
                'destroy'
            )
        ;
    } else {
        $('#address')
            .popup({
                inline: true,
                hoverable: true
            })
        ;
    }
}

function setAutoStart(autoStart, controls) {
    let buttonCss = 'ui fluid floating right labeled icon button';
    let iconCss = 'close icon';
    if (autoStart) {
        buttonCss = 'ui fluid floating right labeled icon green button';
        iconCss = 'check icon';
    }

    controls.autostart.classList.value = buttonCss;
    controls.autostart.getElementsByTagName('i')[0].classList.value = iconCss;
}

function getAutoStart(controls) {
    return (controls.autostart.classList.contains('green'));
}

module.exports = {setLoading, parseStatus, showPopup, setAutoStart, getAutoStart};