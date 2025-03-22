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

    async stop(id) {
        this.isDead = true
        this.colors.head = 'black'
        this.colors.eyes = 'gray'
        this.colors.body = 'darkred'
        if (id === playerId) {
            await postUserScore(isAnonymous ? 'anon' : playerId)
            console.log(`Posted score of ${score} for PlayerId: ${playerId} `)
        }
    }
}