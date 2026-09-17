import { describe, expect, it } from "vitest";
import {
  parseWordList,
  chooseRandomWord,
  isAllowedGuess,
  validateHardModeGuess,
  evaluateGuess,
  calculateWinRate,
  updateGameStatistics
} from "../wordle_logic.js";


// WORD LIST TESTS

describe("parseWordList", () => {
  it("trims and converts words to uppercase", () => {
    const text = " apple \n crane \n STARE ";

    expect(parseWordList(text)).toEqual([
      "APPLE",
      "CRANE",
      "STARE"
    ]);
  });

  it("keeps only five letter words", () => {
    const text = "APPLE\nFOUR\nSIXTY\nLONGER\nB\n";

    expect(parseWordList(text)).toEqual(["APPLE", "SIXTY"]);
  });

  it("handles different line endings and blank lines", () => {
    const text = "APPLE\r\n\r\nCRANE\n\nSTARE";

    expect(parseWordList(text)).toEqual([
      "APPLE",
      "CRANE",
      "STARE"
    ]);
  });
});


// ANSWER SELECTION TESTS

describe("chooseRandomWord", () => {
  const words = ["APPLE", "CRANE", "STARE"];

  it("selects the first word at the start of the range", () => {
    expect(chooseRandomWord(words, 0)).toBe("APPLE");
  });

  it("selects the last word near the end of the range", () => {
    expect(chooseRandomWord(words, 0.999)).toBe("STARE");
  });
});


// GUESS VALIDATION TESTS

describe("isAllowedGuess", () => {
  const answers = ["APPLE", "CRANE"];
  const allowedGuesses = ["STARE", "SLATE"];

  it("accepts a word from the allowed guess list", () => {
    expect(
      isAllowedGuess("STARE", allowedGuesses, answers)
    ).toBe(true);
  });

  it("accepts a word from the answer list", () => {
    expect(
      isAllowedGuess("APPLE", allowedGuesses, answers)
    ).toBe(true);
  });

  it("rejects a word that is in neither list", () => {
    expect(
      isAllowedGuess("ZZZZZ", allowedGuesses, answers)
    ).toBe(false);
  });
});


// GUESS EVALUATION TESTS

describe("evaluateGuess", () => {
  it("marks every tile green for a correct guess", () => {
    expect(evaluateGuess("SLATE", "SLATE")).toEqual([
      "green",
      "green",
      "green",
      "green",
      "green"
    ]);
  });

  it("marks every tile grey when there are no matches", () => {
    expect(evaluateGuess("BRAIN", "CLOUD")).toEqual([
      "grey",
      "grey",
      "grey",
      "grey",
      "grey"
    ]);
  });

  it("marks matching letters in the wrong position yellow", () => {
    expect(evaluateGuess("SLATE", "TEAMS")).toEqual([
      "yellow",
      "grey",
      "green",
      "yellow",
      "yellow"
    ]);
  });

  it("handles a mixture of green, yellow and grey results", () => {
    expect(evaluateGuess("CRANE", "CRATE")).toEqual([
      "green",
      "green",
      "green",
      "grey",
      "green"
    ]);
  });

  it("does not mark an extra repeated letter yellow", () => {
    expect(evaluateGuess("AAAAA", "BANAL")).toEqual([
      "grey",
      "green",
      "grey",
      "green",
      "grey"
    ]);
  });

  it("handles repeated yellow letters correctly", () => {
    expect(evaluateGuess("ALLAY", "BANAL")).toEqual([
      "yellow",
      "yellow",
      "grey",
      "green",
      "grey"
    ]);
  });

  it("handles repeated letters with an exact match", () => {
    expect(evaluateGuess("PAPAL", "APPLE")).toEqual([
      "yellow",
      "yellow",
      "green",
      "grey",
      "yellow"
    ]);
  });

  it("does not reuse an answer letter after it has been matched", () => {
    expect(evaluateGuess("EEEER", "SHEEP")).toEqual([
      "grey",
      "grey",
      "green",
      "green",
      "grey"
    ]);
  });
});


// HARD MODE TESTS

