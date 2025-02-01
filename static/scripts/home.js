import { Page, ParseHomeTemplate } from "./pages.js";

export class HomePage extends Page {
    constructor(){
        super();
        this.overlay = null;
    }
    async render(){
        document.body.innerHTML = await ParseHomeTemplate();
        this.overlay = document.querySelector('.overlay');
        this.init();
    }

    init() {
        const createPostInput = document.getElementById('create-post-input');
        let createPostPopup = document.querySelector('.create-post-popup');
        console.log(createPostPopup);
        
        createPostInput.addEventListener('click', () => this.toggleHidden([createPostPopup, this.overlay]));
        this.overlay.addEventListener('click', (e) => this.toggleHidden([e.target, createPostPopup]));
    }

    toggleHidden(targets) {
        for (const target of targets){
            target.classList.toggle('hidden');
        }
    }

}
