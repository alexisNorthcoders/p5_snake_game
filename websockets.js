const getWebSocketUrl = () => {
    if (window.location.hostname === "raspberrypi.local") {
        return "ws://raspberrypi.local:4002/ws";
    } else if (window.location.hostname === "alexisraspberry.duckdns.org") {
        return "wss://alexisraspberry.duckdns.org/ws";
    } else {
        console.error("Unknown hostname, defaulting to secure WebSocket");
        return "wss://alexisraspberry.duckdns.org/ws";
    }
};

function connectWebSocket() {

    const userData = JSON.parse(localStorage.getItem("userData"));
    name = userData.username
    playerId = String(userData.userId)

    if (retryCount >= maxRetries) {
        console.error("❌ Maximum retry attempts reached. Stopping WebSocket reconnection.");
        return;
    }

    console.log(`🔄 Attempting WebSocket connection... (Attempt ${retryCount + 1}/${maxRetries})`);

    socket = new WebSocket(getWebSocketUrl() + `?playerId=${playerId}`);

    socket.onopen = () => {
        connected = true;
        console.log("✅ Connected to WebSocket server");
        retryCount = 0;
        clearTimeout(reconnectTimeout);



        console.log(`You joined as ${name}`);
        getUserScore(isAnonymous ? 'anon' : playerId).then(data => {
            const userScores = data.sort((a, b) => b.score - a.score)
            highScore = userScores[0]?.score
            highScores = userScores.slice(0, 3)
        })
        if (!gameStarted && !isGameOver) {
            socket.send(JSON.stringify({
                event: "newPlayer",
                player: { name, id: playerId, colours: { head: snakeColors.head, body: snakeColors.body, eyes: snakeColors.eyes } }
            }));
            socket.send(JSON.stringify({
                event: "getConfig"
            }));

            socket.send(JSON.stringify({
                event: "waitingRoomStatus"
            }));
            measurePing();
        }
    };

    socket.onerror = (error) => {
        console.error("❌ WebSocket connection failed, retrying in 3 seconds...", error);
        retryConnection();
    };

    socket.onmessage = async (event) => {
        try {
            // Handle binary pong
            if (event.data instanceof Blob) {
                const arrayBuffer = await event.data.arrayBuffer();
                const view = new Uint8Array(arrayBuffer);

                if (view.length === 1 && view[0] === 2) {
                    // Binary pong received
                    pingValue = Date.now() - startTime;
                    setTimeout(measurePing, 1000);
                    return;
                }
            }
            if (!event.data.startsWith('{')) {
                switch (event.data) {
                    case "p":
                        pingValue = Date.now() - startTime;
                        setTimeout(measurePing, 1000);
                        return
                }

            }
            const data = JSON.parse(event.data);

            switch (data.event) {
                case "waitingRoomStatus":
                    console.log("waitingRoomStatus", data)
                    data.players.forEach((player) => players[player.id] = { ...player, snake: new Snake(player.snake?.x, player.snake?.y, player.type, player.colours, player.snake.size) })
                    break;
                case "startGame":
                    waitingRoom = false;
                    startGame();
                    break;
                case "playerDisconnected":
                    delete players[data.player.id];
                    break;
                case "config":
                    if (!gameConfigured) loadConfig(gameConfig, data);
                    break;
                case "gameover":
                    console.log('GameOver')
                    gameOver()
                    break;
                case "updateFood":
                    const { food } = data
                    const [col, row, id] = food[0]
                    playChompSound()
                    updateFood(col, row, id)
                    break;
                case "snake_update":
                    const { snakesMap } = data
                    for (let id in snakesMap) {
                        if (id === playerId) score = snakesMap[id].snake.score
                        if (players[id].snake.isDead) continue
                        players[id].snake.tail = snakesMap[id].snake.tail
                        players[id].snake.x = snakesMap[id].snake.x
                        players[id].snake.y = snakesMap[id].snake.y
                        players[id].snake.score = snakesMap[id].snake.score
                        if (snakesMap[id].snake.isDead) players[id].snake.stop(id)
                    }
                    break;

                default:
                    console.warn("Unknown event received:", data);
            }
        } catch (error) {
            console.error("Error parsing message:", error);
        }
    };

    socket.onclose = () => {
        if (isGameOver) {
            return
        }
        console.warn("⚠️ WebSocket disconnected, attempting to reconnect...");
        retryConnection();
    };
}

function retryConnection() {
    if (reconnectTimeout) return;

    retryCount++;
    reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connectWebSocket();
    }, 3000);
}