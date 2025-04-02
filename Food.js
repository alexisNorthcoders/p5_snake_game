class Food {
    constructor(col, row, id, type = 'redApple') {
        this.x = gameConfig.leftSectionSize + col * gameConfig.gridSize
        this.y = row * gameConfig.gridSize
        this.type = type
        this.keyframe = 0
        this.id = id
    }
    position({ x, y }) {
        this.x = gameConfig.leftSectionSize + x * gameConfig.gridSize
        this.y = y * gameConfig.gridSize
    }
    draw() {
        switch (this.type) {
            case 'redApple':
                image(redAppleImg, this.x, this.y, gameConfig.scale, gameConfig.scale)
                break
            case 'greenApple':
                image(greenAppleImg, this.x, this.y, gameConfig.scale, gameConfig.scale)
                break
            case 'yellowApple':
                image(yellowAppleImg, this.x, this.y, gameConfig.scale, gameConfig.scale)
                break
        }
    }
}
