const socket = io("http://raspberrypi.local:7000", { transports: ["websocket"] });

function playChompSound() {
  let chompSound = new Audio('assets/sound/chomp.mp3');
  chompSound.play();
}
let showGrid = false;
let players = {};
let audioStarted = false;
let scale;
let key;
let gameStarted = false;
let gamePaused = false
let fps = 10
let collision = false
let side
let drawWalls = false
let score = 0
let scoreMultiplier = 2
let lastScores = 0
let lastType
let isSameType = false
let disableFood = false
const foodConfig = {
  types: ['super', 'normal'],
  storage: [],
  quantity: 0
}

socket.on("connect", () => {
  let name = "";
  if (localStorage.getItem("username")) {
    name = localStorage.getItem("username");
  } else {
    name = prompt("What is your name?");
    localStorage.setItem("username", name);
  }

  console.log("You joined as " + name);
  socket.emit("newPlayer", name);
});
function getRandomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
}

function setup() {
  side = min(windowWidth, windowHeight)
  scale = side / 20
  foodConfig.quantity = floor(scale / 4)
  createCanvas(side, side);
  snake = new Snake()
  pcSnake = new Snake(8, 4, 'pc')
  frameRate(fps)
  walls = new Walls()
  // Listen for new players
  socket.on('newPlayer', (player) => {
    players[player.id] = player;
    //  draw();
  });

  // Listen for player movements
  socket.on('playerMoved', (player) => {
    if (players[player.id]) {
      players[player.id].x = player.x;
      players[player.id].y = player.y;
      players[player.id].direction = player.direction;
      // draw();
    }
  });

  // Listen for disconnections
  socket.on('playerDisconnected', (id) => {
    delete players[id];
    // draw();
  });
}

function draw() {

  background('tan');
  if (showGrid) drawGrid();
  if (!gameStarted) {
    showStartScreen()
  }
  else {
    showScore()
    snake.update();
    snake.draw();
    pcSnake.update()
    pcSnake.draw()
    drawWalls ? walls.draw() : null
    snake.death();
    const hasCollided = false //walls.checkCollision(snake);
    if (hasCollided && collision) {
      snake.stop()
      console.log('Game Over!')
    }
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
          foodConfig.storage[i] = spawnOneFood()
        }
        if (pcSnake.eat(food)) {
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
          foodConfig.storage[i] = spawnOneFood()
        }
        food.draw()
        food.update()
      })
    }


    if (gamePaused) {
      showPauseScreen()
    }
  }


}

function windowResized() {
  resizeCanvasToFitWindow();
}
function keyPressed() {
  console.log(keyCode)
  if (gameStarted === false) {
    startGame();
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
    // pc player
    case 89:
      pcSnake.snakeKey('UP')
      break;
    case 72:
      pcSnake.snakeKey('DOWN')
      break;
    case 71:
      pcSnake.snakeKey('LEFT')
      break;
    case 74:
      pcSnake.snakeKey('RIGHT')
      break;
    case 82:
      restartGame()
      key = 'RIGHT'
      break;
    case ENTER:
      pauseGame()
      break;
  }
  snake.snakeKey(key);
  socket.emit('playerMovement', key)

}
function spawnOneFood() {
  if (disableFood) {
    return
  }
  const type = foodConfig.types[floor(random(0, 3))]
  const cols = floor(width / scale)
  const rows = floor(height / scale)
  return new Food(floor(random(1, cols - 1)) * scale, floor(random(1, rows - 1)) * scale, type)
}
function spawnFood() {
  foodConfig.storage.length = 0
  for (let i = 0; i < foodConfig.quantity; i++) {
    foodConfig.storage.push(spawnOneFood())
  }
}
function drawGrid() {
  stroke('white');
  strokeWeight(0.05);
  for (let x = 0; x < width; x += scale) {
    for (let y = 0; y < height; y += scale) {
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
  side = min(windowWidth, windowHeight)
  noStroke();
  fill(32);
  rect(10, 10, side - 20, side - 20, scale);
  fill(255);
  text(
    'Key buttons: \n1 Draw walls. \n2 Draw grid. \n+ Increase framerate  \n- Decrease framerate \nEnter Pause game \nR Restart',
    side / 2,
    3*scale
  );
  textAlign(CENTER, CENTER)

  textSize(scale)

  text(
    'Click to play.\nUse arrow keys or WASD to move.',
    side / 2,
    side / 2
  );
  noLoop();
}
function mousePressed() {
  if (gameStarted === false) {
    startGame();
  }
}
function startGame() {
  spawnFood()
  gameStarted = true
  showScore()
  loop();
}
async function restartGame() {
  console.log('Reseting game...')
  await snake.reset()
  await pcSnake.reset()
  score = 0;
  spawnFood()
  loop();
}
function pauseGame() {
  gamePaused = !gamePaused
  gamePaused ? noLoop() : loop()
}
function showPauseScreen() {
  let side = min(windowWidth, windowHeight)
  noStroke();
  fill(0, 127);
  rect(10, side / 2 - scale, side - 20, 2 * scale, scale);
  fill(255);
  textAlign(CENTER, CENTER)
  textSize(scale)
  text(
    'Game paused...',
    side / 2,
    side / 2
  );
}
function showScore() {
  let side = min(windowWidth, windowHeight)
  stroke('black');
  strokeWeight(2)
  fill(255);
  textAlign(CENTER, CENTER)
  textSize(scale)
  text(
    `Score: ${score}`,
    side / 2,
    scale * 1.2
  );
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