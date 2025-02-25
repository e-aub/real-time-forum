
class ws {
    constructor() {
        this.ws = new WebSocket(`ws://${window.location.hostname}:8080/api/ws`);
        this.ws.onmessage = this.onmessage.bind(this);
        this.ws.onopen = this.onopen.bind(this);
        this.initListeners();
        this.pongReceived = true;
        this.retryInterval = null;
        this.pingInterval = setInterval(async () => {
            const res = await fetch("/api/authenticated");
            if (res.status === 401) {
                this.ws.close();
                clearInterval(this.pingInterval);
                return;
            }
            if (!this.pongReceived) {
                this.reconnect();
            } else {
                this.pongReceived = false;
                this.ping();
            }

        }, 5000);
    }

    reconnect() {
        this.pongReceived = true;
        this.ws.close();
        this.ws = new WebSocket(`ws://${window.location.hostname}:8080/api/ws`);
        this.ws.onmessage = this.onmessage.bind(this);
        this.ws.onopen = this.onopen.bind(this);
    }

    onopen() {
        console.log("WebSocket opened");
    }

    ping() {
        if (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState == WebSocket.CLOSING) {
            this.pongReceived  = true;
            console.log("websocket is connecting or closing");
            return;
        } else if (this.ws.readyState === WebSocket.OPEN) {
            this.pongReceived = true;
            console.log("websocket is open");
            this.ws.send(JSON.stringify({ type: "ping" }));
        } else {
            console.log("websocket is closed");
            this.pongReceived = false;
            this.reconnect();
        }
    }

    onmessage(event) {
        let data = JSON.parse(event.data);
        switch (data.type) {
            case "status":
                let statusEvent = new CustomEvent('status'
                    , {
                        detail: {
                            username: data.username,
                            online: data.online,
                        }
                    }
                );
                document.dispatchEvent(statusEvent);
                break;
            case "message":
                let chatEvent = new CustomEvent('message'
                    , {
                        detail: {
                            id: data.id,
                            avatar: data.avatar,
                            message: data.content,
                            sender: data.sender,
                            creation_date: data.creation_date,
                        }
                    }
                );
                document.dispatchEvent(chatEvent);
                break;
            case "error":
                let errorEvent = new CustomEvent(`chatWindowError-${data.conversation}`
                    , {
                        detail: {
                            conversation: data.conversation,
                            message_id: data.id,
                        }

                    })
                document.dispatchEvent(errorEvent);
                break;
            case "typing":
                var typingEvent = new CustomEvent('typing'
                    , {
                        detail: {
                            sender: data.sender,
                            typing: data.is_typing,
                        }
                    }
                );
                document.dispatchEvent(typingEvent);
                break;
            case "pong":
                this.pongReceived = true;
                break;
        }
    }

    initListeners() {
        document.addEventListener('sendtyping', (e) => {
            this.ws.send(JSON.stringify({
                type: "typing",
                is_typing: e.detail.is_typing,
                receiver: e.detail.username,
            }));
        });

        document.addEventListener('sendmessage', (e) => {
            this.ws.send(JSON.stringify({
                type: "message",
                id: e.detail.id,
                receiver: e.detail.reciever,
                content: e.detail.message
            }));
        });

        document.addEventListener('closeWs', (e) => {
            this.ws.close();
        });
    }
}

export { ws }