<template>
  <div class="game-container">
    <h2>Flappy Bird</h2>
    <p class="instructions">操作方法：スペースキーまたはクリックでジャンプします。</p>
    <div id="phaser-flappy-game"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

declare const Phaser: any;

let gameInstance: any | null = null;

const initGame = () => {
    if (typeof Phaser === 'undefined') {
        setTimeout(initGame, 100);
        return;
    }

    const config = {
        type: Phaser.AUTO,
        width: 400,
        height: 600,
        backgroundColor: '#87ceeb',
        parent: 'phaser-flappy-game',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 800 },
                debug: false,
            },
        },
        scene: {
            preload,
            create,
            update,
        },
    };

    let bird: any;
    let pipes: any;
    let score = 0;
    let scoreText: any;
    let gameOver = false;
    let scoreTimer: Phaser.Time.TimerEvent;
    let pipeHorizontalDistance = 0;
    const pipeVerticalDistanceRange = [150, 250];
    const pipeHorizontalDistanceRange = [250, 350];

    function preload(this: Phaser.Scene) {
        // No assets needed
    }

    function create(this: Phaser.Scene) {
        // Create bird texture
        const birdGraphics = this.add.graphics();
        birdGraphics.fillStyle(0xffff00, 1); // Yellow
        birdGraphics.fillCircle(10, 10, 10);
        birdGraphics.generateTexture('bird', 20, 20);
        birdGraphics.destroy();

        // Create pipe texture
        const pipeGraphics = this.add.graphics();
        pipeGraphics.fillStyle(0x00ff00, 1); // Green
        pipeGraphics.fillRect(0, 0, 80, 400);
        pipeGraphics.generateTexture('pipe', 80, 400);
        pipeGraphics.destroy();

        // Bird
        bird = this.physics.add.sprite(100, 300, 'bird');
        bird.setCollideWorldBounds(true);
        bird.body.onWorldBounds = true;

        // Pipes (immune to gravity)
        pipes = this.physics.add.group({
            allowGravity: false,
            immovable: true,
        });

        // Score
        score = 0;
        scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', color: '#000' });
        scoreText.setDepth(1); // Render text on top of other objects

        // Time-based score
        scoreTimer = this.time.addEvent({
            delay: 100,
            callback: () => {
                score++;
                scoreText.setText('Score: ' + score);
            },
            loop: true
        });
        
        // Game Over Logic
        const endGame = () => {
            if (gameOver) return;
            gameOver = true;
            scoreTimer.paused = true;
            this.physics.pause();
            bird.setTint(0xff0000);
            scoreText.setText(`Score: ${score}\nClick to Restart`);
            this.input.once('pointerdown', () => {
                gameOver = false;
                score = 0;
                pipeHorizontalDistance = 0;
                this.scene.restart();
            }, this);
        }

        // Collision
        this.physics.add.collider(bird, pipes, endGame, undefined, this);
        this.physics.world.on('worldbounds', (body: any, up: boolean, down: boolean) => {
            if (body.gameObject === bird && (up || down)) {
                endGame();
            }
        }, this);
        
        // Input
        this.input.on('pointerdown', () => {
            if (!gameOver) bird.setVelocityY(-350);
        });
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!gameOver) bird.setVelocityY(-350);
        });
    }

    function update(this: Phaser.Scene) {
        if (gameOver) {
            scoreTimer.paused = true;
            return;
        }

        // Rotate bird
        if (bird.angle < 20) {
            bird.angle += 1;
        }

        pipeHorizontalDistance += 2;

        if (pipeHorizontalDistance > Phaser.Math.Between(pipeHorizontalDistanceRange[0], pipeHorizontalDistanceRange[1])) {
            pipeHorizontalDistance = 0;
            const pipeVerticalDistance = Phaser.Math.Between(pipeVerticalDistanceRange[0], pipeVerticalDistanceRange[1]);
            const pipeVerticalPosition = Phaser.Math.Between(50, 550 - pipeVerticalDistance);
            
            pipes.create(400, pipeVerticalPosition, 'pipe').setOrigin(0, 1);
            pipes.create(400, pipeVerticalPosition + pipeVerticalDistance, 'pipe').setOrigin(0, 0);
            
            pipes.setVelocityX(-200);
        }

        pipes.getChildren().forEach((pipe: any) => {
            // Destroy pipes when they're off screen
            if (pipe.x < -100) {
                pipe.destroy();
            }
        });
    }

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
#phaser-flappy-game {
  margin-top: 20px;
  border: 1px solid #ccc;
}
</style>
