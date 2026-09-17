let answerList = [];
let allowedGuesses = [];
let answer = "";

const maxAttempts = 6;
let attempts = maxAttempts;
let count = 1;
let currentGuess = "";
let currentRow = 0;
const bannedLetters = new Set();
let gameOver = false;
let isAnimating = false;
let gameWon = false;

let hardMode = false;
const greenHints = [null, null, null, null, null];
const requiredLetters = new Set();
let gameHistory = [];

let gamesPlayed = 0;
let wins = 0;
let currentStreak = 0;
let bestStreak = 0;
let guessDistribution = [0, 0, 0, 0, 0, 0];

/**
 * Loads the answer and allowed guess word lists from the text files.
 */
async function loadWordLists() {
  const answerResponse = await fetch("wordle_answers_list.txt");
  const answerText = await answerResponse.text();

  answerList = answerText
    .split(/\r?\n/)
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length === 5);

  const guessResponse = await fetch("wordle_allowed_guesses.txt");
  const guessText = await guessResponse.text();

  allowedGuesses = guessText
    .split(/\r?\n/)
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length === 5);

  console.log("Answers:", answerList.length);
  console.log("Allowed guesses:", allowedGuesses.length);
}

/**
 * Loads the saved game statistics from local storage.
 */
function loadStatistics() {
  gamesPlayed = Number(localStorage.getItem("wordle-games")) || 0;
  wins = Number(localStorage.getItem("wordle-wins")) || 0;
  currentStreak = Number(localStorage.getItem("wordle-current-streak")) || 0;
  bestStreak = Number(localStorage.getItem("wordle-best-streak")) || 0;

  const savedDistribution = localStorage.getItem("wordle-guess-distribution");

  if (savedDistribution) {
    const parsedDistribution = JSON.parse(savedDistribution);

    if (Array.isArray(parsedDistribution) && parsedDistribution.length === 6) {
      guessDistribution = parsedDistribution;
    }
  }
}

/**
 * Saves the current game statistics to local storage.
 */
function saveStatistics() {
  localStorage.setItem("wordle-games", gamesPlayed);
  localStorage.setItem("wordle-wins", wins);
  localStorage.setItem("wordle-current-streak", currentStreak);
  localStorage.setItem("wordle-best-streak", bestStreak);
  localStorage.setItem(
    "wordle-guess-distribution",
    JSON.stringify(guessDistribution)
  );
}

/**
 * Saves the current game so it can be restored after a refresh.
 */
function saveGameState() {
  const gameState = {
    answer,
    attempts,
    count,
    currentRow,
    gameOver,
    gameWon,
    hardMode,
    greenHints,
    requiredLetters: Array.from(requiredLetters),
    gameHistory
  };

  localStorage.setItem("wordle-current-game", JSON.stringify(gameState));
}

/**
 * Loads the saved game state and restores the game from where it left off.
 *
 * @returns {boolean} True if a saved game was loaded successfully.
 */
function loadGameState() {
  const savedGame = localStorage.getItem("wordle-current-game");

  if (!savedGame) {
    return false;
  }

  try {
    const gameState = JSON.parse(savedGame);

    if (
      typeof gameState.answer !== "string" ||
      !Array.isArray(gameState.gameHistory)
    ) {
      return false;
    }

    answer = gameState.answer;
    attempts = Number(gameState.attempts) || 6;
    count = Number(gameState.count) || 1;
    currentRow = Number(gameState.currentRow) || 0;
    gameOver = Boolean(gameState.gameOver);
    gameWon = Boolean(gameState.gameWon);
    hardMode = Boolean(gameState.hardMode);

    if (
      Array.isArray(gameState.greenHints) &&
      gameState.greenHints.length === 5
    ) {
      greenHints.splice(0, greenHints.length, ...gameState.greenHints);
    }

    requiredLetters.clear();

    if (Array.isArray(gameState.requiredLetters)) {
      gameState.requiredLetters.forEach((letter) => {
        requiredLetters.add(letter);
      });
    }

    gameHistory = gameState.gameHistory;

    return true;
  } catch (error) {
    console.error("Could not load saved game:", error);

    return false;
  }
}

/**
 * Updates the statistics after a game has been completed.
 *
 * @param {boolean} won Whether the game was won.
 */
function recordGameResult(won) {
  gamesPlayed++;

  if (won) {
    wins++;
    currentStreak++;
    guessDistribution[count - 1]++;

    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
  } else {
    currentStreak = 0;
  }

  saveStatistics();
}

