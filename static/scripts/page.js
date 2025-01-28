import { router } from "./router.js";

export class Page {
    navigate(path) {
        router.go(path);
    }
}