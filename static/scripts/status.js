class ws{
    constructor(){
        this.ws = new WebSocket('ws://localhost:8000/ws');
        this.ws.onopen = this.onopen.bind(this);
        this.ws.onmessage = this.onmessage.bind(this);
        this.ws.onclose = this.onclose.bind(this);
    }

    onopen(){
        console.log("Connected to WebSocket server");
    }

    onmessage(event){
        console.log(event.data);
        let data = JSON.parse(event.data);
        if(data.type === "message"){

        }
    }
}