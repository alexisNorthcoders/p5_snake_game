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
    if (retryCount >= maxRetries) {
        console.error("❌ Maximum retry attempts reached. Stopping WebSocket reconnection.");
        return;
    }

    console.log(`🔄 Attempting WebSocket connection... (Attempt ${retryCount + 1}/${maxRetries})`);

    socket = new WebSocket(getWebSocketUrl());

    socket.onopen = () => {
        connected = true;
        console.log("✅ Connected to WebSocket server");
        retryCount = 0;
        clearTimeout(reconnectTimeout);

        name = localStorage.getItem("username") || prompt("What is your name?");

        // Generate or retrieve a unique player ID
        playerId = localStorage.getItem("playerId") || randomId();
        localStorage.setItem("playerId", playerId);

        if (!localStorage.getItem("username")) {
            localStorage.setItem("username", name);
        }

        console.log(`You joined as ${name}`);
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
    };

    socket.onerror = (error) => {
        console.error("❌ WebSocket connection failed, retrying in 3 seconds...", error);
        retryConnection();
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            switch (data.event) {
                case "pong":
                    pingValue = Date.now() - startTime;
                    setTimeout(measurePing, 1000);
                    break
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
                case "updateFood":
                    const { food } = data
                    const [col, row, id] = food[0]
                    playChompSound()
                    updateFood(col, row, id)
                    break;
                case "snake_update":
                    const { snakesMap } = data
                    for (let id in snakesMap) {
                        if (players[id].snake.isDead) continue
                        players[id].snake.tail = snakesMap[id].snake.tail
                        players[id].snake.x = snakesMap[id].snake.x
                        players[id].snake.y = snakesMap[id].snake.y
                        if (snakesMap[id].snake.isDead) players[id].snake.stop()
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