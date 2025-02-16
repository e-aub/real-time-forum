
class ws{
    constructor(){
        this.ws = new WebSocket(`ws://${window.location.hostname}:8080/api/ws`);
        this.ws.onopen = (event)=> this.onopen.bind(this);
        this.ws.onmessage = this.onmessage.bind(this);
        this.ws.onerror = (event) => this.reconnect.bind(this);
        this.initListeners();
    }

    reconnect(event){
        console.log("Reconnecting to WebSocket server");
        this.ws = new WebSocket(`ws://${window.location.hostname}:8080/api/ws`);
        this.ws.onopen = (event)=> this.onopen.bind(this);
        this.ws.onmessage = this.onmessage.bind(this);
        this.ws.onerror = (event) => this.reconnect.bind(this);
    }

    onopen(){
        console.log("Connected to WebSocket server");
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
                console.log(`User: ${data.user_name}, Online: ${data.online}`);
                document.dispatchEvent(statusEvent);
                break;
            case "message":
                console.log(data);
                let chatEvent = new CustomEvent('message'
                    , {
                        detail: {
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