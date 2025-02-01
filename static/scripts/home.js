import { Page, ParseHomeTemplate } from "./pages.js";

export class HomePage extends Page {
    constructor(){
        super();
        this.overlay = null;
        this.postError = null;
    }
    async render(){
        document.body.innerHTML = await ParseHomeTemplate();
        this.overlay = document.querySelector('.overlay');
        this.postError = document.querySelector('#create-post-error');
        this.init();
    }

    init() {
        const createPostInput = document.getElementById('create-post-input');
        let createPostPopup = document.querySelector('.create-post-popup');
        console.log(createPostPopup);
        
        createPostInput.addEventListener('click', () => this.toggleHidden([createPostPopup, this.overlay]));
        this.overlay.addEventListener('click', (e) => this.toggleHidden([e.target, createPostPopup]));

        const createPostBtn = document.querySelector('.create-post-button');

        createPostBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target.form);
            try{
                await fetch('/api/create-post', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: formData.get('content'),
                        category: formData.get('category')
                    })
                });
            }catch(error){
                console.error(error);
                this.postError.textContent = error.message;
            }
           
            this.toggleHidden([createPostPopup, this.overlay]);
        });
    }

    toggleHidden(targets) {
        for (const target of targets){
            target.classList.toggle('hidden');
        }
    }

}
