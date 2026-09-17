/**
 * Converts raw word list text into uppercase five letter words.
 *
 * @param {string} text The raw text from a word list file.
 * @returns {string[]} The cleaned five letter words.
 */
export function parseWordList(text) {
  return text
    .split(/\r?\n/)
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word.length === 5);
}

/**
 * Chooses a word using a random value between zero and one.
 *
 * @param {string[]} words The words available for selection.
 * @param {number} randomValue The random value used for selection.
 * @returns {string} The selected word.
 */
export function chooseRandomWord(words, randomValue = Math.random()) {
  const randomIndex = Math.floor(randomValue * words.length);

  return words[randomIndex];
}

/**
 * Checks whether a guess exists in either of the game's word lists.
 *
 * @param {string} guess The word being checked.
 * @param {string[]} allowedGuesses The additional valid guess words.
 * @param {string[]} answerList The words that can be answers.
 * @returns {boolean} True if the word is allowed.
 */
export function isAllowedGuess(guess, allowedGuesses, answerList) {
  return allowedGuesses.includes(guess) || answerList.includes(guess);
}

/**
 * Checks whether a guess follows the Hard Mode requirements.
 *
 * @param {string} guess The word being checked.
 * @param {(string|null)[]} greenHints The known green letters.
 * @param {Set<string>} requiredLetters Letters that must be reused.
 * @returns {{valid: boolean, message: string}} The validation result.
 */
export function validateHardModeGuess(
  guess,
  greenHints,
  requiredLetters
) {
  for (let i = 0; i < 5; i++) {
    if (greenHints[i] !== null && guess[i] !== greenHints[i]) {
      return {
        valid: false,
        message: `You must use ${greenHints[i]} in position ${i + 1}`
      };
    }
  }

  for (const letter of requiredLetters) {
    if (!guess.includes(letter)) {
      return {
        valid: false,
        message: `Your guess must contain ${letter}`
      };
    }
  }

  return {
    valid: true,
    message: ""
  };
}

/**
 * Compares a guess with the answer and returns the tile colours.
 *
 * @param {string} guess The player's five letter guess.
 * @param {string} answer The hidden answer word.
 * @returns {string[]} The result for each tile.
 */
export function evaluateGuess(guess, answer) {
  const answerLetters = answer.split("");
  const colours = ["grey", "grey", "grey", "grey", "grey"];

  for (let i = 0; i < 5; i++) {
    if (guess[i] === answerLetters[i]) {
      colours[i] = "green";
      answerLetters[i] = null;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (colours[i] === "green") {
      continue;
    }

    if (answerLetters.includes(guess[i])) {
      colours[i] = "yellow";
      const index = answerLetters.indexOf(guess[i]);
      answerLetters[index] = null;
    }
  }

  return colours;
}

/**
 * Calculates the win percentage shown in the statistics panel.
 *
 * @param {number} gamesPlayed The number of completed games.
 * @param {number} wins The number of won games.
 * @returns {number} The rounded win percentage.
 */
export function calculateWinRate(gamesPlayed, wins) {
  return gamesPlayed === 0 ? 0 : Math.round((wins / gamesPlayed) * 100);
}

/**
 * Updates the statistics after a game has finished.
 *
 * @param {object} statistics The current statistics.
 * @param {boolean} won Whether the game was won.
 * @param {number} attempts The attempt number used for the win.
 * @returns {object} The updated statistics.
 */
export function updateGameStatistics(statistics, won, attempts) {
  const updatedStatistics = {
    gamesPlayed: statistics.gamesPlayed + 1,
    wins: statistics.wins,
    currentStreak: statistics.currentStreak,
    bestStreak: statistics.bestStreak,
    guessDistribution: [...statistics.guessDistribution]
  };

  if (won) {
    updatedStatistics.wins++;
    updatedStatistics.currentStreak++;

    updatedStatistics.guessDistribution[attempts - 1]++;

    if (updatedStatistics.currentStreak > updatedStatistics.bestStreak) {
      updatedStatistics.bestStreak = updatedStatistics.currentStreak;
    }
  } else {
    updatedStatistics.currentStreak = 0;
  }

  return updatedStatistics;
}
