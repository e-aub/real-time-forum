// const url = `http://${window.location.hostname}:8000/api/test`;

// for (let i = 0; i < 300; i++) {
//   fetchAndResult(url);
// }

// await new Promise((resolve) => setTimeout(resolve, 3000));

// for (let i = 0; i < 300; i++) {
//   fetchAndResult(url);
// }

// function fetchAndResult(url) {
//   fetch(url)
//     .then((response) => console.log(response.status))
//     .catch((error) => console.error(error));
// }

function wsTest() {
  const wsurl = `ws://${window.location.hostname}:8080/api/ws`;
  const ws = new WebSocket(wsurl);
  ws.onclose = () => {
    console.log("WebSocket Client Closed");
    ws.close();
    return;
  };
  ws.onopen = () => {
    console.log("WebSocket test Client Connected");
    let i = 0;
    for (i; i < 300; i++) {
        ws.send(JSON.stringify({
            type: "message",
            id: i,
            receiver: "tantan",
            content: `Hello, this is message ${i}`,
        }));
    }
  };

  ws.onmessage = (message) => {
    console.log(message.data);
  };

  
}
export { wsTest };