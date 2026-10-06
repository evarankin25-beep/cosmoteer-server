const WebSocket = require('ws');
const http = require('http');

// Создаем простейший HTTP-сервер, через который сокеты гарантированно пройдут на Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Cosmoteer Server is Running!\n');
});

const wss = new WebSocket.Server({ server });

let shipGrid = {
    "0,0,0": 3,  // Пушка на носу
    "0,0,-1": 1, // Броня
    "0,0,-2": 2  // Двигатель
};

wss.on('connection', (ws) => {
    console.log('Игрок вошел в систему!');
    ws.send(JSON.stringify({ type: "initShip", grid: shipGrid }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === "buildBlock") {
                const key = `${data.x},${data.y},${data.z}`;
                shipGrid[key] = data.blockType;

                const response = JSON.stringify({
                    type: "updateShip",
                    x: data.x, y: data.y, z: data.z,
                    blockType: data.blockType
                });

                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(response);
                    }
                });
            }
        } catch (e) {
            console.error(e);
        }
    });
});

// Запускаем на порту, который требует Render
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Сетевой мост запущен на порту ${PORT}`);
});
