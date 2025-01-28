import { Page, loginTemplate } from "./pages.js";

export class LoginPage extends Page {
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

            this.navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login. Please try again.');
        }
    }

    render() {
        document.body.innerHTML = loginTemplate;
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
            this.navigate('/signup');
        });
    }
}