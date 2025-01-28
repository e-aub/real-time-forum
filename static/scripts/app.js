class Router {
    constructor(routes) {
        this.routes = routes || {};
        this.initialize();
    }

    add(routeName, callback) {
        this.routes[routeName] = callback;
    }

    initialize() {
        this.route(location.pathname);
        window.addEventListener('popstate', () => {
            this.route(location.pathname);
        });
    }

    route(routeName) {
        const route = this.routes[routeName];
        if (route) {
            route.render();
        } else {
            this.render404();
        }
    }

    go(routeName) {
        history.pushState(null, null, routeName);
        this.route(routeName);
    }

    render404() {
        document.body.textContent = '404 - Page Not Found';
    }
}


class HomePage {
    render() {
        document.body.innerHTML = '';
        const a = document.createElement('a');
        a.addEventListener('click', (e) => {
            e.preventDefault();
            router.go('/signup');
        });
        a.textContent = 'signup';
        document.body.appendChild(a);
    }
}

class LoginPage{
    constructor() {
        this.errors = {
            login_name: '',
            password: ''
        };
        this.debounceTimeout = null;
    }

    validateLoginName(value) {
        if (!value) return 'Email or username is required';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmail = emailRegex.test(value);

        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        const isUsername = usernameRegex.test(value);

        if (!isEmail && !isUsername) {
            return 'Please enter a valid email or username';
        }

        return '';
    }

    validatePassword(value) {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
    }

