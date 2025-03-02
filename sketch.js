let socket;
let reconnectTimeout;
let retryCount = 0;
const maxRetries = 10;
let connected = false;
let gameConfigured = false;
let waitingRoom = true;
let minPlayers = 1;
let pingValue = 0
let uiCanvas
let offset = 200
let showGrid = false;
let players = {};
let audioStarted = false;
let key;
let gameStarted = false;
let gamePaused = false
let playerId
let fps = 10
let collision = false
let drawWalls = false
let score = 0
let scoreMultiplier = 2
let lastScores = 0
let lastType
let isSameType = false
let disableFood = false
let name
let walls

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
  //socket = new WebSocket("ws://raspberrypi.local:4002/ws");
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

  /* socket.onclose = () => {
    console.warn("⚠️ WebSocket disconnected, attempting to reconnect...");
    retryConnection();
  }; */
}

function retryConnection() {
  if (reconnectTimeout) return;

  retryCount++;
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connectWebSocket();
  }, 3000);
}

// Start WebSocket connection
connectWebSocket();

function playChompSound() {
  let chompSound = new Audio('assets/sound/chomp.mp3');
  chompSound.play();
}

function measurePing() {
  startTime = Date.now();
  socket.send(JSON.stringify({ event: "ping" }))
}

const foodConfig = {
  types: ['super', 'normal'],
  storage: [],
  quantity: 0,
  coordinates: []
}
const gameConfig = {
  cols: 0,
  rows: 0,
  scale: 0,
  side: 0
}

function setup() {

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

}

function loadConfig(gameConfig, data) {

  gameConfigured = true;

  const { config, food } = data

  console.log(food)

  gameConfig.side = config.side
  gameConfig.scale = gameConfig.side / 20
  gameConfig.cols = gameConfig.side / gameConfig.scale
  gameConfig.rows = gameConfig.side / gameConfig.scale
  foodConfig.coordinates = food
  foodConfig.quantity = food.length
  fps = config.fps
  walls = new Walls()

  createCanvas(gameConfig.side + offset, gameConfig.side);
  uiCanvas = createGraphics(offset, gameConfig.side);
  frameRate(fps)
  showStartScreen()

}
function getRandomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
}
function draw() {
  if (!connected || !gameConfigured) return;

  background('tan');

  if (waitingRoom) {
    drawUIBox()
    showWaitingRoom();
    return;
  }
  if (showGrid) drawGrid();
  if (!gameStarted) {
    showStartScreen()
  }
  else {

    for (let id in players) {
      const snake = players[id].snake
      snake.update();
      snake.draw();
      snake.death();
      if (!disableFood) {

        foodConfig.storage.forEach((food, i) => {
          if (snake.eat(food)) {
            if (lastType === food.type) {
              isSameType = true
              lastScores += 10
              score += 10
            }
            else {
              isSameType = false
              lastType = food.type
              score += 10
              score += 2 * lastScores
              lastScores = 0
            }
            if (id === playerId) {
              socket.send(JSON.stringify({
                event: "foodEaten",
                id: String(food.id)
              }));
            }
          }

          food.draw()
          food.update()
        })
      }
    }
    drawWalls ? walls.draw() : null

    drawUIBox()

    const hasCollided = false //walls.checkCollision(snake);
    if (hasCollided && collision) {
      // snake.stop()
      console.log('Game Over!')
    }



    if (gamePaused) {
      showPauseScreen()
    }
  }


}
function showWaitingRoom() {
  noStroke();
  fill(32);
  rect(10 + offset, 10, gameConfig.side - 20, gameConfig.side - 20, gameConfig.scale);
  fill(255);
  textSize(gameConfig.scale);
  textAlign(CENTER, CENTER);
  text(
    `Waiting for players... (${Object.keys(players).length}/${minPlayers})\nPress ENTER to start`,
    gameConfig.side / 2 + offset,
    gameConfig.side / 2
  );
}
function windowResized() {
  // resizeCanvasToFitWindow();
}
function keyPressed() {
  // press Enter to start game
  if (waitingRoom && keyCode === ENTER && Object.keys(players).length >= minPlayers) {
    socket.send(JSON.stringify({ event: "startGame" }));
  }

  switch (keyCode) {
    case 49:
      drawWalls = !drawWalls
      break
    case 50:
      showGrid = !showGrid
      break
    case 107:
      fps += 10
      frameRate(fps)
      break
    case 109:
      fps -= 10
      frameRate(fps)
      break
    case 38:
    case 87:
      key = 'UP';
      break;
    case 40:
    case 83:
      key = 'DOWN';
      break;
    case 37:
    case 65:
      key = 'LEFT';
      break;
    case 39:
    case 68:
      key = 'RIGHT';
      break;
    case 82:
      restartGame()
      key = 'RIGHT'
      break;
    case ENTER:
      if (gameStarted) pauseGame()
      break;
  }
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      event: "playerMovement",
      player: {
        name,
        id: playerId,
        snake: {
          x: players[playerId].snake.x,
          y: players[playerId].snake.y
        }
      },
      key
    }));
  }

}

