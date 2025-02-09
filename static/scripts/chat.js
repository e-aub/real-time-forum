class status{
    constructor(){
        this.friends = new Map();

    }
}

class user{
    constructor(data){
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.chatListElement = null;
        this.conversationWindow = null;
        this.statusListElement = null;
    }
    
    initEventListeners(){
    }
}