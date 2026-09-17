# Wordle 24/7

A browser based Wordle game built from scratch using HTML, CSS and JavaScript.

[Live Demo](https://zamrisharaff.github.io/Wordle-24-7/)
[GitHub Repository](https://github.com/ZamriSharaff/Wordle-24-7.git)

## About the project

Wordle 24/7 is a browser based word guessing game inspired by the original Wordle format. The goal is to guess a hidden five letter word within six attempts.

The project started as a small word guessing program and was later developed into a complete browser based game with an interactive board, on-screen keyboard, animations, statistics, saved progress and multiple game settings.

Unlike the original daily format, Wordle 24/7 is designed for unlimited play. Starting a new game selects a random answer from the project's answer word list.

## Features

### Core gameplay

- Six attempts to guess the hidden five letter word
- Validates guesses against separate answer and allowed-guess word lists
- Wordle style green, yellow and grey tile results
- Correct handling of repeated letters
- Physical keyboard and on-screen keyboard support
- Enter and backspace controls
- Input is disabled while tile animations are playing

### Game modes

- Normal mode for standard gameplay
- Hard Mode, which requires revealed hints to be used in subsequent guesses
- Hard Mode can only be enabled at the start of a round
- Hard Mode state is saved when the page is refreshed

### Statistics

The game keeps track of:

- Games played
- Wins
- Win percentage
- Current winning streak
- Best winning streak
- Guess distribution from one to six attempts

Statistics are stored locally in the browser so they remain available between sessions.

### Saved game state

An unfinished game can be resumed after refreshing the page.

The saved game includes:

- Current answer
- Current attempt
- Current board position
- Completed guesses
- Tile results
- Hard Mode status
- Revealed hints
- Required letters

### User interface

- Dark and light themes
- Theme preference saved between sessions
- Help panel explaining the game rules
- New game button to reset and start fresh
- Hard Mode information panel
- End of game result panel with play again feature
- Statistics panel
- Animated tile reveals
- Letter entry and deletion animations
- Row shake animation for invalid guesses
- Responsive mobile layout
- Custom favicon featuring a logo I created for the project

## Technologies

- HTML5
- CSS3
- JavaScript
- Browser Local Storage
- Git and GitHub Pages
- Vitest for automated unit testing

The game itself uses no frameworks or external runtime libraries. Vitest is included as a development dependency for testing the reusable game logic.

## How It Works

### Word lists

The game uses two text files:

wordle_answers_list.txt
wordle_allowed_guesses.txt

The answer list contains words that can be selected as answers, while the allowed guesses list contains words that can be entered by the player.

The word lists are loaded when the game starts and converted to uppercase so that comparisons are consistent.

### Guess validation

Each submitted guess is compared with the answer in two stages.

First, letters in the correct positions are marked green. Those letters are then removed from consideration.

The remaining letters are checked for yellow matches. Any letters that are not present in the remaining answer are marked grey.

### Game state

The main game state is kept in JavaScript and includes the current guess, board position, remaining attempts, game status, Hard Mode hints and completed guesses.

Completed games and unfinished games are stored separately in `localStorage`, which allows the game to restore both progress and statistics after a page refresh without requiring a server or database.

### Board and keyboard

The game board and on-screen keyboard are created dynamically with JavaScript.

Each board tile stores its row and column using data attributes. This makes it possible to update individual tiles without hardcoding all game cells in the HTML.

The keyboard is also generated from the keyboard layout defined in JavaScript. Key colours are updated based on previous guesses, with green taking priority over yellow and grey.

## Design decisions

### Vanilla JavaScript

I chose to build the project using plain JavaScript instead of a framework. This helped me keep the project lightweight and gave me direct control over the DOM, game state, animations and browser storage. It also gave me a better understanding of how the different parts of a browser game work together.

### Separate word lists

The answer words and allowed guesses are stored in separate text files rather than being written directly into the JavaScript, which makes it easier to update the word data without changing the game logic.

### Local Storage

I used `localStorage` instead of a backend database because the project is entirely client side. This keeps the game simple while still allowing saved games, statistics and theme preferences to persist between sessions.

### Dynamic interface generation

The board and on-screen keyboard are generated using JavaScript rather than writing every tile and key manually in the HTML. This reduces repeated markup and makes it easier to reset and recreate the game when a new round starts.

### Reusable game logic

The core game rules that can be tested independently are stored in `wordle_logic.js` rather than being kept entirely inside the browser interface code. Using this approach make core game calculations easier to reuse and test without depending on the DOM.

### Sequential tile reveal

After a guess is submitted, the five tiles are revealed one at a time instead of changing colour simultaneously.

The keyboard colours are updated after the entire row has finished revealing.

### Responsive layout

The desktop and mobile layouts use different CSS rules where necessary.

On smaller screens, the game uses the available screen space between the header and keyboard to position the board. The keyboard stays at the bottom of the screen and the layout is adjusted to accommodate different mobile screen sizes.

### Accessibility

The interface uses semantic HTML elements and ARIA labels for controls such as the statistics, help and theme buttons.

The game also supports normal keyboard input, so players can use their physical keyboard instead of relying only on the on-screen keyboard.

## Testing

The project uses Vitest for automated unit testing of the reusable game logic in `wordle_logic.js`.

The test suite currently contains 29 automated unit tests covering:

- Word list parsing and normalisation
- Random answer selection
- Guess validation
- Green, yellow and grey tile evaluation
- Repeated letter handling
- Hard Mode validation
- Win percentage calculation
- Game statistics updates

The current test run passes all 29 tests. The coverage report for `wordle_logic.js` shows 100% statement, branch, function and line coverage.

### Running the tests

Install the development dependencies:

```bash
npm install
```

Run the tests in watch mode:

```bash
npm test
```

Run the tests once without watch mode:

```bash
npm run test:run
```

Generate the coverage report:

```bash
npm run coverage
```

## Project structure

Wordle_Game/
    index.html
    style.css
    wordle_script.js
    wordle_logic.js
    wordle_answers_list.txt
    wordle_allowed_guesses.txt
    favicon.png
    tests/
        wordle_logic.test.js
    package.json
    package-lock.json
    .gitignore
    README.md

### File descriptions

| File                         | Purpose                                                             |
|------------------------------|---------------------------------------------------------------------|
| `index.html`                 | Main structure of the game interface                                |
| `style.css`                  | Layout, themes, animations and responsive styling                   |
| `wordle_script.js`           | Game state, input handling, DOM updates and browser interface logic |
| `wordle_logic.js`            | Reusable game logic used by the browser and automated tests         |
| `wordle_answers_list.txt`    | Words that can be selected as answers                               |
| `wordle_allowed_guesses.txt` | Additional valid words that can be entered as guesses               |
| `favicon.png`                | Custom project logo used as the browser tab icon                    |
| `tests/wordle_logic.test.js` | Automated unit tests for the reusable game logic                    |
| `package.json`               | Project metadata and npm test scripts                               |
| `package-lock.json`          | Locked versions of installed npm dependencies                       |
| `.gitignore`                 | Files and folders excluded from version control                     |
| `README.md`                  | Project documentation                                               |

## Running the project locally

Because the game loads the word lists using `fetch()`, it should be run through a local web server rather than opened directly as a `file://` page.

For example, using VS Code with a local development server:

1. Clone the repository.
2. Open the project folder in VS Code.
3. Start a local web server.
4. Open the provided local address in a browser.

The game can then be played normally.

## GitHub Pages

The project is deployed using GitHub Pages, which allows the game to be played directly in a web browser without installing anything.

Live version:

https://zamrisharaff.github.io/Wordle-24-7/

## What I learned

This project helped me develop my understanding of several areas of web development, particularly:

- Manipulating the DOM with JavaScript
- Handling keyboard and mouse input
- Managing game state in a browser
- Working with `localStorage`
- Loading external data with `fetch()`
- Designing responsive layouts with CSS
- Creating CSS animations
- Structuring a project into separate HTML, CSS, JavaScript and data files
- Writing clear documentation for JavaScript functions and project code
- Writing and organising automated unit tests
- Using Git and GitHub for version control and deployment

One of the more challenging parts was handling repeated letters correctly. I had to separate exact matches from non-exact matches so that the result of a guess behaves correctly when a letter appears multiple times.

Another area that required attention was responsive design. The desktop layout and mobile layout need different spacing and positioning so that the board, controls and keyboard remain usable on smaller screens.

Adding automated testing also helped me separate reusable game logic from browser specific interface code. Doing so, it made the project structure clearer, and the main rules are now easier to test independently.

## Project status & future development

The current version of Wordle 24/7 is a complete playable game with automated unit tests and is deployed through GitHub Pages, but there is still room for further development. Future changes may include additional game features and settings, further testing of browser specific interactions, and modifications based on user feedback and ideas for future versions.

## Word List Attribution

The word lists used by this project were sourced from word lists published by cfreshman:

- Answer words: [wordle-answers-alphabetical.txt](https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b)
- Allowed guesses: [wordle-allowed-guesses.txt](https://gist.github.com/cfreshman/cdcdf777450c5b5301e439061d29694c)

The lists are used as the word data for the game's answer and guess validation systems.

## License

No open source license has currently been added to this project.
