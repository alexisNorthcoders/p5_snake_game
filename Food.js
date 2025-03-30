class Food {
    constructor(col, row, id, type = 'normal') {
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

        image(appleImg, this.x, this.y, gameConfig.scale, gameConfig.scale)
    }
}
