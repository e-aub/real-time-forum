
class ws{
    constructor(){
        this.ws = new WebSocket(`ws://${window.location.hostname}:8080/api/ws`);
        this.ws.onmessage = this.onmessage.bind(this);
        this.ws.onerror =  this.reconnect.bind(this);
        this.ws.onclose =  this.reconnect.bind(this);
        this.ws.onopen = this.onopen.bind(this);
        this.initListeners();
        this.pongReceived = false;
        this.reconnecting = false;
        this.retryInterval = null;
        this.pingInterval = setInterval(() => {
            if (!this.pongReceived) {
                this.pongReceived = false;
                this.reconnect();
            }else{
                this.pongReceived = false;
                this.ping();
            }
            
        }, 5000);
    }

    reconnect(event){
        if (this.reconnecting) return;
        // this.ws.close();
        this.reconnecting = true;
        console.log("Reconnecting to WebSocket server");

        this.ws = new WebSocket(`ws://${window.location.hostname}:8080/api/ws`);
        this.ws.onmessage = this.onmessage.bind(this);
        this.ws.onopen = this.onopen.bind(this);
    }

    onopen(){
        this.reconnecting = false;
        this.ping();  
        
    }

    ping(){
        if (this.ws.readyState === WebSocket.OPEN){
        this.ws.send(JSON.stringify({type: "ping"}));
        // console.log("Ping");
    }else{
        this.reconnect();
    }
    }

    onmessage(event){
        let data = JSON.parse(event.data);
        switch(data.type){
            case "status":
                let statusEvent = new CustomEvent('status'
                    , {
                        detail: {
                            username: data.username,
                            online: data.online,
                        }
                    }
                );
                // console.log(`User: ${data.user_name}, Online: ${data.online}`);
                document.dispatchEvent(statusEvent);
                break;
            case "message":
                // console.log(data);
                let chatEvent = new CustomEvent('message'
                    , {
                        detail: {
                            id : data.id,
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
                console.log(`Error: ${data.message}`);
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
                // console.log("Pong");
                break;
        }
    }

    initListeners(){
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
                receiver: e.detail.reciever,
                content: e.detail.message
            }));
        });

    }
}

export  {ws}