function spawnFood() {

  for (let i = 0; i < foodConfig.quantity; i++) {
    const [col, row, id] = foodConfig.coordinates[i]
    foodConfig.storage.push(new Food(col, row, id))
  }
}
function updateFood(col, row, id) {
  console.log('updating food', col, row, id)
  const foodToUpdate = foodConfig.storage.find(food => food.id === id)
  foodToUpdate.position({ x: col, y: row })

}
function drawGrid() {
  stroke('white');
  strokeWeight(0.05);
  for (let x = 0; x < width; x += gameConfig.scale) {
    for (let y = 0; y < height; y += gameConfig.scale) {
      line(x, 0, x, height);
      line(0, y, width, y);
    }
  }
}
function resizeCanvasToFitWindow() {
  side = min(windowWidth, windowHeight)
  scale = side / 20
  resizeCanvas(side, side);
}
function showStartScreen() {
  getUserScore(1)
  noStroke();
  fill(32);
  rect(10, 10, gameConfig.side - 20, gameConfig.side - 20, gameConfig.scale);
  fill(255);
  text(
    'Key buttons: \n1 Draw walls. \n2 Draw grid. \n+ Increase framerate  \n- Decrease framerate \nEnter Pause game \nR Restart',
    gameConfig.side / 2,
    3 * gameConfig.scale
  );
  textAlign(CENTER, CENTER)

  textSize(gameConfig.scale)

  text(
    'Click to play.\nUse arrow keys or WASD to move.',
    gameConfig.side / 2,
    gameConfig.side / 2
  );
  noLoop();
}

function startGame() {
  if (connected && gameConfigured) {
    spawnFood()
    gameStarted = true
    showScore()
    loop();
  }
}
async function restartGame() {
  console.log('Reseting game...')
  score = 0;
  spawnFood()
  loop();
}
function pauseGame() {
  gamePaused = !gamePaused
  gamePaused ? noLoop() : loop()
}
function showPauseScreen() {
  noStroke();
  fill(0, 127);
  rect(10, gameConfig.side / 2 - scale, gameConfig.side - 20, 2 * scale, scale);
  fill(255);
  textAlign(CENTER, CENTER)
  textSize(scale)
  text(
    'Game paused...',
    gameConfig.side / 2,
    gameConfig.side / 2
  );
}
function showScore() {
  stroke('black');
  strokeWeight(2)
  fill(255);
  textAlign(CENTER, CENTER)
  textSize(gameConfig.scale)
  text(
    `Score: ${score}`,
    gameConfig.side / 2,
    gameConfig.scale * 1.2
  );
}
function showPing() {
  stroke('black');
  strokeWeight(2)
  fill(255);
  textSize(gameConfig.scale / 2);
  textAlign(LEFT, TOP);
  text(`Ping: ${pingValue}ms`, 5, 5);
}

function drawUIBox() {
  uiCanvas.clear();

  // Background

  uiCanvas.fill("#F5DEB3")
  uiCanvas.rect(0, 0, uiCanvas.width, uiCanvas.height)

  // Text
  uiCanvas.noStroke();
  uiCanvas.fill("black");
  uiCanvas.textSize(16);
  uiCanvas.textAlign(LEFT, CENTER);

  uiCanvas.text(`⚡ SCORE: ${score}`, 20, 50);
  uiCanvas.text(`🔧 PING: ${pingValue}ms`, 20, 90);
  uiCanvas.text(`🎮 FPS: ${fps}`, 20, 130);
  Object.keys(players).forEach((key, i) => uiCanvas.text(`🧑 Player #${i + 1}: ${players[key].name}`, 20, 170 + 40 * i))


  // Frame
  uiCanvas.strokeWeight(4);
  uiCanvas.stroke(" #7D7D7D");
  uiCanvas.noFill();
  uiCanvas.rect(10, 10, uiCanvas.width - 20, uiCanvas.height - 20, 10);

  image(uiCanvas, 0, 0);
  loop()
}

function playSound(frequency, duration) {

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const oscillator = audioCtx.createOscillator();

  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();

  oscillator.stop(audioCtx.currentTime + duration / 1000);
}

async function getUserScore(userId) {
  try {
    const response = await fetch(`/snake/score/${userId}`);
    if (!response.ok) {
      throw new Error(`Error fetching score: ${response.statusText}`);
    }
    const scores = await response.json();
    console.log("User scores:", scores);
    return scores;
  } catch (error) {
    console.error("Error retrieving user score:", error);
    return null;
  }
}

async function postUserScore(userId) {
  try {

    const params = {
      score
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    }
    const response = await fetch(`/snake/score/${userId}`, options);

    if (!response.ok) {
      throw new Error(`Error posting score: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Score added:", result);
    return result;
  } catch (error) {
    console.error("Error posting user score:", error);
    return null;
  }
}
