<template>
  <div class="game-container">
    <h2>Tetris</h2>
    <p class="instructions">操作方法：左右の矢印キーで移動、上の矢印キーで回転、下の矢印キーでソフトドロップします。</p>
    <div id="phaser-tetris-game"></div>
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

    const BoardWidth = 10;
    const BoardHeight = 20;
    const BlockSize = 30;

    const config = {
        type: Phaser.AUTO,
        width: BoardWidth * BlockSize,
        height: BoardHeight * BlockSize,
        backgroundColor: '#2d2d2d',
        parent: 'phaser-tetris-game',
        scene: {
            preload,
            create,
            update,
        },
    };

    const Tetrominoes = {
        'I': [[1, 1, 1, 1]],
        'J': [[1, 0, 0], [1, 1, 1]],
        'L': [[0, 0, 1], [1, 1, 1]],
        'O': [[1, 1], [1, 1]],
        'S': [[0, 1, 1], [1, 1, 0]],
        'T': [[0, 1, 0], [1, 1, 1]],
        'Z': [[1, 1, 0], [0, 1, 1]]
    };
    const Colors = [0x00f0f0, 0x0000f0, 0xf0a000, 0xf0f000, 0x00f000, 0xa000f0, 0xf00000];

    let board: any[][];
    let graphics: any;
    let currentPiece: { shape: number[][], x: number, y: number, color: number };
    let dropTimer: Phaser.Time.TimerEvent;
    let normalDropDelay = 1000;
    let cursors: any;
    let score = 0;
    let scoreText: any;
    let gameOver = false;


    function preload(this: Phaser.Scene) {}

    function create(this: Phaser.Scene) {
        cursors = this.input.keyboard.createCursorKeys();
        board = Array.from({ length: BoardHeight }, () => Array(BoardWidth).fill(0));
        graphics = this.add.graphics();
        scoreText = this.add.text(5, 5, 'Score: 0', { fontSize: '20px', color: '#ffffff' }).setDepth(1);
        
        spawnNewPiece.call(this);
        
        dropTimer = this.time.addEvent({
            delay: normalDropDelay,
            callback: movePieceDown,
            callbackScope: this,
            loop: true
        });
    }

    function update(this: Phaser.Scene, time: number, delta: number) {
        if (gameOver) return;

        if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
            movePiece(-1, 0);
        } else if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
            movePiece(1, 0);
        } else if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
            rotatePiece();
        }

        if (cursors.down.isDown) {
            dropTimer.delay = 50; // Soft drop speed
        } else {
            dropTimer.delay = normalDropDelay; // Restore normal speed
        }

        draw();
    }
    
    function draw() {
        graphics.clear();
        // Draw board
        for (let y = 0; y < BoardHeight; y++) {
            for (let x = 0; x < BoardWidth; x++) {
                if (board[y][x]) {
                    graphics.fillStyle(Colors[board[y][x] -1]);
                    graphics.fillRect(x * BlockSize, y * BlockSize, BlockSize, BlockSize);
                }
            }
        }
        // Draw current piece
        graphics.fillStyle(Colors[currentPiece.color]);
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    graphics.fillRect((currentPiece.x + x) * BlockSize, (currentPiece.y + y) * BlockSize, BlockSize, BlockSize);
                }
            }
        }
    }

    function spawnNewPiece(this: Phaser.Scene) {
        const pieces = 'IJLOSTZ';
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        const shape = Tetrominoes[type as keyof typeof Tetrominoes];
        const color = pieces.indexOf(type);

        currentPiece = {
            shape,
            color,
            x: Math.floor(BoardWidth / 2) - Math.floor(shape[0].length / 2),
            y: 0,
        };

        if (checkCollision()) {
            gameOver = true;
            dropTimer.remove();
            scoreText.setText(`Game Over\nScore: ${score}`);
        }
    }

    function movePiece(dx: number, dy: number) {
        currentPiece.x += dx;
        currentPiece.y += dy;
        if (checkCollision()) {
            currentPiece.x -= dx;
            currentPiece.y -= dy;
            return false;
        }
        return true;
    }
    
    function movePieceDown(this: Phaser.Scene) {
        if (!movePiece(0, 1)) {
            lockPiece.call(this);
            clearLines.call(this);
            spawnNewPiece.call(this);
        }
    }

    function rotatePiece() {
        const originalShape = currentPiece.shape;
        const newShape = originalShape[0].map((_, colIndex) => originalShape.map(row => row[colIndex]).reverse());
        currentPiece.shape = newShape;

        if (checkCollision()) {
            currentPiece.shape = originalShape; // Revert if collision
        }
    }

    function checkCollision() {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    const newX = currentPiece.x + x;
                    const newY = currentPiece.y + y;
                    if (newX < 0 || newX >= BoardWidth || newY >= BoardHeight || (newY >= 0 && board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    function lockPiece() {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color + 1;
                }
            }
        }
    }

    function clearLines(this: Phaser.Scene) {
        let linesCleared = 0;
        for (let y = BoardHeight - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== 0)) {
                linesCleared++;
                board.splice(y, 1);
                board.unshift(Array(BoardWidth).fill(0));
                y++; // Re-check the same row index as it's now a new row
            }
        }
        if (linesCleared > 0) {
            score += linesCleared * 10;
            scoreText.setText('Score: ' + score);
            normalDropDelay = Math.max(200, 1000 - (score * 10));
            dropTimer.delay = normalDropDelay;
        }
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
</style>
