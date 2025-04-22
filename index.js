window.onerror = (message, source, lineno, colno, error) => {
    alert(`An error occured at ${lineno}:${colno}: ${message}`);
    window.location.href = window.location.origin + window.location.pathname;
    return false;
}

const url = new URL(window.location.href);

function shallowEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
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

    get disabled() {
        return this.checkbox.disabled;
    }

    set disabled(value) {
        return this.checkbox.disabled = value;
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
        this.range.style.marginBottom = "0";
        this.inner.appendChild(this.range);
    }

    get min() {
        return this.range.min;
    }

    set min(value) {
        return this.range.min = value;
    }

    get max() {
        return this.range.max;
    }

    set max(value) {
        return this.range.max = value;
    }

    get value() {
        return this.range.value;
    }

    set value(value) {
        return this.range.value = value;
    }

    get step() {
        return this.range.step;
    }

    set step(value) {
        return this.range.step = value;
    }

    get disabled() {
        return this.range.disabled;
    }

    set disabled(value) {
        return this.range.disabled = value;
    }
}

class SetupWindow {
    constructor() {
        this.inner = document.createElement("form");

        this.titleHeading = document.createElement("h1");
        this.titleHeading.style.marginTop = "var(--pico-typography-spacing-vertical)";
        this.titleHeading.innerHTML = `<img src="icon.png" style="margin-right: 5px; display: inline-block; width: 60px; vertical-align: -15px;"> Lux Client`;
        this.inner.appendChild(this.titleHeading);

        this.addressInput = document.createElement("input");
        this.addressInput.type = "text";
        this.addressInput.placeholder = "Address";
        if (!url.searchParams.has("address")) {
            this.addressInput.value = localStorage.getItem("address");
        } else {
            this.addressInput.value = url.searchParams.get("address");
            this.addressInput.disabled = true;
        }
        this.inner.appendChild(this.addressInput);

        if (!url.searchParams.has("key")) {
            this.passwordInput = document.createElement("input");
            this.passwordInput.type = "password";
            this.passwordInput.autocomplete = "current-password";
            this.passwordInput.placeholder = "Password";
            this.passwordInput.value = localStorage.getItem("password");
            this.inner.appendChild(this.passwordInput);
        }

        if (url.searchParams.get("view_only") !== "true") {
            this.clientSideMouseCheckbox = new Checkbox("Client-side mouse");
            this.clientSideMouseCheckbox.checked = localStorage.getItem("client_side_mouse") === "true";
            this.inner.appendChild(this.clientSideMouseCheckbox.inner);

            this.simulateTouchpadCheckbox = new Checkbox("Simulate touchpad");
            this.simulateTouchpadCheckbox.checked = navigator.maxTouchPoints && localStorage.getItem("simulate_touchpad") === "true";
            this.simulateTouchpadCheckbox.disabled = !navigator.maxTouchPoints;
            this.inner.appendChild(this.simulateTouchpadCheckbox.inner);

            this.naturalTouchScrollingCheckbox = new Checkbox("Natural touch scrolling");
            this.naturalTouchScrollingCheckbox.checked = navigator.maxTouchPoints && localStorage.getItem("natural_touch_scrolling") === "true";
            this.naturalTouchScrollingCheckbox.disabled = !navigator.maxTouchPoints;
            this.inner.appendChild(this.naturalTouchScrollingCheckbox.inner);

            this.viewOnlyCheckbox = new Checkbox("View only");
            this.viewOnlyCheckbox.checked = localStorage.getItem("view_only") === "true";
            this.inner.appendChild(this.viewOnlyCheckbox.inner);
        }

        this.tcpConnectivityCheckbox = new Checkbox("TCP connectivity");
        this.tcpConnectivityCheckbox.checked = localStorage.getItem("tcp_connectivity") === "true";
        this.inner.appendChild(this.tcpConnectivityCheckbox.inner);

        if (url.searchParams.get("view_only") !== "true") {
            this.mouseSensitivityRange = new Range("Mouse sensitivity:", 0.1, 2.9, 1.5, 0.1);
            this.mouseSensitivityRange.value = parseFloat(localStorage.getItem("sensitivity"));
            this.inner.appendChild(this.mouseSensitivityRange.inner);
        }

        this.submitButton = document.createElement("button");
        this.submitButton.type = "submit";
        this.submitButton.innerText = "Login";
        this.inner.appendChild(this.submitButton);

        // this.windowSizeLabel = document.createElement("p");
        // this.windowSizeLabel.innerText = `${window.innerWidth}x${window.innerHeight}`;
        // this.inner.appendChild(this.windowSizeLabel);

        this.inner.addEventListener("submit", this.handleSubmit.bind(this), {
            passive: false,
        });

        this.carbonLabel = document.createElement("p");
        this.carbonLabel.style.textAlign = "center";
        this.carbonLabel.innerHTML = "<i class=\"fas fa-leaf\" style=\"color: #32A852;\"></i> <strong>Lux and Tenebra are <a href=\"https://github.com/UE2020/tenebra?tab=readme-ov-file#using-hardware-accelerated-encoding-macos--linux-only\">committed</a> to curbing carbon emissions.</strong>";
        this.inner.appendChild(this.carbonLabel);

        this.inner.style.boxSizing = "border-box";
        this.inner.style.width = "100%";
        this.inner.style.height = "100%";
        this.inner.style.minHeight = "fit-content";
        this.inner.style.paddingLeft = "15%";
        this.inner.style.paddingRight = "15%";
        this.inner.style.display = "flex";
        this.inner.style.flexDirection = "column";
        this.inner.style.justifyContent = "center";

    }

