window.onerror = (message, source, lineno, colno, error) => {
    alert(`An error occured at ${lineno}:${colno}: ${message}`);
    window.location.reload();
    return false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function positionInVideo(x, y, video) {
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    const windowAspectRatio = video.offsetWidth / video.offsetHeight;
    if (videoAspectRatio > windowAspectRatio) {
        return {
            x: Math.round(x / (video.offsetWidth / video.videoWidth)),
            y: Math.round((y - ((1. - windowAspectRatio / videoAspectRatio) * video.offsetHeight) / 2) / (video.offsetWidth / video.videoWidth)),
        };
    } else if (videoAspectRatio < windowAspectRatio) {
        return {
            x: Math.round((x - ((1. - videoAspectRatio / windowAspectRatio) * video.offsetWidth) / 2) / (video.offsetHeight / video.videoHeight)),
            y: Math.round(y / (video.offsetHeight / video.videoHeight)),
        };
    } else {
        return {
            x: Math.round(x / (video.offsetWidth / video.videoWidth)),
            y: Math.round(y / (video.offsetHeight / video.videoHeight)),
        };
    }
}

function touchListAsArray(touchList) {
    const ret = [];
    for (const touch of touchList) {
        ret.push(touch);
    }
    return ret;
}

function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function isTouchForceful(touch) {
    if (isSafari()) {
        return touch.force > 0;
    } else {
        return touch.force > 1;
    }
}

class Checkbox {
    constructor(label, checked = false) {
        this.inner = document.createElement("label");
        this.inner.style.marginBottom = "var(--pico-spacing)";

        this.checkbox = document.createElement("input");
        this.checkbox.type = "checkbox";
        this.checkbox.checked = checked;
        this.inner.appendChild(this.checkbox);

        this.label = document.createTextNode(label);
        this.inner.appendChild(this.label);
    }

    get checked() {
        return this.checkbox.checked;
    }
}

class SetupForm {
    constructor() {
        this.inner = document.createElement("form");

        this.titleHeading = document.createElement("h1");
        this.titleHeading.innerHTML = `<img src="icon.png" style="margin-right: 5px; display: inline-block; width: 60px; vertical-align: -15px;"> Lux Client`;
        this.inner.appendChild(this.titleHeading);

        this.addressInput = document.createElement("input");
        this.addressInput.type = "text";
        this.addressInput.placeholder = "IP Address";
        this.inner.appendChild(this.addressInput);

        this.passwordInput = document.createElement("input");
        this.passwordInput.type = "password";
        this.passwordInput.autocomplete = "current-password";
        this.passwordInput.placeholder = "Password";
        this.inner.appendChild(this.passwordInput);

        this.clientSideMouseCheckbox = new Checkbox("Client-side mouse");
        this.inner.appendChild(this.clientSideMouseCheckbox.inner);

        this.simulateTouchpadCheckbox = new Checkbox("Simulate touchpad");
        this.inner.appendChild(this.simulateTouchpadCheckbox.inner);

        this.naturalTouchScrollingCheckbox = new Checkbox("Natural touch scrolling");
        this.inner.appendChild(this.naturalTouchScrollingCheckbox.inner);

        this.submitButton = document.createElement("button");
        this.submitButton.type = "submit";
        this.submitButton.innerText = "Login";
        this.inner.appendChild(this.submitButton);

        this.inner.addEventListener("submit", this.handleSubmit.bind(this), {
            passive: false,
        });

        this.inner.style.boxSizing = "border-box";
        this.inner.style.width = "100%";
        this.inner.style.height = "100%";

        this.inner.style.paddingLeft = "15%";
        this.inner.style.paddingRight = "15%";

        this.inner.style.display = "flex";
        this.inner.style.flexDirection = "column";
        this.inner.style.justifyContent = "center";

        // Load credentials
        this.addressInput.value = localStorage.getItem("address");
        this.passwordInput.value = localStorage.getItem("password");
    }

    handleSubmit(event) {
        event.preventDefault();

        // Save credentials
        localStorage.setItem("address", this.addressInput.value);
        localStorage.setItem("password", this.passwordInput.value);

        const streamingWindow = new StreamingWindow(
            this.clientSideMouseCheckbox.checked,
            this.simulateTouchpadCheckbox.checked,
            this.naturalTouchScrollingCheckbox.checked,
        );
        streamingWindow.startStreaming(
            this.addressInput.value,
            this.passwordInput.value,
        );
        this.inner.replaceWith(streamingWindow.inner);
    }
}

class StreamingWindow {
    constructor(clientSideMouse = false, simulateTouchpad = false, naturalTouchScrolling = false) {
        this.inner = document.createElement("div");

        this.clientSideMouse = clientSideMouse;
        this.simulateTouchpad = simulateTouchpad;
        this.naturalTouchScrolling = naturalTouchScrolling;

        this.wheelX = 0;
        this.wheelY = 0;

        this.touches = [];
        this.lastRightClickTime = 0;

        this.inner.style.display = "flex";
        this.inner.style.boxSizing = "border-box";
        this.inner.style.width = "100%";
        this.inner.style.height = "100%";
        this.inner.style.justifyContent = "center";
        this.inner.style.alignItems = "center";
    }

    async startStreaming(address, password) {
        this.inner.ariaBusy = true;
        this.inner.innerText = "Connecting...";
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: true,
            });
            stream.getTracks().forEach(track => track.stop());
        } catch (e) {
            this.inner.innerText += " (without TCP support, due to insufficient permissions)";
        }

        this.conn = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });

        this.conn.oniceconnectionstatechange = event => {
            if (this.conn.iceConnectionState === "failed" || this.conn.iceConnectionState === "disconnected") {
                alert(`The ICE connection state has changed to ${this.conn.iceConnectionState}.`);
                window.location.reload();
            }
        };

        this.orderedChannel = this.conn.createDataChannel("ordered-input", {
            ordered: true,
        });
        this.unorderedChannel = this.conn.createDataChannel("unordered-input", {
            ordered: false,
        });
        this.orderedChannel.onclose = this.unorderedChannel.onclose = () => {
            alert("An input data channel has closed.");
            window.location.reload();
        };

        this.conn.ontrack = event => {
            const media = document.createElement(event.track.kind);
            media.setAttribute("webkit-playsinline", "");
            media.setAttribute("playsinline", "");
            if (media.tagName === "VIDEO") { // Ignore audio tracks, for now
                this.video = media;
                this.video.srcObject = event.streams[0];

                this.video.autoplay = true;
                this.video.controls = false;

                this.video.style.flex = "1";
                this.video.style.minWidth = "0";

                if (!this.clientSideMouse) {
                    this.video.onclick = event => {
                        if (this.video.requestPointerLock) {
                            this.video.requestPointerLock({
                                unadjustedMovement: true,
                            }).catch(() => {
                                this.video.requestPointerLock();
                            });
                        }
                    };
                } else {
                    document.addEventListener("contextmenu", event => event.preventDefault());
                }
                this.video.addEventListener("mousemove", this.handleMouseMove.bind(this));
                this.video.addEventListener("mousedown", this.handleMouseDown.bind(this));
                this.video.addEventListener("mouseup", this.handleMouseUp.bind(this));
                document.addEventListener("wheel", this.handleWheel.bind(this), {
                    passive: false,
                });
                document.addEventListener("keydown", this.handleKeyDown.bind(this), {
                    passive: false,
                });
                document.addEventListener("keyup", this.handleKeyUp.bind(this), {
                    passive: false,
                });
                this.video.addEventListener("touchstart", this.handleTouchStart.bind(this), {
                    passive: false,
                });
                this.video.addEventListener("touchend", this.handleTouchEnd.bind(this), { 
                    passive: false,
                });
                this.video.addEventListener("touchcancel", this.handleTouchEnd.bind(this), { 
                    passive: false,
                });
                this.video.addEventListener("touchmove", this.handleTouchMove.bind(this), {
                    passive: false,
                });

                this.inner.innerText = "";
                this.inner.ariaBusy = false;
                this.inner.style.removeProperty("justify-content");
                this.inner.style.removeProperty("align-items");
                this.inner.style.flex = "1";
                this.inner.style.minHeight = "0";
                this.inner.appendChild(this.video);
            }
        };

        this.conn.onicecandidate = async event => {
            if (!event.candidate) {
                const resp = await fetch(`https://${address}/offer`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        password,
                        show_mouse: !this.clientSideMouse,
                        offer: btoa(JSON.stringify(this.conn.localDescription)),
                    }),
                }).catch(e => {
                    alert(`Error: ${e}`);
                    window.location.reload();
                });

                if (resp.status === 200) {
                    const answer = await resp.text();
                    try {
                        this.conn.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(JSON.parse(answer).Offer))));
                    } catch (e) {
                        alert(`Error: ${e}`);
                        window.location.reload();
                    }
                } else {
                    alert(`Error: ${(await resp.json()).Error}`);
                    window.location.reload();
                }
            }
        };

        // Offer to receive 1 video track
        this.conn.addTransceiver("video", { direction: "recvonly" });
        this.conn.createOffer().then(offer => {
            this.conn.setLocalDescription(offer);
        });
    }

    channelsOpen() {
        return this.orderedChannel.readyState === "open" && this.unorderedChannel.readyState === "open";
    }

    pushTouch(touch) {
        this.touches.push({
            identifier: touch.identifier,
            clientX: touch.clientX,
            clientY: touch.clientY,
            initialClientX: touch.clientX,
            initialClientY: touch.clientY,
            force: touch.force,
            startTime: Date.now(),
        });
    }

    handleMouseMove(event) {
        if (this.clientSideMouse) {
            const message = {
                type: "mousemoveabs",
                ...positionInVideo(event.clientX, event.clientY, this.video),
            };
            if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
        } else {
            const message = {
                type: "mousemove",
                x: Math.round(event.movementX),
                y: Math.round(event.movementY),
            };
            if (this.channelsOpen()) this.unorderedChannel.send(JSON.stringify(message));
        }
    }

    handleMouseDown(event) {
        const message = {
            type: "mousedown",
            button: event.button,
        };
        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
    }

    handleMouseUp(event) {
        const message = {
            type: "mouseup",
            button: event.button,
        };
        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
    }

    handleWheel(event) {
        event.preventDefault();

        this.wheelX += event.deltaX;
        this.wheelY += event.deltaY;

        if (isSafari()) {
            if (Math.abs(this.wheelX) >= 120 / 3 || Math.abs(this.wheelY) >= 120 / 3) {
                const message = {
                    type: "wheel",
                    x: Math.round(this.wheelX * 3),
                    y: Math.round(this.wheelY * 3),
                };
                if (this.channelsOpen()) this.unorderedChannel.send(JSON.stringify(message));

                this.wheelX = 0;
                this.wheelY = 0;
            }
        } else {
            if (Math.abs(this.wheelX) >= 120 || Math.abs(this.wheelY) >= 120) {
                const message = {
                    type: "wheel",
                    x: Math.round(this.wheelX),
                    y: Math.round(this.wheelY),
                };
                if (this.channelsOpen()) this.unorderedChannel.send(JSON.stringify(message));

                this.wheelX = 0;
                this.wheelY = 0;
            }
        }
    }

    handleKeyDown(event) {
        event.preventDefault();

        const message = {
            type: "keydown",
            key: event.code,
        };
        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
    }

    handleKeyUp(event) {
        event.preventDefault();

        const message = {
            type: "keyup",
            key: event.code,
        };
        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
    }

    handleTouchStart(event) {
        event.preventDefault();
        const newTouches = touchListAsArray(event.changedTouches);

        if (this.simulateTouchpad) {
            switch (this.touches.length) {
                case 0: {
                    let penTouch;
                    if ((penTouch = newTouches.findIndex(touch => isTouchForceful(touch))) !== -1) {
                        this.touches = [];
                        this.pushTouch(newTouches[penTouch]);

                        // Start drag
                        let message = {
                            type: "mousemoveabs",
                            ...positionInVideo(
                                this.touches[0].clientX,
                                this.touches[0].clientY,
                                this.video,
                            ),
                        };
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                        message = {
                            type: "mousedown",
                            button: 0,
                        };
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));

                        return;
                    }
                    break;
                }

                default: {
                    let penTouch;
                    if ((penTouch = newTouches.findIndex(touch => isTouchForceful(touch))) !== -1) {
                        if (this.touches.some(touch => isTouchForceful(touch))) {
                            break;
                        }

                        // Clear existing touches
                        let message = {
                            type: "mouseup",
                        };
                        message.button = 0;
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                        message.button = 2;
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));

                        this.touches = [];
                        this.pushTouch(newTouches[penTouch]);

                        // Start drag
                        message = {
                            type: "mousemoveabs",
                            ...positionInVideo(
                                this.touches[0].clientX,
                                this.touches[0].clientY,
                                this.video,
                            ),
                        };
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                        message = {
                            type: "mousedown",
                            button: 0,
                        };
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));

                        return;
                    }
                    break;
                }
            }

            for (const touch of newTouches) {
                if (touch.radiusX <= 75 && touch.radiusY <= 75) {
                    this.pushTouch(touch);
                }
            }

            switch (this.touches.length) {
                case 3: {
                    // Start drag
                    const message = {
                        type: "mousedown",
                        button: 0,
                    };
                    if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                    break;
                }
            }
        } else {
            let penTouch;
            if ((penTouch = newTouches.findIndex(touch => isTouchForceful(touch))) !== -1) {
                // Clear existing touches
                for (const touch of this.touches) {
                    const message = {
                        type: "touchend",
                        id: Math.abs(touch.identifier) % 10,
                    };
                    if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                }
                this.touches = [];
                this.pushTouch(newTouches[penTouch]);

                // Start drag
                let message = {
                    type: "mousemoveabs",
                    ...positionInVideo(
                        this.touches[0].clientX,
                        this.touches[0].clientY,
                        this.video,
                    ),
                };
                if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                message = {
                    type: "mousedown",
                    button: 0,
                };
                if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
            } else {
                for (const touch of newTouches) {
                    if (touch.radiusX <= 75 && touch.radiusY <= 75) {
                        const message = {
                            type: "touchstart",
                            id: Math.abs(touch.identifier) % 10,
                            ...positionInVideo(touch.clientX, touch.clientY, this.video),
                        };
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                        this.pushTouch(touch);
                    }
                }
            }
        }
    }

    async handleTouchEnd(event) {
        event.preventDefault();
        const deletedTouches = touchListAsArray(event.changedTouches);

        if (this.simulateTouchpad) {
            switch (this.touches.length) {
                case 1: {
                    if (isTouchForceful(this.touches[0])) {
                        // End drag
                        const message = {
                            type: "mouseup",
                            button: 0,
                        };
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                    } else if (Date.now() - this.lastRightClickTime > 125 &&
                        Date.now() - this.touches[0].startTime <= 125) {
                        const message = {
                            button: 0,
                        };
                        message.type = "mousedown";
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                        message.type = "mouseup";
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));

                        // Make lone touches linger to improve two-finger tap detection
                        await sleep(125);
                    }
                    break;
                }

                case 2: {
                    if (this.touches.every(touch => Date.now() - touch.startTime <= 250) &&
                        this.touches.every(
                            touch => distance(
                                touch.clientX,
                                touch.clientY,
                                touch.initialClientX,
                                touch.initialClientY,
                            ) <= 25
                        ) &&
                        distance(
                            this.touches[0].clientX,
                            this.touches[0].clientY,
                            this.touches[1].clientX,
                            this.touches[1].clientY,
                        ) >= 20) {
                        const message = {
                            button: 2,
                        };
                        message.type = "mousedown";
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                        message.type = "mouseup";
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));

                        this.lastRightClickTime = Date.now();
                    }
                    break;
                }

                case 3: {
                    // End drag
                    const message = {
                        type: "mouseup",
                        button: 0,
                    };
                    if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                    break;
                }
            }
        } else {
            for (const deletedTouch of deletedTouches) {
                let touch;
                if (touch = this.touches.find(touch => touch.identifier === deletedTouch.identifier)) {
                    if (isTouchForceful(touch)) {
                        // End drag
                        const message = {
                            type: "mouseup",
                            button: 0,
                        };
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                    } else {
                        const message = {
                            type: "touchend",
                            id: Math.abs(touch.identifier) % 10,
                        };
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                    }
                }
            }
        }

        this.touches = this.touches.filter(touch => {
            for (const deletedTouch of deletedTouches) {
                if (touch.identifier === deletedTouch.identifier) {
                    return false;
                }
            }
            return true;
        });
    }

    handleTouchMove(event) {
        event.preventDefault();
        const movedTouches = touchListAsArray(event.changedTouches);

        if (this.simulateTouchpad) {
            const updatedTouches = touchListAsArray(event.touches);

            switch (this.touches.length) {
                case 1: {
                    if (isTouchForceful(this.touches[0])) {
                        const message = {
                            type: "mousemoveabs",
                            ...positionInVideo(
                                updatedTouches[0].clientX,
                                updatedTouches[0].clientY,
                                this.video,
                            ),
                        };
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                    } else {
                        const message = {
                            type: "mousemove",
                            x: Math.round((updatedTouches[0].clientX - this.touches[0].clientX) * 1.5),
                            y: Math.round((updatedTouches[0].clientY - this.touches[0].clientY) * 1.5),
                        };
                        if (this.channelsOpen()) this.unorderedChannel.send(JSON.stringify(message));
                    }
                    break;
                }

                case 2: {
                    if (this.touches.every(touch => Date.now() - touch.startTime >= 25)) {
                        if (Math.abs(updatedTouches[0].clientX - this.touches[0].clientX) < 15 &&
                            Math.abs(updatedTouches[0].clientY - this.touches[0].clientY) < 15) {
                            return;
                        }

                        const message = {
                            type: "wheel",
                            x: Math.round((updatedTouches[0].clientX - this.touches[0].clientX) * (this.naturalTouchScrolling ? -1 : 1) * 8),
                            y: Math.round((updatedTouches[0].clientY - this.touches[0].clientY) * (this.naturalTouchScrolling ? -1 : 1) * 8),
                        };
                        if (this.channelsOpen()) this.unorderedChannel.send(JSON.stringify(message));
                    }
                    break;
                }

                case 3: {
                    const message = {
                        type: "mousemove",
                        x: Math.round((updatedTouches[0].clientX - this.touches[0].clientX) * 1.5),
                        y: Math.round((updatedTouches[0].clientY - this.touches[0].clientY) * 1.5),
                    };
                    if (this.channelsOpen()) this.unorderedChannel.send(JSON.stringify(message));
                    break;
                }
            }
        } else {
            for (const movedTouch of movedTouches) {
                let touch;
                if (touch = this.touches.find(touch => touch.identifier === movedTouch.identifier)) {
                    if (isTouchForceful(touch)) {
                        const message = {
                            type: "mousemoveabs",
                            ...positionInVideo(touch.clientX, touch.clientY, this.video),
                        };
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                    } else {
                        const message = {
                            type: "touchmove",
                            id: Math.abs(touch.identifier) % 10,
                            ...positionInVideo(touch.clientX, touch.clientY, this.video),
                        };
                        if (this.channelsOpen()) this.orderedChannel.send(JSON.stringify(message));
                    }
                }
            }
        }

        for (const touch of this.touches) {
            for (const movedTouch of movedTouches) {
                if (touch.identifier === movedTouch.identifier) {
                    touch.clientX = movedTouch.clientX;
                    touch.clientY = movedTouch.clientY;
                }
            }
        }
    }
}

const setupForm = new SetupForm();
document.body.appendChild(setupForm.inner);
