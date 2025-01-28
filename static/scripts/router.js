import { HomePage } from './home.js';
import { LoginPage } from './login.js';
import { SignupPage } from './signup.js';


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


var router = new Router({
    '/': new HomePage(router),
    '/login': new LoginPage(router),
    '/signup': new SignupPage(router),
});

export { router };