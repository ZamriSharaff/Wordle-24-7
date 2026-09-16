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

function updateStatisticsDisplay() {
  document.getElementById("stat-games").textContent = gamesPlayed;

  document.getElementById("stat-wins").textContent = wins;

  const winRate =
    gamesPlayed === 0 ? 0 : Math.round((wins / gamesPlayed) * 100);

  document.getElementById("stat-win-rate").textContent = `${winRate}%`;

  document.getElementById("stat-current-streak").textContent = currentStreak;

  document.getElementById("stat-best-streak").textContent = bestStreak;
}

function updateGuessDistribution() {
  const highestCount = Math.max(...guessDistribution, 1);

  for (let i = 0; i < 6; i++) {
    const bar = document.getElementById(`distribution-${i + 1}`);

    const percentage = (guessDistribution[i] / highestCount) * 100;

    bar.style.width = `${percentage}%`;

    bar.textContent = guessDistribution[i];
  }
}

function chooseAnswer() {
  const randomIndex = Math.floor(Math.random() * answerList.length);
  answer = answerList[randomIndex];

  console.log("Today's answer:", answer);
}

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

function colourTiles(colours, onComplete) {
  let tileIndex = 0;

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

function updateKeyboard(colours) {
  updateKeyboardForGuess(currentGuess, colours);
}

function restoreKeyboard() {
  const keys = document.querySelectorAll(".key");

  keys.forEach((key) => {
    key.classList.remove("green", "yellow", "grey");
  });

  gameHistory.forEach((game) => {
    updateKeyboardForGuess(game.guess, game.colours);
  });
}

function showMessage(message) {
  const messagePopup = document.getElementById("message");

  messagePopup.textContent = message;

  messagePopup.classList.add("show");

  clearTimeout(messagePopup.messageTimer);

  messagePopup.messageTimer = setTimeout(() => {
    messagePopup.classList.remove("show");
  }, 1000);
}

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

function hideResultPanel() {
  const overlay = document.getElementById("result-overlay");

  overlay.classList.remove("show");
}

function showHelp() {
  const overlay = document.getElementById("help-overlay");

  overlay.classList.add("show");

  animateHelpExamples();
}

function hideHelp() {
  const overlay = document.getElementById("help-overlay");

  overlay.classList.remove("show");
}

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

function setupStatisticsButton() {
  const statsButton = document.getElementById("stats-button");

  statsButton.addEventListener("click", () => {
    statsButton.blur();

    showStatistics();
  });
}

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

function setupOverlayClose(overlayId, closeFunction) {
  const overlay = document.getElementById(overlayId);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeFunction();
    }
  });
}

function setupNewGame() {
  const newGame = document.getElementById("new-game");

  newGame.addEventListener("click", () => {
    newGame.blur();

    resetGame();
  });
}

function showHardMode() {
  const overlay = document.getElementById("hard-mode-overlay");

  overlay.classList.add("show");
}

function hideHardMode() {
  const overlay = document.getElementById("hard-mode-overlay");

  overlay.classList.remove("show");
}

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

function restoreHardModeButton() {
  const hardModeButton = document.getElementById("hard-mode");

  hardModeButton.classList.toggle("enabled", hardMode);
}

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