/**
 * Updates the statistics shown in the statistics panel.
 */
function updateStatisticsDisplay() {
  document.getElementById("stat-games").textContent = gamesPlayed;
  document.getElementById("stat-wins").textContent = wins;

  const winRate =
    gamesPlayed === 0 ? 0 : Math.round((wins / gamesPlayed) * 100);

  document.getElementById("stat-win-rate").textContent = `${winRate}%`;
  document.getElementById("stat-current-streak").textContent = currentStreak;
  document.getElementById("stat-best-streak").textContent = bestStreak;
}

/**
 * Updates the guess distribution bars using the saved results.
 */
function updateGuessDistribution() {
  const highestCount = Math.max(...guessDistribution, 1);

  for (let i = 0; i < 6; i++) {
    const bar = document.getElementById(`distribution-${i + 1}`);
    const percentage = (guessDistribution[i] / highestCount) * 100;

    bar.style.width = `${percentage}%`;
    bar.textContent = guessDistribution[i];
  }
}

/**
 * Chooses a random word from the answer list for the current game.
 */
function chooseAnswer() {
  const randomIndex = Math.floor(Math.random() * answerList.length);
  answer = answerList[randomIndex];

  console.log("Today's answer:", answer);
}

/**
 * Creates the six rows of five tiles used for the game board.
 */
function createBoard() {
  const board = document.getElementById("board");

  for (let row = 0; row < maxAttempts; row++) {
    for (let col = 0; col < 5; col++) {
      const tile = document.createElement("div");

      tile.classList.add("tile");
      tile.dataset.row = row;
      tile.dataset.col = col;
      board.appendChild(tile);
    }
  }
}

/**
 * Puts the guesses from the saved game back onto the board.
 */
function restoreBoard() {
  gameHistory.forEach((game, row) => {
    for (let i = 0; i < 5; i++) {
      const tile = document.querySelector(
        `.tile[data-row="${row}"][data-col="${i}"]`
      );

      if (tile) {
        tile.textContent = game.guess[i];

        tile.classList.remove(
          "typed",
          "typed-pop",
          "green",
          "yellow",
          "grey",
          "reveal",
          "shake"
        );

        tile.classList.add(game.colours[i]);
      }
    }
  });
}

const keyboardRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["⌫", "Z", "X", "C", "V", "B", "N", "M", "ENTER"]
];

/**
 * Creates the on-screen keyboard and adds click actions to each key.
 */
function createKeyboard() {
  const keyboard = document.getElementById("keyboard");

  keyboardRows.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.classList.add("keyboard-row");

    row.forEach((keyValue) => {
      const button = document.createElement("button");
      button.classList.add("key");

      if (keyValue === "⌫") {
        button.textContent = "⌫";
        button.dataset.key = "BACK";
      } else {
        button.textContent = keyValue;
        button.dataset.key = keyValue;
      }

      if (keyValue === "ENTER" || keyValue === "⌫") {
        button.classList.add("wide");
      }

      button.addEventListener("click", () => {
        if (keyValue === "⌫") {
          handleKey("BACK");
        } else {
          handleKey(keyValue);
        }
        button.blur();
      });

      rowElement.appendChild(button);
    });

    keyboard.appendChild(rowElement);
  });
}

/**
 * Adds a letter to the current guess if there is room for it.
 *
 * @param {string} letter The letter to add.
 */
function addLetter(letter) {
  if (gameOver || isAnimating) {
    return;
  }

  if (currentGuess.length < 5) {
    currentGuess += letter;
    updateCurrentRow();
    animateTypedTile();
  }
}

/**
 * Plays the small pop animation when a letter is added.
 */
function animateTypedTile() {
  const tileIndex = currentGuess.length - 1;

  const tile = document.querySelector(
    `.tile[data-row="${currentRow}"][data-col="${tileIndex}"]`
  );

  if (tile) {
    tile.classList.remove("typed");
    tile.classList.add("typed");
    void tile.offsetWidth;
    tile.classList.add("typed-pop");

    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("typed-pop");
      },
      { once: true }
    );
  }
}

/**
 * Updates the current board row to match the current guess.
 */
function updateCurrentRow() {
  for (let i = 0; i < 5; i++) {
    const tile = document.querySelector(
      `.tile[data-row="${currentRow}"][data-col="${i}"]`
    );

    if (tile) {
      tile.textContent = currentGuess[i] || "";
    }
  }
}

/**
 * Removes the last letter from the current guess.
 */
