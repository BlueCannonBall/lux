function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
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

        this.viewOnlyCheckboxLabel = document.createElement("label");
        this.viewOnlyCheckboxLabel.style.marginBottom = "var(--pico-spacing)";
        this.inner.appendChild(this.viewOnlyCheckboxLabel);

        this.viewOnlyCheckbox = document.createElement("input");
        this.viewOnlyCheckbox.type = "checkbox";
        this.viewOnlyCheckboxLabel.appendChild(this.viewOnlyCheckbox);

        this.viewOnlyCheckboxLabelText = document.createTextNode("View only");
        this.viewOnlyCheckboxLabel.appendChild(this.viewOnlyCheckboxLabelText);

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

        const streamingWindow = new StreamingWindow();
        streamingWindow.startStreaming(this.ipAddressInput.value, this.passwordInput.value, this.viewOnlyCheckbox.checked);
        this.inner.replaceWith(streamingWindow.inner);
    }
}

class StreamingWindow {
    constructor() {
        this.inner = document.createElement("div");

        this.touches = [];
        this.lastRightClickTime = 0;

        this.inner.style.boxSizing = "border-box";
        this.inner.style.width = "100%";
        this.inner.style.height = "100%";

        this.inner.style.display = "flex";
        this.inner.style.flex = "1";
        this.inner.style.minHeight = "0";
    }

    startStreaming(ipAddress, password, viewOnly = false) {
        this.conn = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });

        if (!viewOnly) {
            this.sendChannel = this.conn.createDataChannel("input");
            this.sendChannel.onclose = () => {
                alert("Input data channel closed.");
                window.location.reload();
            };
        }

        this.conn.ontrack = event => {
            const mediaWindow = document.createElement(event.track.kind);
            if (mediaWindow.tagName === "VIDEO") { // Ignore audio tracks, for now
                mediaWindow.srcObject = event.streams[0];

                mediaWindow.autoplay = true;
                mediaWindow.controls = false;

                mediaWindow.style.flex = "1";
                mediaWindow.style.minWidth = "0";

                if (!viewOnly) {
                    mediaWindow.onclick = event => {
                        mediaWindow.requestPointerLock();
                    };

                    mediaWindow.addEventListener("mousemove", this.handleMouseMove.bind(this));
                    mediaWindow.addEventListener("mousedown", this.handleMouseDown.bind(this));
                    mediaWindow.addEventListener("mouseup", this.handleMouseUp.bind(this));
                    document.addEventListener("wheel", this.handleWheel.bind(this), { passive: false });
                    document.addEventListener("keydown", this.handleKeyDown.bind(this), { passive: false });
                    document.addEventListener("keyup", this.handleKeyUp.bind(this), { passive: false });
                    mediaWindow.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: false });
                    mediaWindow.addEventListener("touchend", this.handleTouchEnd.bind(this), { passive: false });
                    mediaWindow.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false });
                }

                this.inner.appendChild(mediaWindow);
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

        // Offer to receive 1 video track and 1 audio track
        this.conn.addTransceiver("audio", { direction: "recvonly" });
        this.conn.addTransceiver("video", { direction: "recvonly" });
        this.conn.createOffer().then(offer => this.conn.setLocalDescription(offer));
    }

    handleMouseMove(event) {
        const message = {
            type: "mousemove",
            x: event.movementX,
            y: event.movementY,
        };

        this.sendChannel.send(JSON.stringify(message));
    }

    handleMouseDown(event) {
        const message = {
            type: "mousedown",
            button: event.button,
        };

        this.sendChannel.send(JSON.stringify(message));
    }

    handleMouseUp(event) {
        const message = {
            type: "mouseup",
            button: event.button,
        };

        this.sendChannel.send(JSON.stringify(message));
    }

    handleWheel(event) {
        event.preventDefault();

        const message = {
            type: "wheel",
            x: event.deltaX,
            y: event.deltaY,
        };

        this.sendChannel.send(JSON.stringify(message));
    }

    handleKeyDown(event) {
        event.preventDefault();

        const message = {
            type: "keydown",
            key: event.code,
        };

        this.sendChannel.send(JSON.stringify(message));
    }

    handleKeyUp(event) {
        event.preventDefault();

        const message = {
            type: "keyup",
            key: event.code,
        };

        this.sendChannel.send(JSON.stringify(message));
    }

    handleTouchStart(event) {
        event.preventDefault();

        for (const newTouch of event.changedTouches) {
            this.touches.push({
                identifier: newTouch.identifier,
                clientX: newTouch.clientX,
                clientY: newTouch.clientY,
                initialClientX: newTouch.clientX,
                initialClientY: newTouch.clientY,
                startTime: Date.now(),
            });
        }

        // Start drag
        if (this.touches.length === 3) {
            const message = {
                type: "mousedown",
                button: 0,
            };

            this.sendChannel.send(JSON.stringify(message));
        }
    }

    async handleTouchEnd(event) {
        event.preventDefault();

        // Handle normal click
        if (Date.now() - this.lastRightClickTime > 125 &&
            this.touches.length === 1 &&
            Date.now() - this.touches[0].startTime < 125) {
            const message = {
                button: 0,
            };

            message.type = "mousedown";
            this.sendChannel.send(JSON.stringify(message));
            message.type = "mouseup";
            this.sendChannel.send(JSON.stringify(message));
        }

        // Handle two-finger tap as right click
        if (event.changedTouches.length === 1 &&
            this.touches.length === 2 &&
            this.touches.every(touch => Date.now() - touch.startTime < 250) &&
            this.touches.every(touch => distance(touch.clientX, touch.clientY, touch.initialClientX, touch.initialClientY) < 25) &&
            distance(this.touches[0].clientX, this.touches[0].clientY, this.touches[1].clientX, this.touches[1].clientY) > 15) {
            const message = {
                button: 2,
            };

            message.type = "mousedown";
            this.sendChannel.send(JSON.stringify(message));
            message.type = "mouseup";
            this.sendChannel.send(JSON.stringify(message));

            this.lastRightClickTime = Date.now();
        }

        // End drag
        if (this.touches.length === 3) {
            const message = {
                type: "mouseup",
                button: 0,
            };

            this.sendChannel.send(JSON.stringify(message));
        }

        // Make lone touches linger to improve two-finger tap detection
        if (this.touches.length === 1) {
            await sleep(125);
        }

        this.touches = this.touches.filter(touch => {
            for (const deletedTouch of event.changedTouches) {
                if (touch.identifier === deletedTouch.identifier) {
                    return false;
                }
            }
            return true;
        });
    }

    handleTouchMove(event) {
        event.preventDefault();

        let message;
        if (event.touches.length === 2 && this.touches.every(touch => Date.now() - touch.startTime > 25)) {
            if (Math.abs(event.touches[0].clientX - this.touches[0].clientX) < 15 &&
                Math.abs(event.touches[0].clientY - this.touches[0].clientY) < 15) {
                return;
            }
            message = {
                type: "wheel",
                x: (event.touches[0].clientX - this.touches[0].clientX) * 8,
                y: (event.touches[0].clientY - this.touches[0].clientY) * 8,
            };
        } else {
            message = {
                type: "mousemove",
                x: (event.touches[0].clientX - this.touches[0].clientX) * 1.5,
                y: (event.touches[0].clientY - this.touches[0].clientY) * 1.5,
            };
        }

        this.sendChannel.send(JSON.stringify(message));

        for (const touch of this.touches) {
            for (const movedTouch of event.changedTouches) {
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
