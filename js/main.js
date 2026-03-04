/**
 * =============================================================================
 * SOCAL FOOD TRUCK SIM — Main Controller
 * =============================================================================
 * Wires together Engine (simulation) and UI (rendering).
 * Manages the game loop: intro → briefing → planning → simulation → results.
 */

const Game = {
  state: null,

  /**
   * Initialize the game: set up UI, attach global event handlers.
   */
  init() {
    UI.init();
    this.attachGlobalListeners();
    UI.renderIntro();
  },

  /**
   * Start a new game (or restart).
   */
  startNewGame() {
    this.state = Engine.createInitialState();
    this.startDay();
  },

  /**
   * Begin a new day: generate weather/events, show briefing.
   */
  startDay() {
    Engine.startDay(this.state);
    UI.renderBriefing(this.state);
  },

  /**
   * Player finished briefing, move to planning phase.
   */
  goToPlanning() {
    UI.renderPlanning(this.state);
  },

  /**
   * Player confirmed plan, run the simulation.
   */
  openForBusiness() {
    const decisions = UI.getDecisions(this.state);

    // Validate
    if (decisions.menuItems.length < 2 || decisions.menuItems.length > 5) {
      alert("Please select 2\u20135 menu items.");
      return;
    }

    const expenses = Engine.calculatePlannedExpenses(decisions, this.state);
    if (expenses.total > this.state.cash) {
      alert("You can't afford this plan! Reduce purchases or costs.");
      return;
    }

    // Run simulation
    const results = Engine.simulateDay(this.state, decisions);

    // Check game over
    if (this.state.gameOver) {
      UI.renderResults(this.state, results);
      // After viewing results, they'll see game over
      this._pendingGameOver = true;
    } else {
      UI.renderResults(this.state, results);
    }
  },

  /**
   * Advance to next day.
   */
  nextDay() {
    if (this.state.gameOver || this._pendingGameOver) {
      this._pendingGameOver = false;
      UI.renderGameOver(this.state);
      return;
    }
    this.state.day++;
    this.startDay();
  },

  /**
   * Attach event handlers that persist across phase changes.
   * Uses event delegation on the document body.
   */
  attachGlobalListeners() {
    const self = this;

    document.body.addEventListener("click", function(e) {
      const target = e.target;
      if (!target) return;

      // Check by ID
      switch (target.id) {
        case "btn-start-game":
          self.startNewGame();
          break;
        case "btn-to-planning":
          self.goToPlanning();
          break;
        case "btn-open":
          if (!target.disabled) {
            self.openForBusiness();
          }
          break;
        case "btn-next-day":
          self.nextDay();
          break;
        case "btn-restart":
          self.startNewGame();
          break;
      }
    });
  },

  _pendingGameOver: false
};

// =============================================================================
// BOOT
// =============================================================================
document.addEventListener("DOMContentLoaded", function() {
  Game.init();
});
