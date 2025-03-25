class Snake {
    constructor(x = 2 + gameConfig.leftSectionSize, y = 4, type = 'player', colors = {}, size = 0) {
        this.type = type
        this.start = { x, y }
        this.x = x
        this.y = y
        this.size = size;
        this.tail = []
        this.glow = false
        this.transparent = 255

        this.colors =
        {
            body: colors.body || getRandomColor(),
            head: colors.head || getRandomColor(),
            eyes: colors.eyes || getRandomColor()
        }
    }

    speed = { x: 1, y: 0 };
    isDead = false;

    food = 0;
    direction(x, y) {
        this.speed.x = x;
        this.speed.y = y;
    }
    position({ x, y }) {
        this.x = x;
        this.y = y;
    }
    draw() {
        const bodyColor = this.colors.body;
        const rgbValues = bodyColor.match(/\d+/g);
        const r = parseInt(rgbValues[0]);
        const g = parseInt(rgbValues[1]);
        const b = parseInt(rgbValues[2]);
        const bodyColorTransparent = color(r, g, b, this.transparent);

        const glowColor = 'rgba(255, 255, 0, 0.8)';
        const glowSize = 10;  // Size of the glow

        if (this.glow) {
            // Enable glow effect
            drawingContext.shadowBlur = glowSize;
            drawingContext.shadowColor = glowColor;
        }

        for (let i = 0; i < this.tail.length; i++) {
            let segment = this.tail[i];
            fill(bodyColorTransparent);
            strokeWeight(2);
            stroke(`rgba(0, 0, 0, ${this.transparent})`);
            square(segment.x, segment.y, gameConfig.scale);
        }

        // Draw head
        if (this.glow) {
            drawingContext.shadowBlur = glowSize * 1.5;
            drawingContext.shadowColor = 'rgba(255, 255, 0, 0.8)';
        }

        fill(this.colors.head);
        strokeWeight(2);
        stroke('black');
        circle(this.x + gameConfig.scale / 2, this.y + gameConfig.scale / 2, gameConfig.scale);

        // Draw eyes
        if (this.glow) {
            drawingContext.shadowBlur = glowSize * 2;
            drawingContext.shadowColor = 'rgba(255, 255, 255, 0.8)';
        }
        fill(this.colors.eyes);
        stroke('yellow');
        strokeWeight(1);
        rect(this.x + 3 * gameConfig.scale / 5, this.y, gameConfig.scale / 5);
        rect(this.x + gameConfig.scale / 5, this.y, gameConfig.scale / 5);

        // Reset glow effect
        drawingContext.shadowBlur = 0;
        drawingContext.shadowColor = 'transparent';
    }

    async stop(id) {
        this.isDead = true
        this.colors.head = 'black'
        this.colors.eyes = 'gray'
        this.colors.body = 'rgb(139, 0, 0)'
        if (id === playerId) {
            await postUserScore(isAnonymous ? 'anon' : playerId)
            console.log(`Posted score of ${score} for PlayerId: ${playerId} `)
        }
    }
}