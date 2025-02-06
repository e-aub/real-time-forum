import { HomePage } from './home.js';
import { LoginPage } from './login.js';
import { SignupPage } from './signup.js';

class Router {
    constructor(routes = {}) {
        this.routes = routes;
        this.initialize();
    }

    add(routeName, callback) {
        this.routes[routeName] = callback;
    }

    initialize() {
        window.addEventListener('popstate', () => this.route(location.pathname));
        this.route(location.pathname); 
    }

    async isAuthenticated() {
        try {
            const response = await fetch('/api/authenticated');
            return response.status !== 401;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    async route(routeName, updateHistory = true) {
        const route = this.routes[routeName];
        if (!route) return this.render404();

        const authenticated = await this.isAuthenticated();
        if (!authenticated && routeName === '/') {
            routeName = '/login';
            this.routes[routeName].render();
        }else if (authenticated && (routeName === '/login' || routeName === '/signup')) {
            routeName = '/';
            this.routes[routeName].render();
        }else{
            this.routes[routeName].render();
        }

        if (updateHistory) {
            if (window.history.length > 1) {
                  history.pushState(null, null, routeName);
              } else {
                history.replaceState(null, null, routeName);
              }
        }
    }

    navigate(routeName) {
        this.route(routeName, true);
    }

    render404() {
        document.body.textContent = '404 - Page Not Found';
    }
}

const router = new Router({
    '/': new HomePage(),
    '/login': new LoginPage(),
    '/signup': new SignupPage(),
});

export { router };
