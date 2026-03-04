/**
 * =============================================================================
 * SOCAL FOOD TRUCK SIM — UI Layer
 * =============================================================================
 * All DOM rendering and user interaction. References GameData constants and
 * Engine functions but never mutates game state directly — passes decisions
 * back to the main controller.
 */

const UI = {

  // Cache DOM elements on init
  els: {},

  init() {
    this.els = {
      statusBar: document.getElementById("status-bar"),
      dayDisplay: document.getElementById("day-display"),
      cashDisplay: document.getElementById("cash-display"),
      repDisplay: document.getElementById("rep-display"),
      dowDisplay: document.getElementById("dow-display"),

      phaseBriefing: document.getElementById("phase-briefing"),
      phasePlanning: document.getElementById("phase-planning"),
      phaseResults: document.getElementById("phase-results"),
      phaseGameover: document.getElementById("phase-gameover"),
      phaseIntro: document.getElementById("phase-intro"),

      briefingContent: document.getElementById("briefing-content"),
      planningContent: document.getElementById("planning-content"),
      resultsContent: document.getElementById("results-content"),
      gameoverContent: document.getElementById("gameover-content"),

      btnStartGame: document.getElementById("btn-start-game"),
      btnToPlan: document.getElementById("btn-to-planning"),
      btnOpen: document.getElementById("btn-open"),
      btnNextDay: document.getElementById("btn-next-day"),
      btnRestart: document.getElementById("btn-restart")
    };
  },

  // ===========================================================================
  // PHASE MANAGEMENT
  // ===========================================================================

  showPhase(phase) {
    const phases = ["phase-intro", "phase-briefing", "phase-planning",
                    "phase-results", "phase-gameover"];
    for (const p of phases) {
      const el = document.getElementById(p);
      if (el) el.classList.toggle("hidden", p !== "phase-" + phase);
    }
  },

  // ===========================================================================
  // STATUS BAR
  // ===========================================================================

  updateStatusBar(state) {
    this.els.dayDisplay.textContent = `Day ${state.day} / ${GAME_CONFIG.totalDays}`;
    this.els.cashDisplay.textContent = `$${state.cash.toFixed(2)}`;
    this.els.cashDisplay.className = state.cash < 100 ? "status-val danger" : "status-val";
    this.els.repDisplay.textContent = `${Math.round(state.reputation)} / 100`;
    this.els.repDisplay.className = state.reputation < 25 ? "status-val danger" :
                                     state.reputation >= 70 ? "status-val good" : "status-val";
    this.els.dowDisplay.textContent = Engine.getDayName(state.day);
  },

  // ===========================================================================
  // INTRO SCREEN
  // ===========================================================================

  renderIntro() {
    this.showPhase("intro");
  },

  // ===========================================================================
  // MORNING BRIEFING
  // ===========================================================================

  renderBriefing(state) {
    this.showPhase("briefing");
    this.updateStatusBar(state);

    let html = `<h2>Morning Briefing \u2014 Day ${state.day}</h2>`;

    // Weather
    html += `<div class="panel weather-panel">`;
    html += `<h3>${state.todayWeather.emoji} Weather Forecast</h3>`;
    html += `<p class="weather-big">${state.todayWeather.name}</p>`;
    const weatherNote = state.todayWeather.id === "sunny" ? "Great day for foot traffic and cold drinks!" :
                        state.todayWeather.id === "heatwave" ? "Scorching! Drinks will fly, heavy meals less so." :
                        state.todayWeather.id === "rain" ? "Rain will keep people indoors. Expect lower traffic." :
                        "Overcast skies. Moderate conditions.";
    html += `<p class="weather-note">${weatherNote}</p>`;
    html += `</div>`;

    // Events
    if (state.todayEvents.length > 0) {
      html += `<div class="panel events-panel">`;
      html += `<h3>\u{1F4E2} Today's Events</h3>`;
      for (const event of state.todayEvents) {
        html += `<div class="event-item"><strong>${event.name}</strong>: ${event.description}</div>`;
      }
      html += `</div>`;
    }

    // Yesterday's feedback
    if (state.lastDayResults) {
      const r = state.lastDayResults;
      html += `<div class="panel feedback-panel">`;
      html += `<h3>\u{1F4AC} Yesterday's Feedback</h3>`;
      html += `<p>Served <strong>${r.totalServed}</strong> customers at <strong>${LOCATIONS[r.location].name}</strong>. `;
      html += `Net profit: <strong class="${r.netProfit >= 0 ? 'positive' : 'negative'}">$${r.netProfit.toFixed(2)}</strong></p>`;
      if (r.reviews.length > 0) {
        html += `<div class="reviews">`;
        for (const review of r.reviews) {
          html += `<div class="review-bubble">"${review}"</div>`;
        }
        html += `</div>`;
      }
      html += `</div>`;
    }

    // Current inventory summary
    html += `<div class="panel inventory-panel">`;
    html += `<h3>\u{1F4E6} Current Inventory</h3>`;
    html += `<div class="inventory-grid">`;
    const categories = ["meat", "carb", "dairy", "produce", "condiment", "supply"];
    for (const cat of categories) {
      const items = Object.entries(INGREDIENTS).filter(([, v]) => v.category === cat);
      if (items.length === 0) continue;
      for (const [id, ing] of items) {
        const qty = state.inventory[id] || 0;
        if (qty < 0.01 && cat !== "meat") continue; // Skip empty non-essential
        const qtyClass = qty < 0.5 ? "qty-low" : qty < 2 ? "qty-med" : "qty-ok";
        html += `<div class="inv-item ${qtyClass}">`;
        html += `<span class="inv-name">${ing.name}</span>`;
        html += `<span class="inv-qty">${qty.toFixed(1)} ${ing.unit}</span>`;
        html += `</div>`;
      }
    }
    html += `</div></div>`;

    // Market prices
    html += `<div class="panel market-panel">`;
    html += `<h3>\u{1F4B0} Today's Market Prices</h3>`;
    html += `<div class="market-grid">`;
    for (const [id, ing] of Object.entries(INGREDIENTS)) {
      const price = state.ingredientPrices[id];
      const diff = ((price - ing.basePrice) / ing.basePrice * 100).toFixed(0);
      const diffClass = diff > 10 ? "price-up" : diff < -10 ? "price-down" : "";
      html += `<div class="market-item ${diffClass}">`;
      html += `<span>${ing.name}</span>`;
      html += `<span>$${price.toFixed(2)}/${ing.unit} `;
      if (Math.abs(diff) > 5) {
        html += `<small>(${diff > 0 ? '+' : ''}${diff}%)</small>`;
      }
      html += `</span></div>`;
    }
    html += `</div></div>`;

    this.els.briefingContent.innerHTML = html;
  },

  // ===========================================================================
  // PLANNING PHASE
  // ===========================================================================

  renderPlanning(state) {
    this.showPhase("planning");
    this.updateStatusBar(state);

    let html = `<h2>\u{1F4CB} Today's Plan</h2>`;

    // --- Location Selection ---
    html += `<div class="panel">`;
    html += `<h3>\u{1F4CD} Choose Your Spot</h3>`;
    html += `<div class="location-cards">`;
    for (const [id, loc] of Object.entries(LOCATIONS)) {
      const dayOfWeek = Engine.getDayOfWeek(state.day);
      const traffic = loc.baseTraffic[dayOfWeek];
      const trafficLevel = traffic >= 100 ? "High" : traffic >= 65 ? "Medium" : "Low";
      html += `<label class="location-card">`;
      html += `<input type="radio" name="location" value="${id}" ${id === "downtown" ? "checked" : ""}>`;
      html += `<div class="loc-inner">`;
      html += `<div class="loc-name">${loc.name}</div>`;
      html += `<div class="loc-desc">${loc.description}</div>`;
      html += `<div class="loc-stats">`;
      html += `<span>Traffic: ${trafficLevel}</span>`;
      html += `<span>Parking: $${loc.parkingFee}</span>`;
      html += `</div>`;
      html += `</div></label>`;
    }
    html += `</div></div>`;

    // --- Menu Selection, Pricing & Prep ---
    html += `<div class="panel">`;
    html += `<h3>\u{1F372} Menu, Pricing & Prep</h3>`;
    html += `<p class="hint">Select 2\u20135 items to offer today. Set your price and how many to prep.</p>`;
    html += `<div class="menu-grid">`;
    html += `<div class="menu-header"><span>Offer</span><span>Item</span><span>Price ($)</span><span>Prep Qty</span><span>Ref. Price</span></div>`;
    let defaultChecked = 0;
    for (const [id, item] of Object.entries(MENU_ITEMS)) {
      const checked = defaultChecked < 3 ? "checked" : "";
      defaultChecked++;
      html += `<div class="menu-row" data-item="${id}">`;
      html += `<input type="checkbox" class="menu-toggle" data-item="${id}" ${checked}>`;
      html += `<span class="menu-item-name">${item.emoji} ${item.name}</span>`;
      html += `<input type="number" class="menu-price" data-item="${id}" value="${item.referencePrice.toFixed(2)}" min="${item.priceRange[0]}" max="${item.priceRange[1]}" step="0.50">`;
      html += `<input type="number" class="menu-qty" data-item="${id}" value="15" min="0" max="100" step="1">`;
      html += `<span class="menu-ref">$${item.priceRange[0]}\u2013$${item.priceRange[1]}</span>`;
      html += `</div>`;
    }
    html += `</div></div>`;

    // --- Ingredient Shopping ---
    html += `<div class="panel">`;
    html += `<h3>\u{1F6D2} Ingredient Shopping</h3>`;
    html += `<p class="hint">Buy what you need. Click "Auto-buy" to fill shortfalls based on your prep plan.</p>`;
    html += `<button type="button" id="btn-autobuy" class="btn-small">Auto-buy Shortfalls</button>`;
    html += `<div class="shop-grid">`;
    html += `<div class="shop-header"><span>Ingredient</span><span>In Stock</span><span>Needed</span><span>Buy Qty</span><span>Cost</span></div>`;
    for (const [id, ing] of Object.entries(INGREDIENTS)) {
      const stock = (state.inventory[id] || 0).toFixed(1);
      const price = state.ingredientPrices[id].toFixed(2);
      html += `<div class="shop-row" data-ing="${id}">`;
      html += `<span class="shop-name">${ing.name} <small>($${price}/${ing.unit})</small></span>`;
      html += `<span class="shop-stock" id="stock-${id}">${stock}</span>`;
      html += `<span class="shop-needed" id="needed-${id}">0.0</span>`;
      html += `<input type="number" class="shop-buy" data-ing="${id}" value="0" min="0" max="50" step="1">`;
      html += `<span class="shop-cost" id="cost-${id}">$0.00</span>`;
      html += `</div>`;
    }
    html += `</div></div>`;

    // --- Staffing & Operations ---
    html += `<div class="panel ops-panel">`;
    html += `<h3>\u2699\uFE0F Operations</h3>`;
    html += `<div class="ops-grid">`;
    html += `<div class="ops-item">`;
    html += `<label>Hours Open:</label>`;
    html += `<input type="range" id="hours-open" min="${GAME_CONFIG.minHoursOpen}" max="${GAME_CONFIG.maxHoursOpen}" value="${GAME_CONFIG.defaultHoursOpen}" step="1">`;
    html += `<span id="hours-display">${GAME_CONFIG.defaultHoursOpen}h</span>`;
    html += `</div>`;
    html += `<div class="ops-item">`;
    html += `<label><input type="checkbox" id="hire-helper"> Hire helper ($${GAME_CONFIG.helperHourlyWage}/hr)</label>`;
    html += `<span id="labor-cost-display">$0</span>`;
    html += `</div>`;
    html += `<div class="ops-item">`;
    html += `<label>Marketing: $<input type="number" id="marketing-spend" value="0" min="0" max="${GAME_CONFIG.maxMarketingSpend}" step="5"></label>`;
    html += `<span id="marketing-lift-display">+0% traffic</span>`;
    html += `</div>`;
    html += `</div></div>`;

    // --- Cost Summary ---
    html += `<div class="panel summary-panel">`;
    html += `<h3>\u{1F4B5} Cost Summary</h3>`;
    html += `<div id="cost-breakdown" class="cost-breakdown"></div>`;
    html += `<div class="open-btn-container">`;
    html += `<button id="btn-open" class="btn-big">\u{1F69B} Open for Business!</button>`;
    html += `</div>`;
    html += `</div>`;

    this.els.planningContent.innerHTML = html;

    // Re-cache the open button since it was re-created
    this.els.btnOpen = document.getElementById("btn-open");

    // Attach planning event listeners
    this._attachPlanningListeners(state);
    // Initial calculation
    this._updatePlanningCalcs(state);
  },

  /**
   * Attach all event listeners for the planning phase.
   */
  _attachPlanningListeners(state) {
    const self = this;

    // Menu toggles and quantities trigger recalculation
    document.querySelectorAll(".menu-toggle, .menu-price, .menu-qty").forEach(el => {
      el.addEventListener("change", () => self._updatePlanningCalcs(state));
      el.addEventListener("input", () => self._updatePlanningCalcs(state));
    });

    // Shopping buy quantities
    document.querySelectorAll(".shop-buy").forEach(el => {
      el.addEventListener("change", () => self._updatePlanningCalcs(state));
      el.addEventListener("input", () => self._updatePlanningCalcs(state));
    });

    // Hours slider
    const hoursSlider = document.getElementById("hours-open");
    if (hoursSlider) {
      hoursSlider.addEventListener("input", () => {
        document.getElementById("hours-display").textContent = hoursSlider.value + "h";
        self._updatePlanningCalcs(state);
      });
    }

    // Helper toggle
    const helperToggle = document.getElementById("hire-helper");
    if (helperToggle) {
      helperToggle.addEventListener("change", () => self._updatePlanningCalcs(state));
    }

    // Marketing spend
    const marketingInput = document.getElementById("marketing-spend");
    if (marketingInput) {
      marketingInput.addEventListener("input", () => self._updatePlanningCalcs(state));
    }

    // Auto-buy button
    const autobuyBtn = document.getElementById("btn-autobuy");
    if (autobuyBtn) {
      autobuyBtn.addEventListener("click", () => {
        const prepPlan = self._getMenuPlan().prepQty;
        const suggestions = Engine.suggestPurchases(prepPlan, state.inventory);
        for (const [ingId, qty] of Object.entries(suggestions)) {
          const input = document.querySelector(`.shop-buy[data-ing="${ingId}"]`);
          if (input) input.value = qty;
        }
        self._updatePlanningCalcs(state);
      });
    }

    // Location change
    document.querySelectorAll('input[name="location"]').forEach(el => {
      el.addEventListener("change", () => self._updatePlanningCalcs(state));
    });
  },

  /**
   * Recalculate and display all planning-phase numbers.
   */
  _updatePlanningCalcs(state) {
    const plan = this._getMenuPlan();
    const needed = Engine.calculateIngredientsNeeded(plan.prepQty);

    // Update "needed" column in shopping
    for (const [ingId] of Object.entries(INGREDIENTS)) {
      const neededEl = document.getElementById(`needed-${ingId}`);
      if (neededEl) {
        neededEl.textContent = (needed[ingId] || 0).toFixed(1);
        // Highlight if stock is insufficient
        const stock = state.inventory[ingId] || 0;
        const buyQty = parseFloat(document.querySelector(`.shop-buy[data-ing="${ingId}"]`)?.value || 0);
        const totalAvailable = stock + buyQty;
        neededEl.className = "shop-needed" + ((needed[ingId] || 0) > totalAvailable ? " shortfall" : "");
      }

      // Update cost column
      const costEl = document.getElementById(`cost-${ingId}`);
      const buyInput = document.querySelector(`.shop-buy[data-ing="${ingId}"]`);
      if (costEl && buyInput) {
        const qty = parseFloat(buyInput.value) || 0;
        const price = state.ingredientPrices[ingId] || 0;
        costEl.textContent = `$${(qty * price).toFixed(2)}`;
      }
    }

    // Calculate expenses
    const decisions = this._gatherDecisions(state);
    const expenses = Engine.calculatePlannedExpenses(decisions, state);

    // Update labor cost display
    const laborDisplay = document.getElementById("labor-cost-display");
    if (laborDisplay) {
      laborDisplay.textContent = `$${expenses.laborCost.toFixed(0)}`;
    }

    // Update marketing lift display
    const marketingDisplay = document.getElementById("marketing-lift-display");
    if (marketingDisplay) {
      const spend = parseFloat(document.getElementById("marketing-spend")?.value || 0);
      const lift = spend > 0
        ? Math.sqrt(spend / GAME_CONFIG.maxMarketingSpend) * GAME_CONFIG.maxMarketingLift * 100
        : 0;
      marketingDisplay.textContent = `+${lift.toFixed(0)}% traffic`;
    }

    // Update cost breakdown
    const breakdownEl = document.getElementById("cost-breakdown");
    if (breakdownEl) {
      let bhtml = `<div class="cost-line"><span>Ingredients:</span><span>$${expenses.purchaseCost.toFixed(2)}</span></div>`;
      bhtml += `<div class="cost-line"><span>Fixed costs (fuel, permit, commissary):</span><span>$${expenses.fixedCosts.toFixed(2)}</span></div>`;
      bhtml += `<div class="cost-line"><span>Parking fee:</span><span>$${expenses.parkingFee.toFixed(2)}</span></div>`;
      bhtml += `<div class="cost-line"><span>Labor:</span><span>$${expenses.laborCost.toFixed(2)}</span></div>`;
      bhtml += `<div class="cost-line"><span>Marketing:</span><span>$${expenses.marketingCost.toFixed(2)}</span></div>`;
      bhtml += `<div class="cost-line cost-total"><span>Total upfront cost:</span><span>$${expenses.total.toFixed(2)}</span></div>`;
      bhtml += `<div class="cost-line ${expenses.total > state.cash ? 'cost-over' : 'cost-ok'}">`;
      bhtml += `<span>Cash after expenses:</span><span>$${(state.cash - expenses.total).toFixed(2)}</span></div>`;
      breakdownEl.innerHTML = bhtml;
    }

    // Validate menu selection count
    const checkedCount = document.querySelectorAll(".menu-toggle:checked").length;
    const openBtn = this.els.btnOpen || document.getElementById("btn-open");
    if (openBtn) {
      const canAfford = expenses.total <= state.cash;
      const validMenu = checkedCount >= 2 && checkedCount <= 5;
      openBtn.disabled = !canAfford || !validMenu;
      if (!canAfford) {
        openBtn.textContent = "\u274C Can't afford this plan!";
      } else if (!validMenu) {
        openBtn.textContent = `Select ${checkedCount < 2 ? "at least 2" : "at most 5"} menu items`;
      } else {
        openBtn.textContent = "\u{1F69B} Open for Business!";
      }
    }
  },

  /**
   * Extract the current menu plan from DOM inputs.
   */
  _getMenuPlan() {
    const menuItems = [];
    const prices = {};
    const prepQty = {};

    document.querySelectorAll(".menu-toggle").forEach(cb => {
      const id = cb.dataset.item;
      if (cb.checked) {
        menuItems.push(id);
        const priceInput = document.querySelector(`.menu-price[data-item="${id}"]`);
        const qtyInput = document.querySelector(`.menu-qty[data-item="${id}"]`);
        prices[id] = parseFloat(priceInput?.value) || MENU_ITEMS[id].referencePrice;
        prepQty[id] = parseInt(qtyInput?.value) || 0;
      }
    });

    return { menuItems, prices, prepQty };
  },

  /**
   * Gather all player decisions from the planning form.
   */
  _gatherDecisions(state) {
    const plan = this._getMenuPlan();
    const location = document.querySelector('input[name="location"]:checked')?.value || "downtown";
    const hoursOpen = parseInt(document.getElementById("hours-open")?.value) || GAME_CONFIG.defaultHoursOpen;
    const hireHelper = document.getElementById("hire-helper")?.checked || false;
    const marketingSpend = parseFloat(document.getElementById("marketing-spend")?.value) || 0;

    const purchaseOrder = {};
    document.querySelectorAll(".shop-buy").forEach(input => {
      const id = input.dataset.ing;
      const qty = parseFloat(input.value) || 0;
      if (qty > 0) purchaseOrder[id] = qty;
    });

    return {
      location,
      menuItems: plan.menuItems,
      prices: plan.prices,
      prepQty: plan.prepQty,
      purchaseOrder,
      hireHelper,
      hoursOpen,
      marketingSpend
    };
  },

  /**
   * Get decisions from the planning form (called by main controller).
   */
  getDecisions(state) {
    return this._gatherDecisions(state);
  },

  // ===========================================================================
  // RESULTS PHASE
  // ===========================================================================

  renderResults(state, results) {
    this.showPhase("results");
    this.updateStatusBar(state);

    let html = `<h2>\u{1F4CA} End of Day ${results.day} Report</h2>`;

    // Location & Weather recap
    const loc = LOCATIONS[results.location];
    html += `<div class="panel recap-panel">`;
    html += `<p>${results.weather.emoji} <strong>${results.weather.name}</strong> at <strong>${loc.name}</strong></p>`;
    if (results.events.length > 0) {
      html += `<p>Events: ${results.events.map(e => e.name).join(", ")}</p>`;
    }
    html += `<p>Foot traffic: <strong>${results.footTraffic}</strong> people passed by</p>`;
    html += `</div>`;

    // Sales breakdown
    html += `<div class="panel">`;
    html += `<h3>\u{1F4B0} Sales</h3>`;
    html += `<div class="sales-grid">`;
    html += `<div class="sales-header"><span>Item</span><span>Demand</span><span>Sold</span><span>Wasted</span><span>Price</span><span>Revenue</span></div>`;
    for (const [itemId, sale] of Object.entries(results.sales)) {
      const item = MENU_ITEMS[itemId];
      const soldOutClass = sale.ordered > sale.served ? "sold-out-row" : "";
      html += `<div class="sales-row ${soldOutClass}">`;
      html += `<span>${item.emoji} ${sale.name}</span>`;
      html += `<span>${sale.ordered}</span>`;
      html += `<span>${sale.served}</span>`;
      html += `<span>${sale.wasted > 0 ? sale.wasted : "-"}</span>`;
      html += `<span>$${sale.price.toFixed(2)}</span>`;
      html += `<span>$${sale.revenue.toFixed(2)}</span>`;
      html += `</div>`;
    }
    html += `<div class="sales-row sales-total">`;
    html += `<span>TOTAL</span><span>${results.totalDemand}</span><span>${results.totalServed}</span><span></span><span></span>`;
    html += `<span>$${results.totalRevenue.toFixed(2)}</span>`;
    html += `</div>`;
    html += `</div></div>`;

    // Financials
    html += `<div class="panel">`;
    html += `<h3>\u{1F4B5} Financials</h3>`;
    html += `<div class="fin-grid">`;
    html += `<div class="fin-line"><span>Revenue:</span><span class="positive">+$${results.totalRevenue.toFixed(2)}</span></div>`;
    html += `<div class="fin-line indent"><span>Ingredient purchases:</span><span>-$${results.purchaseCost.toFixed(2)}</span></div>`;
    html += `<div class="fin-line indent"><span>Fixed costs:</span><span>-$${results.fixedCosts.toFixed(2)}</span></div>`;
    html += `<div class="fin-line indent"><span>Parking fee:</span><span>-$${results.parkingFee.toFixed(2)}</span></div>`;
    html += `<div class="fin-line indent"><span>Labor:</span><span>-$${results.laborCost.toFixed(2)}</span></div>`;
    html += `<div class="fin-line indent"><span>Marketing:</span><span>-$${results.marketingCost.toFixed(2)}</span></div>`;
    html += `<div class="fin-line indent"><span>CC processing fees:</span><span>-$${results.ccFees.toFixed(2)}</span></div>`;
    if (results.spoilageCost > 0) {
      html += `<div class="fin-line indent"><span>Spoilage loss:</span><span>-$${results.spoilageCost.toFixed(2)}</span></div>`;
    }
    html += `<div class="fin-line fin-total"><span>Net Profit:</span>`;
    html += `<span class="${results.netProfit >= 0 ? 'positive' : 'negative'}">`;
    html += `${results.netProfit >= 0 ? '+' : ''}$${results.netProfit.toFixed(2)}</span></div>`;
    html += `</div>`;
    html += `<div class="fin-cash">Cash on hand: <strong>$${state.cash.toFixed(2)}</strong></div>`;
    html += `</div>`;

    // Spoilage
    const spoilEntries = Object.entries(results.spoilage).filter(([, v]) => v > 0.01);
    if (spoilEntries.length > 0) {
      html += `<div class="panel spoilage-panel">`;
      html += `<h3>\u{1F924} Overnight Spoilage</h3>`;
      for (const [ingId, amount] of spoilEntries) {
        const ing = INGREDIENTS[ingId];
        html += `<div class="spoil-item">${ing.name}: ${amount.toFixed(1)} ${ing.unit} lost</div>`;
      }
      html += `<div class="spoil-total">Estimated spoilage cost: $${results.spoilageCost.toFixed(2)}</div>`;
      html += `</div>`;
    }

    // Reputation
    html += `<div class="panel rep-panel">`;
    html += `<h3>\u2B50 Reputation</h3>`;
    const repDir = results.reputationChange >= 0 ? "+" : "";
    html += `<div class="rep-change ${results.reputationChange >= 0 ? 'positive' : 'negative'}">`;
    html += `${repDir}${results.reputationChange.toFixed(1)} reputation`;
    html += `</div>`;
    html += `<div class="rep-bar-container">`;
    html += `<div class="rep-bar" style="width: ${results.newReputation}%"></div>`;
    html += `<span class="rep-bar-label">${Math.round(results.newReputation)} / 100</span>`;
    html += `</div>`;
    html += `</div>`;

    // Reviews
    if (results.reviews.length > 0) {
      html += `<div class="panel">`;
      html += `<h3>\u{1F4AC} Customer Reviews</h3>`;
      html += `<div class="reviews">`;
      for (const review of results.reviews) {
        html += `<div class="review-bubble">"${review}"</div>`;
      }
      html += `</div></div>`;
    }

    // Service capacity info
    const capPercent = Math.round(results.capacityUsed / results.serviceCapacity * 100);
    html += `<div class="panel">`;
    html += `<h3>\u23F1\uFE0F Service Capacity</h3>`;
    html += `<div class="cap-bar-container">`;
    html += `<div class="cap-bar ${capPercent > 90 ? 'cap-full' : ''}" style="width: ${Math.min(100, capPercent)}%"></div>`;
    html += `<span class="cap-label">${capPercent}% used (${Math.round(results.capacityUsed)} / ${Math.round(results.serviceCapacity)} min)</span>`;
    html += `</div>`;
    if (capPercent > 90) {
      html += `<p class="cap-warning">You were at capacity! Consider hiring help or opening longer.</p>`;
    }
    html += `</div>`;

    // Progress toward goals
    html += `<div class="panel goals-panel">`;
    html += `<h3>\u{1F3AF} Season Goals</h3>`;
    const cashProgress = Math.min(100, (state.cash / GAME_CONFIG.winCash) * 100);
    const repProgress = Math.min(100, (state.reputation / GAME_CONFIG.winReputation) * 100);
    html += `<div class="goal-item">`;
    html += `<span>Cash goal: $${state.cash.toFixed(0)} / $${GAME_CONFIG.winCash}</span>`;
    html += `<div class="goal-bar-container"><div class="goal-bar cash-bar" style="width: ${cashProgress}%"></div></div>`;
    html += `</div>`;
    html += `<div class="goal-item">`;
    html += `<span>Reputation goal: ${Math.round(state.reputation)} / ${GAME_CONFIG.winReputation}</span>`;
    html += `<div class="goal-bar-container"><div class="goal-bar rep-goal-bar" style="width: ${repProgress}%"></div></div>`;
    html += `</div>`;
    html += `<p class="days-left">${GAME_CONFIG.totalDays - state.day} days remaining</p>`;
    html += `</div>`;

    // Next day button — change text if game is over
    html += `<div class="next-btn-container">`;
    if (state.gameOver) {
      html += `<button id="btn-next-day" class="btn-big">\u{1F3C1} View Final Results</button>`;
    } else {
      html += `<button id="btn-next-day" class="btn-big">\u{1F305} Next Day \u2192</button>`;
    }
    html += `</div>`;

    this.els.resultsContent.innerHTML = html;

    // Re-cache the next day button
    this.els.btnNextDay = document.getElementById("btn-next-day");
  },

  // ===========================================================================
  // GAME OVER SCREEN
  // ===========================================================================

  renderGameOver(state) {
    this.showPhase("gameover");
    this.updateStatusBar(state);

    let html = "";

    switch (state.gameResult) {
      case "win_cash":
        html += `<div class="gameover-win">`;
        html += `<h2>\u{1F389} You Made It!</h2>`;
        html += `<p>You hit <strong>$${state.cash.toFixed(2)}</strong> in cash!</p>`;
        html += `<p>From a scrappy food truck to a real business \u2014 you've proved you can run a kitchen on wheels.</p>`;
        html += `</div>`;
        break;
      case "win_reputation":
        html += `<div class="gameover-win">`;
        html += `<h2>\u{1F31F} Legendary Status!</h2>`;
        html += `<p>Your reputation hit <strong>${Math.round(state.reputation)}</strong>!</p>`;
        html += `<p>You're the most beloved food truck in SoCal. People line up before you even park.</p>`;
        html += `</div>`;
        break;
      case "lose_cash":
        html += `<div class="gameover-lose">`;
        html += `<h2>\u{1F4B8} Broke!</h2>`;
        html += `<p>You ran out of money (cash: $${state.cash.toFixed(2)}).</p>`;
        html += `<p>The commissary fee is due and you can't cover it. Time to close up shop.</p>`;
        html += `</div>`;
        break;
      case "lose_reputation":
        html += `<div class="gameover-lose">`;
        html += `<h2>\u{1F6AB} Shut Down!</h2>`;
        html += `<p>Your reputation dropped to <strong>${Math.round(state.reputation)}</strong>.</p>`;
        html += `<p>Too many complaints. The city pulled your permit.</p>`;
        html += `</div>`;
        break;
      case "lose_time":
        html += `<div class="gameover-lose">`;
        html += `<h2>\u23F0 Season Over</h2>`;
        html += `<p>30 days are up. Cash: $${state.cash.toFixed(2)}, Rep: ${Math.round(state.reputation)}.</p>`;
        html += `<p>You didn't hit the $${GAME_CONFIG.winCash} cash or ${GAME_CONFIG.winReputation} reputation goal. Better luck next season!</p>`;
        html += `</div>`;
        break;
    }

    // Stats summary
    html += `<div class="final-stats">`;
    html += `<h3>Season Stats</h3>`;
    const totalRevenue = state.history.reduce((s, h) => s + h.revenue, 0);
    const totalProfit = state.history.reduce((s, h) => s + h.profit, 0);
    const totalServed = state.history.reduce((s, h) => s + h.served, 0);
    const bestDay = state.history.reduce((best, h) => h.profit > best.profit ? h : best, state.history[0]);
    html += `<div class="stat-line"><span>Days played:</span><span>${state.history.length}</span></div>`;
    html += `<div class="stat-line"><span>Total revenue:</span><span>$${totalRevenue.toFixed(2)}</span></div>`;
    html += `<div class="stat-line"><span>Total profit:</span><span>$${totalProfit.toFixed(2)}</span></div>`;
    html += `<div class="stat-line"><span>Customers served:</span><span>${totalServed}</span></div>`;
    if (bestDay) {
      html += `<div class="stat-line"><span>Best day:</span><span>Day ${bestDay.day} ($${bestDay.profit.toFixed(2)} profit)</span></div>`;
    }
    html += `</div>`;

    // Profit history sparkline (text-based)
    if (state.history.length > 0) {
      html += `<div class="history-chart">`;
      html += `<h3>Profit History</h3>`;
      const maxProfit = Math.max(...state.history.map(h => Math.abs(h.profit)), 1);
      for (const h of state.history) {
        const barWidth = Math.abs(h.profit) / maxProfit * 100;
        const barClass = h.profit >= 0 ? "bar-positive" : "bar-negative";
        html += `<div class="chart-row">`;
        html += `<span class="chart-day">D${h.day}</span>`;
        html += `<div class="chart-bar-container">`;
        html += `<div class="chart-bar ${barClass}" style="width: ${barWidth}%"></div>`;
        html += `</div>`;
        html += `<span class="chart-val">$${h.profit.toFixed(0)}</span>`;
        html += `</div>`;
      }
      html += `</div>`;
    }

    html += `<div class="restart-container">`;
    html += `<button id="btn-restart" class="btn-big">\u{1F504} Play Again</button>`;
    html += `</div>`;

    this.els.gameoverContent.innerHTML = html;
    this.els.btnRestart = document.getElementById("btn-restart");
  }
};