describe("validateHardModeGuess", () => {
  it("accepts a guess that follows all green hints", () => {
    const hints = ["C", null, null, "N", null];
    const requiredLetters = new Set(["R"]);

    expect(
      validateHardModeGuess("CRANE", hints, requiredLetters)
    ).toEqual({
      valid: true,
      message: ""
    });
  });

  it("rejects a guess that moves a green letter", () => {
    const hints = ["C", null, null, null, null];
    const requiredLetters = new Set();

    expect(
      validateHardModeGuess("ACORN", hints, requiredLetters)
    ).toEqual({
      valid: false,
      message: "You must use C in position 1"
    });
  });

  it("rejects a guess that omits a required letter", () => {
    const hints = [null, null, null, null, null];
    const requiredLetters = new Set(["R"]);

    expect(
      validateHardModeGuess("PLANT", hints, requiredLetters)
    ).toEqual({
      valid: false,
      message: "Your guess must contain R"
    });
  });

  it("accepts a guess containing all required letters", () => {
    const hints = [null, null, null, null, null];
    const requiredLetters = new Set(["R", "E"]);

    expect(
      validateHardModeGuess("CRANE", hints, requiredLetters)
    ).toEqual({
      valid: true,
      message: ""
    });
  });

  it("checks green hints before required letters", () => {
    const hints = ["C", null, null, null, null];
    const requiredLetters = new Set(["R"]);

    expect(
      validateHardModeGuess("PLANT", hints, requiredLetters)
    ).toEqual({
      valid: false,
      message: "You must use C in position 1"
    });
  });

  it("accepts a guess when there are no hard mode requirements", () => {
    const hints = [null, null, null, null, null];
    const requiredLetters = new Set();

    expect(
      validateHardModeGuess("PLANT", hints, requiredLetters)
    ).toEqual({
      valid: true,
      message: ""
    });
  });
});


// STATISTICS TESTS

describe("calculateWinRate", () => {
  it("returns zero before any games have been played", () => {
    expect(calculateWinRate(0, 0)).toBe(0);
  });

  it("calculates a whole number percentage", () => {
    expect(calculateWinRate(3, 2)).toBe(67);
  });

  it("returns one hundred percent for all wins", () => {
    expect(calculateWinRate(5, 5)).toBe(100);
  });

  it("returns zero percent for no wins", () => {
    expect(calculateWinRate(5, 0)).toBe(0);
  });
});

describe("updateGameStatistics", () => {
  it("updates wins, streak and distribution after a win", () => {
    const statistics = {
      gamesPlayed: 2,
      wins: 1,
      currentStreak: 1,
      bestStreak: 1,
      guessDistribution: [1, 0, 0, 0, 0, 0]
    };

    expect(
      updateGameStatistics(statistics, true, 2)
    ).toEqual({
      gamesPlayed: 3,
      wins: 2,
      currentStreak: 2,
      bestStreak: 2,
      guessDistribution: [1, 1, 0, 0, 0, 0]
    });
  });

  it("resets the current streak after a loss", () => {
    const statistics = {
      gamesPlayed: 4,
      wins: 3,
      currentStreak: 3,
      bestStreak: 3,
      guessDistribution: [0, 1, 1, 1, 0, 0]
    };

    expect(
      updateGameStatistics(statistics, false, 6)
    ).toEqual({
      gamesPlayed: 5,
      wins: 3,
      currentStreak: 0,
      bestStreak: 3,
      guessDistribution: [0, 1, 1, 1, 0, 0]
    });
  });

  it("keeps the best streak when the current streak is lower", () => {
    const statistics = {
      gamesPlayed: 8,
      wins: 6,
      currentStreak: 1,
      bestStreak: 4,
      guessDistribution: [1, 2, 1, 2, 0, 0]
    };

    expect(
      updateGameStatistics(statistics, true, 5)
    ).toEqual({
      gamesPlayed: 9,
      wins: 7,
      currentStreak: 2,
      bestStreak: 4,
      guessDistribution: [1, 2, 1, 2, 1, 0]
    });
  });
});
