document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const gameState = {
        board: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 'X',
        gameMode: 'pvp',
        gameActive: true,
        scores: {
            playerX: 0,
            playerO: 0,
            ties: 0
        },
        winCombinations: [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ]
    };

    // DOM Elements
    const cells = document.querySelectorAll('.cell');
    const statusDisplay = document.getElementById('status');
    const restartButton = document.getElementById('restart-btn');
    const pvpButton = document.getElementById('pvp-btn');
    const pvcButton = document.getElementById('pvc-btn');
    const playerXScore = document.querySelector('#player1-score span');
    const playerOScore = document.querySelector('#player2-score span');
    const tiesScore = document.querySelector('#ties span');

    // Initialize the game
    initGame();

    function initGame() {
        // Reset board
        gameState.board = ['', '', '', '', '', '', '', '', ''];
        gameState.gameActive = true;
        gameState.currentPlayer = 'X';
        
        // Reset UI
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'win-line');
            cell.classList.remove('row-0', 'row-1', 'row-2', 'col-0', 'col-1', 'col-2', 'diag-0', 'diag-1');
        });
        
        updateStatus();
        
        // Add event listeners
        cells.forEach(cell => {
            cell.addEventListener('click', handleCellClick);
        });
        
        restartButton.addEventListener('click', restartGame);
        pvpButton.addEventListener('click', () => switchMode('pvp'));
        pvcButton.addEventListener('click', () => switchMode('pvc'));
    }

    function handleCellClick(event) {
        const cell = event.target;
        const index = parseInt(cell.getAttribute('data-index'));
        
        // Check if cell is already taken or game is inactive
        if (gameState.board[index] !== '' || !gameState.gameActive) {
            return;
        }
        
        // Process player move
        processMove(index);
        
        // Computer's turn if in PVC mode and game is still active
        if (gameState.gameMode === 'pvc' && gameState.currentPlayer === 'O' && gameState.gameActive) {
            setTimeout(computerMove, 600);
        }
    }

    function processMove(index) {
        // Update board state
        gameState.board[index] = gameState.currentPlayer;
        
        // Update UI
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        cell.classList.add(gameState.currentPlayer.toLowerCase());
        cell.textContent = gameState.currentPlayer;
        
        // Check for win or draw
        const winInfo = checkWin();
        if (winInfo) {
            endGame(winInfo.winner, winInfo.combination);
        } else if (!gameState.board.includes('')) {
            endGame('draw');
        } else {
            // Switch player
            gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
            updateStatus();
        }
    }

    function computerMove() {
        // Simple AI strategy:
        // 1. Check for winning move
        // 2. Block opponent's winning move
        // 3. Choose center if available
        // 4. Choose a corner
        // 5. Choose randomly
        
        let move = -1;
        
        // Check for winning move for computer
        move = findWinningMove('O');
        if (move !== -1) {
            processMove(move);
            return;
        }
        
        // Block player's winning move
        move = findWinningMove('X');
        if (move !== -1) {
            processMove(move);
            return;
        }
        
        // Take center if available
        if (gameState.board[4] === '') {
            processMove(4);
            return;
        }
        
        // Take a random corner
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(index => gameState.board[index] === '');
        if (availableCorners.length > 0) {
            const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
            processMove(randomCorner);
            return;
        }
        
        // Take any available cell
        const availableCells = gameState.board
            .map((cell, index) => cell === '' ? index : -1)
            .filter(index => index !== -1);
        
        if (availableCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            processMove(availableCells[randomIndex]);
        }
    }

    function findWinningMove(player) {
        for (let i = 0; i < gameState.winCombinations.length; i++) {
            const [a, b, c] = gameState.winCombinations[i];
            const values = [gameState.board[a], gameState.board[b], gameState.board[c]];
            
            // Count how many cells are taken by the player and how many are empty
            const playerCount = values.filter(val => val === player).length;
            const emptyCount = values.filter(val => val === '').length;
            
            if (playerCount === 2 && emptyCount === 1) {
                // Find the empty cell in the combination
                if (gameState.board[a] === '') return a;
                if (gameState.board[b] === '') return b;
                if (gameState.board[c] === '') return c;
            }
        }
        return -1;
    }

    function checkWin() {
        for (let i = 0; i < gameState.winCombinations.length; i++) {
            const [a, b, c] = gameState.winCombinations[i];
            
            if (
                gameState.board[a] !== '' &&
                gameState.board[a] === gameState.board[b] &&
                gameState.board[a] === gameState.board[c]
            ) {
                return {
                    winner: gameState.board[a],
                    combination: i
                };
            }
        }
        return null;
    }

    function endGame(winner, combination) {
        gameState.gameActive = false;
        
        if (winner === 'draw') {
            statusDisplay.textContent = "Game ended in a draw!";
            gameState.scores.ties++;
            tiesScore.textContent = `Ties: ${gameState.scores.ties}`;
        } else {
            // Update scores
            if (winner === 'X') {
                gameState.scores.playerX++;
                playerXScore.textContent = `Player X: ${gameState.scores.playerX}`;
                statusDisplay.textContent = "Player X wins!";
            } else {
                gameState.scores.playerO++;
                playerOScore.textContent = `Player O: ${gameState.scores.playerO}`;
                statusDisplay.textContent = "Player O wins!";
            }
            
            // Highlight winning combination
            highlightWinner(combination);
        }
    }

    function highlightWinner(combinationIndex) {
        const combination = gameState.winCombinations[combinationIndex];
        
        // Determine the type of win for styling
        let winType = '';
        if (combinationIndex < 3) {
            winType = `row-${combinationIndex}`;
        } else if (combinationIndex < 6) {
            winType = `col-${combinationIndex - 3}`;
        } else {
            winType = `diag-${combinationIndex - 6}`;
        }
        
        // Add win-line class to the winning cells
        combination.forEach(index => {
            const cell = document.querySelector(`.cell[data-index="${index}"]`);
            cell.classList.add('win-line', winType);
        });
    }

    function updateStatus() {
        if (gameState.gameActive) {
            if (gameState.gameMode === 'pvp') {
                statusDisplay.textContent = `Player ${gameState.currentPlayer}'s turn`;
            } else {
                statusDisplay.textContent = gameState.currentPlayer === 'X' 
                    ? "Your turn (X)" 
                    : "Computer's turn (O)";
            }
        }
    }

    function restartGame() {
        initGame();
    }

    function switchMode(mode) {
        gameState.gameMode = mode;
        
        // Update UI for active mode
        if (mode === 'pvp') {
            pvpButton.classList.add('active');
            pvcButton.classList.remove('active');
            playerOScore.textContent = `Player O: ${gameState.scores.playerO}`;
            document.querySelector('#player2-score i').className = 'fas fa-user';
        } else {
            pvpButton.classList.remove('active');
            pvcButton.classList.add('active');
            playerOScore.textContent = `Computer: ${gameState.scores.playerO}`;
            document.querySelector('#player2-score i').className = 'fas fa-robot';
        }
        
        restartGame();
    }
});