    handleSubmit(event) {
        event.preventDefault();

        if (!url.searchParams.has("key")) {
            localStorage.setItem("address", this.addressInput.value);
            localStorage.setItem("password", this.passwordInput.value);
        }
        if (url.searchParams.get("view_only") !== "true") {
            localStorage.setItem("client_side_mouse", this.clientSideMouseCheckbox.checked.toString());
            localStorage.setItem("simulate_touchpad", this.simulateTouchpadCheckbox.checked.toString());
            localStorage.setItem("natural_touch_scrolling", this.naturalTouchScrollingCheckbox.checked.toString());
            localStorage.setItem("view_only", this.viewOnlyCheckbox.checked.toString());
            localStorage.setItem("sensitivity", this.mouseSensitivityRange.value.toString());
        }
        localStorage.setItem("tcp_connectivity", this.tcpConnectivityCheckbox.checked.toString());

        const videoWindow = new VideoWindow(
            this.clientSideMouseCheckbox?.checked,
            this.simulateTouchpadCheckbox?.checked,
            this.naturalTouchScrollingCheckbox?.checked,
            url.searchParams.get("view_only") === "true" || this.viewOnlyCheckbox.checked,
            this.mouseSensitivityRange?.value,
        );
        videoWindow.startStreaming(
            this.addressInput.value,
            this.passwordInput?.value,
            this.tcpConnectivityCheckbox.checked,
        );
        this.inner.replaceWith(videoWindow.inner);
    }
}

