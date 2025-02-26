class Walls {
    thickness = gameConfig.scale
    topWall = { x: 0 + offset, y: 0, width: gameConfig.side / 2, height: this.thickness };
    bottomWall = { x: 0 + offset, y: gameConfig.side - this.thickness, width: gameConfig.side / 2, height: this.thickness };
    leftWall = { x: 0 + offset, y: 0, width: this.thickness, height: gameConfig.side };
    rightWall = { x: gameConfig.side - this.thickness + offset, y: 0, width: this.thickness, height: gameConfig.side };
    array = [this.topWall, this.bottomWall, this.leftWall, this.rightWall]
    draw() {
        stroke('black');
        strokeWeight(2);
        fill('gray');
        this.array.forEach((wall) => {
            rect(wall.x, wall.y, wall.width, wall.height)
        })

    }
    checkCollision(snake) {
        if (this.topWall.y > snake.y && snake.x < this.topWall.width + this.topWall.x) {
            return true
        }
        if (this.bottomWall.y <= snake.y && snake.x < this.topWall.width + this.topWall.x) {
            return true
        }
        if (this.leftWall.x >= snake.x) {
            return true
        }
        if (this.rightWall.x <= snake.x) {
            return true
        }
    };
}