function removeLetter() {
  if (gameOver || isAnimating) {
    return;
  }

  if (currentGuess.length > 0) {
    const tileIndex = currentGuess.length - 1;
    currentGuess = currentGuess.slice(0, -1);
    updateCurrentRow();
    animateDeletedTile(tileIndex);
  }
}

/**
 * Plays the animation for removing a letter from the board.
 *
 * @param {number} tileIndex The position of the tile being cleared.
 */
function animateDeletedTile(tileIndex) {
  const tile = document.querySelector(
    `.tile[data-row="${currentRow}"][data-col="${tileIndex}"]`
  );

  if (tile) {
    tile.classList.remove("typed");
    tile.classList.remove("deleted");
    void tile.offsetWidth;
    tile.classList.add("deleted");

    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("deleted");
      },
      { once: true }
    );
  }
}

/**
 * Shakes the current row when a guess cannot be submitted.
 */
function shakeCurrentRow() {
  for (let i = 0; i < 5; i++) {
    const tile = document.querySelector(
      `.tile[data-row="${currentRow}"][data-col="${i}"]`
    );

    if (tile) {
      tile.classList.remove("shake");
      void tile.offsetWidth;
      tile.classList.add("shake");

      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("shake");
        },
        { once: true }
      );
    }
  }
}

/**
 * Checks whether the current guess is complete and is a valid word.
 *
 * @returns {boolean} True if the guess can be submitted.
 */
function validateGuess() {
  if (currentGuess.length !== 5) {
    showMessage("Your guess must contain 5 letters");
    shakeCurrentRow();
    return false;
  }

  const validGuess =
    allowedGuesses.includes(currentGuess) || answerList.includes(currentGuess);

  if (!validGuess) {
    showMessage("Not in word list");
    shakeCurrentRow();
    return false;
  }

  return true;
}

/**
 * Checks whether the current guess follows the hard mode rules.
 *
 * @returns {boolean} True if the hard mode requirements are met.
 */
function validateHardMode() {
  if (!hardMode) {
    return true;
  }

  for (let i = 0; i < 5; i++) {
    if (greenHints[i] !== null && currentGuess[i] !== greenHints[i]) {
      showMessage(`You must use ${greenHints[i]} in position ${i + 1}`);
      shakeCurrentRow();

      return false;
    }
  }

  for (const letter of requiredLetters) {
    if (!currentGuess.includes(letter)) {
      showMessage(`Your guess must contain ${letter}`);
      shakeCurrentRow();

      return false;
    }
  }

  return true;
}

/**
 * Compares the current guess with the answer and works out each tile colour.
 *
 * @returns {string[]} The colours to use for the five tiles.
 */
function checkGuess() {
  const answerLetters = answer.split("");
  const colours = ["grey", "grey", "grey", "grey", "grey"];

  for (let i = 0; i < 5; i++) {
    if (currentGuess[i] === answerLetters[i]) {
      colours[i] = "green";
      answerLetters[i] = null;
      greenHints[i] = currentGuess[i];
      requiredLetters.add(currentGuess[i]);
    }
  }

  for (let i = 0; i < 5; i++) {
    if (colours[i] === "green") {
      continue;
    }

    if (answerLetters.includes(currentGuess[i])) {
      colours[i] = "yellow";
      const index = answerLetters.indexOf(currentGuess[i]);
      answerLetters[index] = null;
      requiredLetters.add(currentGuess[i]);
    } else {
      colours[i] = "grey";
      bannedLetters.add(currentGuess[i]);
    }
  }

  return colours;
}

/**
 * Reveals the result of the guess one tile at a time.
 *
 * @param {string[]} colours The colours for each tile.
 * @param {Function} onComplete Function to run when all tiles are revealed.
 */
function colourTiles(colours, onComplete) {
  let tileIndex = 0;

  /**
   * Reveals the next tile and continues until the whole row is finished.
   */
  function revealNextTile() {
    if (tileIndex >= 5) {
      onComplete();
      return;
    }

    const tile = document.querySelector(
      `.tile[data-row="${currentRow}"][data-col="${tileIndex}"]`
    );

    if (!tile) {
      tileIndex++;
      revealNextTile();
      return;
    }

    const colour = colours[tileIndex];

    tile.classList.remove("reveal");
    tile.classList.remove("typed-pop");
    tile.classList.remove("green");
    tile.classList.remove("yellow");
    tile.classList.remove("grey");

    tile.style.setProperty("--result-color", `var(--${colour})`);
    void tile.offsetWidth;
    tile.classList.add("reveal");

    tile.addEventListener(
      "animationend",
      (event) => {
        if (event.animationName !== "tile-flip") {
          return;
        }

        tile.classList.remove("reveal");
        tile.classList.add(colour);
        tile.classList.remove("typed");
        tile.style.removeProperty("--result-color");
        tileIndex++;

        revealNextTile();
      },
      { once: true }
    );
  }

  revealNextTile();
}

