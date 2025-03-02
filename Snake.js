class Snake {
    constructor(x = 2 + offset, y = 4, type = 'player', colors = {}) {
        this.type = type
        this.start = { x, y }
        this.x = x * gameConfig.scale + offset
        this.y = y * gameConfig.scale

        this.colors =
        {
            body: colors.body || getRandomColor(),
            head: colors.head || getRandomColor(),
            eyes: colors.eyes || getRandomColor()
        }
    }

    speed = { x: 1, y: 0 };
    size = 0;
    tail = [];
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
    eat(food) {
        let distance = dist(this.x, this.y, food.x, food.y)
        if (distance < gameConfig.scale / 2) {
            if (food.type === 'super') {
                this.superGrow(2)
                playChompSound()
            }
            if (food.type === 'poison') {
                this.shrink()

            }
            if (food.type === 'normal') {
                this.grow(1)
                playChompSound()
            }
            if (food.type === 'death') {
                playSound(500, 200)
                this.stop()
            }

            return true
        }
        return false
    }
    update() {
        if (this.isDead) {
            return;
        }
        //If the total is the same size as array length, meaning no food has been eaten, then shift everything over
        if (this.size === this.tail.length) {
            for (let i = 0; i < this.tail.length - 1; i++) { //as snakes move shift spots down getting the new spot at the end of the array
                this.tail[i] = this.tail[i + 1] //as it moves shift everything over by one
            }
        }

        this.tail[this.size - 1] = createVector(this.x, this.y) //when I am done moving I want the last spot to create Vector on the tail equals to current location of snake

        this.x = this.x + this.speed.x * gameConfig.scale;
        this.y = this.y + this.speed.y * gameConfig.scale;

        if (this.x > Number(gameConfig.side) + offset) {
            this.x = 0 + offset
        }
        if (this.x < 0 + offset) {
            this.x = gameConfig.side + offset
        }
        if (this.y > Number(gameConfig.side)) {
            this.y = 0
        }
        if (this.y < 0) {
            this.y = gameConfig.side
        }
        this.keyPressedThisFrame++;
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
    snakeKey(key) {
        if (this.keyPressedThisFrame < 1 || this.isDead) {
            return; //ignores key press
        }
        switch (key) {
            case ('UP'):
                if (this.speed.y <= 0 || !this.size) {
                    this.direction(0, -1);
                }
                break;
            case ('DOWN'):
                if (this.speed.y >= 0 || !this.size) {
                    this.direction(0, 1);
                }
                break;
            case ('RIGHT'):
                if (this.speed.x >= 0 || !this.size) {
                    this.direction(1, 0);
                }
                break;
            case ('LEFT'):
                if (this.speed.x <= 0 || !this.size) {
                    this.direction(-1, 0);
                }
                break;
        }
        this.keyPressedThisFrame = 0;
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
        this.resetColors()
        this.x = this.start.x * gameConfig.scale + offset
        this.y = this.start.y * gameConfig.scale
        this.tail = []
        this.size = 0
        this.speed = { x: 1 / gameConfig.scale / 0.2, y: 0 };
        this.direction(1, 0)

    }
    shrink() {
        if (this.size > 0) {
            this.size--;
        }
        this.tail.shift();
    }
    grow(size) {
        this.size += size
        for (let i = 0; i < size; i++) {
            this.tail.push(createVector(this.x, this.y))
        }

    }
    superGrow(size) {
        this.size += size
        for (let i = 0; i < size; i++) {
            this.tail.push(createVector(this.x, this.y))
        }
    }
    resetColors() {
        this.colors = {

            body: 'blue',
            head: 'brown',
            eyes: 'red'
        }
    }
}