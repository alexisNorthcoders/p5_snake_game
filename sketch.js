let scale;
let food;
let food2;
let food3;
let food4;
let key;
let gameStarted = false;
let gamePaused = false

function setup() {
  let side = min(windowWidth, windowHeight)
  scale = side / 20
  createCanvas(side, side);
  snake = new Snake()
  frameRate(60)
  walls = new Walls()
  food = spawnFood()
  food2 = spawnFood()
  food3 = spawnFood('super')
  food4 = spawnFood('poison')


}

function draw() {

  background('tan');
  //drawGrid();
  if (!gameStarted) {
    showStartScreen()
  }
  else {
    snake.update();
    snake.draw();
    walls.draw()
    snake.death();
    const hasCollided = walls.checkCollision(snake);
    if (hasCollided) {
      snake.stop()
      console.log('Game Over!')
    }

    food.draw()
    food2.draw()
    food3.draw()
    food4.draw()

    if (snake.eat(food)) {
      food = spawnFood()
    }
    if (snake.eat(food2)) {
      food2 = spawnFood()
    }
    if (snake.eat(food3)) {
      food3 = spawnFood('super')
    }
    if (snake.eat(food4)) {
      food4 = spawnFood('poison')
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
  switch (keyCode) {
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
    case ENTER:
      pauseGame()
      break;
  }
  snake.snakeKey(key);
}
function spawnFood(type) {
  const cols = floor(width / scale)
  const rows = floor(height / scale)
  return new Food(floor(random(1, cols - 1)) * scale, floor(random(1, rows - 1)) * scale, type)
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
  let side = min(windowWidth, windowHeight)
  scale = side / 20
  resizeCanvas(side, side);
}
function showStartScreen() {
  let side = min(windowWidth, windowHeight)
  noStroke();
  fill(32);
  rect(10, 10, side - 20, side - 20, scale);
  fill(255);
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
  gameStarted = true
  loop();
}
function pauseGame() {
  gamePaused = !gamePaused
  gamePaused ? noLoop() : loop()
}
function showPauseScreen() {
  let side = min(windowWidth, windowHeight)
  noStroke();
  fill(32);
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