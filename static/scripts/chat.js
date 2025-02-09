import { status } from "/static/scripts/status.js";

class chat extends status {
    constructor() {
        super();
        this.chatWindowContainerHtmlElement = null;
        this.chatListContainerHelElement = null;
        this.chatWindows = new Map();
        this.chatList = new Map();
        this.init();
    }

    init() {
        this.chatWindowContainerHtmlElement = document.querySelector('.chat-window-container');
        this.chatListContainerHelElement = document.querySelector('.user-list');
        this.chatListContainerHelElement.addEventListener('click', (e) => {
            console.log("dataset", e.target.dataset.username, "userInMap:",this.users.get(e.target.dataset.username));
            
            this.createChatWindow(this.users.get(e.target.dataset.username));
        });
    }


    
    createChatWindow(user) {
        let chatWindw = new chatWindow(user);
        this.chatWindows.set(user, chatWindw);
        this.pushToChatList(user);
    }

    openChatWindow(user) {
        if (!this.chatWindows.has(user)) {
            if (this.chatWindows.size > 3) {
                let [firstChatWindow] = [...this.chatWindows][1];
                this.hideChatWindow(firstChatWindow);
                this.createChatWindow(user);
            } else {
                this.createChatWindow(user);
            }
        }else if (this.chatWindows.has(user) && !this.chatWindows.get(user).focused){
            let chatWindow = this.chatWindows.get(user);
            chatWindow.focused = true;
            chatWindow.chatWindowHtmlElement.style.display = 'flex';
        }

    }

    
    hideChatWindow(user) {
        let chatWindow = this.chatWindows.get(user);
        this.pushToChatList(user);
        chatWindow.focused = false;
        chatWindow.chatWindowHtmlElement.style.display = 'none';
    }

    removeChatWindow(user) {
        let chatWindow = this.chatWindows.get(user);
        chatWindow.chatWindowHtmlElement?.remove();
        this.chatWindows.delete(user);
    }

    pushToChatList(user) {
        console.log(user);
        
        if (!this.chatList.has(user)) {
            if (this.chatList.size > 10) {
                let [firstChatListItem] = [...this.chatList][1];
                this.popFromChatList(firstChatListItem);
                this.createChatListListItem(user);
            } else {
                this.createChatListListItem(user);
            }
        }else if (this.chatList.has(user) && !this.chatList.get(user).focused){
            let chatListItem = this.chatList.get(user);
            chatListItem.focused = true;
            chatListItem.chatListHtmlElement.style.display = 'flex';
        }
    }

    popFromChatList(user) {
        this.chatList.get(user).chatListHtmlElement.display = 'none';
    }

    createChatListListItem(user) {
        const chatListItem = document.createElement('li');
        chatListItem.classList.add('user-item');
        chatListItem.dataset.username = user.username;

        chatListItem.innerHTML = `
            <img src="${user.avatar}" alt="${user.username}" class="user-avatar"/>
            <span>${user.firstname } ${user.lastname}</span>
        `;
        this.chatListContainerHelElement.appendChild(chatListItem);
    }


}

class chatWindow {
    constructor(user) {
        this.user = user;
        this.chatWindowHtmlElement = null;
        this.focused = false;
    }

    createChatWindow(username, avatar) {
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.id = `chat-window-${username}`;

        // Create header
        const header = document.createElement('div');
        header.className = 'chat-header';
        header.innerHTML = `
            <div class="user-info">
                <img src="${avatar}" alt="${avatar}" class="user-avatar"/>
                <div class="header-text">
                    <span class="username">${username}</span>
                </div>
            </div>
            <div class="chat-actions">
                <button class="minimize-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M20 12L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                <button class="close-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;

        // Create messages container
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'chat-messages';
        messagesContainer.id = `messages-${username}`;

        // Create input area
        const inputArea = document.createElement('div');
        inputArea.className = 'chat-input';
        inputArea.innerHTML = `
            <div class="input-wrapper">
                <input 
                    type="text" 
                    placeholder="Type a message..." 
                    id="input-${username}"
                    class="message-input"
                />
            </div>
            <button class="send-btn">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;

        chatWindow.appendChild(header);
        chatWindow.appendChild(messagesContainer);
        chatWindow.appendChild(inputArea);

        return chatWindow;
    }

}


export { chat };