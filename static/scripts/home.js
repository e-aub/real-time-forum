import { Page, ParseHomeTemplate } from "/static/scripts/pages.js";
import { status } from "/static/scripts/status.js";
import { Chat } from "/static/scripts/chat.js";
import { ws } from "/static/scripts/ws.js";

export class HomePage extends Page {
    constructor() {
        super();
        this.overlay = null;
        this.createPostPopup = null;
        this.maxId = null;
        this.userData = null;
        this.Ws =  new ws();
    }
    async render() {
        try {
            const response = await fetch("/api/authenticated");
            if (response.ok) {
                const data = await response.json();
                this.userData = data;
                document.querySelector("#app").innerHTML = await ParseHomeTemplate(data);
                this.overlay = document.querySelector(".overlay");
                await this.init();
            } else if (response.status === 401) {
                this.navigate("/login");
            } else {
                throw new Error("Authentication error");
            }
        } catch (error) {
            document.querySelector("#app").innerHTML = error.message;
        }
    }

    async init() {
        try {
            const resp = await fetch("/api/max_post_id");
            if (!resp.ok) throw new Error("Error fetching max post ID");
            const data = await resp.json();
            this.maxId = data.max_post_id;
            
        } catch (err) {
            console.error(err);
        }

        this.createPostPopup = document.querySelector(".create-post-popup");
        this.getPosts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById("create-post-input")?.addEventListener("click", () => {
            this.toggleHidden([this.createPostPopup, this.overlay]);
            this.createPostPopup.querySelector(".form-input")?.focus();
        });

        this.overlay?.addEventListener("click", (e) => {
            if (e.target === this.overlay) this.toggleHidden([this.overlay, this.createPostPopup]);
        });

        document.getElementById("createPostForm")?.addEventListener("submit", (e) => this.createPost(e));

        document.querySelector(".user-profile")?.addEventListener("click", async (e) => {
            if (e.target.classList.contains("logout-btn")) {
                this.Ws.ws.close();
                try {
                    const response = await fetch("/api/logout", { method: "POST" });
                    if (response.ok) this.navigate("/login");
                } catch (error) {
                    this.displayError("Logout failed.");
                }
            }
            this.toggleHidden([document.querySelector(".profile-popup")]);
        });

        let throttledGetPosts = this.throttle(this.getPosts.bind(this), 500)
        document.addEventListener("scroll", ()=>{
            
            if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 10){
                if(this.maxId <= 0){
                    console.log("no more posts to show");
                    return
                }
                console.log("SCROLL EVENT");
                throttledGetPosts();
            }
        })
        let chata = new Chat(this.userData);
        // chata.init();
    }

    throttle(func, limit) {
        let inThrottle = false
        return (...args) => {          
            if (!inThrottle) {
                func.apply(args)
                inThrottle = true
                setTimeout(()=>{inThrottle = false}, limit)
            }
        }
    }



    toggleHidden(elements) {
        elements.forEach(el => el?.classList.toggle("hidden"));
    }

    async createPost(event) {
        event.preventDefault();
        const form = event.target;
        const content = form.querySelector(".form-input")?.value.trim();
        const categories = this.getSelectedCategories(form);

        if (!this.isValidPost(content, categories)) return;

        try {
            const response = await fetch("/api/create_post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, categories })
            });
            let jsonResponse = await response.json();

            if (!response.ok) {
                throw new Error(jsonResponse.message || "Create post error");
            }

            console.log("Post created successfully");
            form.reset();
            const postData = {
                post_id: jsonResponse.post_id,
                content: content,
                categories: categories,
                first_name: this.userData.firstname,
                last_name: this.userData.lastname,
                avatar: this.userData.avatar_url,
                created_at: new Date(),
            };
            const postElem = this.createPostElement(postData);
            document.querySelector(".posts-feed")?.prepend(postElem);
            this.toggleHidden([this.createPostPopup, this.overlay]);

        } catch (error) {
            this.displayError(error.message);
        }
    }

    getSelectedCategories(form) {
        return [...form.querySelectorAll("input[name='category']:checked")].map(cb => cb.value);
    }

    isValidPost(content, categories) {
        const errorElement = document.querySelector(".error-text");
        errorElement.textContent = "";

        if (!content) {
            errorElement.textContent = "Content cannot be empty.";
            return false;
        }
        if (categories.length === 0) {
            errorElement.textContent = "At least one category must be selected.";
            return false;
        }
        return true;
    }

    displayError(message) {
        let errDiv = document.querySelector(".error-text");
        errDiv.textContent = message;
    }

    createPostElement(post) {
        /* create post header dom */
        const image = newEl("img",{
            "src":`${post.avatar}`,
            "alt":`${post.user_name}'s avatar`
        })
        const fullName = newEl("h4",{},)
        fullName.textContent = `${post.first_name} ${post.last_name}`
        const postTime = newEl("div",{"class":`post-time`})
        postTime.textContent = `${this.formatTimestamp(post.created_at)}`
        const postHeaderInfo = newEl("div",{"class":`post-header-info`},fullName,postTime)
        const categories = newEl("div", { "class": "categories-container" }, 
            ...post.categories.map(cat => {
                const span = newEl("span", { "class": `category-tag ${cat.toLowerCase()}` });
                span.textContent = cat;
                return span;
            })
        );
        const postheader = newEl("div",{"class":`post-header`},image,postHeaderInfo,categories)

        /* create post content dom */
        const postContent = newEl("pre",{"class":`post-content`})
        postContent.textContent = `${post.content}`

        /* create post actions dom */
        const likeButton = newEl("button",{"class": `post-action`})
        const commentButton = newEl("button",{"class": `post-action`})
        likeButton.textContent = `👍 Like`
        commentButton.textContent = `💬 Comment`
        const postActions = newEl("div", {"class":`post-actions`},likeButton,commentButton)

        const postElement = newEl("article", {
            "class":`post`,
            "id": `post-${post.post_id}`
        },postheader,postContent,postActions)
        return postElement;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        date.setTime(date.getTime() + 3600000)
        const diff = Math.floor((Date.now() - date) / 1000);
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    }

    async getPosts() {
        try {
            console.log(this.maxId);
            const queryParams = new URLSearchParams({ offset: this.maxId });
            const response = await fetch(`/api/posts?${queryParams}`);
            if (!response.ok){
                if (response.status == 404){
                    throw new Error("no more posts to show");
                }
                throw new Error("Error fetching posts");
            }
            const posts = await response.json();
            posts.forEach(post => {
                document.querySelector(".posts-feed")?.appendChild(this.createPostElement(post));
            });
            this.maxId = this.maxId - posts.length;
        } catch (error) {
            console.error(error);
        }
    }
}

function newEl(name, attrs, ...childs) {
    /* create new element */
    const el = document.createElement(name);
    /* add attrebutes to the element */
    if (attrs != undefined) {
        for (let attr of Object.keys(attrs)) {
            el.setAttribute(attr,attrs[attr])
        }
    }
    /* append childs to the element */
    if (childs != undefined) {
        for (let child of childs) {
            el.appendChild(child)
        }
    }
    return el
}

function handleLike(postId) {
    console.log(`Liked post ${postId}`);
}

function handleComment(postId) {
    console.log(`Comment on post ${postId}`);
}
