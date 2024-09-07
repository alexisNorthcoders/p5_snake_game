class Snake {
    x = 2 * scale
    y = 4 * scale
    speed = { x: 1, y: 0 };
    size = 0;
    tail = [];
    keyPressedThisFrame = false;
    isDead = false;
    colors = {
        body: 'green',
        head: 'darkgreen',
        eyes: 'red'
    }
    direction(x, y) {
        this.speed.x = x;
        this.speed.y = y;
    }
    eat(food) {
        let distance = dist(this.x, this.y, food.x, food.y)
        if (distance < 1) {
            if (food.type === 'super') this.superGrow()
            if (food.type === 'poison') this.shrink()
            if (food.type === 'normal') this.grow()

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
        /* this.x = constrain(this.x, 0, width - scale)
        this.y = constrain(this.y, 0, height - scale) */
        this.keyPressedThisFrame = false;
    }
    draw() {

        fill(this.colors.body);
        strokeWeight(2);
        stroke(this.colors.body);
        for (let i = 0; i < this.tail.length; i++) {
            let segment = this.tail[i];
            let nextSegment = this.tail[i + 1] || { x: this.x, y: this.y };

            fill(this.colors.body);
            circle(segment.x + scale / 2, segment.y + scale / 2, scale);

            // Draw circles to connect segments
            if (i < this.tail.length - 1) {
                let circX = (segment.x + nextSegment.x) / 2 + scale / 2;
                let circY = (segment.y + nextSegment.y) / 2 + scale / 2;
                circle(circX, circY, scale);
            }
        }
        //head
        fill(this.colors.head);
        circle(this.x + scale / 2, this.y + scale / 2, scale);
        fill(this.colors.eyes);
        stroke('yellow');
        strokeWeight(1);
        rect(this.x + 3 * scale / 5, this.y, scale / 5);
        rect(this.x + scale / 5, this.y, scale / 5);


    }
    snakeKey(key) {
        if (this.keyPressedThisFrame || this.isDead) {
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
        this.keyPressedThisFrame = true;
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
                //  this.size = 0
                // this.tail = []
            }
        });
    }
    reset() {
        this.x = 2 * scale
        this.y = 4 * scale
        this.tail = []
        this.size = 0
        this.speaed = { x: 1, y: 0 };
        this.direction(1, 0)

    }
    shrink() {
        if (this.size > 0) {
            this.size--;
        }
        this.tail.shift();
    }
    grow() {
        this.size++
        this.tail.push(createVector(this.x, this.y))

    }
    superGrow() {
        this.size += 2
        this.tail.push(createVector(this.x, this.y))
        this.tail.push(createVector(this.x, this.y))
    }
}