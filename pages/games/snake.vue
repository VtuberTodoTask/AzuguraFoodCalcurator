<template>
  <div class="game-container">
    <h2>Snake Game</h2>
    <p class="instructions">操作方法：矢印キーでスネークを操作します。</p>
    <div id="phaser-snake-game"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

// Type definition for Phaser if not globally available
declare const Phaser: any;

let gameInstance: any | null = null; // Phaser.Game

const initGame = () => {
    if (typeof Phaser === 'undefined') {
        setTimeout(initGame, 100);
        return;
    }

    // --- Phaser Game Logic ---

    class Food extends Phaser.GameObjects.Image {
        constructor(scene: Phaser.Scene, x: number, y: number) {
            super(scene, x, y, 'food');
            this.setTexture('food');
            this.setPosition(x * 16, y * 16);
            this.setOrigin(0);
            this.scene.children.add(this);
        }

        eat(): void {
            const x = Phaser.Math.Between(0, 39);
            const y = Phaser.Math.Between(0, 29);
            this.setPosition(x * 16, y * 16);
        }
    }

    class Snake {
        headPosition: Phaser.Geom.Point;
        body: Phaser.GameObjects.Group;
        head: Phaser.GameObjects.Image;
        alive: boolean;
        speed: number;
        minSpeed: number;
        moveTime: number;
        tail: Phaser.Geom.Point;
        heading: number;
        direction: number;

        constructor(scene: Phaser.Scene, x: number, y: number) {
            this.headPosition = new Phaser.Geom.Point(x, y);
            this.body = scene.add.group();
            this.head = this.body.create(x * 16, y * 16, 'body');
            this.head.setOrigin(0);
            this.alive = true;
            this.speed = 120;
            this.minSpeed = 30;
            this.moveTime = 0;
            this.tail = new Phaser.Geom.Point(x, y);
            this.heading = Phaser.Math.Between(0, 3);
            this.direction = this.heading;
        }

        update(time: number): boolean {
            if (time >= this.moveTime) {
                return this.move(time);
            }
            return false;
        }

        faceLeft(): void {
            if (this.direction === 2 || this.direction === 3) this.heading = 0;
        }
        faceRight(): void {
            if (this.direction === 2 || this.direction === 3) this.heading = 1;
        }
        faceUp(): void {
            if (this.direction === 0 || this.direction === 1) this.heading = 2;
        }
        faceDown(): void {
            if (this.direction === 0 || this.direction === 1) this.heading = 3;
        }

        move(time: number): boolean {
            switch (this.heading) {
                case 0: this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x - 1, 0, 40); break;
                case 1: this.headPosition.x = Phaser.Math.Wrap(this.headPosition.x + 1, 0, 40); break;
                case 2: this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y - 1, 0, 30); break;
                case 3: this.headPosition.y = Phaser.Math.Wrap(this.headPosition.y + 1, 0, 30); break;
            }
            this.direction = this.heading;

            Phaser.Actions.ShiftPosition(this.body.getChildren(), this.headPosition.x * 16, this.headPosition.y * 16, 1, this.tail);

            const hitBody = Phaser.Actions.GetFirst(this.body.getChildren(), { x: this.head.x, y: this.head.y }, 1);
            if (hitBody) {
                this.alive = false;
                return false;
            }

            this.moveTime = time + this.speed;
            return true;
        }

        grow(): void {
            const newPart = this.body.create(this.tail.x, this.tail.y, 'body');
            newPart.setOrigin(0);
            this.speed = Math.max(this.minSpeed, this.speed - 2);
        }

        collideWithFood(food: Food): boolean {
            if (this.head.x === food.x && this.head.y === food.y) {
                this.grow();
                food.eat();
                return true;
            }
            return false;
        }
    }

    const snakeGameScene = new Phaser.Scene('SnakeGame');

    snakeGameScene.preload = function (this: Phaser.Scene) {
        // No assets to load from external URLs
    };

    let snake: Snake;
    let food: Food;
    let cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    let scoreText: Phaser.GameObjects.Text;

    snakeGameScene.create = function (this: Phaser.Scene) {
        // Create 'food' texture
        const foodGraphics = this.add.graphics();
        foodGraphics.fillStyle(0xff0000, 1); // Red
        foodGraphics.fillRect(0, 0, 16, 16);
        foodGraphics.generateTexture('food', 16, 16);
        foodGraphics.destroy();

        // Create 'body' texture
        const bodyGraphics = this.add.graphics();
        bodyGraphics.fillStyle(0x00ff00, 1); // Green
        bodyGraphics.fillRect(0, 0, 16, 16);
        bodyGraphics.generateTexture('body', 16, 16);
        bodyGraphics.destroy();

        food = new Food(this, 3, 4);
        snake = new Snake(this, 8, 8);
        cursors = this.input.keyboard.createCursorKeys();
        scoreText = this.add.text(10, 10, 'Score: 1', { font: '18px Arial', color: '#ffffff' });
    };

    snakeGameScene.update = function (this: Phaser.Scene, time: number) {
        if (!snake.alive) {
            this.scene.restart();
        }

        if (cursors.left.isDown) snake.faceLeft();
        else if (cursors.right.isDown) snake.faceRight();
        else if (cursors.up.isDown) snake.faceUp();
        else if (cursors.down.isDown) snake.faceDown();

        if (snake.update(time)) {
            if (snake.collideWithFood(food)) {
                scoreText.setText('Score: ' + snake.body.getLength());
            }
        }
    };
    // --- End of Phaser Game Logic ---

    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 640,
        height: 480,
        backgroundColor: '#2d2d2d',
        parent: 'phaser-snake-game',
        scene: snakeGameScene
    };

    gameInstance = new Phaser.Game(config);
};

useHead({
    script: [
        {
            src: 'https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js',
            async: true,
        },
    ],
});

onMounted(() => {
    initGame();
});

onUnmounted(() => {
    if (gameInstance) {
        gameInstance.destroy(true);
        gameInstance = null;
    }
});
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}
#phaser-snake-game {
  margin-top: 20px;
  border: 1px solid #ccc;
}
</style>
