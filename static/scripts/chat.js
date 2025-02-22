import { status } from "/static/scripts/status.js";
import { newEl } from "./utils.js";

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
            const audio = new Audio('/static/audio/message.mp3');
            audio.play();
            
            const statusListUl = this.usersListHtmlElement.querySelector('.user-list');
            const user = this.users.get(e.detail.sender);
            const statusListElement = user.statusListElement;
            statusListUl.prepend(statusListElement);
            
            if (this.chatWindows.has(e.detail.sender)) {
                var chatWindow = this.chatWindows.get(e.detail.sender);
                    chatWindow.typingIndicator.classList.remove('visible');
                    const chatContainer = chatWindow.messagesContainer;
                    const messageElement = this.#createMessageElement(e.detail.sender, e.detail);
                    chatContainer.appendChild(messageElement);
                    chatContainer.scroll(0, chatContainer.scrollHeight);
            }
        
            if (!chatWindow || !chatWindow.focused) {
                user.statusListElement.classList.add('has-unread');
            }
        });
        

        document.addEventListener('typing', (e) => {
            let receiver = e.detail.sender;
            let isTyping = e.detail.typing;
            if (this.chatWindows.has(receiver) && this.chatWindows.get(receiver).focused) {              
                let messagesContainer = this.chatWindows.get(receiver).messagesContainer;

                let typingIndicator = messagesContainer.querySelector('.typing-indicator');
                typingIndicator.classList.toggle('visible', isTyping);

                if (isTyping) {
                    this.chatWindows.get(receiver).typingSound.pause();
                    this.chatWindows.get(receiver).typingSound.play();
                } else {
                    this.chatWindows.get(receiver).typingSound.pause();
                }
 
                messagesContainer.scrollTop = messagesContainer.scrollHeight;

            }
        });
    }

    async createChatWindow(user) {
        const [chatWindow, chatMessages, typingIndicator] = this.createChatWindowElement(user.username, `${user.firstname} ${user.lastname}`, user.avatar);
        this.chatWindowContainerHtmlElement.prepend(chatWindow);
        const typingSound = new Audio('/static/audio/typing.mp3');
        typingSound.loop = true;
        this.chatWindows.set(user.username, { element: chatWindow, messagesContainer: chatMessages,typingIndicator: typingIndicator, focused: true, isTyping: false, typingTimeout: null, typingSound: typingSound, lastSentId: 0 });
        await this.loadOldMessages(user.username, true);
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
        minimizeBtn.addEventListener('click', () => {
            this.hideChatWindow(this.users.get(username));
        });
        chatActions.appendChild(minimizeBtn);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        
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

        document.addEventListener(`chatWindowError-${username}`, (e) => {
            console.log(e.detail);
            let msg = messagesContainer.querySelector(`.message-text[data-err-id="${e.detail.message_id}"]`);
            msg.textContent = 'This message was not sent. Please try again.';
            msg.style.color = 'red';
        })
            

        return [chatWindow, messagesContainer, typingIndicator];
    }

    #hideIfReachedMaxChatWindows() {
        let [focusedWindowsCount, firstWindowUserName] = this.getFocusedWindowsCount();
        const maxWindows = document.body.clientWidth < 700 ? 1 : Math.ceil((document.body.clientWidth - 700) / 320);
        if (focusedWindowsCount >= maxWindows) {
            this.hideChatWindow(this.users.get(firstWindowUserName));
        }
    }
    async openChatWindow(user) {
      
     
        if (!this.chatWindows.has(user.username)) {
            this.#hideIfReachedMaxChatWindows();
            this.popFromChatList(user);
            await this.createChatWindow(user);
        } else {
            let chatWindow = this.chatWindows.get(user.username);
            if (!chatWindow.focused) {
                this.#hideIfReachedMaxChatWindows();
                this.popFromChatList(user);
                this.chatWindowContainerHtmlElement.prepend(chatWindow.element);
                chatWindow.focused = true;
                chatWindow.element.style.display = 'flex';
                chatWindow.element.scroll(0, chatWindow.element.scrollHeight);
            }
        }
        if (user.statusListElement.classList.contains('has-unread')) {
            try{
                const receivedMessages = this.chatWindows.get(user.username).messagesContainer.querySelectorAll('.message.received:not(.typing-indicator)');
                const lastMessageId = receivedMessages[receivedMessages.length - 1].dataset.id;

                
                const queryParams = new URLSearchParams({
                    message_id: lastMessageId
                })

                const res = await fetch(`/api/seen?${queryParams.toString()}`, {
                    method: 'PUT',
                }
                )

                if (res.status === 204){
                    user.statusListElement.classList.remove('has-unread');
                }
            }catch(err){
                console.error(err);
            }            
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
            <img src="${user.avatar}" alt="${user.username}" title="${user.firstname} ${user.lastname}" class="user-avatar"/>
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
        messages?.forEach(message => {
            chatContainer.prepend(this.#createMessageElement(username, message));
            if (scroll) {
                chatContainer.scroll(0, chatContainer.scrollHeight);
            }
        })
    }

    #createMessageElement(username, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', message.sender !== username ? 'sent' : 'received');
        messageElement.dataset.id = message.id;
        let avatar = (this.users.get(message.sender)?.avatar ? this.users.get(message.sender).avatar : this.myData.avatar_url);
        const img = newEl('img', { src: avatar, class: 'message-avatar', alt: message.sender });
        const messageTime = newEl('div', { class: 'message-time' });
        messageTime.textContent = message.creation_date;
        const messageText = newEl('div', { class: 'message-text' });
        if (message.sentErrId) messageText.dataset.errId = `${message.sentErrId}`;
        messageText.textContent = message.message;
        const messageContent = newEl('div', { class: 'message-content' }, messageTime, messageText);
        messageElement.append(img, messageContent);
        return messageElement;
    }

    #messageValid(message) {
        message = message.trim();
        return message.length > 0 && message.length <= 500;
    }

    sendMessage(messagesContainer, messageContent, username, avatar) {
        const chatWindow = this.chatWindows.get(username);
        chatWindow.lastSentId++;
        let messageElement = this.#createMessageElement(username, {
            message: messageContent, avatar: avatar, creation_date: new Date().toLocaleString('en-CA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(',', ''),
            sentErrId: chatWindow.lastSentId
        });
        const statusListUl = this.usersListHtmlElement.querySelector('.user-list');
        const user = this.users.get(username);
        const statusListElement = user.statusListElement;
        statusListUl.prepend(statusListElement);
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scroll(0, messagesContainer.scrollHeight);
        
        let typingEvent = new CustomEvent('sendtyping', { detail: { username: username, is_typing: false } });
        document.dispatchEvent(typingEvent);

        let e = new CustomEvent('sendmessage', {
            detail: {
                reciever: username,
                message: messageContent,
                id: chatWindow.lastSentId
            }
        })
        document.dispatchEvent(e);
    }
}

export { Chat };