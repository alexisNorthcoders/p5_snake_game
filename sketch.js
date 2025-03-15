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
let showGrid = false;
let players = {};
let audioStarted = false;
let key;
let gameStarted = false;
let gamePaused = false
let playerId
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
let snakeColors = {
  body: getRandomColor(),
  head: getRandomColor(),
  eyes: getRandomColor()
};
let buttonX, buttonY, buttonWidth = 100, buttonHeight = 40;
let previewX, previewY;
let snakeImg;
function preload() {
  snakeImg = loadImage('snakelogo.png');
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

function playChompSound() {
  let chompSound = new Audio('assets/sound/chomp.mp3');
  chompSound.play();
}
function measurePing() {
  startTime = Date.now();
  socket.send(JSON.stringify({ event: "ping" }))
}
function setup() {
  preload()
  connectWebSocket();
}
function loadConfig(gameConfig, data) {

  gameConfigured = true;

  console.log(data)

  const { config, food } = data

  gameConfig.side = config.side
  gameConfig.leftSectionSize = config.leftSectionSize
  gameConfig.backgroundColour = config.backgroundColour
  gameConfig.waitingRoom = config.waitingRoom
  gameConfig.scale = gameConfig.side / config.scaleFactor
  gameConfig.cols = gameConfig.side / gameConfig.scale
  gameConfig.rows = gameConfig.side / gameConfig.scale
  foodConfig.coordinates = food
  foodConfig.quantity = food.length
  fps = config.fps
  walls = new Walls()

  createCanvas(gameConfig.side + gameConfig.leftSectionSize, gameConfig.side);
  uiCanvas = createGraphics(gameConfig.leftSectionSize, gameConfig.side);
  //frameRate(fps)
  showStartScreen()

}
function draw() {
  if (!connected || !gameConfigured) return;

  background(gameConfig.backgroundColour);

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

    // draw snakes
    for (let id in players) {
      players[id].snake.draw()
    }
    // draw food
    if (!disableFood) foodConfig.storage.forEach((food) => food.draw())

    drawWalls ? walls.draw() : null

    drawUIBox()

    if (gamePaused) showPauseScreen()
  }
}
function showWaitingRoom() {
  noStroke();
  fill(gameConfig.waitingRoom.backgroundColour);
  rect(10 + gameConfig.leftSectionSize, 10, gameConfig.side - 20, gameConfig.side - 20, gameConfig.scale);

  // Text instructions
  fill(255);
  textSize(gameConfig.scale * 0.5);
  textAlign(CENTER, CENTER);
  text(
    `${gameConfig.waitingRoom.waitingRoomMessage} Waiting for players... (${Object.keys(players).length}/${minPlayers})\nPress ENTER to start`,
    gameConfig.side / 2 + gameConfig.leftSectionSize,
    gameConfig.side / 2 - 50
  );

  // Show current colors
  textSize(gameConfig.scale * 0.4);
  text("Click to change colors:", gameConfig.side / 2 + gameConfig.leftSectionSize, gameConfig.side / 2);

  // Draw color preview
  previewX = gameConfig.side / 2 - 40 + gameConfig.leftSectionSize;
  previewY = gameConfig.side / 2 + 30;

  strokeWeight(2);
  stroke('black');

  // Draw body segments (clickable)
  fill(snakeColors.body);
  square(previewX, previewY, 20);
  square(previewX - 20, previewY, 20);
  square(previewX - 40, previewY, 20);

  // Draw head (clickable)
  fill(snakeColors.head);
  circle(previewX + 30, previewY + 10, 25);

  // Draw eyes (clickable)
  fill(snakeColors.eyes);
  stroke('yellow');
  strokeWeight(1);
  rect(previewX + 30 - 5, previewY + 5, 5);
  rect(previewX + 30 + 5, previewY + 5, 5);

  // Draw "Set Colors" button
  buttonX = gameConfig.side / 2 - 50 + gameConfig.leftSectionSize;
  buttonY = gameConfig.side / 2 + 80;
  fill(50, 150, 255);
  strokeWeight(2);
  stroke(255);
  rect(buttonX, buttonY, buttonWidth, buttonHeight, 5);

  fill(255);
  noStroke();
  textSize(18);
  textAlign(CENTER, CENTER);
  text("Set Colors", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
}
function windowResized() {
  // resizeCanvasToFitWindow();
}
function keyPressed() {
  if (keyCode === 66) snakeColors.body = getRandomColor();
  if (keyCode === 72) snakeColors.head = getRandomColor();
  if (keyCode === 69) snakeColors.eyes = getRandomColor();
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
      },
      key
    }));
  }

}

// Detect mouse clicks
function mousePressed() {
  // Check if "Set Colors" button is clicked
  if (
    mouseX > buttonX && mouseX < buttonX + buttonWidth &&
    mouseY > buttonY && mouseY < buttonY + buttonHeight
  ) {
    socket.send(JSON.stringify({
      event: "updatePlayer",
      player: { name, id: playerId, colours: { head: snakeColors.head, body: snakeColors.body, eyes: snakeColors.eyes } }
    }));
    return;
  }

  // Check if body is clicked
  if (
    mouseX > previewX - 40 && mouseX < previewX + 20 &&
    mouseY > previewY && mouseY < previewY + 20
  ) {
    snakeColors.body = getRandomColor();
    return;
  }

  // Check if head is clicked
  if (
    dist(mouseX, mouseY, previewX + 30, previewY + 10) < 12.5
  ) {
    snakeColors.head = getRandomColor();
    return;
  }

  // Check if eyes are clicked
  if (
    (mouseX > previewX + 30 - 5 && mouseX < previewX + 30 &&
      mouseY > previewY + 5 && mouseY < previewY + 10) ||
    (mouseX > previewX + 30 + 5 && mouseX < previewX + 35 &&
      mouseY > previewY + 5 && mouseY < previewY + 10)
  ) {
    snakeColors.eyes = getRandomColor();
    return;
  }
}

function spawnFood() {

  for (let i = 0; i < foodConfig.quantity; i++) {
    const [col, row, id] = foodConfig.coordinates[i]
    foodConfig.storage.push(new Food(col, row, id))
  }
}
function updateFood(col, row, id) {
  // only update the food changing position
  const foodToUpdate = foodConfig.storage.find(food => food.id === id)
  foodToUpdate.position({ x: col, y: row })
}
function drawGrid() {
  stroke('white');
  strokeWeight(0.05);
  for (let x = gameConfig.leftSectionSize; x < width; x += gameConfig.scale) {
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

  uiCanvas.fill("#31253b")
  uiCanvas.rect(0, 0, uiCanvas.width, uiCanvas.height)

  // Image 

 

  // Text
  uiCanvas.noStroke();
  uiCanvas.fill("white");
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
  image(snakeImg, 0, 400, 200, 200)
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
