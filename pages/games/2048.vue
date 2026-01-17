<template>
  <div class="game-container">
    <h2>2048</h2>
    <p class="instructions">操作方法：矢印キーでタイルをスライドさせます。</p>
    <div id="phaser-2048-game"></div>
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

    const GridSize = 4;
    const TileSize = 100;
    const TileMargin = 16;

    const config = {
        type: Phaser.AUTO,
        width: GridSize * TileSize + (GridSize + 1) * TileMargin,
        height: GridSize * TileSize + (GridSize + 1) * TileMargin,
        backgroundColor: '#bbada0',
        parent: 'phaser-2048-game',
        scene: {
            preload,
            create,
        },
    };

    const TileColors: { [key: number]: { bg: string, text: string } } = {
        0: { bg: '#cdc1b4', text: '#776e65' },
        2: { bg: '#eee4da', text: '#776e65' },
        4: { bg: '#ede0c8', text: '#776e65' },
        8: { bg: '#f2b179', text: '#f9f6f2' },
        16: { bg: '#f59563', text: '#f9f6f2' },
        32: { bg: '#f67c5f', text: '#f9f6f2' },
        64: { bg: '#f65e3b', text: '#f9f6f2' },
        128: { bg: '#edcf72', text: '#f9f6f2' },
        256: { bg: '#edcc61', text: '#f9f6f2' },
        512: { bg: '#edc850', text: '#f9f6f2' },
        1024: { bg: '#edc53f', text: '#f9f6f2' },
        2048: { bg: '#edc22e', text: '#f9f6f2' },
    };

    let board: number[][];
    let tileSprites: any[][];
    let score = 0;
    let canMove = true;

    function preload(this: Phaser.Scene) {}

    function create(this: Phaser.Scene) {
        board = Array.from({ length: GridSize }, () => Array(GridSize).fill(0));
        tileSprites = Array.from({ length: GridSize }, () => Array(GridSize).fill(null));

        drawGrid.call(this);
        addNumber.call(this);
        addNumber.call(this);
        
        this.input.keyboard.on('keydown-UP', () => handleMove(0, -1));
        this.input.keyboard.on('keydown-DOWN', () => handleMove(0, 1));
        this.input.keyboard.on('keydown-LEFT', () => handleMove(-1, 0));
        this.input.keyboard.on('keydown-RIGHT', () => handleMove(1, 0));
    }

    function drawGrid(this: Phaser.Scene) {
        for (let y = 0; y < GridSize; y++) {
            for (let x = 0; x < GridSize; x++) {
                const tileX = TileMargin * (x + 1) + TileSize * x;
                const tileY = TileMargin * (y + 1) + TileSize * y;
                
                // Background tile
                this.add.graphics()
                    .fillStyle(Phaser.Display.Color.HexStringToColor(TileColors[0].bg).color)
                    .fillRoundedRect(tileX, tileY, TileSize, TileSize, 8);

                // Sprite container
                const tileContainer = this.add.container(tileX + TileSize/2, tileY + TileSize/2);
                const tileSprite = this.add.graphics()
                    .fillStyle(Phaser.Display.Color.HexStringToColor(TileColors[board[y][x]].bg).color)
                    .fillRoundedRect(-TileSize/2, -TileSize/2, TileSize, TileSize, 8);
                const tileText = this.add.text(0, 0, board[y][x] === 0 ? '' : String(board[y][x]), {
                    fontSize: `${TileSize/3}px`,
                    color: TileColors[board[y][x]].text || '#000000',
                    fontStyle: 'bold'
                }).setOrigin(0.5);

                tileContainer.add([tileSprite, tileText]);
                tileSprites[y][x] = tileContainer;
            }
        }
    }

    function addNumber(this: Phaser.Scene) {
        let emptyTiles = [];
        for (let y = 0; y < GridSize; y++) {
            for (let x = 0; x < GridSize; x++) {
                if (board[y][x] === 0) {
                    emptyTiles.push({ x, y });
                }
            }
        }

        if (emptyTiles.length > 0) {
            const pos = Phaser.Math.RND.pick(emptyTiles);
            board[pos.y][pos.x] = Math.random() < 0.9 ? 2 : 4;
            updateGrid();
        }
    }
    
    function updateGrid() {
        for (let y = 0; y < GridSize; y++) {
            for (let x = 0; x < GridSize; x++) {
                const value = board[y][x];
                const container = tileSprites[y][x];
                const tileSprite = container.getAt(0);
                const tileText = container.getAt(1);

                tileSprite.clear();
                tileSprite.fillStyle(Phaser.Display.Color.HexStringToColor(TileColors[value as keyof typeof TileColors].bg).color)
                    .fillRoundedRect(-TileSize/2, -TileSize/2, TileSize, TileSize, 8);
                
                tileText.setText(value === 0 ? '' : String(value));
                tileText.setColor(TileColors[value as keyof typeof TileColors].text);
            }
        }
    }

    function handleMove(this: Phaser.Scene, dx: number, dy: number) {
        if (!canMove) return;
        canMove = false;
        
        const traversals = buildTraversals(dx, dy);
        let moved = false;
        
        traversals.x.forEach(x => {
            traversals.y.forEach(y => {
                const cell = { x, y };
                const tile = board[y][x];

                if (tile) {
                    const positions = findFartherstPosition(cell, dx, dy);
                    const next = positions.next;
                    const farthest = positions.farthest;

                    if (next && next.value === tile) { // Merge
                        board[y][x] = 0;
                        board[next.y][next.x] *= 2;
                        score += board[next.y][next.x];
                        moved = true;
                    } else if (farthest) {
                        if (farthest.x !== x || farthest.y !== y) {
                           board[farthest.y][farthest.x] = tile;
                           board[y][x] = 0;
                           moved = true;
                        }
                    }
                }
            });
        });

        if (moved) {
            addNumber.call(this);
        }
        
        updateGrid();
        canMove = true;
        
        if (!movesAvailable()) {
            console.log("Game Over!");
        }
    }

    function buildTraversals(dx: number, dy: number) {
        const traversals = { x: [] as number[], y: [] as number[] };
        for (let i = 0; i < GridSize; i++) {
            traversals.x.push(i);
            traversals.y.push(i);
        }
        if (dx === 1) traversals.x = traversals.x.reverse();
        if (dy === 1) traversals.y = traversals.y.reverse();
        return traversals;
    }

    function findFartherstPosition(cell: {x:number, y:number}, dx: number, dy: number) {
        let current = cell;
        let next;
        do {
            next = { x: current.x + dx, y: current.y + dy, value: 0 };
            if (!isWithinBounds(next) || board[next.y][next.x] !== 0) break;
            current = next;
        } while (isWithinBounds(current));
        
        const nextCell = { x: current.x + dx, y: current.y + dy };
        if(isWithinBounds(nextCell)) {
            next.value = board[nextCell.y][nextCell.x];
        }

        return { farthest: current, next: isWithinBounds(nextCell) ? next : null };
    }
    
    function isWithinBounds(cell: {x:number, y:number}) {
        return cell.x >= 0 && cell.x < GridSize && cell.y >= 0 && cell.y < GridSize;
    }

    function movesAvailable() {
        // Check for empty cells
        if (board.flat().includes(0)) return true;
        // Check for possible merges
        for (let y = 0; y < GridSize; y++) {
            for (let x = 0; x < GridSize; x++) {
                const tile = board[y][x];
                if ((x < GridSize - 1 && tile === board[y][x+1]) || (y < GridSize - 1 && tile === board[y+1][x])) {
                    return true;
                }
            }
        }
        return false;
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
