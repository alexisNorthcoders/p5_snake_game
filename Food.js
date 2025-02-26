class Food {
    constructor(col, row, type = 'normal') {
        this.x = col * gameConfig.scale + offset
        this.y = row * gameConfig.scale
        this.type = type
        this.keyframe = 0
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
    update() {
        this.keyframe++
        if (this.keyframe > 300 && this.type == 'super') {
            this.type = 'normal'
            this.keyframe = 0
        }
        if (this.keyframe > 300 && this.type == 'normal') {
            this.type = 'poison'
            this.keyframe = 0
        }
        if (this.keyframe > 600 && this.type == 'poison') {
            this.type = 'death'
            this.keyframe = 0
        }

    }
}