/**
 * Updates the colour of a keyboard key based on a guess result.
 *
 * @param {string} guess The guess that was entered.
 * @param {string[]} colours The colours produced for that guess.
 */
function updateKeyboardForGuess(guess, colours) {
  for (let i = 0; i < 5; i++) {
    const letter = guess[i];
    const key = document.querySelector(`.key[data-key="${letter}"]`);

    if (!key) {
      continue;
    }

    if (key.classList.contains("green")) {
      continue;
    }

    if (colours[i] === "green") {
      key.classList.remove("yellow");
      key.classList.remove("grey");

      key.classList.add("green");
    } else if (colours[i] === "yellow" && !key.classList.contains("yellow")) {
      key.classList.remove("grey");

      key.classList.add("yellow");
    } else if (colours[i] === "grey" && !key.classList.contains("yellow")) {
      key.classList.add("grey");
    }
  }
}

/**
 * Updates the keyboard using the result of the current guess.
 *
 * @param {string[]} colours The colours from the current guess.
 */
function updateKeyboard(colours) {
  updateKeyboardForGuess(currentGuess, colours);
}

/**
 * Restores the keyboard colours from the saved game history.
 */
function restoreKeyboard() {
  const keys = document.querySelectorAll(".key");

  keys.forEach((key) => {
    key.classList.remove("green", "yellow", "grey");
  });

  gameHistory.forEach((game) => {
    updateKeyboardForGuess(game.guess, game.colours);
  });
}

/**
 * Shows a short message to the player and hides it after a moment.
 *
 * @param {string} message The message to display.
 */
function showMessage(message) {
  const messagePopup = document.getElementById("message");
  messagePopup.textContent = message;
  messagePopup.classList.add("show");

  clearTimeout(messagePopup.messageTimer);

  messagePopup.messageTimer = setTimeout(() => {
    messagePopup.classList.remove("show");
  }, 1000);
}

/**
 * Shows the result panel when the game has ended.
 */
function showResultPanel() {
  const overlay = document.getElementById("result-overlay");
  const gameResult = document.getElementById("game-result");
  const resultTitle = document.getElementById("result-title");
  const resultMessage = document.getElementById("result-message");
  const resultAnswer = document.getElementById("result-answer");
  const resultAttempts = document.getElementById("result-attempts");
  const playAgain = document.getElementById("play-again");

  gameResult.classList.remove("hidden");
  resultAnswer.textContent = answer;

  if (gameWon) {
    resultTitle.textContent = "You Won!";
    resultMessage.textContent = "Congratulations!";

    resultAttempts.textContent = `${count} ${
      count === 1 ? "attempt" : "attempts"
    }`;
  } else {
    resultTitle.textContent = "Game Over";
    resultMessage.textContent = "Better luck next time!";

    const usedAttempts = count - 1;

    resultAttempts.textContent = `${usedAttempts} ${
      usedAttempts === 1 ? "attempt" : "attempts"
    }`;
  }

  playAgain.classList.remove("hidden");

  updateStatisticsDisplay();
  updateGuessDistribution();

  overlay.classList.add("show");
}

/**
 * Opens the statistics panel without showing the game result.
 */
function showStatistics() {
  const overlay = document.getElementById("result-overlay");
  const gameResult = document.getElementById("game-result");
  const playAgain = document.getElementById("play-again");

  gameResult.classList.add("hidden");
  playAgain.classList.add("hidden");

  updateStatisticsDisplay();
  updateGuessDistribution();

  overlay.classList.add("show");
}

/**
 * Closes the result or statistics panel.
 */
function hideResultPanel() {
  const overlay = document.getElementById("result-overlay");

  overlay.classList.remove("show");
}

/**
 * Opens the help panel and starts the example animations.
 */
function showHelp() {
  const overlay = document.getElementById("help-overlay");

  overlay.classList.add("show");

  animateHelpExamples();
}

/**
 * Closes the help panel.
 */
function hideHelp() {
  const overlay = document.getElementById("help-overlay");

  overlay.classList.remove("show");
}

