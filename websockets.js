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
        player: { name, id: playerId }
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
            data.players.forEach((player) => players[player.id] = { ...player, snake: new Snake() })
            break;
          case "startGame":
            waitingRoom = false;
            startGame();
            break;
          case "playerMovement":
            if (data.player.name === 'Server') {
              console.log(`Player: ${data.player.name}, Key: ${data.key}`)
              players[data.player.id].snake.snakeKey(data.key)
            }
            else if (players[data.player.id]) {
              console.log(`Player: ${data.player.name}, Key: ${data.key}`)
              players[data.player.id].snake.position(data.player.snake)
              players[data.player.id].snake.snakeKey(data.key)
            }
            break;
  
          case "playerDisconnected":
            delete players[data.player.id];
            break;
          case "food":
            players[data.player.id] = { ...data.player, snake: new Snake() };
            break;
          case "config":
            if (!gameConfigured) loadConfig(gameConfig, data);
            break;
          case "updateFood":
            const { food } = data
            const [col, row, id] = food[0]
            updateFood(col, row, id)
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