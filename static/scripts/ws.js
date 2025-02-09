
class ws{
    constructor(){
        this.ws = new WebSocket(`ws://${window.location.hostname}:8000/api/ws`);
        this.ws.onopen = (event)=> this.onopen.bind(this, event);
        this.ws.onmessage = this.onmessage.bind(this);
        this.ws.onclose = this.onclose.bind(this);
    }

    onopen(){
        console.log("Connected to WebSocket server");
    }

    onmessage(event){
        console.log(event.data);
        let data = JSON.parse(event.data);
        switch(data.type){
            case "status":
                let statusEvent = new Event('status'
                    , {
                        detail: {
                            user_name: data.user_name,
                            online: data.online,
                        }
                    }
                );
                console.log(`User: ${data.user_name}, Online: ${data.online}`);
                document.dispatchEvent(statusEvent);
                break;
            case "message":
                chatEvent = new Event('message'
                    , {
                        detail: {
                            message: data.message,
                            sender: data.sender,
                            timeStamp: data.creation_date,
                        }
                    }
                );
                document.dispatchEvent(chatEvent);
                console.log(`Message from ${data.sender}: ${data.message}`);
                break;
            case "error":
                console.log(`Error: ${data.message}`);
                break;
            case "typing":
                typingEvent = new Event('typing'
                    , {
                        detail: {
                            sender: data.sender,
                        }
                    }
                );
                document.dispatchEvent(typingEvent);
                console.log(`Message from ${data.sender}: ${data.message}`);
                break;
        }
    }
}