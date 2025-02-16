import { status } from "/static/scripts/status.js";

class Chat extends status {
    constructor(myData) {
        super();
        this.chatWindowContainerHtmlElement = null;
        this.chatListContainerHtmlElement = null;
        this.usersListHtmlElement = null;
        this.chatWindows = new Map();
        this.chatList = new Map();
        this.myData = myData;
        this.init();
    }

    init() {
        this.chatWindowContainerHtmlElement = document.querySelector('.chat-container');
        this.chatListContainerHtmlElement = document.querySelector('.chat-list .user-list');
        this.usersListHtmlElement = document.querySelector('.users-list');

        this.usersListHtmlElement.addEventListener('click', (e) => {
            let toggleHidden = false;
            if (e.target.parentNode.classList.contains('user-item')) {
                this.openChatWindow(this.users.get(e.target.parentNode.dataset.username));
                toggleHidden = true;
            } else if (e.target.classList.contains('user-item')) {
                this.openChatWindow(this.users.get(e.target.dataset.username));
                toggleHidden = true;
            }

            if (toggleHidden) {
                this.usersListHtmlElement.classList.toggle('active');
            }
        });

        document.addEventListener('message', (e) => {
            if (this.chatWindows.has(e.detail.sender)) {
                let messageElement = this.#createMessageElement(e.detail.sender, e.detail);
                let chatWindow = this.chatWindows.get(e.detail.sender)
                clearTimeout(chatWindow.typingTimeout);
                let chatContainer = chatWindow.messagesContainer;
                let typingIndicator = chatWindow.typingIndicator;
                typingIndicator.classList.remove('visible');
                chatContainer.appendChild(messageElement);
                chatContainer.scroll(0, chatContainer.scrollHeight);
            }
        });

        document.addEventListener('typing', (e) => {
            let receiver = e.detail.sender;
            let isTyping = e.detail.typing;
            if (this.chatWindows.has(receiver) && this.chatWindows.get(receiver).focused) {
                let messagesContainer = this.chatWindows.get(receiver).messagesContainer;

                let typingIndicator = messagesContainer.querySelector('.typing-indicator');
                typingIndicator.classList.toggle('visible', isTyping);
 
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

            }
        });
    }

    createChatWindow(user) {
        const [chatWindow, chatMessages, typingIndicator] = this.createChatWindowElement(user.username, `${user.firstname} ${user.lastname}`, user.avatar);
        this.chatWindowContainerHtmlElement.prepend(chatWindow);
        this.chatWindows.set(user.username, { element: chatWindow, messagesContainer: chatMessages,typingIndicator: typingIndicator, focused: true, isTyping: false, typingTimeout: null });
        this.loadOldMessages(user.username, true);
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

        // typing indicator

        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator', 'message', 'received');
        let userAvatarTyping = document.createElement('img');
        userAvatarTyping.src = avatar;
        userAvatarTyping.alt = username;
        userAvatarTyping.className = 'message-avatar';
        typingIndicator.append(userAvatarTyping);
        const typingIndicatorContent = document.createElement('div');
        typingIndicatorContent.classList.add('message-content')
        typingIndicator.appendChild(typingIndicatorContent);
        const typingIndocatorText = document.createElement('div');
        typingIndocatorText.classList.add('message-text')
        typingIndocatorText.textContent = 'is typing...';
        typingIndicatorContent.appendChild(typingIndocatorText);

        messagesContainer.appendChild(typingIndicator);


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

        messageInput.addEventListener('input', this.#typingHandler.bind(this, username));

        messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                if (!this.#messageValid(messageInput.value)) return;
                this.sendMessage(messagesContainer, messageInput.value, username, avatar);
                messageInput.value = '';
                messageInput.focus();
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
            if (!this.#messageValid(messageInput.value)) return;
            this.sendMessage(messagesContainer, messageInput.value, username, avatar);
            messageInput.value = '';
            messageInput.focus();
        });
        inputArea.appendChild(sendBtn);

        chatWindow.appendChild(header);
        chatWindow.appendChild(messagesContainer);
        chatWindow.appendChild(inputArea);

        messagesContainer.addEventListener('scroll', () => {
            if (messagesContainer.scrollTop <= 20) {
                this.throtteledLoadOldMessages(username);
            }
        });

        return [chatWindow, messagesContainer, typingIndicator];
    }

    openChatWindow(user) {
        let [focusedWindowsCount, firstWindowUserName] = this.getFocusedWindowsCount();
        const maxWindows = document.body.clientWidth < 700 ? 1 : Math.ceil((document.body.clientWidth - 700) / 320);
        let hide = false;
     
    
        if (!this.chatWindows.has(user.username)) {
            this.popFromChatList(user);
            this.createChatWindow(user);
            hide = true;
        } else {
            let chatWindow = this.chatWindows.get(user.username);
            if (!chatWindow.focused) {
                this.popFromChatList(user);
                this.chatWindowContainerHtmlElement.prepend(chatWindow.element);
                chatWindow.focused = true;
                chatWindow.element.style.display = 'flex';
                hide = true;
            }
        }
        if (focusedWindowsCount >= maxWindows && hide) {
            let opponentUser = this.users.get(firstWindowUserName);
            this.hideChatWindow(opponentUser);
        }
    }
    

    getFocusedWindowsCount() {
        let focusedChatWindows = Array.from(this.chatWindows.entries()).filter(chatWindow => chatWindow[1].focused);
        const count = focusedChatWindows.length;
        return count > 0 ? [focusedChatWindows.length, focusedChatWindows[0][0]] : [0, null];
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
        if (!this.chatList.has(user.username)) {
            if (this.chatList.size > 10) {
                let firstChatListItem = Array.from(this.chatWindows.keys())[0];
                this.popFromChatList(firstChatListItem);
            }
            this.createChatListItem(this.users.get(user.username));
        }

        let chatListItem = this.chatList.get(user.username);
        chatListItem.focused = true;
        chatListItem.element.style.display = 'flex';

    }

    popFromChatList(user) {

        let chatListItem = this.chatList.get(user.username);
        if (chatListItem) {
            chatListItem.element.style.display = 'none';
        }
    }

    createChatListItem(user) {
        const chatListItem = document.createElement('li');
        chatListItem.classList.add('user-item');
        chatListItem.dataset.username = `${user.firstname} ${user.lastname}`;


        chatListItem.innerHTML = `
            <img src="${user.avatar}" alt="${user.username}" class="user-avatar"/>
        `;

        chatListItem.addEventListener('click', () => {
            this.openChatWindow(user);
        });

        this.chatList.set(user.username, { element: chatListItem, focused: false });
        this.chatListContainerHtmlElement.prepend(chatListItem);
    }


    #typingHandler(username) {
        let chatWindow = this.chatWindows.get(username);
        clearTimeout(chatWindow.typingTimeout);
        if (!chatWindow.isTyping) {
            chatWindow.isTyping = true;
            const event = new CustomEvent('sendtyping', { detail: { username: username, is_typing: true } });
            document.dispatchEvent(event);
        }
        chatWindow.typingTimeout = setTimeout(() => {
            chatWindow.isTyping = false;
            const event = new CustomEvent('sendtyping', { detail: { username: username, is_typing: false } });
            document.dispatchEvent(event);
        }, 1000);
    }


    debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        }
    }

    async loadOldMessages(username, scroll = false) {
        let chatWindow = this.chatWindows.get(username);
        try {
            if (chatWindow.lastId === -1) {
                return;
            }
            const queryParams = new URLSearchParams({ opponnent: username, offset: chatWindow.lastId ? chatWindow.lastId : "" });
            const resp = await fetch(`/api/messages?${queryParams.toString()}`);
            if (!resp.ok) throw new Error("Error fetching messages");
            const data = await resp.json();

            chatWindow.lastId = data.offset;
            this.appendMessages(username, data.messages, scroll);

        } catch (err) {
            console.error(err);
        }
    }

    throttle(func, delay) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall < delay) {
                return;
            }
            lastCall = now;
            func.apply(this, args);
        }
    }

    throtteledLoadOldMessages = this.throttle(this.loadOldMessages, 1000);

    appendMessages(username, messages, scroll) {
        let chatWindow = this.chatWindows.get(username);
        let chatContainer = chatWindow.element.querySelector('.chat-messages');
        messages.forEach(message => {
            chatContainer.prepend(this.#createMessageElement(username, message));
            if (scroll) {
                chatContainer.scroll(0, chatContainer.scrollHeight);
            }
        })
    }

    #createMessageElement(username, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', message.sender !== username ? 'sent' : 'received');
        let avatar = (this.users.get(message.sender)?.avatar ? this.users.get(message.sender).avatar : this.myData.avatar_url);
        messageElement.innerHTML = `
         <img src="${avatar}" class="message-avatar" alt="${message.sender}">
            <div class="message-content">
            <div class="message-time">${message.creation_date}</div>
            <div class="message-text">${message.message}</div>
            </div>
        `;
        return messageElement;
    }

    #messageValid(message) {
        message = message.trim();
        return message.length > 0;
    }

    sendMessage(messagesContainer, messageContent, username, avatar) {
        let messageElement = this.#createMessageElement(username, {
            message: messageContent, avatar: avatar, creation_date: new Date().toLocaleString('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(',', '')
        });
        messagesContainer.appendChild(messageElement);
        messagesContainer.scroll(0, messagesContainer.scrollHeight);

        let e = new CustomEvent('sendmessage', {
            detail: {
                reciever: username,
                message: messageContent
            }
        })
        document.dispatchEvent(e);
    }
}

export { Chat };