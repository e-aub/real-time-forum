import { router } from "/static/scripts/router.js";

class Page {
    constructor(){
        this.router = router;
    }
        
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

                    <div class="users-list">
                        <h3>Contacts</h3>
                        <ul class="user-list">
                            <!-- Users will be dynamically added here -->
                        </ul>
                    </div>

                    <div class="chat-list">
                        <ul class="user-list">
                            <!-- Chats will be dynamically added here -->
                        </ul>
                    </div>

                    <!-- Comments section -->
                    <div id="backgroundOverlay" class="background-overlay"></div>
                    <div id="commentsSection" class="comment-section">
                        <!-- Comments modal content -->
                    </div>

                    <div class="chat-container">
                        <!-- chat windows wil be addede here -->
                    </div>`;
}


export { Page, ParseHomeTemplate, loginTemplate, signUpTemplate };