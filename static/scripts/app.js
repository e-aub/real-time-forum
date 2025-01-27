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

class Page {
    render() {
    }
}

class HomePage extends Page {
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

class LoginPage extends Page {
    constructor() {
        super();
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

    // Add password validation method
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
            this.updateFormValidity(); // Add form validity check
        }, 300);
    }

    // Add method to check overall form validity
    updateFormValidity() {
        const form = document.getElementById('loginForm');
        const loginName = form.querySelector('input[name="login_name"]').value;
        const password = form.querySelector('input[name="password"]').value;

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
                    this.errors.login_name = errorData.error;
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
                        
                        <a href="/" class="home-link" id="homeLink">Create an account</a>
                    </div>
                `;
        const style = document.createElement("link");
        style.rel = "stylesheet"
        style.href = "/static/styles/login.css"
        document.head.appendChild(style)
        const form = document.getElementById('loginForm');
        const emailInput = form.querySelector('input[name="login_name"]');
        const passwordInput = form.querySelector('input[name="password"]');
        const homeLink = document.getElementById('homeLink');

        emailInput.addEventListener('input', (e) => {
            this.debounceValidation('login_name', e.target.value);
        });

        passwordInput.addEventListener('input', (e) => {
            this.debounceValidation('password', e.target.value);
        });

        form.addEventListener('submit', (e) => this.handleLogin(e));

        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            router.go('/');
        });
    }
}

class SignupPage extends Page {
    render() {
        document.body.innerHTML = '';
        const a = document.createElement('a');
        a.addEventListener('click', (e) => {
            e.preventDefault();
            router.go('/login');
        });
        a.textContent = 'login';
        document.body.appendChild(a);
    }
}

const router = new Router({
    '/': new HomePage(),
    '/login': new LoginPage(),
    '/signup': new SignupPage()
});
