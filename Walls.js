class Walls {
    thickness = scale
    topWall = { x: 0, y: 0, width: width / 2, height: this.thickness };
    bottomWall = { x: 0, y: height - this.thickness, width: width / 2, height: this.thickness };
    leftWall = { x: 0, y: 0, width: this.thickness, height: height };
    rightWall = { x: width - this.thickness, y: 0, width: this.thickness, height: height };
    array = [this.topWall, this.bottomWall, this.leftWall, this.rightWall]
    draw() {
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


