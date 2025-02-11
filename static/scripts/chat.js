import { status } from "/static/scripts/status.js";

class Chat extends status {
    constructor() {
        super();
        this.chatWindowContainerHtmlElement = null;
        this.chatListContainerHtmlElement = null;
        this.usersListHtmlElement = null;
        this.chatWindows = new Map();
        this.chatList = new Map();
        this.init();
    }

    init() {
        this.chatWindowContainerHtmlElement = document.querySelector('.chat-container');
        this.chatListContainerHtmlElement = document.querySelector('.chat-list .user-list');
        this.usersListHtmlElement = document.querySelector('.users-list');
        console.log("chat list :", this.chatListContainerHtmlElement);
        
        this.usersListHtmlElement.addEventListener('click', (e) => {
            if (e.target.parentNode.classList.contains('user-item')) {
                this.openChatWindow(this.users.get(e.target.parentNode.dataset.username));
            } else if (e.target.classList.contains('user-item')) {
                console.log(this.users.get(e.target.dataset.username).username);
                this.openChatWindow(this.users.get(e.target.dataset.username));
            }           
        });
    }

    createChatWindow(user) {
        console.log(`Creating chat window for user ${user}`);
        const chatWindow = this.createChatWindowElement(user.username, `${user.firstname} ${user.lastname}`, user.avatar);
        this.chatWindowContainerHtmlElement.appendChild(chatWindow); 
        this.chatWindows.set(user.username, { element: chatWindow, focused: true });
        // this.pushToChatList(user);
    }

    createChatWindowElement(username, fullname, avatar) {
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        chatWindow.id = `chat-window-${username}`;

        //header
        const header = document.createElement('div');
        header.className = 'chat-header';

        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';

        const userAvatar = document.createElement('img');
        userAvatar.src = avatar;
        userAvatar.alt = username;
        userAvatar.className = 'user-avatar';
        userInfo.appendChild(userAvatar);

        const headerText = document.createElement('div');
        headerText.className = 'header-text';

        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'username';
        usernameSpan.textContent = fullname;
        headerText.appendChild(usernameSpan);

        userInfo.appendChild(headerText);
        header.appendChild(userInfo);

        const chatActions = document.createElement('div');
        chatActions.className = 'chat-actions';

        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'minimize-btn';
        minimizeBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M20 12L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
        minimizeBtn.addEventListener('click', () => {
            this.hideChatWindow(this.users.get(username));
        });
        chatActions.appendChild(minimizeBtn);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
        closeBtn.addEventListener('click', () => {
            this.removeChatWindow(username);
        });
        chatActions.appendChild(closeBtn);

        header.appendChild(chatActions);

        //messages container
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'chat-messages';
        messagesContainer.id = `messages-${username}`;

        //message input
        const inputArea = document.createElement('div');
        inputArea.className = 'chat-input';

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'input-wrapper';

        const messageInput = document.createElement('input');
        messageInput.type = 'text';
        messageInput.placeholder = 'Type a message...';
        messageInput.id = `input-${username}`;
        messageInput.className = 'message-input';
        //enter send message event listener
        messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
               
                console.log('Message sent:', messageInput.value);
                messageInput.value = '';
            }
        });
        inputWrapper.appendChild(messageInput);
        inputArea.appendChild(inputWrapper);

        const sendBtn = document.createElement('button');
        sendBtn.className = 'send-btn';
        sendBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
            //send icon event listener
        sendBtn.addEventListener('click', () => {
            console.log('Message sent:', messageInput.value);
            messageInput.value = '';
        });
        inputArea.appendChild(sendBtn);

        chatWindow.appendChild(header);
        chatWindow.appendChild(messagesContainer);
        chatWindow.appendChild(inputArea);

        return chatWindow;
    }

    openChatWindow(user) {
        console.log(this.chatWindows);
        
        if (!this.chatWindows.has(user.username)) {
            if (this.chatWindows.size > 3) {
                let [firstChatWindow] = [...this.chatWindows][1];
                this.hideChatWindow(firstChatWindow);
            }
            this.popFromChatList(user);
            this.createChatWindow(user);
        } else if (this.chatWindows.has(user.username) && !this.chatWindows?.get(user.username).focused) {
            let chatWindow = this.chatWindows.get(user.username);
            this.popFromChatList(user);
            chatWindow.focused = true;
            chatWindow.element.style.display = 'flex';
        }
    }

    hideChatWindow(user) {
        let chatWindow = this.chatWindows.get(user.username);
        if (chatWindow) {
            this.pushToChatList(user);
            chatWindow.focused = false;
            chatWindow.element.style.display = 'none';
        }
    }

    removeChatWindow(username) {
        let chatWindow = this.chatWindows.get(username);
        if (chatWindow) {
            chatWindow.element?.remove();
            this.chatWindows.delete(username);
        }
    }

    pushToChatList(user) {
        console.log(user);
        console.log(this.chatList.has(user.username));
        
        if (!this.chatList.has(user.username)) {            
            console.log("push to chat list");
            if (this.chatList.size > 10) {
                let [firstChatListItem] = [...this.chatList][1];
                this.popFromChatList(firstChatListItem);
            }
            this.createChatListItem(this.users.get(user.username));
        }
            console.log("adjust display");
            
            let chatListItem = this.chatList.get(user.username);
            chatListItem.focused = true;
            chatListItem.element.style.display = 'flex';
        
    }

    popFromChatList(user) {
        console.log("pop from chat list");
        
        let chatListItem = this.chatList.get(user.username);
        if (chatListItem) {
            chatListItem.element.style.display = 'none';
        }
    }

    createChatListItem(user) {
        const chatListItem = document.createElement('li');
        chatListItem.classList.add('user-item');
        chatListItem.dataset.username = `${user.firstname} ${user.lastname}`;

        chatListItem.addEventListener('click', () => {
            this.openChatWindow(user);
        });

        chatListItem.innerHTML = `
            <img src="${user.avatar}" alt="${user.username}" class="user-avatar"/>
        `;

        chatListItem.addEventListener('click', () => {
            this.openChatWindow(user);
        });

        this.chatList.set(user.username, { element: chatListItem, focused: false });
        this.chatListContainerHtmlElement.prepend(chatListItem);
    }
}

export { Chat };