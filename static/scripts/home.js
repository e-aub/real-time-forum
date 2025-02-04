import { Page, ParseHomeTemplate } from "./pages.js";

export class HomePage extends Page {
    constructor() {
        super();
        this.overlay = null;
        this.createPostPopup = null;
    }

    async render() {
        try {
            const response = await fetch('/api/authenticated');
            if (response.status === 200) {
                const data = await response.json();
                document.querySelector("#app").innerHTML = await ParseHomeTemplate(data);
                this.overlay = document.querySelector('.overlay');
                this.init();
            } else if (response.status === 401) {
                this.navigate('/login');
                return;
            } else {
                throw new Error('Authentication error');
            }
        } catch (error) {
            document.querySelector("#app").innerHTML = error.message;
        }
    }

    init() {
        const createPostInput = document.getElementById('create-post-input');
        this.createPostPopup = document.querySelector('.create-post-popup');
        const profilePopup = document.querySelector('.profile-popup');

        createPostInput.addEventListener('click', () => {
            this.toggleHidden([this.createPostPopup, this.overlay])
            this.createPostPopup.querySelector('.form-input').focus();
        });
        this.overlay.addEventListener('click', (e) => this.toggleHidden([e.target, this.createPostPopup]));

        document.getElementById('createPostForm').addEventListener('submit', (e) => this.createPost(e));
        document.querySelector(".user-profile").addEventListener('click', async (e) => {
            if (e.target.classList.contains("logout-btn")){
                await fetch('/api/logout', {
                    method: 'POST'
                }).then(response => {
                    if (response.ok) {
                        this.navigate('/login');
                    }
                })
            }
            this.toggleHidden([profilePopup])
        });
    }

    toggleHidden(targets) {
        for (const target of targets) {
            target.classList.toggle('hidden');
        }
    }

    async createPost(event) {
        event.preventDefault();

        const content = event.target.querySelector('.form-input').value;
        const selectedCategories = this.getSelectedCategories(event.target);

        if (!this.isValidPost(content, selectedCategories)) {
            return;
        }

        const data = {
            content: content,
            categories: selectedCategories
        };

        try {
            const response = await this.sendCreatePostRequest(data);

            if (!response.ok) {
                if (response.status === 400) {
                    const errorData = await response.json();
                    this.displayError(errorData.message);
                } else {
                    throw new Error('Create post error');
                }
            } else {
                console.log("Post created successfully");
                event.target.reset();
                this.toggleHidden([this.createPostPopup, this.overlay]);
                //EXEMPLE
                const postData = {
                    id: '123',
                    author: {
                        name: 'John Doe',
                        avatar: '/path/to/avatar.jpg'
                    },
                    content: 'This is my first post!',
                    timestamp: new Date(),
                    categories: ['Politics', 'Science', 'Help', 'Funny', 'Entertainment']
                };

                // Create and append post
                const postElement = this.createPostElement(postData);
                document.querySelector('.posts-feed').appendChild(postElement);
            }
        } catch (error) {
            console.error(error);
            this.displayError("Something went wrong while creating the post.");
        }
    }

    getSelectedCategories(form) {
        const selectedCategories = [];
        form.querySelectorAll('input[name="category"]:checked').forEach(checkbox => {
            selectedCategories.push(checkbox.value);
        });
        return selectedCategories;
    }


    isValidPost(content, selectedCategories) {
        let valid = true;
        const errorMessageElement = document.querySelector('.error-text');
        errorMessageElement.textContent = '';

        if (!content.trim()) {
            valid = false;
            errorMessageElement.textContent = 'Content cannot be empty.';
        }

        if (selectedCategories.length === 0) {
            valid = false;
            errorMessageElement.textContent = errorMessageElement.textContent
                ? errorMessageElement.textContent + ' At least one category must be selected.'
                : 'At least one category must be selected.';
        }

        return valid;
    }

    async sendCreatePostRequest(data) {
        return await fetch('api/create_post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    }

    displayError(message) {
        const errorElement = document.querySelector('.error-text');
        errorElement.textContent = message;
    }




    ///////////////////////////////////////////////////

    createPostElement(postData) {
        const postElement = document.createElement('article');
        postElement.className = 'post';
        postElement.id = `post-${postData.id}`;
    
        const header = document.createElement('div');
        header.className = 'post-header';
    
        const avatar = document.createElement('img');
        avatar.src = postData.author.avatar || '/default-avatar.jpg';
        avatar.alt = `${postData.author.name}'s avatar`;
        header.appendChild(avatar);
    
        const headerInfo = document.createElement('div');
        headerInfo.className = 'post-header-info';
    
        const authorName = document.createElement('h4');
        authorName.textContent = postData.author.name;
        headerInfo.appendChild(authorName);
    
        const timeElement = document.createElement('div');
        timeElement.className = 'post-time';
        timeElement.textContent = this.formatTimestamp(postData.timestamp);
        headerInfo.appendChild(timeElement);
    
        header.appendChild(headerInfo);
    
        if (postData.categories && postData.categories.length > 0) {
            const categoriesContainer = document.createElement('div');
            categoriesContainer.className = 'categories-container';
    
            postData.categories.forEach(category => {
                const categoryTag = document.createElement('span');
                categoryTag.className = `category-tag ${category.toLowerCase()}`;
                categoryTag.textContent = category;
                categoriesContainer.appendChild(categoryTag);
            });
    
            header.appendChild(categoriesContainer);
        }
    
        const content = document.createElement('div');
        content.className = 'post-content';
        content.textContent = postData.content;
    
        const actions = document.createElement('div');
        actions.className = 'post-actions';
    
        const likeAction = this.createAction('Like', '👍');
        likeAction.addEventListener('click', () => this.handleLike(postData.id));
    
        const commentAction = this.createAction('Comment', '💬');
        commentAction.addEventListener('click', () => this.handleComment(postData.id));
    
        actions.appendChild(likeAction);
        actions.appendChild(commentAction);
    
        postElement.appendChild(header);
        postElement.appendChild(content);
        postElement.appendChild(actions);
    
        return postElement;
    }

    createAction(text, icon) {
        const action = document.createElement('button');
        action.className = 'post-action';
        action.innerHTML = `${icon} ${text}`;
        return action;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    handleLike(postId) {
        console.log(`Liked post ${postId}`);
    }

    handleComment(postId) {
        console.log(`Comment on post ${postId}`);
    }
}
