import { Page, homeTemplate } from "./pages.js";

export class HomePage extends Page {
    constructor(){
        super();
    }
    render(){
        document.querySelector("#app").innerHTML = homeTemplate;
    }

}
