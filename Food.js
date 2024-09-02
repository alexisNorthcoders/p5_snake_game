class Food{
    constructor(col,row,type='normal'){
        this.x = col
        this.y = row
        this.type = type
        console.log(`Food location: (${this.x}, ${this.y})`);
    }
    draw(){
        fill('darkorange');
        if (this.type === 'super'){
            fill('red')
        }
        if (this.type === 'poison'){
            fill('yellow')
        }
        circle(this.x + scale / 2, this.y + scale / 2, scale / 1.5)
    }
}