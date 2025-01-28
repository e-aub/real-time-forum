export class HomePage {
    render() {
        document.body.innerHTML = '';
        const a = document.createElement('a');
        a.addEventListener('click', (e) => {
            e.preventDefault();
            router.go('/signup');
        });
        a.textContent = 'signup';
        document.body.appendChild(a);
    }
}