    debounceValidation(inputName, value) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            if (inputName === 'login_name') {
                this.errors.login_name = this.validateLoginName(value);
            } else if (inputName === 'password') {
                this.errors.password = this.validatePassword(value);
            }
            this.updateErrorMessages();
            this.updateFormValidity(); 
        }, 500);
    }

    updateFormValidity() {
        const form = document.getElementById('loginForm');
        const loginName = form.querySelector('input[name="login_name"]').value;
        const password = form.querySelector('input[name="password"]').value;
    
        this.errors.login_name = this.validateLoginName(loginName);
        this.errors.password = this.validatePassword(password);
    
        this.formValid = (
            loginName &&
            password &&
            !this.errors.login_name &&
            !this.errors.password
        );
    }

    updateErrorMessages() {
        const emailError = document.getElementById('email-error');
        const passwordError = document.getElementById('password-error');
        const loginButton = document.querySelector('.login-button');

        if (emailError) emailError.textContent = this.errors.login_name;
        if (passwordError) passwordError.textContent = this.errors.password;

        if (loginButton) {
            loginButton.disabled = !this.formValid;
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const loginData = {
            login_name: formData.get('login_name'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401) {
                    if (errorData.message == "Invalid username or email"){
                        this.errors.login_name = errorData.message;
                        this.errors.password = null;
                    }else{                        
                        this.errors.password = errorData.message;
                        this.errors.login_name = null;
                    }
                    this.updateErrorMessages();
                } else {
                    throw new Error(errorData.error || 'Login failed');
                }
                return;
            }

            router.go('/');
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please try again.');
        }
    }

    render() {
        document.body.innerHTML = `
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
        const style = document.createElement("link");
        style.rel = "stylesheet"
        style.href = "/static/styles/login.css"
        document.head.appendChild(style)
        const form = document.getElementById('loginForm');
        const emailInput = form.querySelector('input[name="login_name"]');
        const passwordInput = form.querySelector('input[name="password"]');
        const signUpLink = document.getElementById('sign-up-link');

        emailInput.addEventListener('input', (e) => {

            this.updateFormValidity()
            this.debounceValidation('login_name', e.target.value);
        });

        passwordInput.addEventListener('input', (e) => {
            this.updateFormValidity()
            this.debounceValidation('password', e.target.value);
        });

        form.addEventListener('submit', (e) => this.handleLogin(e));

        signUpLink.addEventListener('click', (e) => {
            e.preventDefault();
            router.go('/signup');
        });
    }
}

class SignupPage {
    constructor() {
        this.errors = {
            nickname: '',
            age: '',
            gender: '',
            firstname: '',
            lastname: '',
            email: '',
            password: '',
            password2: ''
        };
    }

    validateNickname(value) {
        if (!value) return 'Nickname is required';
        if (value.length < 3) return 'Nickname must be at least 3 characters';
        if (value.length > 20) return 'Nickname must be less than 20 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Nickname can only contain letters, numbers and underscores';
        return '';
    }

    validateName(value, field) {
        if (!value) return `${field} is required`;
        if (value.length < 2) return `${field} must be at least 2 characters`;
        if (!/^[a-zA-Z\s-']+$/.test(value)) return `${field} can only contain letters, spaces, hyphens and apostrophes`;
        return '';
    }

    validateEmail(value) {
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
    }

    validateAge(value) {
        if (!value) return 'Age is required';
        const age = parseInt(value);
        if (isNaN(age)) return 'Please enter a valid age';
        if (age < 13) return 'You must be at least 13 years old';
        if (age > 120) return 'Please enter a valid age';
        return '';
    }

    validateGender(value) {
        if (!value) return 'Please select a gender';
        const validGenders = ['male', 'female'];
        if (!validGenders.includes(value.toLowerCase())) return 'Please select a valid gender';
        return '';
    }

    validatePassword(value) {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        
        const hasLower = /[a-z]/.test(value);
        const hasUpper = /[A-Z]/.test(value);
        const hasDigit = /[0-9]/.test(value);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}; ':"\\|,.<>/?]/.test(value);
        
        if (!hasLower || !hasUpper || !hasDigit || !hasSpecial) {
            return 'Password must include uppercase, lowercase, number, and special character';
        }
        return '';
    }

    validatePassword2(value, password) {
        if (!value) return 'Please confirm your password';
        if (value !== password) return 'Passwords do not match';
        return '';
    }

    updateFormValidity() {
        const form = document.getElementById('signupForm');
        const nickname = form.querySelector('input[name="nickname"]').value;
        const age = form.querySelector('input[name="age"]').value;
        const gender = form.querySelector('select[name="gender"]').value;
        const firstname = form.querySelector('input[name="firstname"]').value;
        const lastname = form.querySelector('input[name="lastname"]').value;
        const email = form.querySelector('input[name="email"]').value;
        const password = form.querySelector('input[name="password"]').value;
        const password2 = form.querySelector('input[name="password2"]').value;

        this.errors.nickname = this.validateNickname(nickname);
        this.errors.age = this.validateAge(age);
        this.errors.gender = this.validateGender(gender);
        this.errors.firstname = this.validateName(firstname, 'First name');
        this.errors.lastname = this.validateName(lastname, 'Last name');
        this.errors.email = this.validateEmail(email);
        this.errors.password = this.validatePassword(password);
        this.errors.password2 = this.validatePassword2(password2, password);

        this.formValid = (
            nickname &&
            age &&
            gender &&
            firstname &&
            lastname &&
            email &&
            password &&
            password2 &&
            !this.errors.nickname &&
            !this.errors.age &&
            !this.errors.gender &&
            !this.errors.firstname &&
            !this.errors.lastname &&
            !this.errors.email &&
            !this.errors.password &&
            !this.errors.password2
        );
    }

    updateErrorMessages() {
        const errorElements = document.querySelectorAll('[id$="-error"]');
        errorElements.forEach(element => {
            const fieldName = element.id.replace('-error', '');
            element.textContent = this.errors[fieldName];
        });

        const signupButton = document.querySelector('.signup-button');
        if (signupButton) {
            signupButton.disabled = !this.formValid;
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const signupData = {
            nickname: formData.get('nickname'),
            age: formData.get('age'),
            gender: formData.get('gender'),
            firstname: formData.get('firstname'),
            lastname: formData.get('lastname'),
            email: formData.get('email'),
            password: formData.get('password'),
            password2: formData.get('password2')
        };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 409) {
                    if (errorData.message.includes('nickname')) {
                        console.log("nickname");
                        
                        this.errors.nickname = 'Nickname already taken';
                    } else if (errorData.message.includes('email')) {
                        console.log("email");
                        this.errors.email = 'Email already registered';
                    }
                    this.updateErrorMessages();
                } else {
                    throw new Error(errorData.message || 'Signup failed');
                }
                return;
            }

            router.go('/login');
        } catch (error) {
            console.error('Signup error:', error);
            alert('An error occurred during signup. Please try again.');
        }
    }

    render() {
        document.body.innerHTML = `
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

        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = "/static/styles/signup.css";
        document.head.appendChild(style);

        const form = document.getElementById('signupForm');
        const inputs = form.querySelectorAll('input, select');
        const loginLink = document.getElementById('loginLink');

        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateFormValidity();
                this.updateErrorMessages();
            });
        });

        form.addEventListener('submit', (e) => this.handleSignup(e));

        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            router.go('/login');
        });
    }
}
const router = new Router({
    '/': new HomePage(),
    '/login': new LoginPage(),
    '/signup': new SignupPage()
});