/**
 * Resets and plays the example tile animations in the help panel.
 */
function animateHelpExamples() {
  const exampleTiles = document.querySelectorAll(".example-result");

  exampleTiles.forEach((tile) => {
    const colour = tile.dataset.colour;

    tile.classList.remove("reveal");
    tile.classList.remove("green");
    tile.classList.remove("yellow");
    tile.classList.remove("grey");
    tile.style.setProperty("--help-result-color", `var(--${colour})`);
    tile.style.animationDelay = "0s";
  });

  exampleTiles.forEach((tile) => {
    void tile.offsetWidth;
  });

  exampleTiles.forEach((tile) => {
    const colour = tile.dataset.colour;

    tile.classList.add("reveal");

    tile.addEventListener(
      "animationend",
      (event) => {
        if (event.animationName !== "help-tile-flip") {
          return;
        }

        tile.classList.remove("reveal");
        tile.classList.add(colour);
        tile.style.removeProperty("--help-result-color");
        tile.style.removeProperty("animation-delay");
      },
      { once: true }
    );
  });
}

/**
 * Resets everything and starts a completely new game.
 */
function resetGame() {
  hideResultPanel();

  answer = "";
  attempts = maxAttempts;
  count = 1;
  currentGuess = "";
  currentRow = 0;
  bannedLetters.clear();
  gameOver = false;
  isAnimating = false;
  gameWon = false;
  hardMode = false;
  greenHints.fill(null);
  requiredLetters.clear();
  gameHistory = [];

  const board = document.getElementById("board");
  board.innerHTML = "";

  const keyboard = document.getElementById("keyboard");
  keyboard.innerHTML = "";

  const playAgain = document.getElementById("play-again");
  playAgain.classList.add("hidden");

  const hardModeButton = document.getElementById("hard-mode");
  hardModeButton.classList.remove("enabled");

  const messagePopup = document.getElementById("message");
  messagePopup.classList.remove("show");

  clearTimeout(messagePopup.messageTimer);

  chooseAnswer();
  createBoard();
  createKeyboard();
  restoreHardModeButton();
  saveGameState();
}

/**
 * Sets up the buttons and actions used by the result panel.
 */
function setupResultPanel() {
  const closeButton = document.getElementById("result-close");
  const playAgain = document.getElementById("play-again");

  closeButton.addEventListener("click", () => {
    hideResultPanel();
    closeButton.blur();
  });

  playAgain.addEventListener("click", () => {
    playAgain.blur();
    resetGame();
  });
}

/**
 * Adds the click action for opening the statistics panel.
 */
function setupStatisticsButton() {
  const statsButton = document.getElementById("stats-button");

  statsButton.addEventListener("click", () => {
    statsButton.blur();
    showStatistics();
  });
}

/**
 * Sets up the help button and the help panel close button.
 */
function setupHelpPanel() {
  const helpButton = document.getElementById("help-button");
  const helpClose = document.getElementById("help-close");

  helpButton.addEventListener("click", () => {
    helpButton.blur();
    showHelp();
  });

  helpClose.addEventListener("click", () => {
    helpClose.blur();
    hideHelp();
  });
}

/**
 * Allows a popup to be closed by clicking outside its main panel.
 *
 * @param {string} overlayId The ID of the popup overlay.
 * @param {Function} closeFunction Function used to close the popup.
 */
function setupOverlayClose(overlayId, closeFunction) {
  const overlay = document.getElementById(overlayId);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeFunction();
    }
  });
}

/**
 * Adds the click action for starting a new game.
 */
function setupNewGame() {
  const newGame = document.getElementById("new-game");

  newGame.addEventListener("click", () => {
    newGame.blur();
    resetGame();
  });
}

/**
 * Opens the hard mode information popup.
 */
function showHardMode() {
  const overlay = document.getElementById("hard-mode-overlay");

  overlay.classList.add("show");
}

/**
 * Closes the hard mode information popup.
 */
function hideHardMode() {
  const overlay = document.getElementById("hard-mode-overlay");

  overlay.classList.remove("show");
}

/**
 * Sets up the hard mode button and its popup.
 */
