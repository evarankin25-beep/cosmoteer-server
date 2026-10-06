const WebSocket = require('ws');

// Запускаем сервер на порту, который выдаст облако Render (или на 8080 по умолчанию)
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// Хранилище для сетки нашего общего корабля Cosmoteer 3D
// Ключ: "x,y,z", Значение: тип блока (1 - броня, 2 - реактор, 3 - пушка)
let shipGrid = {
    "0,0,0": 3,  // Пушка на носу
    "0,0,-1": 1, // Корпус (броня)
    "0,0,-2": 2  // Двигатель
};

console.log(`Сервер Cosmoteer запущен на порту ${PORT}`);

wss.on('connection', (ws) => {
    console.log('Новый игрок подключился к космосу!');

    // Как только игрок зашел, сразу отправляем ему текущее состояние корабля
    ws.send(JSON.stringify({ type: "initShip", grid: shipGrid }));

    // Слушаем команды от игроков
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            // Если игрок нажал кнопку "Построить блок"
            if (data.type === "buildBlock") {
                const key = `${data.x},${data.y},${data.z}`;
                shipGrid[key] = data.blockType; // Сохраняем на сервере

                // Рассылаем обновленный блок ВШЕМ подключенным игрокам (Широковещание)
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
            console.error("Ошибка обработки пакета:", e);
        }
    });

    ws.on('close', () => {
        console.log('Игрок отключился.');
    });
});