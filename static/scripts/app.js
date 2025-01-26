class Router {
    constructor(routes) {
        this.routes = routes || {};
        this.#initialize();
    }

    add(routeName, callback) {
        this.routes[routeName] = callback;
    }

    #initialize() {
        this.#route(location.pathname);

        window.addEventListener('popstate', () => {
            this.#route(location.pathname);
        });
    }

    #route(routeName) {
        const route = this.routes[routeName];
        console.log(route);
        
        if (route) {
            route();
        } else {
            this.#render404();
        }
    }

    go(routeName) {
        console.log(`Navigating to ${routeName}`);

        history.pushState(null, null, routeName);

        this.#route(routeName);
    }

    #render404() {
        document.body.textContent = '404 - Page Not Found';
    }
}

const router = new Router({
    '/about': () => {
        document.body.innerHTML = '';
        const a = document.createElement('a');
        a.addEventListener('click', (e) => {
            e.preventDefault();
            router.go('/');
        })
        a.textContent = 'Home';
        document.body.appendChild(a);
    },
    '/': () => {
        document.body.innerHTML = '';
        const a = document.createElement('a');
        a.addEventListener('click', (e) => {
            e.preventDefault();
            router.go('/about');
        })
        a.textContent = 'About';
        document.body.appendChild(a);
    }
});
