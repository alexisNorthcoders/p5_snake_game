class Snake {
    constructor(x = 2, y = 4, type = 'player') {
        this.type = type
        this.start = { x, y }
        this.x = x * scale
        this.y = y * scale
    }

    speed = { x: 1 / scale / 0.2, y: 0 };
    size = 0;
    tail = [];
    keyPressedThisFrame = 0;
    isDead = false;
    colors =
        {
            'player': {
                body: 'blue',
                head: 'brown',
                eyes: 'red'
            },
            'pc': {
                body: 'green',
                head: 'darkgreen',
                eyes: 'red'
            }
        }
    food = 0;
    direction(x, y) {
        this.speed.x = x / scale / 0.2;
        this.speed.y = y / scale / 0.2;
    }
    eat(food) {
        let distance = dist(this.x, this.y, food.x, food.y)
        if (distance < scale / 2) {
            if (food.type === 'super') {
                this.superGrow(10)
                playChompSound()
            }
            if (food.type === 'poison') {
                this.shrink()

            }
            if (food.type === 'normal') {
                this.grow(5)
                playSound(500, 200)
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
        if (this.size === this.tail.length) {
            for (let i = 0; i < this.tail.length - 1; i++) {
                this.tail[i] = this.tail[i + 1]
            }
        }

        this.tail[this.size - 1] = createVector(this.x, this.y)

        this.x = this.x + this.speed.x * scale;
        this.y = this.y + this.speed.y * scale;

        if (this.x > Number(side)) {
            this.x = 0
        }
        if (this.x < 0) {
            this.x = side
        }
        if (this.y > Number(side)) {
            this.y = 0
        }
        if (this.y < 0) {
            this.y = side
        }
        this.keyPressedThisFrame++;
    }
    draw() {
        fill(this.colors[this.type].body);
        strokeWeight(2);
        stroke(this.colors[this.type].body);

        for (let i = 0; i < this.tail.length; i++) {
            let segment = this.tail[i];
            fill(this.colors[this.type].body);
            circle(segment.x + scale / 2, segment.y + scale / 2, scale);
        }

        // Draw head
        fill(this.colors[this.type].head);
        circle(this.x + scale / 2, this.y + scale / 2, scale);

        // Draw eyes
        fill(this.colors[this.type].eyes);
        stroke('yellow');
        strokeWeight(1);
        rect(this.x + 3 * scale / 5, this.y, scale / 5);
        rect(this.x + scale / 5, this.y, scale / 5);
    }
    snakeKey(key) {
        if (this.keyPressedThisFrame < 2 || this.isDead) {
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
        this.colors[this.type].head = 'black'
        this.colors[this.type].eyes = 'gray'
        this.colors[this.type].body = 'darkred'
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
        this.x = this.start.x * scale
        this.y = this.start.y * scale
        this.tail = []
        this.size = 0
        this.speed = { x: 1 / scale / 0.2, y: 0 };
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
        this.colors =
        {
            'player': {
                body: 'blue',
                head: 'brown',
                eyes: 'red'
            },
            'pc': {
                body: 'green',
                head: 'darkgreen',
                eyes: 'red'
            }
        }
    }
}