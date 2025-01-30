const url = "http://localhost:8000/api/test";

for (let i = 0; i < 300; i++) {
    fetchAndResult(url);
}

await new Promise(resolve => setTimeout(resolve, 3000));

for (let i = 0; i < 300; i++) {
    fetchAndResult(url);
}

function fetchAndResult(url){
    fetch(url)
        .then(response => console.log(response.status))
        .catch(error => console.error(error));}