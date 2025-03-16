class Food {
    constructor(col, row, id, type = 'normal') {
        this.x = col
        this.y = row
        this.type = type
        this.keyframe = 0
        this.id = id
    }
    position({ x, y }) {
        this.x = x
        this.y = y
    }
    draw() {

        image(appleImg, this.x, this.y, gameConfig.scale, gameConfig.scale)
    }
}
