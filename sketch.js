const socket = new WebSocket("ws://raspberrypi.local:4001/ws");

function playChompSound() {
  let chompSound = new Audio('assets/sound/chomp.mp3');
  chompSound.play();
}
let showGrid = false;
let players = {};
let audioStarted = false;
let key;
let gameStarted = false;
let gamePaused = false
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

const foodConfig = {
  types: ['super', 'normal'],
  storage: [],
  quantity: 0
}
const gameConfig = {
  cols: 0,
  rows: 0,
  scale: 0,
  side: 0
}

socket.onopen = () => {
  console.log("Connected to WebSocket server");

  name = localStorage.getItem("username") || prompt("What is your name?");

  if (!localStorage.getItem("username")) {
    localStorage.setItem("username", name);
  }

  console.log(`You joined as ${name}`);
  socket.send(JSON.stringify({
    event: "newPlayer",
    player: { name }
  }));
  socket.send(JSON.stringify({
    event: "getConfig"
  }));
};

function setup() {
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.event) {
        case "newPlayer":
          players[data.player.name] = { ...data.player, snake: new Snake() };
          break;

        case "playerMovement":
          if (players[data.player.name]) {
            console.log(`Player: ${data.player.name}, Key: ${data.key}`)
            players[data.player.name].snake.snakeKey(data.key)
          }
          break;

        case "playerDisconnected":
          delete players[data.player.name];
          break;
        case "food":
          players[data.player.name] = { ...data.player, snake: new Snake() };
          break;
        case "config":
          console.log(data)
          loadConfig(gameConfig, data.config)
          break;

        default:
          console.warn("Unknown event received:", data);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  };

  players
  snake = new Snake()

  walls = new Walls()

}

function loadConfig(gameConfig, data) {

  gameConfig.side = data.side
  gameConfig.scale = gameConfig.side / 20
  gameConfig.cols = gameConfig.side / gameConfig.scale
  gameConfig.rows = gameConfig.side / gameConfig.scale
  fps = data.fps
  createCanvas(gameConfig.side, gameConfig.side);
  frameRate(fps)
  foodConfig.quantity = floor(gameConfig.scale / 4)
  showStartScreen()

}
function getRandomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
}
function draw() {

  background('tan');
  if (showGrid) drawGrid();
  if (!gameStarted) {
    showStartScreen()
  }
  else {
    showScore()
    for (let playerName in players) {
      const snake = players[playerName].snake
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
            foodConfig.storage[i] = spawnOneFood()
          }

          food.draw()
          food.update()
        })
      }
    }
    drawWalls ? walls.draw() : null

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

function windowResized() {
  // resizeCanvasToFitWindow();
}
function keyPressed() {

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
    case 82:
      restartGame()
      key = 'RIGHT'
      break;
    case ENTER:
      pauseGame()
      break;
  }
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      event: "playerMovement",
      player: { name },
      key
    }));
  }

}
function spawnOneFood() {
  if (disableFood) {
    return
  }
  const type = foodConfig.types[floor(random(0, 3))]
  return new Food(floor(random(1, gameConfig.cols - 1)) * gameConfig.scale, floor(random(1, gameConfig.rows - 1)) * gameConfig.scale, type)
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
  textSize(scale)
  text(
    `Score: ${score}`,
    gameConfig.side / 2,
    gameConfig.scale * 1.2
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