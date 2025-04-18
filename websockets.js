const getWebSocketUrl = () => {

    if (window.location.hostname === "95.217.177.76" || window.location.hostname === "snakemp.duckdns.org") {
        return "wss://snakemp.duckdns.org/ws" // "ws://raspberrypi.local:4002/ws"
    } else if (window.location.hostname === "alexisraspberry.duckdns.org") {
        return "wss://alexisraspberry.duckdns.org/ws";
    } else {
        console.error("Unknown hostname, defaulting to secure WebSocket");
        return "wss://alexisraspberry.duckdns.org/ws";
    }
};

function connectWebSocket() {

    const { username, token, userId } = JSON.parse(localStorage.getItem("userData"));
   
    name = username
    playerId = String(userId)

    if (retryCount >= maxRetries) {
        console.error("❌ Maximum retry attempts reached. Stopping WebSocket reconnection.");
        return;
    }

    console.log(`🔄 Attempting WebSocket connection... (Attempt ${retryCount + 1}/${maxRetries})`);

    socket = new WebSocket(getWebSocketUrl() + `?player_id=${playerId}&access_token=${token}`);

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
                    setTimeout(measurePing, 5000);
                    return;
                }
            }
            if (!event.data.startsWith('{')) {
                switch (event.data) {
                    case "p":
                        pingValue = Date.now() - startTime;
                        setTimeout(measurePing, 5000);
                        return
                }

            }
            const data = JSON.parse(event.data);

            switch (data.event) {
                case "verified":
                    console.log("Verified connection. Server is ready.")
                    if (!gameStarted && !isGameOver) {
                        socket.send(JSON.stringify({
                            event: "newPlayer",
                            player: { name, id: playerId, colours: { head: snakeColors.head, body: snakeColors.body, eyes: snakeColors.eyes } }
                        }));
                        measurePing();
                    }
                    break
                case "waitingRoomStatus":
                    console.log("waitingRoomStatus", data)
                    players = {}
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
                    const [col, row, id, type] = food[0]
                    //   playChompSound()
                    updateFood(col, row, id, type)
                    break;
                case "snake_update":
                    const { snakesMap } = data
                    for (const id in snakesMap) {
                        const updatedSnake = snakesMap[id].snake;
                        const currentSnake = players[id].snake;

                        if (id === playerId) score = updatedSnake.score;

                        if (currentSnake.isDead) continue;

                        currentSnake.tail = updatedSnake.tail
                        currentSnake.score = updatedSnake.score
                        currentSnake.position({ x: updatedSnake.x, y: updatedSnake.y })

                        if (updatedSnake.isDead) currentSnake.stop(id);
                    }
                    break;

                case "snake_update_v2":
                    const { snakes } = data

                    for (const snake of snakes) {
                        const currentSnake = players[snake.playerId].snake;

                        if (snake.playerId === playerId) score = snake.score
                        if (currentSnake.isDead) continue

                        currentSnake.tail = snake.tail
                        currentSnake.score = snake.score
                        currentSnake.position({ x: snake.x, y: snake.y })

                        if (snake.isDead) currentSnake.stop(snake.playerId)
                    }

                    break



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