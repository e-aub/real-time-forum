import { router } from "./router.js";

class Page {
    navigate(path) {
        router.route(path);
    }
}

const signUpTemplate = `
 <div class="signup-container">
                <h1 class="signup-title">Create your account</h1>
                <form class="signup-form" id="signupForm">
                    <div class="form-row">
                        <div class="form-group">
                            <input 
                                type="text" 
                                name="firstname" 
                                class="form-input" 
                                placeholder="First name"
                            >
                            <div class="error-text" id="firstname-error"></div>
                        </div>
                        
                        <div class="form-group">
                            <input 
                                type="text" 
                                name="lastname" 
                                class="form-input" 
                                placeholder="Last name"
                            >
                            <div class="error-text" id="lastname-error"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <input 
                            type="text" 
                            name="nickname" 
                            class="form-input" 
                            placeholder="Nickname"
                        >
                        <div class="error-text" id="nickname-error"></div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <input 
                                type="number" 
                                name="age" 
                                class="form-input" 
                                placeholder="Age"
                                min="13"
                                max="120"
                            >
                            <div class="error-text" id="age-error"></div>
                        </div>

                        <div class="form-group">
                            <select name="gender" class="form-input">
                                <option value="male" selected>Male</option>
                                <option value="female">Female</option>
                            </select>
                            <div class="error-text" id="gender-error"></div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <input 
                            type="email" 
                            name="email" 
                            class="form-input" 
                            placeholder="Email"
                            autocomplete="email"
                        >
                        <div class="error-text" id="email-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <input 
                            type="password" 
                            name="password" 
                            class="form-input" 
                            placeholder="Password"
                            autocomplete="new-password"
                        >
                        <div class="error-text" id="password-error"></div>
                    </div>

                    <div class="form-group">
                        <input 
                            type="password" 
                            name="password2" 
                            class="form-input" 
                            placeholder="Confirm password"
                            autocomplete="new-password"
                        >
                        <div class="error-text" id="password2-error"></div>
                    </div>
    
                    <button type="submit" class="signup-button" disabled>Create Account</button>
                    
                    <div class="divider">or</div>
                </form>
                
                <a href="/login" class="login-link" id="loginLink">Already have an account? Log in</a>
            </div>
`;

const loginTemplate = `
                    <div class="login-container">
                        <h1 class="login-title">Log in to Talk</h1>
                        <form class="login-form" id="loginForm">
                            <div class="form-group">
                                <input 
                                    type="text" 
                                    name="login_name" 
                                    class="form-input" 
                                    placeholder="Email or username"
                                    autocomplete="username"
                                >
                                <div class="error-text" id="email-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <input 
                                    type="password" 
                                    name="password" 
                                    class="form-input" 
                                    placeholder="Password"
                                    autocomplete="current-password"
                                >
                                <div class="error-text" id="password-error"></div>
                            </div>
        
                            <button type="submit" class="login-button" disabled>Log In</button>
                            
                            <div class="divider">or</div>
                        </form>
                        
                        <a href="/signup" class="home-link" id="sign-up-link">Create an account</a>
                    </div>
                `;
