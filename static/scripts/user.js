class User{
    constructor(data){
        this.firstname = data.firstname;
        this.lastname = data.lastname;
        this.username = data.username;
        this.avatar = data.avatar;
        this.chatListElement = null;
        this.conversationWindow = null;
        this.statusListElement = null;
    }
    
    initEventListeners(){
        
    }


}

export { User };