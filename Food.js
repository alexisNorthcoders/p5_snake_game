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
        stroke('black');
        fill('darkorange');
        if (this.type === 'super') {
            stroke('black');
            fill('red')
        }
        if (this.type === 'poison') {
            stroke('black');
            fill('yellow')
        }
        if (this.type === 'death') {
            stroke('green');
            fill('black')
        }
        circle(this.x + gameConfig.scale / 2, this.y + gameConfig.scale / 2, gameConfig.scale / 2)
    }
}
