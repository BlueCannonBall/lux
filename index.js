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

function addStereoToSDP(sdp) {
    // Regular expression to match `a=fmtp` lines with the specified format
    const fmtpRegex = /(a=fmtp:(\d+) minptime=\d+;useinbandfec=\d+)(.*)/g;

    // Replace matches by appending `;stereo=1` if not already present
    const updatedSDP = sdp.replace(fmtpRegex, (match, base, number, rest) => {
        if (!rest.includes(';stereo=1')) {
            return `${base};stereo=1${rest}`;
        }
        return match; // No modification if `stereo=1` is already present
    });

    return updatedSDP;
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

class Checkbox {
    constructor(label, checked = false) {
        this.inner = document.createElement("label");
        this.inner.style.marginBottom = "var(--pico-spacing)";

        this.checkbox = document.createElement("input");
        this.checkbox.type = "checkbox";
        this.checked = checked;
        this.inner.appendChild(this.checkbox);

        this.label = document.createTextNode(label);
        this.inner.appendChild(this.label);
    }

    get checked() {
        return this.checkbox.checked;
    }

    set checked(value) {
        return this.checkbox.checked = value;
    }
}

class Range {
    constructor(label, min, max, value, step) {
        this.inner = document.createElement("label");
        this.inner.style.marginBottom = "var(--pico-spacing)";

        this.label = document.createTextNode(label);
        this.inner.appendChild(this.label);

        this.range = document.createElement("input");
        this.range.type = "range";
        this.range.min = min;
        this.range.max = max;
        this.value = value;
        this.range.step = step;
        this.range.style.marginBottom = '0';
        this.inner.appendChild(this.range);
    }

    get value() {
        return this.range.value;
    }

    set value(value) {
        return this.range.value = value;
    }
}

class SetupForm {
    constructor() {
        this.inner = document.createElement("form");

        this.titleHeading = document.createElement("h1");
        this.titleHeading.style.marginTop = "var(--pico-typography-spacing-vertical)";
        this.titleHeading.innerHTML = `<img src="icon.png" style="margin-right: 5px; display: inline-block; width: 60px; vertical-align: -15px;"> Lux Client`;
        this.inner.appendChild(this.titleHeading);

        this.addressInput = document.createElement("input");
        this.addressInput.type = "text";
        this.addressInput.placeholder = "Address";
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

        this.viewOnlyCheckbox = new Checkbox("View only");
        this.inner.appendChild(this.viewOnlyCheckbox.inner);

        this.mouseSensitivityRange = new Range("Mouse sensitivity:", 0.1, 2.9, 1.5, 0.1);
        this.inner.appendChild(this.mouseSensitivityRange.inner);

        this.submitButton = document.createElement("button");
        this.submitButton.type = "submit";
        this.submitButton.innerText = "Login";
        this.inner.appendChild(this.submitButton);

        this.windowSizeLabel = document.createElement("p");
        this.windowSizeLabel.innerText = `${window.innerWidth}x${window.innerHeight}`;
        this.inner.appendChild(this.windowSizeLabel);

        this.inner.addEventListener("submit", this.handleSubmit.bind(this), {
            passive: false,
        });

        this.inner.style.boxSizing = "border-box";
        this.inner.style.width = "100%";
        this.inner.style.height = "100%";
        this.inner.style.minHeight = "fit-content";

        this.inner.style.paddingLeft = "15%";
        this.inner.style.paddingRight = "15%";

        this.inner.style.display = "flex";
        this.inner.style.flexDirection = "column";
        this.inner.style.justifyContent = "center";

        this.addressInput.value = localStorage.getItem("address");
        this.passwordInput.value = localStorage.getItem("password");
        this.clientSideMouseCheckbox.checked = localStorage.getItem("client_side_mouse") === "true";
        this.simulateTouchpadCheckbox.checked = localStorage.getItem("simulate_touchpad") === "true";
        this.naturalTouchScrollingCheckbox.checked = localStorage.getItem("natural_touch_scrolling") === "true";
        this.viewOnlyCheckbox.checked = localStorage.getItem("view_only") === "true";
        this.mouseSensitivityRange.value = localStorage.getItem("sensitivity");
    }

    handleSubmit(event) {
        event.preventDefault();

        localStorage.setItem("address", this.addressInput.value);
        localStorage.setItem("password", this.passwordInput.value);
        localStorage.setItem("client_side_mouse", this.clientSideMouseCheckbox.checked.toString());
        localStorage.setItem("simulate_touchpad", this.simulateTouchpadCheckbox.checked.toString());
        localStorage.setItem("natural_touch_scrolling", this.naturalTouchScrollingCheckbox.checked.toString());
        localStorage.setItem("view_only", this.viewOnlyCheckbox.checked.toString());
        localStorage.setItem("sensitivity", this.mouseSensitivityRange.value);

        const streamingWindow = new StreamingWindow(
            this.clientSideMouseCheckbox.checked,
            this.simulateTouchpadCheckbox.checked,
            this.naturalTouchScrollingCheckbox.checked,
            this.viewOnlyCheckbox.checked,
            this.mouseSensitivityRange.value,
        );
        streamingWindow.startStreaming(
            this.addressInput.value,
            this.passwordInput.value,
            true,
        );
        this.inner.replaceWith(streamingWindow.inner);
    }
}

class StreamingWindow {
    constructor(
        clientSideMouse = false,
        simulateTouchpad = false,
        naturalTouchScrolling = false,
        viewOnly = false,
        mouseSensitivity = 1.5,
        virtualMouseX = window.innerWidth / 2,
        virtualMouseY = window.innerHeight / 2,
    ) {
        this.inner = document.createElement("div");

        this.clientSideMouse = clientSideMouse;
        this.simulateTouchpad = simulateTouchpad;
        this.naturalTouchScrolling = naturalTouchScrolling;
        this.viewOnly = viewOnly;
        this.mouseSensitivity = mouseSensitivity;

        this.abortController = new AbortController();

        this.virtualMouseX = virtualMouseX
        this.virtualMouseY = virtualMouseY;

        this.touches = [];
        this.lastRightClickTime = 0;

        this.inner.style.display = "flex";
        this.inner.style.boxSizing = "border-box";
        this.inner.style.width = "100%";
        this.inner.style.height = "100%";
        this.inner.style.justifyContent = "center";
        this.inner.style.alignItems = "center";
    }

    async startStreaming(address, password, askCamera) {
        this.inner.ariaBusy = true;
        this.inner.innerText = "Connecting...";

        if (askCamera) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: true,
                });
                stream.getTracks().forEach(track => track.stop());
            } catch (e) {
                this.inner.innerText += " (without TCP support, due to insufficient permissions)";
            }
        }

        this.conn = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });

        this.conn.addEventListener("iceconnectionstatechange", event => {
            if (this.conn.iceConnectionState === "closed" ||
                this.conn.iceConnectionState === "failed" ||
                this.conn.iceConnectionState === "disconnected") {
                this.abortController.abort();
                const streamingWindow = new StreamingWindow(
                    this.clientSideMouse,
                    this.simulateTouchpad,
                    this.naturalTouchScrolling,
                    this.viewOnly,
                    this.mouseSensitivity,
                    this.virtualMouseX,
                    this.virtualMouseY,
                );
                streamingWindow.startStreaming(address, password, false);
                this.inner.replaceWith(streamingWindow.inner);
            }
        }, { signal: this.abortController.signal });

        if (!this.viewOnly) {
            this.orderedChannel = this.conn.createDataChannel("ordered-input", {
                ordered: true,
            });
            this.unorderedChannel = this.conn.createDataChannel("unordered-input", {
                ordered: false,
            });
        }

        this.conn.addEventListener("track", event => {
            const media = document.createElement(event.track.kind);
            if (event.track.kind === "audio") {
                this.audio = media;
                this.audio.controls = false;
                this.audio.autoplay = true;
                this.audio.srcObject = event.streams[0];
                this.inner.appendChild(this.audio);
            } else if (event.track.kind === "video") {
                this.video = media;
                this.video.controls = false;
                this.video.playsInline = true;
                this.video.autoplay = true;
                this.video.srcObject = event.streams[0];

                this.video.style.flex = "1";
                this.video.style.minWidth = "0";
                this.video.style.userSelect = "none";

                this.canvas = document.createElement("canvas");
                this.ctx = this.canvas.getContext("2d");
                this.canvas.width = window.innerWidth * window.devicePixelRatio;
                this.canvas.height = window.innerHeight * window.devicePixelRatio;
                this.canvas.style.position = "absolute";
                this.canvas.style.top = '0';
                this.canvas.style.left = '0';
                this.canvas.style.width = "100%";
                this.canvas.style.height = "100%";
                this.canvas.style.userSelect = "none";

                window.addEventListener("resize", () => {
                    this.canvas.width = window.innerWidth * window.devicePixelRatio;
                    this.canvas.height = window.innerHeight * window.devicePixelRatio;
                    if (this.clientSideMouse && this.simulateTouchpad && this.mouseImage.complete) {
                        this.virtualMouseX = Math.min(Math.max(this.virtualMouseX, 0), window.innerWidth);
                        this.virtualMouseY = Math.min(Math.max(this.virtualMouseY, 0), window.innerHeight);
                        this.drawVirtualMouse();
                    }
                }, { signal: this.abortController.signal });

                if (!this.viewOnly) {
                    if (!this.clientSideMouse) {
                        this.canvas.addEventListener("click", async () => {
                            if (this.canvas.requestPointerLock) {
                                try {
                                    await this.canvas.requestPointerLock({
                                        unadjustedMovement: true,
                                    });
                                } catch (e) {
                                    await this.canvas.requestPointerLock();
                                }
                            }
                        }, { signal: this.abortController.signal });
                    } else {
                        document.addEventListener("contextmenu", event => event.preventDefault(), { signal: this.abortController.signal });
                        if (this.simulateTouchpad) {
                            this.mouseImage = new Image();
                            this.mouseImage.src = "mouse.png";
                            this.mouseImage.onload = this.drawVirtualMouse.bind(this);
                        }
                    }
                    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this), { signal: this.abortController.signal });
                    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this), { signal: this.abortController.signal });
                    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this), { signal: this.abortController.signal });
                    document.addEventListener("wheel", this.handleWheel.bind(this), {
                        passive: false,
                        signal: this.abortController.signal,
                    });
                    document.addEventListener("keydown", this.handleKeyDown.bind(this), {
                        passive: false,
                        signal: this.abortController.signal,
                    });
                    document.addEventListener("keyup", this.handleKeyUp.bind(this), {
                        passive: false,
                        signal: this.abortController.signal,
                    });
                    this.canvas.addEventListener("touchstart", event => event.preventDefault(), {
                        passive: false,
                        signal: this.abortController.signal,
                    });
                    this.canvas.addEventListener("touchend", event => event.preventDefault(), {
                        passive: false,
                        signal: this.abortController.signal,
                    });
                    this.canvas.addEventListener("touchmove", event => event.preventDefault(), {
                        passive: false,
                        signal: this.abortController.signal,
                    });
                    this.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this), {
                        signal: this.abortController.signal,
                    });
                    this.canvas.addEventListener("pointerup", this.handlePointerUp.bind(this), {
                        signal: this.abortController.signal,
                    });
                    this.canvas.addEventListener("pointercancel", this.handlePointerUp.bind(this), {
                        signal: this.abortController.signal,
                    });
                    this.canvas.addEventListener("pointermove", this.handlePointerMove.bind(this), {
                        signal: this.abortController.signal,
                    });
                }

                this.inner.innerText = "";
                this.inner.ariaBusy = false;
                this.inner.style.removeProperty("justify-content");
                this.inner.style.removeProperty("align-items");
                this.inner.style.flex = "1";
                this.inner.style.minHeight = "0";

                this.inner.appendChild(this.video);
                this.inner.appendChild(this.canvas);
            }
        }, { signal: this.abortController.signal });

        this.conn.addEventListener("icecandidate", async event => {
            if (!event.candidate) {
                const resp = await fetch(`https://${address}/offer`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        password,
                        show_mouse: !this.clientSideMouse || this.viewOnly,
                        offer: btoa(JSON.stringify(this.conn.localDescription)),
                    }),
                }).catch(e => {
                    alert(`Error: ${e}`);
                    window.location.reload();
                });

                if (resp.status === 200) {
                    const answer = await resp.text();
                    try {
                        function modifyCandidates(sdp) {
                            // Split the SDP into lines
                            const lines = sdp.split('\n');
                            const modifiedLines = lines.map(line => {
                                // Match srflx candidates with udp
                                const match = line.match(/candidate:(\S+) 1 udp (\d+) (\d+\.\d+\.\d+\.\d+) (\d+) typ srflx(?: ufrag \S+)?/i);
                                if (match) {
                                    const [
                                        ,
                                        foundation, priority, ip, port
                                    ] = match;

                                    // Modify the candidate line
                                    return `a=candidate:${foundation} 1 UDP ${priority} ${ip} ${port} typ srflx raddr 0.0.0.0 rport 0`;
                                }
                                // Return unmodified line if it doesn't match
                                return line;
                            });

                            // Join the modified lines back into an SDP string
                            return modifiedLines.join('\n');
                        }

                        let sessionDescription = JSON.parse(atob(JSON.parse(answer).Offer));
                        console.log(sessionDescription.sdp);
                        sessionDescription.sdp = modifyCandidates(sessionDescription.sdp);
                        console.log(sessionDescription.sdp);
                        sessionDescription.sdp = addStereoToSDP(sessionDescription.sdp);
                        this.conn.setRemoteDescription(new RTCSessionDescription(sessionDescription));
                    } catch (e) {
                        alert(`Error: ${e}`);
                        window.location.reload();
                    }
                } else {
                    alert(`Error: ${(await resp.json()).Error}`);
                    window.location.reload();
                }
            }
        }, { signal: this.abortController.signal });

        // Offer to receive 1 video track
        this.conn.addTransceiver("video", { direction: "recvonly" });
        this.conn.addTransceiver("audio", { direction: "recvonly" });
        this.conn.createOffer().then(offer => {
            let desc = {
                type: offer.type,
                sdp: addStereoToSDP(offer.sdp),
            };
            this.conn.setLocalDescription(new RTCSessionDescription(desc));
        });
    }

    moveVirtualMouse(x, y) {
        this.virtualMouseX = Math.min(Math.max(this.virtualMouseX + x, 0), window.innerWidth);
        this.virtualMouseY = Math.min(Math.max(this.virtualMouseY + y, 0), window.innerHeight);
        if (this.mouseImage.complete) this.drawVirtualMouse();
    }

    drawVirtualMouse() {
        this.ctx.clearRect(0, 0, this.canvas.width * window.devicePixelRatio, this.canvas.height * window.devicePixelRatio);
        this.ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 1.5 * window.devicePixelRatio;
        this.ctx.shadowOffsetY = 1.5 * window.devicePixelRatio;
        this.ctx.drawImage(
            this.mouseImage,
            Math.round(this.virtualMouseX * window.devicePixelRatio),
            Math.round(this.virtualMouseY * window.devicePixelRatio),
            this.mouseImage.width / 40 * window.devicePixelRatio,
            this.mouseImage.height / 40 * window.devicePixelRatio,
        );
    }

    pushTouch(touch) {
        this.touches.push({
            id: touch.id,
            clientX: touch.clientX,
            clientY: touch.clientY,
            initialClientX: touch.clientX,
            initialClientY: touch.clientY,
            startTime: Date.now(),
        });
    }

    clearTouches() {
        if (this.simulateTouchpad) {
            const message = {
                type: "mouseup",
            };
            message.button = 0;
            this.sendOrdered(message);
            message.button = 2;
            this.sendOrdered(message);
            this.touches = [];
        } else {
            for (const touch of this.touches) {
                const message = {
                    type: "touchend",
                    id: Math.abs(touch.id) % 10,
                };
                this.sendOrdered(message);
            }
            this.touches = [];
        }
    }


    sendOrdered(message) {
        if (this.orderedChannel.readyState === "open") {
            this.orderedChannel.send(JSON.stringify(message));
        }
    }

    sendUnordered(message) {
        if (this.unorderedChannel.readyState === "open") {
            this.unorderedChannel.send(JSON.stringify(message));
        }
    }

    handleMouseMove(event) {
        if (this.clientSideMouse) {
            const message = {
                type: "mousemoveabs",
                ...positionInVideo(event.clientX, event.clientY, this.video),
            };
            this.sendOrdered(message);
        } else {
            const message = {
                type: "mousemove",
                x: Math.round(event.movementX),
                y: Math.round(event.movementY),
            };
            this.sendUnordered(message);
        }
    }

    handleMouseDown(event) {
        const message = {
            type: "mousedown",
            button: event.button,
        };
        this.sendOrdered(message);
    }

    handleMouseUp(event) {
        const message = {
            type: "mouseup",
            button: event.button,
        };
        this.sendOrdered(message);
    }

    handleWheel(event) {
        event.preventDefault();

        const message = {
            type: "wheel",
            x: Math.round(event.deltaX),
            y: Math.round(event.deltaY),
        };
        this.sendUnordered(message);
    }

    handleKeyDown(event) {
        event.preventDefault();

        const message = {
            type: "keydown",
            key: event.code,
        };
        this.sendOrdered(message);
    }

    handleKeyUp(event) {
        event.preventDefault();

        const message = {
            type: "keyup",
            key: event.code,
        };
        this.sendOrdered(message);
    }

    handleTouchStart(newTouches) {
        if (this.simulateTouchpad) {
            for (const touch of newTouches) {
                if (touch.radiusX <= 75 && touch.radiusY <= 75) {
                    this.pushTouch(touch);
                }
            }

            switch (this.touches.length) {
                case 3: {
                    if (this.clientSideMouse) {
                        const message = {
                            type: "mousemoveabs",
                            ...positionInVideo(this.virtualMouseX, this.virtualMouseY, this.video),
                        };
                        this.sendOrdered(message);
                    }

                    // Start drag
                    const message = {
                        type: "mousedown",
                        button: 0,
                    };
                    this.sendOrdered(message);
                    break;
                }
            }
        } else {
            for (const touch of newTouches) {
                if (touch.radiusX <= 75 && touch.radiusY <= 75) {
                    const message = {
                        type: "touchstart",
                        id: Math.abs(touch.id) % 10,
                        ...positionInVideo(touch.clientX, touch.clientY, this.video),
                    };
                    this.sendOrdered(message);
                    this.pushTouch(touch);
                }
            }
        }
    }

    async handleTouchEnd(deletedTouches) {
        deletedTouches = deletedTouches.filter(deletedTouch => this.touches.some(touch => touch.id === deletedTouch.id));
        if (!deletedTouches) return;

        if (this.simulateTouchpad) {
            switch (this.touches.length) {
                case 1: {
                    if (Date.now() - this.lastRightClickTime > 125 &&
                        Date.now() - this.touches[0].startTime <= 125) {
                        if (this.clientSideMouse) {
                            const message = {
                                type: "mousemoveabs",
                                ...positionInVideo(this.virtualMouseX, this.virtualMouseY, this.video),
                            };
                            this.sendOrdered(message);
                        }

                        const message = {
                            button: 0,
                        };
                        message.type = "mousedown";
                        this.sendOrdered(message);
                        message.type = "mouseup";
                        this.sendOrdered(message);

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
                        if (this.clientSideMouse) {
                            const message = {
                                type: "mousemoveabs",
                                ...positionInVideo(this.virtualMouseX, this.virtualMouseY, this.video),
                            };
                            this.sendOrdered(message);
                        }

                        const message = {
                            button: 2,
                        };
                        message.type = "mousedown";
                        this.sendOrdered(message);
                        message.type = "mouseup";
                        this.sendOrdered(message);

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
                    this.sendOrdered(message);
                    break;
                }
            }
        } else {
            for (const deletedTouch of deletedTouches) {
                let touch;
                if (touch = this.touches.find(touch => touch.id === deletedTouch.id)) {
                    const message = {
                        type: "touchend",
                        id: Math.abs(touch.id) % 10,
                    };
                    this.sendOrdered(message);
                }
            }
        }

        this.touches = this.touches.filter(touch => !deletedTouches.some(deletedTouch => deletedTouch.id === touch.id));
    }

    handleTouchMove(movedTouches) {
        movedTouches = movedTouches.filter(movedTouch => this.touches.some(touch => touch.id === movedTouch.id));
        if (movedTouches.length === 0) return;

        if (this.simulateTouchpad) {
            switch (this.touches.length) {
                case 1: {
                    if (this.clientSideMouse) {
                        this.moveVirtualMouse(
                            (movedTouches[0].clientX - this.touches[0].clientX) * this.mouseSensitivity,
                            (movedTouches[0].clientY - this.touches[0].clientY) * this.mouseSensitivity,
                        );
                        const message = {
                            type: "mousemoveabs",
                            ...positionInVideo(this.virtualMouseX, this.virtualMouseY, this.video),
                        };
                        this.sendOrdered(message);
                    } else {
                        const message = {
                            type: "mousemove",
                            x: Math.round((movedTouches[0].clientX - this.touches[0].clientX) * this.mouseSensitivity),
                            y: Math.round((movedTouches[0].clientY - this.touches[0].clientY) * this.mouseSensitivity),
                        };
                        this.sendUnordered(message);
                    }
                    break;
                }

                case 2: {
                    if (movedTouches[0].id === this.touches[0].id &&
                        this.touches.every(touch => Date.now() - touch.startTime >= 25)) {
                        const message = {
                            type: "wheel",
                            x: Math.round(movedTouches[0].clientX - this.touches[0].clientX) * (this.naturalTouchScrolling ? -1 : 1) * 8,
                            y: Math.round(movedTouches[0].clientY - this.touches[0].clientY) * (this.naturalTouchScrolling ? -1 : 1) * 8,
                        };
                        this.sendUnordered(message);
                    }
                    break;
                }

                case 3: {
                    if (movedTouches[0].id === this.touches[0].id) {
                        if (this.clientSideMouse) {
                            this.moveVirtualMouse(
                                (movedTouches[0].clientX - this.touches[0].clientX) * this.mouseSensitivity,
                                (movedTouches[0].clientY - this.touches[0].clientY) * this.mouseSensitivity,
                            );
                            const message = {
                                type: "mousemoveabs",
                                ...positionInVideo(this.virtualMouseX, this.virtualMouseY, this.video),
                            };
                            this.sendOrdered(message);
                        } else {
                            const message = {
                                type: "mousemove",
                                x: Math.round((movedTouches[0].clientX - this.touches[0].clientX) * this.mouseSensitivity),
                                y: Math.round((movedTouches[0].clientY - this.touches[0].clientY) * this.mouseSensitivity),
                            };
                            this.sendUnordered(message);
                        }
                    }
                    break;
                }
            }
        } else {
            for (const movedTouch of movedTouches) {
                let touch;
                if (touch = this.touches.find(touch => touch.id === movedTouch.id)) {
                    const message = {
                        type: "touchmove",
                        id: Math.abs(touch.id) % 10,
                        ...positionInVideo(touch.clientX, touch.clientY, this.video),
                    };
                    this.sendOrdered(message);
                }
            }
        }

        for (const touch of this.touches) {
            for (const movedTouch of movedTouches) {
                if (touch.id === movedTouch.id) {
                    touch.clientX = movedTouch.clientX;
                    touch.clientY = movedTouch.clientY;
                }
            }
        }
    }

    handlePointerDown(event) {
        if (event.pointerType === "touch") {
            this.handleTouchStart([{
                id: event.pointerId,
                clientX: event.clientX,
                clientY: event.clientY,
                radiusX: event.width / 2,
                radiusY: event.height / 2,
            }]);
        } else if (event.pointerType === "pen") {
            this.clearTouches();

            const message = {
                type: "pen",
                ...positionInVideo(event.clientX, event.clientY, this.video),
                pressure: Math.max(event.pressure, 0.001),
                tiltX: Math.round(event.tiltX),
                tiltY: Math.round(event.tiltY),
            };
            this.sendOrdered(message);
        }
    }

    handlePointerUp(event) {
        if (event.pointerType === "touch") {
            this.handleTouchEnd([{
                id: event.pointerId,
                clientX: event.clientX,
                clientY: event.clientY,
                radiusX: event.width / 2,
                radiusY: event.height / 2,
            }]);
        } else if (event.pointerType === "pen") {
            const message = {
                type: "pen",
                ...positionInVideo(event.clientX, event.clientY, this.video),
                pressure: 0,
                tiltX: Math.round(event.tiltX),
                tiltY: Math.round(event.tiltY),
            };
            this.sendOrdered(message);
        }
    }

    handlePointerMove(event) {
        if (event.pointerType === "touch") {
            this.handleTouchMove([{
                id: event.pointerId,
                clientX: event.clientX,
                clientY: event.clientY,
                radiusX: event.width / 2,
                radiusY: event.height / 2,
            }]);
        } else if (event.pointerType === "pen") {
            this.clearTouches();

            const message = {
                type: "pen",
                ...positionInVideo(event.clientX, event.clientY, this.video),
                pressure: Math.max(event.pressure, 0.001),
                tiltX: Math.round(event.tiltX),
                tiltY: Math.round(event.tiltY),
            };
            this.sendOrdered(message);
        }
    }
}

const setupForm = new SetupForm();
document.body.appendChild(setupForm.inner);