class VideoWindow {
    constructor(
        clientSideMouse = false,
        simulateTouchpad = false,
        naturalTouchScrolling = false,
        viewOnly = false,
        mouseSensitivity = 1.5,
    ) {
        this.inner = document.createElement("div");

        this.clientSideMouse = clientSideMouse;
        this.simulateTouchpad = simulateTouchpad;
        this.naturalTouchScrolling = naturalTouchScrolling;
        this.viewOnly = viewOnly;
        this.mouseSensitivity = mouseSensitivity;

        this.virtualMouseX = window.innerWidth / 2;
        this.virtualMouseY = window.innerHeight / 2;

        this.touches = [];
        this.lastRightClickTime = 0;

        this.currentPenStroke = [];

        this.inner.style.width = "100%";
        this.inner.style.height = "100%";
        this.inner.style.display = "flex";
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
                if (!url.searchParams.has("key")) {
                    url.searchParams.set("reconnect", "true");
                    window.location.href = url.toString();
                } else {
                    alert("The connection has closed.");
                    window.location.href = window.location.origin + window.location.pathname;
                }
            }
        });

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
            if (event.track.kind === "video") {
                this.video = media;
                this.video.controls = false;
                this.video.playsInline = true;
                this.video.srcObject = event.streams[0];
                this.video.play(); // Autoplay is buggy

                this.canvas = document.createElement("canvas");
                this.ctx = this.canvas.getContext("2d");

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
                        });
                    } else {
                        if (this.simulateTouchpad) {
                            this.mouseImage = new Image();
                            this.mouseImage.src = "mouse.png";
                            this.mouseImage.onload = this.draw.bind(this);
                        }
                        document.addEventListener("contextmenu", event => event.preventDefault());
                    }
                    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
                    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
                    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
                    document.addEventListener("wheel", this.handleWheel.bind(this), { passive: false });
                    document.addEventListener("keydown", this.handleKeyDown.bind(this), { passive: false });
                    document.addEventListener("keyup", this.handleKeyUp.bind(this), { passive: false });
                    this.canvas.addEventListener("touchstart", event => event.preventDefault(), { passive: false });
                    this.canvas.addEventListener("touchend", event => event.preventDefault(), { passive: false });
                    this.canvas.addEventListener("touchmove", event => event.preventDefault(), { passive: false });
                    this.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this));
                    this.canvas.addEventListener("pointerup", this.handlePointerUp.bind(this));
                    this.canvas.addEventListener("pointercancel", this.handlePointerUp.bind(this));
                    this.canvas.addEventListener("pointermove", this.handlePointerMove.bind(this));
                }
                window.addEventListener("resize", this.handleResize.bind(this));

                this.video.style.minWidth = "0";
                this.video.style.flex = "1";
                this.video.style.userSelect = "none";
                this.video.style.webkitUserSelect = "none";

                this.canvas.style.position = "absolute";
                this.canvas.style.top = "0";
                this.canvas.style.left = "0";
                this.canvas.style.width = "100%";
                this.canvas.style.height = "100%";
                this.canvas.style.userSelect = "none";
                this.canvas.style.webkitUserSelect = "none";

                this.inner.innerText = "";
                this.inner.ariaBusy = false;
                this.inner.style.removeProperty("justify-content");
                this.inner.style.removeProperty("align-items");

                this.inner.appendChild(this.video);
                this.inner.appendChild(this.canvas);
                this.handleResize();
            } else if (event.track.kind === "audio") {
                this.audio = media;
                this.audio.controls = false;
                this.audio.srcObject = event.streams[0];
                this.audio.play(); // Autoplay is buggy
            }
        });

        this.conn.addEventListener("icecandidate", async event => {
            if (!event.candidate) {
                const resp = await fetch(`https://${address}/offer`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(!url.searchParams.has("key") ? {
                        password,
                        show_mouse: !this.clientSideMouse || this.viewOnly,
                        offer: btoa(JSON.stringify(this.conn.localDescription)),
                    } : {
                        key: url.searchParams.get("key"),
                        show_mouse: !this.clientSideMouse || this.viewOnly,
                        offer: btoa(JSON.stringify(this.conn.localDescription)),
                    }),
                }).catch(e => {
                    alert(`Error: ${e}`);
                    window.location.href = window.location.origin + window.location.pathname;
                });

                if (resp.status === 200) {
                    const answer = await resp.text();
                    try {
                        const desc = JSON.parse(atob(JSON.parse(answer).Offer));
                        console.log("Remote descripton:", desc);
                        desc.sdp = desc.sdp.replace("useinbandfec=1", "useinbandfec=0;stereo=1");
                        this.conn.setRemoteDescription(new RTCSessionDescription(desc));
                    } catch (e) {
                        alert(`Error: ${e}`);
                        window.location.href = window.location.origin + window.location.pathname;
                    }
                } else {
                    alert(`Error: ${(await resp.json()).Error}`);
                    window.location.href = window.location.origin + window.location.pathname;
                }
            }
        });

        // Offer to receive a video track and an audio track
        this.conn.addTransceiver("video", { direction: "recvonly" });
        this.conn.addTransceiver("audio", { direction: "recvonly" });
        this.conn.createOffer().then(offer => {
            const desc = {
                type: offer.type,
                sdp: offer.sdp.replace("useinbandfec=1", "useinbandfec=0;stereo=1"),
            };
            console.log("Local description:", desc);
            this.conn.setLocalDescription(new RTCSessionDescription(desc));
        });
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

    positionInVideo(x, y) {
        const videoAspectRatio = this.video.videoWidth / this.video.videoHeight;
        const windowAspectRatio = this.canvas.clientWidth / this.canvas.clientHeight;
        if (videoAspectRatio > windowAspectRatio) {
            return {
                x: Math.round(x / (this.canvas.clientWidth / this.video.videoWidth)),
                y: Math.round((y - ((1 - windowAspectRatio / videoAspectRatio) * this.canvas.clientHeight) / 2) / (this.canvas.clientWidth / this.video.videoWidth)),
            };
        } else if (videoAspectRatio < windowAspectRatio) {
            return {
                x: Math.round((x - ((1 - videoAspectRatio / windowAspectRatio) * this.canvas.clientWidth) / 2) / (this.canvas.clientHeight / this.video.videoHeight)),
                y: Math.round(y / (this.canvas.clientHeight / this.video.videoHeight)),
            };
        } else {
            return {
                x: Math.round(x / (this.canvas.clientWidth / this.video.videoWidth)),
                y: Math.round(y / (this.canvas.clientHeight / this.video.videoHeight)),
            };
        }
    }

    moveVirtualMouse(x, y) {
        this.virtualMouseX = Math.min(Math.max(this.virtualMouseX + x, 0), this.canvas.clientWidth - 1);
        this.virtualMouseY = Math.min(Math.max(this.virtualMouseY + y, 0), this.canvas.clientHeight - 1);
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pen stroke
        if (this.currentPenStroke.length >= 2) {
            this.ctx.save();
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            this.ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = "round";
            this.ctx.lineJoin = "round";
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentPenStroke[0].x, this.currentPenStroke[0].y);
            for (let i = 1; i < this.currentPenStroke.length; ++i) {
                this.ctx.lineTo(this.currentPenStroke[i].x, this.currentPenStroke[i].y);
            }
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Draw mouse
        if (this.clientSideMouse && this.simulateTouchpad && this.mouseImage.complete) {
            this.ctx.save();
            this.ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            this.ctx.shadowBlur = 2.5 * window.devicePixelRatio;
            this.ctx.shadowOffsetX = 1.5 * window.devicePixelRatio;
            this.ctx.shadowOffsetY = 1.5 * window.devicePixelRatio;
            this.ctx.drawImage(
                this.mouseImage,
                Math.round(this.virtualMouseX * window.devicePixelRatio),
                Math.round(this.virtualMouseY * window.devicePixelRatio),
                Math.round(this.mouseImage.width / 40 * window.devicePixelRatio),
                Math.round(this.mouseImage.height / 40 * window.devicePixelRatio),
            );
            this.ctx.restore();
        }
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

    clearTouches(mouseup = true) {
        if (this.simulateTouchpad) {
            if (mouseup) {
                const message = {
                    type: "mouseup",
                };
                message.button = 0;
                this.sendOrdered(message);
                message.button = 2;
                this.sendOrdered(message);
            }
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

    handleMouseMove(event) {
        if (this.clientSideMouse) {
            const message = {
                type: "mousemoveabs",
                ...this.positionInVideo(event.clientX, event.clientY),
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
                if (touch.radiusX <= 60 && touch.radiusY <= 60) {
                    this.pushTouch(touch);
                }
            }

            switch (this.touches.length) {
                case 3: {
                    if (this.clientSideMouse) {
                        const message = {
                            type: "mousemoveabs",
                            ...this.positionInVideo(this.virtualMouseX, this.virtualMouseY),
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
                    this.pushTouch(touch);

                    const message = {
                        type: "touchstart",
                        id: Math.abs(touch.id) % 10,
                        ...this.positionInVideo(touch.clientX, touch.clientY),
                    };
                    this.sendOrdered(message);
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
                    const now = Date.now();
                    if (now - this.lastRightClickTime > 125 && now - this.touches[0].startTime <= 125) {
                        if (this.clientSideMouse) {
                            const message = {
                                type: "mousemoveabs",
                                ...this.positionInVideo(this.virtualMouseX, this.virtualMouseY),
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
                    const now = Date.now();
                    if (this.touches.every(touch => now - touch.startTime <= 250) &&
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
                                ...this.positionInVideo(this.virtualMouseX, this.virtualMouseY),
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

                        this.lastRightClickTime = now;
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
        if (!movedTouches.length) return;

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
                            ...this.positionInVideo(this.virtualMouseX, this.virtualMouseY),
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
                    const now = Date.now();
                    if (movedTouches[0].id === this.touches[0].id && this.touches.every(touch => now - touch.startTime >= 25)) {
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
                                ...this.positionInVideo(this.virtualMouseX, this.virtualMouseY),
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
                        ...this.positionInVideo(touch.clientX, touch.clientY),
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

            // Pen input on iOS is ASTOUNDINGLY BROKEN!
            // Safari gives you TWO of every pen-related event, so they must be deduplicated
            // MANY SUCH CASES - see comments in Tenebra's input code
            const message = {
                type: "pen",
                ...this.positionInVideo(event.clientX, event.clientY),
                pressure: Math.max(event.pressure, 0.001),
                tiltX: Math.round(event.tiltX),
                tiltY: Math.round(event.tiltY),
            };
            if (!shallowEqual(message, this.lastPenMessage)) {
                this.currentPenStroke = [{ x: event.clientX, y: event.clientY, time: Date.now() }];

                this.sendOrdered(message);
                this.lastPenMessage = message;
            }
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
                ...this.positionInVideo(event.clientX, event.clientY),
                pressure: 0,
                tiltX: Math.round(event.tiltX),
                tiltY: Math.round(event.tiltY),
            };
            if (!shallowEqual(message, this.lastPenMessage)) {
                this.currentPenStroke = [];
                this.draw();

                this.sendOrdered(message);
                this.lastPenMessage = message;
            }
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
            this.clearTouches(false);

            const message = {
                type: "pen",
                ...this.positionInVideo(event.clientX, event.clientY),
                pressure: Math.max(event.pressure, 0.001),
                tiltX: Math.round(event.tiltX),
                tiltY: Math.round(event.tiltY),
            };
            if (!shallowEqual(message, this.lastPenMessage)) {
                const now = Date.now();
                if (event.getCoalescedEvents) {
                    for (const coalescedEvent of event.getCoalescedEvents()) {
                        if (now - this.currentPenStroke[0].time > 1000 / 60 * 20) {
                            this.currentPenStroke.shift();
                        }
                        this.currentPenStroke.push({ x: coalescedEvent.clientX, y: coalescedEvent.clientY, time: now });

                        const coalescedMessage = {
                            type: "pen",
                            ...this.positionInVideo(coalescedEvent.clientX, coalescedEvent.clientY),
                            pressure: Math.max(coalescedEvent.pressure, 0.001),
                            tiltX: Math.round(coalescedEvent.tiltX),
                            tiltY: Math.round(coalescedEvent.tiltY),
                        };
                        this.sendOrdered(coalescedMessage);
                    }
                } else {
                    if (now - this.currentPenStroke[0].time > 1000 / 60 * 20) {
                        this.currentPenStroke.shift();
                    }
                    this.currentPenStroke.push({ x: event.clientX, y: event.clientY, time: now });

                    this.sendOrdered(message);
                }
                this.draw();

                this.lastPenMessage = message;
            }
        }
    }

    handleResize() {
        this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
        this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;

        if (!this.viewOnly) {
            if (this.clientSideMouse && this.simulateTouchpad) {
                this.virtualMouseX = Math.min(this.virtualMouseX, this.canvas.clientWidth - 1);
                this.virtualMouseY = Math.min(this.virtualMouseY, this.canvas.clientHeight - 1);
            }
            this.draw();
        }
    }
}

if (url.searchParams.get("reconnect") === "true") {
    const videoWindow = new VideoWindow(
        localStorage.getItem("client_side_mouse") === "true",
        localStorage.getItem("simulate_touchpad") === "true",
        localStorage.getItem("natural_touch_scrolling") === "true",
        localStorage.getItem("view_only") === "true",
        parseFloat(localStorage.getItem("sensitivity")),
    );
    videoWindow.startStreaming(
        localStorage.getItem("address"),
        localStorage.getItem("password"),
        localStorage.getItem("tcp_connectivity") === "true",
    );
    document.body.appendChild(videoWindow.inner);
} else {
    const setupWindow = new SetupWindow();
    document.body.appendChild(setupWindow.inner);
}