async function ParseHomeTemplate(userData) {    
    return `<div class="header">
                        <img class="logo" src="/static/images/logo.png" alt="talk" />
                        <div class="user-profile">
                            <img src="${userData.avatar_url}" alt="User" class="user-avatar" />
                            <div class="profile-popup hidden" id="profilePopup">
                                <button class="logout-btn">Logout</button>
                            </div>
                        </div>
                    </div>
                    <div class="overlay hidden"></div>
                    <div class="container">
                        <div class="create-post">
                            <div class="create-post-body">
                                <div class="create-post-input">
                                    <img src="${userData.avatar_url}" alt="User" class="user-avatar"/>
                                    <input type="text" id="create-post-input" placeholder="What's on your mind, ${userData.firstname} ?" readonly />
                                </div>
                            </div>
                            <div class="create-post-popup hidden">
                                <form id="createPostForm">
                                    <div class="form-group">
                                        <textarea name="content" class="form-input" placeholder="What's on your mind, ${userData.firstname} ?" minlength="1" maxlength="1000" required></textarea>
                                    </div>
                                    <div class="categories">
                                        <label for="funny">Funny
                                        <input id="funny" type="checkbox" name="category" value="funny">
                                        </label>
                                        <label for="help">Help
                                        <input id="help" type="checkbox" name="category" value="help">
                                        </label>
                                        <label for="science">Science
                                        <input id="science" type="checkbox" name="category" value="science">
                                        </label>
                                        <label for="entertainment">Entertainment
                                        <input id="entertainment" type="checkbox" name="category" value="entertainment">
                                        </label>
                                        <label for="random">Random
                                        <input id="random" type="checkbox" name="category" value="random">
                                        </label>
                                    </div>
                                    <div class="error-text" id="create-post-error"></div>
                                    <button type="submit" class="create-post-button">Post</button>
                                </form>
                            </div>
                        </div>

                        <div class="posts-feed">
                            <!-- Posts will be dynamically added here -->
                        </div>
                    </div>

                    <div class="online-users">
                        <h3>Contacts</h3>
                        <ul class="user-list">
                            <li class="user-item" onclick="openChat('yassine abcdef')">
                                <img src="" alt="Shiffu" class="user-avatar"/>
                                <span>yassine abcdef</span>
                                <div class="online-indicator"></div>
                            </li>
                        </ul>
                    </div>

                    <div class="chat-list">
                        <ul class="user-list">
                            <li class="user-item" data-username="John Doe">
                                <img src="/path/to/avatar.jpg" alt="John Doe" class="user-avatar"/>
                                <div class="online-indicator"></div>
                            </li>
                            <!-- For offline users -->
                            <li class="user-item offline" data-username="Jane Smith">
                                <img src="/path/to/avatar.jpg" alt="Jane Smith" class="user-avatar"/>
                                <div class="online-indicator"></div>
                            </li>
                        </ul>
                    </div>

                    <!-- Comments Modals -->
                    <div class="background-overlay"></div>
                    <section class="comments-section">
                    <div class="comments-container">
                        <div class="comment-content">
                        <article class="post-details">
                            <header class="post-header">
                            <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                            <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="post-body">
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex, nam!
                            Placeat molestiae deleniti adipisci facilis accusantium enim,
                            consectetur necessitatibus non. Tempora ad blanditiis harum
                            tempore autem fugiat nihil velit dicta!
                            </p>
                        </article>
                        <!-- Comment Cards -->
                        <div class="comment-list">
                            <article class="comment-card">
                            <header class="comment-header">
                                <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                                <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="comment-body">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex,
                                nam!
                            </p>
                            </article>
                            <article class="comment-card">
                            <header class="comment-header">
                                <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                                <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="comment-body">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex,
                                nam!
                            </p>
                            </article>
                            <article class="comment-card">
                            <header class="comment-header">
                                <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                                <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="comment-body">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex,
                                nam!
                            </p>
                            </article>
                            <article class="comment-card">
                            <header class="comment-header">
                                <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                                <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="comment-body">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex,
                                nam!
                            </p>
                            </article>
                            <article class="comment-card">
                            <header class="comment-header">
                                <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                                <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="comment-body">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex,
                                nam!
                            </p>
                            </article>
                            <article class="comment-card">
                            <header class="comment-header">
                                <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                                <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="comment-body">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex,
                                nam!
                            </p>
                            </article>
                            <article class="comment-card">
                            <header class="comment-header">
                                <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                                <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="comment-body">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex,
                                nam!
                            </p>
                            </article>
                            <article class="comment-card">
                            <header class="comment-header">
                                <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                                <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="comment-body">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex,
                                nam!
                            </p>
                            </article>
                            <article class="comment-card">
                            <header class="comment-header">
                                <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                                <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="comment-body">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex,
                                nam!
                            </p>
                            </article>
                            <article class="comment-card">
                            <header class="comment-header">
                                <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                                <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="comment-body">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex,
                                nam!
                            </p>
                            </article>
                            <article class="comment-card">
                            <header class="comment-header">
                                <img src="${userData.avatar_url}" class="profile-img" alt="profile image" />
                                <p class="profile-username">Yassine Rahhaoui</p>
                            </header>
                            <p class="comment-body">
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex,
                                nam!
                            </p>
                            </article>
                        </div>
                        </div>
                        <!-- Comment Form -->
                        <form id="comment-form" class="comment-form" method="post" novalidate>
                        <div class="comment-form-group">
                            <input
                            type="text"
                            name="comment"
                            class="comment-input"
                            id="comment"
                            placeholder="Create your comment..."
                            autocomplete="off"
                            required
                            />
                            <button type="submit" class="comment-btn">Send</button>
                        </div>
                        </form>
                    </div>
                    </section>

                    <div class="chat-container">
                        <div class="chat-window" id="chat-window-1">
                            <!-- Chat Header -->
                            <div class="chat-header">
                                <div class="user-info">
                                    <img src="avatar" alt="alt" class="user-avatar"/>
                                    <div class="header-text">
                                        <span class="username">eaub</span>
                                        <span class="online-status">Active Now</span>
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
                            </div>

                            <!-- Chat Messages -->
                            <div class="chat-messages" id="messages-1">
                                <!-- Messages will be dynamically added here -->
                                <div class="message-group received">
                                    <img src="1" alt="1" class="message-avatar"/>
                                    <div class="messages">
                                        <div class="message">Hey, how are you?</div>
                                        <div class="message">I was wondering if you're free today?</div>
                                        <div class="message-time">2:30 PM</div>
                                    </div>
                                </div>
                                
                                <div class="message-group sent">
                                    <div class="messages">
                                        <div class="message">Hi! I'm good, thanks!</div>
                                        <div class="message">Yes, I'm free after 4 PM</div>
                                        <div class="message-time">2:31 PM</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Chat Input -->
                            <div class="chat-input">
                                <div class="input-wrapper">
                                    <input 
                                        type="text" 
                                        placeholder="Type a message..." 
                                        id="input-1"
                                        class="message-input"
                                    />
                                </div>
                                <button class="send-btn">
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                         <div class="chat-window" id="chat-window-1">
                            <!-- Chat Header -->
                            <div class="chat-header">
                                <div class="user-info">
                                    <img src="avatar" alt="alt" class="user-avatar"/>
                                    <div class="header-text">
                                        <span class="username">eaub</span>
                                        <span class="online-status">Active Now</span>
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
                            </div>

                            <!-- Chat Messages -->
                            <div class="chat-messages" id="messages-1">
                                <!-- Messages will be dynamically added here -->
                                <div class="message-group received">
                                    <img src="1" alt="1" class="message-avatar"/>
                                    <div class="messages">
                                        <div class="message">Hey, how are you?</div>
                                        <div class="message">I was wondering if you're free today?</div>
                                        <div class="message-time">2:30 PM</div>
                                    </div>
                                </div>
                                
                                <div class="message-group sent">
                                    <div class="messages">
                                        <div class="message">Hi! I'm good, thanks!</div>
                                        <div class="message">Yes, I'm free after 4 PM</div>
                                        <div class="message-time">2:31 PM</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Chat Input -->
                            <div class="chat-input">
                                <div class="input-wrapper">
                                    <input 
                                        type="text" 
                                        placeholder="Type a message..." 
                                        id="input-1"
                                        class="message-input"
                                    />
                                </div>
                                <button class="send-btn">
                                    <svg width="20" height="20" viewBox="0 0 24 24">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>`;
}

export { Page, ParseHomeTemplate, loginTemplate, signUpTemplate };