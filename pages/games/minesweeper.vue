<template>
  <div class="game-container">
    <h2>Minesweeper</h2>
    <p class="instructions">操作方法：クリックでセルを開き、右クリックで旗を立てます。</p>
    <div id="phaser-minesweeper-game"></div>
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

    const Rows = 16;
    const Cols = 16;
    const NumMines = 40;
    const TileSize = 30;

    const config = {
        type: Phaser.AUTO,
        width: Cols * TileSize,
        height: Rows * TileSize,
        backgroundColor: '#c0c0c0',
        parent: 'phaser-minesweeper-game',
        scene: {
            create,
        },
    };

    const CellState = { HIDDEN: 0, REVEALED: 1, FLAGGED: 2 };
    
    let board: { isMine: boolean, adjacentMines: number, state: number, sprite: any, text: any }[][];
    let gameOver = false;
    let firstClick = true;

    function create(this: Phaser.Scene) {
        board = Array.from({ length: Rows }, (_, r) => 
            Array.from({ length: Cols }, (_, c) => ({
                isMine: false,
                adjacentMines: 0,
                state: CellState.HIDDEN,
                sprite: this.add.sprite(c * TileSize, r * TileSize, 'cell').setOrigin(0),
                text: this.add.text(c * TileSize + TileSize/2, r * TileSize + TileSize/2, '', { fontSize: `${TileSize*0.6}px`, color: '#000000' }).setOrigin(0.5)
            }))
        );

        const hiddenTexture = this.add.graphics()
            .fillStyle(0xb0b0b0).fillRect(0,0,TileSize,TileSize)
            .lineStyle(2, 0x808080, 1).strokeRect(0,0,TileSize,TileSize)
            .lineStyle(2, 0xffffff, 1).strokePoints([{x:0,y:TileSize-2},{x:0,y:0},{x:TileSize-2,y:0}])
            .generateTexture('hidden');
        hiddenTexture.destroy();

        const revealedTexture = this.add.graphics()
            .fillStyle(0xc0c0c0).fillRect(0,0,TileSize,TileSize)
            .lineStyle(1, 0x808080, 1).strokeRect(0,0,TileSize,TileSize)
            .generateTexture('revealed');
        revealedTexture.destroy();

        board.forEach((row, r) => row.forEach((cell, c) => {
            cell.sprite.setTexture('hidden');
            cell.sprite.setInteractive();
            cell.sprite.on('pointerdown', (pointer: any) => handleCellClick.call(this, pointer, r, c));
            cell.text.setDepth(1);
        }));
    }

    function placeMines(this: Phaser.Scene, firstR: number, firstC: number) {
        let minesPlaced = 0;
        while (minesPlaced < NumMines) {
            const r = Math.floor(Math.random() * Rows);
            const c = Math.floor(Math.random() * Cols);
            if (!board[r][c].isMine && !(r === firstR && c === firstC)) {
                board[r][c].isMine = true;
                minesPlaced++;
            }
        }

        for (let r = 0; r < Rows; r++) {
            for (let c = 0; c < Cols; c++) {
                if (!board[r][c].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < Rows && nc >= 0 && nc < Cols && board[nr][nc].isMine) {
                                count++;
                            }
                        }
                    }
                    board[r][c].adjacentMines = count;
                }
            }
        }
    }

    function handleCellClick(this: Phaser.Scene, pointer: any, r: number, c: number) {
        if (gameOver) return;

        const cell = board[r][c];

        if (pointer.rightButtonDown()) {
            if (cell.state === CellState.HIDDEN) {
                cell.state = CellState.FLAGGED;
                cell.text.setText('🚩');
            } else if (cell.state === CellState.FLAGGED) {
                cell.state = CellState.HIDDEN;
                cell.text.setText('');
            }
        } else { // Left click
            if (cell.state === CellState.FLAGGED) return;
            if (firstClick) {
                placeMines.call(this, r, c);
                firstClick = false;
            }

            if (cell.isMine) {
                gameOver = true;
                cell.text.setText('💣');
                alert('Game Over!');
                // Reveal all mines
                board.forEach(row => row.forEach(c => { if(c.isMine) c.text.setText('💣')}));
                return;
            }
            
            revealCell.call(this, r, c);
            checkWinCondition.call(this);
        }
    }

    function revealCell(this: Phaser.Scene, r: number, c: number) {
        if (r < 0 || r >= Rows || c < 0 || c >= Cols || board[r][c].state !== CellState.HIDDEN) {
            return;
        }

        const cell = board[r][c];
        cell.state = CellState.REVEALED;
        cell.sprite.setTexture('revealed');

        if (cell.adjacentMines > 0) {
            cell.text.setText(String(cell.adjacentMines));
        } else {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    revealCell.call(this, r + dr, c + dc);
                }
            }
        }
    }

    function checkWinCondition(this: Phaser.Scene) {
        const hasWon = board.flat().every(cell => cell.isMine || cell.state === CellState.REVEALED);
        if (hasWon) {
            gameOver = true;
            alert('You Win!');
        }
    }

    gameInstance = new Phaser.Game(config);
    gameInstance.input.mouse.disableContextMenu();
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
