class Snake {
    constructor(x = 2 + gameConfig.leftSectionSize, y = 4, type = 'player', colors = {}, size = 0) {
        this.type = type
        this.start = { x, y }
        this.x = x
        this.y = y
        this.size = size;
        this.tail = []

        this.colors =
        {
            body: colors.body || getRandomColor(),
            head: colors.head || getRandomColor(),
            eyes: colors.eyes || getRandomColor()
        }
    }

    speed = { x: 1, y: 0 };
    keyPressedThisFrame = 0;
    isDead = false;

    food = 0;
    direction(x, y) {
        this.speed.x = x;
        this.speed.y = y;
    }
    position({ x, y }) {
        this.x = x
        this.y = y
    }
    draw() {
        const bodyColor = this.colors.body
        fill(bodyColor);
        strokeWeight(2);
        stroke('black');

        for (let i = 0; i < this.tail.length; i++) {
            let segment = this.tail[i];
            fill(bodyColor);
            strokeWeight(2);
            square(segment.x, segment.y, gameConfig.scale);
        }

        // Draw head
        strokeWeight(2);
        fill(this.colors.head);
        circle(this.x + gameConfig.scale / 2, this.y + gameConfig.scale / 2, gameConfig.scale);

        // Draw eyes
        fill(this.colors.eyes);
        stroke('yellow');
        strokeWeight(1);
        rect(this.x + 3 * gameConfig.scale / 5, this.y, gameConfig.scale / 5);
        rect(this.x + gameConfig.scale / 5, this.y, gameConfig.scale / 5);
    }

    stop() {
        this.speed.x = 0;
        this.speed.y = 0;
        this.isDead = true;
        this.colors.head = 'black'
        this.colors.eyes = 'gray'
        this.colors.body = 'darkred'
    }
    death() {
        if (this.type === "server") return
        this.tail.forEach(segment => {
            const distance = dist(this.x, this.y, segment.x, segment.y)
            if (distance === 0) {
                this.stop()
            }
        });
    }
    async reset() {
        await postUserScore(1)
        this.isDead = false
        this.x = this.start.x * gameConfig.scale + gameConfig.leftSectionSize
        this.y = this.start.y * gameConfig.scale
        this.tail = []
        this.size = 0
        this.speed = { x: 1 / gameConfig.scale / 0.2, y: 0 };
        this.direction(1, 0)

    }
}