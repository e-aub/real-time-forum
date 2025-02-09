class User{
    constructor(data){
        this.firstName = data.firstname;
        this.lastName = data.lastname;
        this.userName = data.username;
        this.avatar = data.avatar;
        this.chatListElement = null;
        this.conversationWindow = null;
        this.statusListElement = null;
    }
    
    initEventListeners(){
        
    }


}

export { User };