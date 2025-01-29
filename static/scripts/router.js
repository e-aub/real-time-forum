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
        // let links = document.getElementsByTagName('link');
        // for (let i = 0; i < links.length; i++) {
        //     links[i].remove();
        // }
        // let preloadLink = document.createElement('link');
        // preloadLink.rel = 'preload';
        // preloadLink.href = `static/styles${routeName}${routeName == "/" ? "style" : ""}.css`;
        // preloadLink.as = 'style';
        // document.head.appendChild(preloadLink);
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
    '/': new HomePage(),
    '/login': new LoginPage(),
    '/signup': new SignupPage(),
});

export { router };