function id(str) {
    return document.getElementById(str);
}

let rmbMode = false;

function start() {
    const conn = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302",
            },
        ],
    });

    const sendChannel = conn.createDataChannel("input");

    conn.ontrack = event => {
        const el = document.createElement(event.track.kind);
        if (el.tagName === "VIDEO") {
            el.srcObject = event.streams[0];

            el.autoplay = true;
            el.controls = false;

            el.style.flex = "1";
            el.style.minWidth = '0';

            el.onclick = event => {
                el.requestPointerLock();
            };

            let currentTouchX = 0;
            let currentTouchY = 0;

            el.onmousemove = event => {
                const message = {
                    type: "mousemove",
                    x: event.movementX,
                    y: event.movementY,
                };

                sendChannel.send(JSON.stringify(message));
            };

            el.onmousedown = event => {
                let button = event.button;
                if (rmbMode) {
                    if (button === 0) button = 2;
                    else if (button === 2) button = 0;
                }

                const message = {
                    type: "mousedown",
                    button: button,
                };

                sendChannel.send(JSON.stringify(message));
            };

            el.onmouseup = event => {
                let button = event.button;
                if (rmbMode) {
                    if (button === 0) button = 2;
                    else if (button === 2) button = 0;
                }

                const message = {
                    type: "mouseup",
                    button: button,
                };

                sendChannel.send(JSON.stringify(message));
            };

            window.onwheel = event => {
                event.preventDefault();

                const message = {
                    type: "wheel",
                    x: event.deltaX,
                    y: event.deltaY,
                };

                sendChannel.send(JSON.stringify(message));
            };

            window.onkeydown = event => {
                event.preventDefault();

                const message = {
                    type: "keydown",
                    key: event.code,
                };

                sendChannel.send(JSON.stringify(message));
            };

            window.onkeyup = event => {
                event.preventDefault();

                const message = {
                    type: "keyup",
                    key: event.code,
                };

                sendChannel.send(JSON.stringify(message));
            };

            window.ontouchstart = event => {
                currentTouchX = event.touches[0].clientX;
                currentTouchY = event.touches[0].clientY;
            };

            // For unknown reasons, preventDefault does not work in window.ontouchmove
            document.addEventListener("touchmove", event => {
                event.preventDefault();

                let message;
                if (event.touches.length === 2) {
                    if (Math.abs(event.touches[0].clientX - currentTouchX) < 15 &&
                        Math.abs(event.touches[0].clientY - currentTouchY) < 15) {
                        return;
                    }
                    message = {
                        type: "wheel",
                        x: (event.touches[0].clientX - currentTouchX) * 8,
                        y: (event.touches[0].clientY - currentTouchY) * 8,
                    };
                } else {
                    message = {
                        type: "mousemove",
                        x: event.touches[0].clientX - currentTouchX,
                        y: event.touches[0].clientY - currentTouchY,
                    };
                }

                sendChannel.send(JSON.stringify(message));

                currentTouchX = event.touches[0].clientX;
                currentTouchY = event.touches[0].clientY;
            }, { passive: false });

            id("remote-videos").appendChild(el);
        }
    };

    conn.onicecandidate = async event => {    
        if (event.candidate === null) {
            const resp = await fetch(`http://${id("ip-address").value}/offer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: id("password").value,
                    offer: btoa(JSON.stringify(conn.localDescription)),
                }),
            }).catch(e => {
                alert(`Error: ${e}`);
            });

            if (resp.status == 200) {
                const answer = await resp.text();

                try {
                    conn.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(JSON.parse(answer).Offer))));
                    id("form").onsubmit = undefined;
                    id("form").innerHTML = `<button onclick="window.location.reload();">Reload</button><button id="toggle-rmb-mode" style="flex: 1;">Enable RMB Mode</button>`;
                    id("toggle-rmb-mode").onclick = event => {
                        event.preventDefault();

                        rmbMode = !rmbMode;
                        id("toggle-rmb-mode").innerText = rmbMode ? "Disable RMB Mode" : "Enable RMB Mode";
                    }
                    document.body.style.backgroundColor = "black";
                } catch (e) {
                    alert(`Error: ${e}`);
                }
            } else {
                alert(`Error: ${await resp.text()}`);
            }
        }
    };

    // Offer to receive 1 video track
    conn.addTransceiver("audio", { direction: "recvonly" });
    conn.addTransceiver("video", { direction: "recvonly" });
    conn.createOffer().then(offer => conn.setLocalDescription(offer));
}
