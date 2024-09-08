class Food {
    constructor(col, row, type = 'normal') {
        this.x = col
        this.y = row
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
        circle(this.x + scale / 2, this.y + scale / 2, scale / 2)
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