function setupHardMode() {
  const hardModeButton = document.getElementById("hard-mode");
  const hardModeClose = document.getElementById("hard-mode-close");

  hardModeButton.addEventListener("click", () => {
    hardModeButton.blur();

    if (hardMode) {
      hardMode = false;
      hardModeButton.classList.remove("enabled");
      saveGameState();
      showMessage("Hard mode disabled");

      return;
    }

    if (currentRow !== 0) {
      showMessage("Hard mode can only be enabled at the start of a round");

      return;
    }

    hardMode = true;
    hardModeButton.classList.add("enabled");
    saveGameState();
    showHardMode();
  });

  hardModeClose.addEventListener("click", () => {
    hardModeClose.blur();
    hideHardMode();
  });
}

/**
 * Restores the hard mode button to match the saved game state.
 */
function restoreHardModeButton() {
  const hardModeButton = document.getElementById("hard-mode");

  hardModeButton.classList.toggle("enabled", hardMode);
}

/**
 * Changes the page theme and saves the choice for later.
 *
 * @param {string} theme The theme to use.
 */
function setTheme(theme) {
  document.documentElement.classList.toggle("light-mode", theme === "light");
  localStorage.setItem("wordle-theme", theme);
  const themeButton = document.getElementById("theme-toggle");

  if (theme === "light") {
    themeButton.textContent = "☾";
    themeButton.setAttribute("aria-label", "Switch to dark mode");
  } else {
    themeButton.textContent = "☀";
    themeButton.setAttribute("aria-label", "Switch to light mode");
  }
}

/**
 * Loads the saved theme and sets up the theme toggle button.
 */
function setupTheme() {
  const themeButton = document.getElementById("theme-toggle");
  const savedTheme = localStorage.getItem("wordle-theme");
  const startingTheme = savedTheme === "light" ? "light" : "dark";
  setTheme(startingTheme);

  themeButton.addEventListener("click", () => {
    const isLightMode =
      document.documentElement.classList.contains("light-mode");
    setTheme(isLightMode ? "dark" : "light");
    themeButton.blur();
  });
}

/**
 * Checks and submits the current guess, then updates the game state.
 */
function submitGuess() {
  if (gameOver || isAnimating) {
    return;
  }

  if (!validateGuess()) {
    return;
  }

  if (!validateHardMode()) {
    return;
  }

  if (currentGuess === answer) {
    const colours = ["green", "green", "green", "green", "green"];

    gameHistory.push({
      guess: currentGuess,
      colours: colours
    });

    isAnimating = true;
    gameWon = true;

    colourTiles(colours, () => {
      updateKeyboard(colours);

      isAnimating = false;
      gameOver = true;

      recordGameResult(true);
      saveGameState();
      showMessage(
        `Congratulations! You guessed the word in ${count} attempts!`
      );
      showResultPanel();
    });

    return;
  }

  const colours = checkGuess();

  gameHistory.push({
    guess: currentGuess,
    colours: colours
  });

  isAnimating = true;

  attempts--;
  count++;

  colourTiles(colours, () => {
    updateKeyboard(colours);

    if (attempts === 0) {
      gameOver = true;
      isAnimating = false;

      recordGameResult(false);
      saveGameState();
      showMessage(`The word was ${answer}`);
      showResultPanel();

      return;
    }

    currentGuess = "";
    currentRow++;
    updateCurrentRow();
    isAnimating = false;
    saveGameState();
  });
}

/**
 * Handles a key press and sends it to the correct game action.
 *
 * @param {string} key The key that was pressed.
 */
function handleKey(key) {
  if (key === "ENTER") {
    submitGuess();
  } else if (key === "BACK") {
    removeLetter();
  } else {
    addLetter(key);
  }
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toUpperCase();

  if (key === "ENTER") {
    event.preventDefault();
    handleKey("ENTER");
  } else if (key === "BACKSPACE") {
    handleKey("BACK");
  } else if (/^[A-Z]$/.test(key)) {
    handleKey(key);
  }
});

/**
 * Starts the game by loading data, restoring saved progress,
 * and setting up the interface.
 */
async function startGame() {
  loadStatistics();
  await loadWordLists();
  const savedGame = loadGameState();

  if (!savedGame) {
    chooseAnswer();
  }

  createBoard();
  createKeyboard();

  if (savedGame) {
    restoreBoard();
    restoreKeyboard();
  }

  restoreHardModeButton();
  setupTheme();
  setupResultPanel();
  setupNewGame();
  setupStatisticsButton();
  setupHelpPanel();
  setupHardMode();

  setupOverlayClose("result-overlay", hideResultPanel);
  setupOverlayClose("help-overlay", hideHelp);
  setupOverlayClose("hard-mode-overlay", hideHardMode);

  if (gameOver) {
    showResultPanel();
  }
}

startGame();
