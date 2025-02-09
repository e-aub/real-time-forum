import { Page, signUpTemplate } from "/static/scripts/pages.js";

export class SignupPage extends Page {
    constructor() {
        super();
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
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Nickname can only contain letters, numbers, hyphen and underscores';
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
            return `Password must include ${!hasUpper ? 'uppercase, ' : ''}${!hasLower ? 'lowercase, ' : ''}${!hasDigit ? 'digit, ' : ''}${!hasSpecial ? 'special character' : ''}`;
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
                        this.errors.nickname = 'Nickname already taken';
                    } else if (errorData.message.includes('email')) {
                        this.errors.email = 'Email already registered';
                    }
                    this.updateErrorMessages();
                } else {
                    throw new Error(errorData.message || 'Signup failed');
                }
                return;
            }

            this.navigate('/login');
        } catch (error) {
            console.error('Signup error:', error);
            alert('An error occurred during signup. Please try again.');
        }
    }

    render() {
        document.querySelector("#app").innerHTML = signUpTemplate;

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
            this.navigate('/login');
        });
    }
}