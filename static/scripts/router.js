import { HomePage } from '/static/scripts/home.js';
import { LoginPage } from '/static/scripts/login.js';
import { SignupPage } from '/static/scripts/signup.js';
import { NotFoundPage } from '/static/scripts/notFound.js';

class Router {
    constructor(classes = {}) {
        this.classes = classes
        this.routes = {};
        this.initialize();
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
        let clas = this.classes[routeName]
        if (!clas) {
            new NotFoundPage();
            history.pushState(null, null, window.location.pathname);
            return;       
        }

        const authenticated = await this.isAuthenticated();
        if (!authenticated && routeName === '/') {
            routeName = '/login';
        }else if (authenticated && (routeName === '/login' || routeName === '/signup')) {
            routeName = '/';
        }

        clas = this.classes[routeName]
        this.routes[routeName] = new clas(); 
        this.routes[routeName].render();

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
}

var router = new Router({
    '/': HomePage,
    '/login': LoginPage,
    '/signup': SignupPage,
});

export { router };
