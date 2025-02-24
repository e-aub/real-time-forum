import { NotFoundTemplate } from "/static/scripts/pages.js";
import { Page } from "/static/scripts/pages.js";

class NotFoundPage extends Page {

    constructor() {
        super();
        this.render();
        this.#initListeners();
    }
    render() {
        document.querySelector("#app").innerHTML = NotFoundTemplate;
        this.#initListeners();
    }

    #initListeners() {
        document.querySelector(".login-btn").addEventListener("click", () => {
            this.navigate("/login");
        });
        document.querySelector(".signup-btn").addEventListener("click", () => {
            this.navigate("/signup");
        });

        document.querySelector(".home-link").addEventListener("click", () => {
            this.navigate("/");
        });
    }
}

export { NotFoundPage };