import { Page, ParseHomeTemplate } from "./pages.js";

export class HomePage extends Page {
    constructor() {
        super();
        this.overlay = null;
        this.createPostPopup = null;
        this.maxId = null;
    }

    async render() {
        try {
            const response = await fetch("/api/authenticated");
            if (response.ok) {
                const data = await response.json();
                document.querySelector("#app").innerHTML = await ParseHomeTemplate(data);
                this.overlay = document.querySelector('.overlay');
                this.init();
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
        this.setupEventListeners();
        this.getPosts();
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
                try {
                    const response = await fetch("/api/logout", { method: "POST" });
                    if (response.ok) this.navigate("/login");
                } catch (error) {
                    this.displayError("Logout failed.");
                }
            }
            this.toggleHidden([document.querySelector(".profile-popup")]);
        });
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Create post error");
            }

            console.log("Post created successfully");
            form.reset();
            this.toggleHidden([this.createPostPopup, this.overlay]);
            this.getPosts();
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

    // displayError(message) {
    //     document.querySelector(".error-text")?.textContent = message;
    // }

    createPostElement(post) {
        const postElement = document.createElement("article");
        postElement.className = "post";
        postElement.id = `post-${post.post_id}`;
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${post.avatar || "/default-avatar.jpg"}" alt="${post.user_name}'s avatar">
                <div class="post-header-info">
                    <h4>${post.user_name}</h4>
                    <div class="post-time">${this.formatTimestamp(post.created_at)}</div>
                </div>
                <div class="categories-container">
                    ${post.categories.map(cat => `<span class="category-tag ${cat.toLowerCase()}">${cat}</span>`).join(" ")}
                </div>
            </div>
            <pre class="post-content">${post.content}</pre>
            <div class="post-actions">
                <button class="post-action" onclick="handleLike('${post.post_id}')">👍 Like</button>
                <button class="post-action" onclick="handleComment('${post.post_id}')">💬 Comment</button>
            </div>
        `;
        return postElement;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const diff = Math.floor((Date.now() - date) / 1000);
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    }

    async getPosts() {
        try {
            const queryParams = new URLSearchParams({ offset: this.maxId });
            const response = await fetch(`/api/posts?${queryParams}`);
            if (!response.ok) throw new Error("Error fetching posts");
            const posts = await response.json();
            posts.forEach(post => {
                document.querySelector(".posts-feed")?.appendChild(this.createPostElement(post));
            });
        } catch (error) {
            console.error(error);
        }
    }
}

function handleLike(postId) {
    console.log(`Liked post ${postId}`);
}

function handleComment(postId) {
    console.log(`Comment on post ${postId}`);
}
