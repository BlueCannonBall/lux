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
            x: x / (video.offsetWidth / video.videoWidth),
            y: (y - ((1.0 - windowAspectRatio / videoAspectRatio) * video.offsetHeight / 2)) / (video.offsetWidth / video.videoWidth),
        };
    } else if (videoAspectRatio < windowAspectRatio) {
        return {
            x: (x - ((1.0 - videoAspectRatio / windowAspectRatio) * video.offsetWidth / 2)) / (video.offsetHeight / video.videoHeight),
            y: y / (video.offsetHeight / video.videoHeight),
        };
    } else {
        return {
            x: x / (video.offsetWidth / video.videoWidth),
            y: y / (video.offsetHeight / video.videoHeight),
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

class SetupForm {
    constructor() {
        this.inner = document.createElement("form");

        this.titleHeading = document.createElement("h1");
        this.titleHeading.innerHTML = `<img src="icon.png" style="margin-right: 5px; display: inline-block; width: 60px; vertical-align: -15px;"> Lux Client`;
        this.inner.appendChild(this.titleHeading);

        this.ipAddressInput = document.createElement("input");
        this.ipAddressInput.type = "text";
        this.ipAddressInput.placeholder = "IP Address";
        this.inner.appendChild(this.ipAddressInput);

        this.passwordInput = document.createElement("input");
        this.passwordInput.type = "password";
        this.passwordInput.autocomplete = "current-password";
        this.passwordInput.placeholder = "Password";
        this.inner.appendChild(this.passwordInput);

        this.clientSideMouseCheckboxLabel = document.createElement("label");
        this.clientSideMouseCheckboxLabel.style.marginBottom = "var(--pico-spacing)";
        this.inner.appendChild(this.clientSideMouseCheckboxLabel);

        this.clientSideMouseCheckbox = document.createElement("input");
        this.clientSideMouseCheckbox.type = "checkbox";
        this.clientSideMouseCheckboxLabel.appendChild(this.clientSideMouseCheckbox);

        this.clientSideMouseCheckboxLabelText = document.createTextNode("Client-side mouse");
        this.clientSideMouseCheckboxLabel.appendChild(this.clientSideMouseCheckboxLabelText);

        this.naturalTouchScrollingCheckboxLabel = document.createElement("label");
        this.naturalTouchScrollingCheckboxLabel.style.marginBottom = "var(--pico-spacing)";
        this.inner.appendChild(this.naturalTouchScrollingCheckboxLabel);

        this.naturalTouchScrollingCheckbox = document.createElement("input");
        this.naturalTouchScrollingCheckbox.type = "checkbox";
        this.naturalTouchScrollingCheckboxLabel.appendChild(this.naturalTouchScrollingCheckbox);

        this.naturalTouchScrollingCheckboxLabelText = document.createTextNode("Natural touch scrolling");
        this.naturalTouchScrollingCheckboxLabel.appendChild(this.naturalTouchScrollingCheckboxLabelText);

        this.submitButton = document.createElement("button");
        this.submitButton.type = "submit";
        this.submitButton.innerText = "Login";
        this.inner.appendChild(this.submitButton);

        this.inner.addEventListener("submit", this.handleSubmit.bind(this), { passive: false });

        this.inner.style.boxSizing = "border-box";
        this.inner.style.width = "100%";
        this.inner.style.height = "100%";

        this.inner.style.paddingLeft = "15%";
        this.inner.style.paddingRight = "15%";
        
        this.inner.style.display = "flex";
        this.inner.style.flexDirection = "column";
        this.inner.style.justifyContent = "center";
    }

    handleSubmit(event) {
        event.preventDefault();

        const streamingWindow = new StreamingWindow(this.clientSideMouseCheckbox.checked, this.naturalTouchScrollingCheckbox.checked);
        streamingWindow.startStreaming(this.ipAddressInput.value, this.passwordInput.value);
        this.inner.replaceWith(streamingWindow.inner);
    }
}

class StreamingWindow {
    constructor(clientSideMouse = false, naturalTouchScrolling = false) {
        this.inner = document.createElement("div");

        this.clientSideMouse = clientSideMouse;
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

    startStreaming(ipAddress, password) {
        this.inner.ariaBusy = true;
        this.inner.innerText = "Connecting...";

        this.conn = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });

        // Ensure 0 latency!
        setInterval(() => {
            const receivers = this.conn.getReceivers();
            for (const receiver of receivers) {
                receiver.jitterBufferTarget = receiver.jitterBufferDelayHint = receiver.playoutDelayHint = 0.;
            }
        });

        this.orderedChannel = this.conn.createDataChannel("ordered-input", { ordered: true });
        this.unorderedChannel = this.conn.createDataChannel("unordered-input", { ordered: false });
        this.orderedChannel.onclose = this.unorderedChannel.onclose = () => {
            alert("An input data channel has closed.");
            window.location.reload();
        };

        this.conn.ontrack = event => {
            event.transceiver.receiver.jitterBufferTarget = event.transceiver.receiver.jitterBufferDelayHint = event.transceiver.receiver.playoutDelayHint = 0.;
            
            const media = document.createElement(event.track.kind);
            if (media.tagName === "VIDEO") { // Ignore audio tracks, for now
                this.video = media;
                this.video.srcObject = event.streams[0];

                this.video.autoplay = true;
                this.video.controls = false;

                this.video.style.flex = "1";
                this.video.style.minWidth = "0";

                if (!this.clientSideMouse) {
                    this.video.onclick = event => {
                        this.video.requestPointerLock();
                    };
                } else {
                    document.addEventListener("contextmenu", event => event.preventDefault());
                }
                this.video.addEventListener("mousemove", this.handleMouseMove.bind(this));
                this.video.addEventListener("mousedown", this.handleMouseDown.bind(this));
                this.video.addEventListener("mouseup", this.handleMouseUp.bind(this));
                document.addEventListener("wheel", this.handleWheel.bind(this), { passive: false });
                document.addEventListener("keydown", this.handleKeyDown.bind(this), { passive: false });
                document.addEventListener("keyup", this.handleKeyUp.bind(this), { passive: false });
                this.video.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: false });
                this.video.addEventListener("touchend", this.handleTouchEnd.bind(this), { passive: false });
                this.video.addEventListener("touchcancel", this.handleTouchEnd.bind(this), { passive: false });
                this.video.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false });

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
            if (event.candidate === null) {
                const resp = await fetch(`http://${ipAddress}/offer`, {
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
                    alert(`Error: ${await resp.text()}`);
                    window.location.reload();
                }
            }
        };

        // Offer to receive 1 video track
        this.conn.addTransceiver("video", { direction: "recvonly" });
        this.conn.createOffer().then(offer => this.conn.setLocalDescription(offer));
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
            this.orderedChannel.send(JSON.stringify(message));
        } else {
            const message = {
                type: "mousemove",
                x: event.movementX,
                y: event.movementY,
            };
            this.unorderedChannel.send(JSON.stringify(message));
        }
    }

    handleMouseDown(event) {
        const message = {
            type: "mousedown",
            button: event.button,
        };
        this.orderedChannel.send(JSON.stringify(message));
    }

    handleMouseUp(event) {
        const message = {
            type: "mouseup",
            button: event.button,
        };
        this.orderedChannel.send(JSON.stringify(message));
    }

    handleWheel(event) {
        event.preventDefault();

        this.wheelX += event.deltaX;
        this.wheelY += event.deltaY;

        if (Math.abs(this.wheelX) >= 120 || Math.abs(this.wheelY) >= 120) {
            const message = {
                type: "wheel",
                x: this.wheelX,
                y: this.wheelY,
            };
            this.unorderedChannel.send(JSON.stringify(message));

            this.wheelX = 0;
            this.wheelY = 0;
        }
    }

    handleKeyDown(event) {
        event.preventDefault();

        const message = {
            type: "keydown",
            key: event.code,
        };
        this.orderedChannel.send(JSON.stringify(message));
    }

    handleKeyUp(event) {
        event.preventDefault();

        const message = {
            type: "keyup",
            key: event.code,
        };
        this.orderedChannel.send(JSON.stringify(message));
    }

    handleTouchStart(event) {
        event.preventDefault();
        const newTouches = touchListAsArray(event.changedTouches);

        switch (this.touches.length) {
            case 0: {
                let penTouch;
                if ((penTouch = newTouches.findIndex(touch => touch.force)) !== -1) {
                    this.touches = [];
                    this.pushTouch(newTouches[penTouch]);

                    // Start drag
                    let message = {
                        type: "mousemoveabs",
                        ...positionInVideo(this.touches[0].clientX, this.touches[0].clientY, this.video),
                    };
                    this.orderedChannel.send(JSON.stringify(message));
                    message = {
                        type: "mousedown",
                        button: 0,
                    };
                    this.orderedChannel.send(JSON.stringify(message));

                    return;
                }
                break;
            }

            default: {
                let penTouch;
                if ((penTouch = newTouches.findIndex(touch => touch.force)) !== -1) {
                    if (this.touches.some(touch => touch.force)) {
                        break;
                    }

                    // Clear existing touches
                    let message = {
                        type: "mouseup",
                    };
                    message.button = 0;
                    this.orderedChannel.send(JSON.stringify(message));
                    message.button = 2;
                    this.orderedChannel.send(JSON.stringify(message));
                    
                    this.touches = [];
                    this.pushTouch(newTouches[penTouch]);

                    // Start drag
                    message = {
                        type: "mousemoveabs",
                        ...positionInVideo(this.touches[0].clientX, this.touches[0].clientY, this.video),
                    };
                    this.orderedChannel.send(JSON.stringify(message));
                    message = {
                        type: "mousedown",
                        button: 0,
                    };
                    this.orderedChannel.send(JSON.stringify(message));

                    return;
                }
                break;
            }
        }

        for (const newTouch of newTouches) {
            if (newTouch.radiusX <= 75 && newTouch.radiusY <= 75) {
                this.pushTouch(newTouch);
            }
        }

        switch (this.touches.length) {
            case 3: {
                // Start drag
                const message = {
                    type: "mousedown",
                    button: 0,
                };
                this.orderedChannel.send(JSON.stringify(message));
                break;
            }
        }
    }

    async handleTouchEnd(event) {
        event.preventDefault();
        const deletedTouches = touchListAsArray(event.changedTouches);

        switch (this.touches.length) {
            case 1: {
                if (this.touches[0].force) {
                    // End drag
                    const message = {
                        type: "mouseup",
                        button: 0,
                    };
                    this.orderedChannel.send(JSON.stringify(message));
                } else if (Date.now() - this.lastRightClickTime > 125 &&
                    Date.now() - this.touches[0].startTime <= 125) {
                    const message = {
                        button: 0,
                    };
                    message.type = "mousedown";
                    this.orderedChannel.send(JSON.stringify(message));
                    message.type = "mouseup";
                    this.orderedChannel.send(JSON.stringify(message));

                    // Make lone touches linger to improve two-finger tap detection
                    await sleep(125);
                }
                break;
            }

            case 2: {
                if (this.touches.every(touch => Date.now() - touch.startTime <= 250) &&
                    this.touches.every(touch => distance(touch.clientX, touch.clientY, touch.initialClientX, touch.initialClientY) <= 25) &&
                    distance(this.touches[0].clientX, this.touches[0].clientY, this.touches[1].clientX, this.touches[1].clientY) >= 15) {
                    const message = {
                        button: 2,
                    };
                    message.type = "mousedown";
                    this.orderedChannel.send(JSON.stringify(message));
                    message.type = "mouseup";
                    this.orderedChannel.send(JSON.stringify(message));

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
                this.orderedChannel.send(JSON.stringify(message));
                break;
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
        const updatedTouches = touchListAsArray(event.touches);
        const movedTouches = touchListAsArray(event.changedTouches);

        switch (this.touches.length) {
            case 1: {
                if (this.touches[0].force) {
                    const message = {
                        type: "mousemoveabs",
                        ...positionInVideo(updatedTouches[0].clientX, updatedTouches[0].clientY, this.video),
                    };
                    this.orderedChannel.send(JSON.stringify(message));
                } else {
                    const message = {
                        type: "mousemove",
                        x: (updatedTouches[0].clientX - this.touches[0].clientX) * 1.5,
                        y: (updatedTouches[0].clientY - this.touches[0].clientY) * 1.5,
                    };
                    this.unorderedChannel.send(JSON.stringify(message));
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
                        x: (updatedTouches[0].clientX - this.touches[0].clientX) * (this.naturalTouchScrolling ? -1 : 1) * 8,
                        y: (updatedTouches[0].clientY - this.touches[0].clientY) * (this.naturalTouchScrolling ? -1 : 1) * 8,
                    };
                    this.unorderedChannel.send(JSON.stringify(message));
                }
                break;
            }

            case 3: {
                const message = {
                    type: "mousemove",
                    x: (updatedTouches[0].clientX - this.touches[0].clientX) * 1.5,
                    y: (updatedTouches[0].clientY - this.touches[0].clientY) * 1.5,
                };
                this.unorderedChannel.send(JSON.stringify(message));
                break;
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
