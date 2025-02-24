import { Page, ParseHomeTemplate } from "/static/scripts/pages.js";
import { Chat } from "/static/scripts/chat.js";
import { formatTimestamp, newEl } from "/static/scripts/utils.js";

export class HomePage extends Page {
  constructor() {
    super();
    this.overlay = null;
    this.createPostPopup = null;
    this.maxId = null;
    this.lastCommentId = null;
    this.userData = null;
    this.postData = null;
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
      this.chat = new Chat(this.userData);

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
    // hide comments
    document
      .querySelector("#backgroundOverlay")
      ?.addEventListener("click", (e) => {
        e.target.style.display = "none";
        document.querySelector("#commentsSection").style.display = "none";
      });

    document.querySelector(".mobile-menu-btn")?.addEventListener("click", () => {
      document.querySelector(".users-list")?.classList.toggle("active");
    });

    document
      .getElementById("create-post-input")
      ?.addEventListener("click", () => {
        this.toggleHidden([this.createPostPopup, this.overlay]);
        this.createPostPopup.querySelector(".form-input")?.focus();
      });

    this.overlay?.addEventListener("click", (e) => {
      if (e.target === this.overlay)
        this.toggleHidden([this.overlay, this.createPostPopup]);
    });

    document
      .getElementById("createPostForm")
      ?.addEventListener("submit", (e) => this.createPost(e));

    document
      .querySelector(".user-profile")
      ?.addEventListener("click", async (e) => {
        if (e.target.classList.contains("logout-btn")) {
          const closeEvent = new Event("closeWs");
          document.dispatchEvent(closeEvent);
          try {
            const response = await fetch("/api/logout", { method: "POST" });
            if (response.ok) this.navigate("/login");
          } catch (error) {
            this.displayError("Logout failed.");
          }
        }
        this.toggleHidden([document.querySelector(".profile-popup")]);
      });

    let throttledGetPosts = this.throttle(this.getPosts.bind(this), 500);
    document.addEventListener("scroll", () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 10
      ) {
        if (this.maxId <= 0) {
          console.log("no more posts to show");
          return;
        }
        console.log("SCROLL EVENT");
        throttledGetPosts();
      }
    });
  }

  throttle(func, limit) {
    let inThrottle = false;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  async createPostCommentsPopup(post) {
    // Create post details
    const profileImg = newEl("img", {
      src: `${post.avatar}`,
      class: "profile-img",
      alt: "profile image",
    });

    const username = newEl("p", { class: "profile-username" });
    username.textContent = `${post.first_name} ${post.last_name}`;

    const postHeader = newEl(
      "header",
      { class: "post-header" },
      profileImg,
      username
    );

    const postBody = newEl("pre", { class: "post-body" });
    postBody.textContent = `${post.content}`;
    const postDetails = newEl(
      "article",
      { class: "post-details" },
      postHeader,
      postBody
    );

    const commentList = newEl("div", { class: "comment-list" });

    // Create comment content container
    const commentContent = newEl(
      "div",
      { class: "comment-content" },
      postDetails,
      commentList
    );
    let throttleGetComments = this.throttle(this.getComments.bind(this), 500);
    commentContent.addEventListener("scroll", (e) => {
      const scrollElement = e.target;
      if (scrollElement.scrollTop + scrollElement.clientHeight >= scrollElement.scrollHeight) {
        if (this.lastCommentId <= 0) {
          // console.log("no more comments to show");
          return;
        }
        // console.log("loading more comments");
        throttleGetComments(post.post_id, commentList);
      }
    });

    // Create comment form
    const input = newEl("input", {
      type: "text",
      name: "comment",
      class: "comment-input",
      id: "comment",
      placeholder: "Create your comment...",
      autocomplete: "off",
      required: "true",
    });

    const submitBtn = newEl("button", {
      type: "submit",
      class: "comment-btn",
    });
    submitBtn.textContent = "Send";
    submitBtn.dataset.postid = post.post_id;

    const formGroup = newEl(
      "div",
      { class: "comment-form-group" },
      input,
      submitBtn
    );

    const commentErr = newEl("p", { class: "error-comment-text" });

    const commentForm = newEl(
      "form",
      {
        id: "commentform",
        class: "comment-form",
        method: "POST",
        novalidate: "true",
      },
      formGroup,
      commentErr
    );
    commentForm.addEventListener("submit", (e) => this.createComment(e));
    // Create main container and append everything
    const postContainer = newEl(
      "div",
      { class: "comments-container" },
      commentContent,
      commentForm
    );

    await this.getComments(post.post_id, commentList);

    const section = document.getElementById("commentsSection");
    section.textContent = "";
    section.appendChild(postContainer);
  }

  toggleHidden(elements) {
    elements.forEach((el) => el?.classList.toggle("hidden"));
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
        body: JSON.stringify({ content, categories }),
      });
      let jsonResponse = await response.json();

      if (!response.ok) {
        throw new Error(jsonResponse.message || "Create post error");
      }

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

  async createComment(event) {
    event.preventDefault();
    const form = event.target;
    const content = form.querySelector(".comment-input")?.value.trim();
    const postId = form.querySelector(".comment-btn").dataset.postid;

    if (!content) {
      this.displayCommentError("Comment cannot be empty.");
      return;
    } else if (content.length > 500) {
      this.displayCommentError("Comment is too long.");
    }

    try {
      const response = await fetch("/api/create_comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: parseInt(postId), content: content }),
      });
      let jsonResponse = await response.json();

      if (!response.ok) {
        throw new Error(jsonResponse.message || "Create comment error");
      }
      console.log("Comment created successfully");
      form.reset();

      this.createCommentElement(
        {
          content: jsonResponse.content,
          firstname: this.userData.firstname,
          lastname: this.userData.lastname,
          avatar: this.userData.avatar_url,
        },
        document.querySelector(".comment-list"),
        true
      );
    } catch (error) {
      this.displayCommentError(error);
    }
  }

  getSelectedCategories(form) {
    return [...form.querySelectorAll("input[name='category']:checked")].map(
      (cb) => cb.value
    );
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

  async getComments(postId, commentsContainer) {
    try {
      const params = new URLSearchParams({
        post_id: postId,
        offset: this.lastCommentId,
      });
      const response = await fetch(`/api/comments?${params.toString()}`);
      if (!response.ok) throw new Error("Error fetching comments");
      const data = await response.json();
      this.lastCommentId = data.offset;
      if (!data.comments) {
        this.lastCommentId = 0;
        return;
      }
      for (const comment of data.comments) {
        console.log(comment);
        this.createCommentElement(comment, commentsContainer);
      }
    } catch (error) {
      console.log(error);
    }
  }

  displayError(message) {
    let errDiv = document.querySelector(".error-text");
    errDiv.textContent = message;
  }


  displayCommentError(message) {
    let errDiv = document.querySelector(".error-comment-text");
    errDiv.textContent = message;
  }


  createCommentElement(comment, commentsContainer, newcomment = false) {
    const commentProfileImg = newEl("img", {
      src: comment.avatar,
      class: "profile-img",
      alt: "profile image",
    });

    const commentUsername = newEl("p", { class: "profile-username" });
    commentUsername.textContent = `${comment.firstname} ${comment.lastname}`;

    const commentHeader = newEl(
      "header",
      { class: "comment-header" },
      commentProfileImg,
      commentUsername
    );

    const commentBody = newEl("p", { class: "comment-body" });
    commentBody.textContent = comment.content;

    const commentCard = newEl(
      "article",
      { class: "comment-card" },
      commentHeader,
      commentBody
    );
    if (newcomment) {
      commentsContainer.prepend(commentCard);
    } else {
      commentsContainer.appendChild(commentCard);
    }
  }

  createPostElement(post) {
    /* create post header dom */
    const image = newEl("img", {
      src: `${post.avatar}`,
      alt: `${post.user_name}'s avatar`,
    });
    const fullName = newEl("h4", {});
    fullName.textContent = `${post.first_name} ${post.last_name}`;
    const postTime = newEl("div", { class: `post-time` });
    postTime.textContent = `${formatTimestamp(post.created_at)}`;
    const postHeaderInfo = newEl(
      "div",
      { class: `post-header-info` },
      fullName,
      postTime
    );
    const categories = newEl(
      "div",
      { class: "categories-container" },
      ...post.categories.map((cat) => {
        const span = newEl("span", {
          class: `category-tag ${cat.toLowerCase()}`,
        });
        span.textContent = cat;
        return span;
      })
    );
    const postheader = newEl(
      "div",
      { class: `post-header` },
      image,
      postHeaderInfo,
      categories
    );

    /* create post content dom */
    const postContent = newEl("pre", { class: `post-content` });
    postContent.textContent = `${post.content}`;

    /* create post actions dom */
    const commentButton = newEl("button", {
      class: `post-action`,
      "data-postid": `${post.post_id}`,
    });
    commentButton.textContent = `💬 Comment`;
    const postActions = newEl(
      "div",
      { class: `post-actions` },
      commentButton
    );
    commentButton.addEventListener("click",(e) => {
      const overlay = document.querySelector("#backgroundOverlay")
      overlay.style.display = "block";
      const section = document.querySelector("#commentsSection");
      section.style.display = "block";
      this.createPostCommentsPopup(post); 
      overlay.onclick = () => this.lastCommentId = null;
    });

    const postElement = newEl(
      "article",
      {
        class: `post`,
        id: `post-${post.post_id}`,
      },
      postheader,
      postContent,
      postActions
    );
    return postElement;
  }



  async getPosts() {
    if (this.maxId < 0) return;
    try {
      const queryParams = new URLSearchParams({ offset: this.maxId });
      const response = await fetch(`/api/posts?${queryParams}`);
      if (!response.ok) {
        if (response.status == 404) {
          throw new Error("no more posts to show");
        }
        throw new Error("Error fetching posts");
      }
      const posts = await response.json();
      posts.forEach((post) => {
        document
          .querySelector(".posts-feed")
          ?.appendChild(this.createPostElement(post));
      });
      this.maxId = this.maxId - posts.length;
    } catch (error) {
      console.error(error);
    }
  }
}

function handleLike(postId) {
}
