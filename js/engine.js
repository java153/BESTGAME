/**
 * =============================================================================
 * SOCAL FOOD TRUCK SIM — Simulation Engine
 * =============================================================================
 * Pure game logic — no DOM access. All simulation functions take state in and
 * return results out, making them easy to test and reason about.
 */

const Engine = {

  // ===========================================================================
  // RANDOM HELPERS
  // ===========================================================================

  /**
   * Random float in [min, max).
   */
  rand(min, max) {
    return Math.random() * (max - min) + min;
  },

  /**
   * Random integer in [min, max] inclusive.
   */
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Pick a random element from an array.
   */
  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // ===========================================================================
  // STATE INITIALIZATION
  // ===========================================================================

  /**
   * Create a fresh game state.
   */
  createInitialState() {
    const inventory = {};
    // Start with small amounts of staples
    for (const id of Object.keys(INGREDIENTS)) {
      inventory[id] = 0;
    }
    // Give starter inventory so day 1 is playable
    inventory.carneAsada = 3;
    inventory.chicken = 2;
    inventory.tortillas = 2;
    inventory.fries = 2;
    inventory.cheese = 2;
    inventory.salsa = 2;
    inventory.avocados = 4;
    inventory.onions = 1;
    inventory.cilantro = 2;
    inventory.limes = 2;
    inventory.cookingOil = 1;
    inventory.cups = 1;
    inventory.napkinsFoil = 1;
    inventory.horchataBase = 1;
    inventory.sourCream = 1;

    return {
      day: 1,
      cash: GAME_CONFIG.startingCash,
      reputation: GAME_CONFIG.startingReputation,
      inventory: inventory,
      // Today's ingredient prices (fluctuate daily)
      ingredientPrices: this.generateIngredientPrices({}),
      // History for graphs / review
      history: [],
      // Game status
      gameOver: false,
      gameResult: null, // "win" | "lose"
      // Today's weather (generated at start of day)
      todayWeather: null,
      // Today's events
      todayEvents: [],
      // Yesterday's results (for briefing)
      lastDayResults: null
    };
  },

  // ===========================================================================
  // DAILY GENERATION
  // ===========================================================================

  /**
   * Generate today's weather by weighted random selection.
   */
  generateWeather() {
    const roll = Math.random();
    let cumulative = 0;
    for (const [id, weather] of Object.entries(WEATHER_TYPES)) {
      cumulative += weather.probability;
      if (roll <= cumulative) {
        return { id, ...weather };
      }
    }
    // Fallback (shouldn't happen if probabilities sum to 1)
    return { id: "sunny", ...WEATHER_TYPES.sunny };
  },

  /**
   * Generate random events for the day.
   * Each event is checked independently against its probability.
   * Returns array of triggered events (usually 0–1, rarely 2+).
   */
  generateEvents() {
    const triggered = [];
    for (const event of EVENTS) {
      if (Math.random() < event.probability) {
        triggered.push(event);
      }
    }
    return triggered;
  },

  /**
   * Generate today's ingredient prices.
   * Applies random noise to base prices, plus any event-driven spikes.
   * @param {Object} eventSpikes - map of ingredientId → price multiplier from events
   */
  generateIngredientPrices(eventSpikes) {
    const prices = {};
    for (const [id, ingredient] of Object.entries(INGREDIENTS)) {
      // Base price with random daily fluctuation
      const noise = 1 + Engine.rand(-GAME_CONFIG.priceVolatility, GAME_CONFIG.priceVolatility);
      let price = ingredient.basePrice * noise;

      // Apply event-driven spikes
      if (eventSpikes && eventSpikes[id]) {
        price *= eventSpikes[id];
      }

      prices[id] = Math.round(price * 100) / 100; // Round to cents
    }
    return prices;
  },

  /**
   * Get day-of-week index (0=Mon .. 6=Sun) from day number.
   * Day 1 starts on Monday.
   */
  getDayOfWeek(dayNumber) {
    return (dayNumber - 1) % 7;
  },

  /**
   * Get day-of-week name.
   */
  getDayName(dayNumber) {
    return GAME_CONFIG.dayNames[this.getDayOfWeek(dayNumber)];
  },

  // ===========================================================================
  // START OF DAY
  // ===========================================================================

  /**
   * Prepare state for a new day: generate weather, events, prices.
   * Called at the start of each day before player makes decisions.
   */
  startDay(state) {
    // Generate weather
    state.todayWeather = this.generateWeather();

    // Generate events
    state.todayEvents = this.generateEvents();

    // Collect any ingredient price spikes from events
    const eventSpikes = {};
    for (const event of state.todayEvents) {
      if (event.effects.ingredientPriceSpike) {
        for (const [ingId, mult] of Object.entries(event.effects.ingredientPriceSpike)) {
          eventSpikes[ingId] = (eventSpikes[ingId] || 1) * mult;
        }
      }
    }

    // Generate ingredient prices with event spikes
    state.ingredientPrices = this.generateIngredientPrices(eventSpikes);

    return state;
  },

  // ===========================================================================
  // INGREDIENT CALCULATIONS
  // ===========================================================================

  /**
   * Calculate total ingredients needed for planned prep quantities.
   * @param {Object} prepPlan - map of menuItemId → quantity to prep
   * @returns {Object} map of ingredientId → total quantity needed
   */
  calculateIngredientsNeeded(prepPlan) {
    const needed = {};
    for (const [itemId, qty] of Object.entries(prepPlan)) {
      if (qty <= 0) continue;
      const item = MENU_ITEMS[itemId];
      if (!item) continue;
      for (const [ingId, perServing] of Object.entries(item.ingredients)) {
        needed[ingId] = (needed[ingId] || 0) + (perServing * qty);
      }
    }
    return needed;
  },

  /**
   * Calculate the cost of a purchase order.
   * @param {Object} purchaseOrder - map of ingredientId → quantity to buy
   * @param {Object} prices - today's ingredient prices
   * @returns {number} total cost
   */
  calculatePurchaseCost(purchaseOrder, prices) {
    let total = 0;
    for (const [ingId, qty] of Object.entries(purchaseOrder)) {
      if (qty > 0 && prices[ingId]) {
        total += qty * prices[ingId];
      }
    }
    return Math.round(total * 100) / 100;
  },

  /**
   * Apply a purchase order to inventory.
   * @param {Object} inventory - current inventory
   * @param {Object} purchaseOrder - map of ingredientId → quantity to buy
   * @returns {Object} updated inventory
   */
  applyPurchase(inventory, purchaseOrder) {
    for (const [ingId, qty] of Object.entries(purchaseOrder)) {
      if (qty > 0) {
        inventory[ingId] = (inventory[ingId] || 0) + qty;
      }
    }
    return inventory;
  },

  // ===========================================================================
  // CORE SIMULATION — Runs the business day
  // ===========================================================================

  /**
   * Simulate a full business day.
   *
   * @param {Object} state - current game state
   * @param {Object} decisions - player's decisions for the day:
   *   {
   *     location: locationId,
   *     menuItems: [itemId, ...],        // which items to offer (2-5)
   *     prices: { itemId: price, ... },   // player-set prices
   *     prepQty: { itemId: qty, ... },    // portions to prep
   *     purchaseOrder: { ingId: qty },    // ingredients to buy
   *     hireHelper: boolean,
   *     hoursOpen: number,
   *     marketingSpend: number
   *   }
   * @returns {Object} results of the day
   */
  simulateDay(state, decisions) {
    const results = {
      day: state.day,
      location: decisions.location,
      weather: state.todayWeather,
      events: state.todayEvents,
      sales: {},           // itemId → { ordered, served, revenue }
      totalRevenue: 0,
      totalCOGS: 0,
      laborCost: 0,
      fixedCosts: 0,
      marketingCost: decisions.marketingSpend || 0,
      parkingFee: 0,
      ccFees: 0,
      purchaseCost: 0,
      totalExpenses: 0,
      netProfit: 0,
      totalServed: 0,
      totalDemand: 0,
      spoilage: {},        // ingId → amount spoiled
      spoilageCost: 0,
      reputationChange: 0,
      newReputation: state.reputation,
      reviews: [],
      footTraffic: 0,
      serviceCapacity: 0,
      capacityUsed: 0
    };

    const location = LOCATIONS[decisions.location];
    const dayOfWeek = this.getDayOfWeek(state.day);

    // ----- Step 1: Apply purchases -----
    results.purchaseCost = this.calculatePurchaseCost(
      decisions.purchaseOrder || {}, state.ingredientPrices
    );
    this.applyPurchase(state.inventory, decisions.purchaseOrder || {});

    // ----- Step 2: Calculate fixed costs -----
    results.parkingFee = location.parkingFee;
    results.fixedCosts = GAME_CONFIG.fuelCost + GAME_CONFIG.permitFee
                       + GAME_CONFIG.commissaryFee;

    // ----- Step 3: Labor cost -----
    const hoursOpen = decisions.hoursOpen || GAME_CONFIG.defaultHoursOpen;
    if (decisions.hireHelper) {
      results.laborCost = GAME_CONFIG.helperHourlyWage * hoursOpen;
    }

    // ----- Step 4: Calculate service capacity -----
    // Total minutes available = hours * 60 * staffing multiplier
    const staffMult = decisions.hireHelper
      ? GAME_CONFIG.helperServiceMultiplier
      : GAME_CONFIG.soloServiceMultiplier;
    const totalMinutes = hoursOpen * 60 * staffMult;
    results.serviceCapacity = totalMinutes; // in "prep minutes"

    // ----- Step 5: Generate foot traffic -----
    // Base traffic from location and day of week
    let footTraffic = location.baseTraffic[dayOfWeek] || 60;

    // Apply weather modifier (scaled by location's weather sensitivity)
    const weatherEffect = state.todayWeather.trafficMult;
    // Blend toward 1.0 based on sensitivity: low sensitivity = less affected
    const weatherMult = 1 + (weatherEffect - 1) * location.weatherSensitivity;
    footTraffic *= weatherMult;

    // Apply event multipliers
    let eventTrafficMult = 1.0;
    for (const event of state.todayEvents) {
      if (event.effects.trafficMult) {
        eventTrafficMult *= event.effects.trafficMult;
      }
    }
    footTraffic *= eventTrafficMult;

    // Apply marketing lift
    // Formula: sqrt(spend / maxSpend) * maxLift — diminishing returns
    const marketingLift = decisions.marketingSpend > 0
      ? Math.sqrt(decisions.marketingSpend / GAME_CONFIG.maxMarketingSpend)
        * GAME_CONFIG.maxMarketingLift
      : 0;
    footTraffic *= (1 + marketingLift);

    // Round to integer
    footTraffic = Math.max(1, Math.round(footTraffic));
    results.footTraffic = footTraffic;

    // ----- Step 6: Calculate demand per menu item -----
    // For each offered item, compute how many people want to order it.
    let totalPrepTimeUsed = 0;
    let totalServed = 0;
    let totalDemand = 0;
    let anySoldOut = false;
    let capacityExceeded = false;
    let overpricedItems = 0;

    for (const itemId of decisions.menuItems) {
      const item = MENU_ITEMS[itemId];
      if (!item) continue;

      const price = decisions.prices[itemId] || item.referencePrice;
      const prepQty = decisions.prepQty[itemId] || 0;

      // --- Interest: what fraction of foot traffic wants this item ---
      // Base popularity
      let interest = item.basePopularity;

      // Location fit: some items do better at certain locations
      interest *= location.itemFit[item.category] || 1.0;

      // Weather effects on category
      if (item.category === "drink") {
        interest *= state.todayWeather.drinkBoost;
      } else if (item.category === "heavy") {
        interest *= state.todayWeather.heavyMealMult;
      }

      // Reputation bonus: +0.6% demand per reputation point above 50
      const repBonus = (state.reputation - 50) * GAME_CONFIG.reputationDemandBonus;
      interest *= (1 + repBonus);

      // --- Price factor: exponential penalty for overpricing ---
      // priceFactor = exp(-elasticity * (price - refPrice) / refPrice)
      // At reference price: factor = 1.0
      // 20% over reference: factor ~ 0.61 (with elasticity 2.5)
      // 20% under reference: factor ~ 1.65
      const adjustedRef = item.referencePrice * (location.priceMultiplier || 1)
                        * (state.todayWeather.priceTolerance || 1);
      const priceFactor = Math.exp(
        -GAME_CONFIG.priceElasticity * (price - adjustedRef) / adjustedRef
      );

      // --- Random variation ---
      const randomness = 1 + Engine.rand(
        -GAME_CONFIG.randomnessRange, GAME_CONFIG.randomnessRange
      );

      // --- Final demand ---
      let ordersWanted = footTraffic * interest * priceFactor * randomness;

      // Add bonus orders from events (e.g., catering order)
      for (const event of state.todayEvents) {
        if (event.effects.bonusOrders) {
          // Spread bonus orders across menu items
          ordersWanted += event.effects.bonusOrders / decisions.menuItems.length;
        }
      }

      ordersWanted = Math.max(0, Math.round(ordersWanted));
      totalDemand += ordersWanted;

      // --- Apply constraints ---
      let served = ordersWanted;

      // Constraint 1: Prep quantity limit
      served = Math.min(served, prepQty);

      // Constraint 2: Ingredient availability
      // Check if we have enough ingredients for this many servings
      let maxFromIngredients = Infinity;
      for (const [ingId, perServing] of Object.entries(item.ingredients)) {
        if (perServing > 0) {
          const available = state.inventory[ingId] || 0;
          maxFromIngredients = Math.min(maxFromIngredients, Math.floor(available / perServing));
        }
      }
      if (maxFromIngredients < Infinity) {
        served = Math.min(served, maxFromIngredients);
      }

      // Constraint 3: Service capacity (prep time)
      const prepTimeNeeded = served * item.prepTime;
      const remainingCapacity = results.serviceCapacity - totalPrepTimeUsed;
      if (prepTimeNeeded > remainingCapacity) {
        served = Math.floor(remainingCapacity / item.prepTime);
        capacityExceeded = true;
      }

      served = Math.max(0, served);
      totalPrepTimeUsed += served * item.prepTime;
      totalServed += served;

      // Track if item sold out (demand exceeded supply)
      if (served < ordersWanted && ordersWanted > 0) {
        anySoldOut = true;
      }

      // Check if overpriced
      if (price > item.referencePrice * 1.30) {
        overpricedItems++;
      }

      // --- Deduct ingredients used ---
      for (const [ingId, perServing] of Object.entries(item.ingredients)) {
        state.inventory[ingId] = Math.max(0,
          (state.inventory[ingId] || 0) - (served * perServing)
        );
      }

      // --- Calculate revenue and COGS ---
      const revenue = served * price;
      let cogs = 0;
      for (const [ingId, perServing] of Object.entries(item.ingredients)) {
        cogs += perServing * (state.ingredientPrices[ingId] || 0);
      }
      cogs *= served;

      // Calculate waste: prepped but not sold portions
      const wasted = Math.max(0, prepQty - served);

      results.sales[itemId] = {
        name: item.name,
        ordered: ordersWanted,
        served: served,
        wasted: wasted,
        price: price,
        revenue: Math.round(revenue * 100) / 100,
        cogs: Math.round(cogs * 100) / 100
      };

      results.totalRevenue += revenue;
      results.totalCOGS += cogs;
    }

    results.totalServed = totalServed;
    results.totalDemand = totalDemand;
    results.capacityUsed = totalPrepTimeUsed;

    // ----- Step 7: Credit card fees -----
    results.ccFees = Math.round(results.totalRevenue * GAME_CONFIG.ccFeeRate * 100) / 100;

    // ----- Step 8: Calculate totals -----
    results.totalRevenue = Math.round(results.totalRevenue * 100) / 100;
    results.totalExpenses = Math.round((
      results.purchaseCost + results.fixedCosts + results.parkingFee +
      results.laborCost + results.marketingCost + results.ccFees
    ) * 100) / 100;
    results.netProfit = Math.round(
      (results.totalRevenue - results.totalExpenses) * 100
    ) / 100;

    // ----- Step 9: Apply spoilage -----
    // Each ingredient spoils at its spoilRate overnight
    let spoilageCost = 0;
    for (const [ingId, qty] of Object.entries(state.inventory)) {
      const ingredient = INGREDIENTS[ingId];
      if (!ingredient || ingredient.spoilRate <= 0 || qty <= 0) continue;

      const spoiled = qty * ingredient.spoilRate;
      if (spoiled > 0.001) { // Only track meaningful spoilage
        results.spoilage[ingId] = Math.round(spoiled * 100) / 100;
        spoilageCost += spoiled * (state.ingredientPrices[ingId] || ingredient.basePrice);
        state.inventory[ingId] = Math.max(0, qty - spoiled);
      }
    }
    results.spoilageCost = Math.round(spoilageCost * 100) / 100;

    // ----- Step 10: Update cash -----
    // Spoilage is a real cost — deduct it from profit
    results.totalExpenses += results.spoilageCost;
    results.netProfit = Math.round(
      (results.totalRevenue - results.totalExpenses) * 100
    ) / 100;
    state.cash = Math.round((state.cash + results.netProfit) * 100) / 100;

    // ----- Step 11: Reputation changes -----
    let repChange = 0;

    // Sold-out penalty (proportional to how much demand was unmet)
    if (anySoldOut) {
      const unmetRatio = Math.max(0, 1 - totalServed / Math.max(1, totalDemand));
      repChange += GAME_CONFIG.repSoldOutPenalty * unmetRatio * 3;
    }

    // Long wait / capacity penalty
    if (capacityExceeded) {
      repChange += GAME_CONFIG.repLongWaitPenalty;
    }

    // Overpricing penalty
    if (overpricedItems > 0) {
      repChange += GAME_CONFIG.repOverpricePenalty * overpricedItems;
    }

    // Good service bonus: met most demand without capacity issues
    if (!capacityExceeded && totalServed >= totalDemand * 0.7) {
      repChange += GAME_CONFIG.repGoodServiceBonus;
    }

    // Consistency bonus: all offered items had stock available
    const allItemsAvailable = decisions.menuItems.every(itemId => {
      const s = results.sales[itemId];
      return s && s.served > 0;
    });
    if (allItemsAvailable) {
      repChange += GAME_CONFIG.repConsistencyBonus;
    }

    // Base decay toward 50
    repChange += GAME_CONFIG.repBaseDecay * Math.sign(state.reputation - 50);

    // Event reputation effects
    for (const event of state.todayEvents) {
      if (event.effects.reputationBonus) {
        repChange += event.effects.reputationBonus;
      }
      if (event.effects.healthInspection) {
        if (state.reputation < 40) {
          repChange -= 10; // Penalty for low-rep inspection
        } else if (state.reputation >= 60) {
          repChange += 3; // Bonus for high-rep inspection
        }
      }
      if (event.effects.reputationMultiplier) {
        // Apply to positive rep changes only
        if (repChange > 0) {
          repChange *= event.effects.reputationMultiplier;
        }
      }
    }

    repChange = Math.round(repChange * 10) / 10;
    results.reputationChange = repChange;
    state.reputation = Math.max(0, Math.min(100,
      Math.round((state.reputation + repChange) * 10) / 10
    ));
    results.newReputation = state.reputation;

    // ----- Step 12: Generate reviews -----
    results.reviews = this.generateReviews(results, state, decisions);

    // ----- Step 13: Store in history -----
    state.history.push({
      day: state.day,
      revenue: results.totalRevenue,
      profit: results.netProfit,
      reputation: state.reputation,
      cash: state.cash,
      served: totalServed,
      weather: state.todayWeather.name,
      location: location.name
    });

    // ----- Step 14: Check win/lose -----
    if (state.cash < GAME_CONFIG.loseCashThreshold) {
      state.gameOver = true;
      state.gameResult = "lose_cash";
    } else if (state.reputation < GAME_CONFIG.loseReputationThreshold) {
      state.gameOver = true;
      state.gameResult = "lose_reputation";
    } else if (state.cash >= GAME_CONFIG.winCash) {
      state.gameOver = true;
      state.gameResult = "win_cash";
    } else if (state.reputation >= GAME_CONFIG.winReputation && state.day >= 15) {
      // Reputation win only available after day 15 (must sustain it)
      state.gameOver = true;
      state.gameResult = "win_reputation";
    } else if (state.day >= GAME_CONFIG.totalDays) {
      state.gameOver = true;
      // Check if either win condition is met at end
      if (state.cash >= GAME_CONFIG.winCash || state.reputation >= GAME_CONFIG.winReputation) {
        state.gameResult = state.cash >= GAME_CONFIG.winCash ? "win_cash" : "win_reputation";
      } else {
        state.gameResult = "lose_time";
      }
    }

    state.lastDayResults = results;
    return results;
  },

  // ===========================================================================
  // REVIEW GENERATION
  // ===========================================================================

  /**
   * Generate 2-3 customer review blurbs based on day's outcomes.
   */
  generateReviews(results, state, decisions) {
    const reviews = [];
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Check conditions and pick matching reviews
    const serveRatio = results.totalServed / Math.max(1, results.totalDemand);

    // Good food reviews when things went well
    if (serveRatio >= 0.7 && results.totalServed > 5) {
      reviews.push(pick(REVIEW_TEMPLATES.greatFood));
    }

    // Good value
    const anyGoodValue = decisions.menuItems.some(id => {
      const price = decisions.prices[id] || 0;
      const ref = MENU_ITEMS[id].referencePrice;
      return price <= ref * 0.95;
    });
    if (anyGoodValue && results.totalServed > 3) {
      reviews.push(pick(REVIEW_TEMPLATES.goodValue));
    }

    // Overpriced complaints
    const anyOverpriced = decisions.menuItems.some(id => {
      const price = decisions.prices[id] || 0;
      const ref = MENU_ITEMS[id].referencePrice;
      return price > ref * 1.25;
    });
    if (anyOverpriced) {
      reviews.push(pick(REVIEW_TEMPLATES.overpriced));
    }

    // Sold out complaints
    if (serveRatio < 0.6 && results.totalDemand > 10) {
      reviews.push(pick(REVIEW_TEMPLATES.soldOut));
    }

    // Long wait
    if (results.capacityUsed > results.serviceCapacity * 0.9) {
      reviews.push(pick(REVIEW_TEMPLATES.longWait));
    }

    // Consistency praise
    if (state.reputation >= 60 && serveRatio >= 0.8) {
      reviews.push(pick(REVIEW_TEMPLATES.consistent));
    }

    // New customer
    if (state.reputation < 45 && results.totalServed > 0) {
      reviews.push(pick(REVIEW_TEMPLATES.newCustomer));
    }

    // Ensure at least 1 review and at most 3
    if (reviews.length === 0) {
      reviews.push(pick(REVIEW_TEMPLATES.newCustomer));
    }
    while (reviews.length > 3) {
      reviews.pop();
    }

    return reviews;
  },

  // ===========================================================================
  // UTILITY: Suggest auto-buy quantities
  // ===========================================================================

  /**
   * Suggest ingredient purchase quantities based on prep plan.
   * Calculates shortfall between what's needed and what's in stock.
   */
  suggestPurchases(prepPlan, inventory) {
    const needed = this.calculateIngredientsNeeded(prepPlan);
    const suggestions = {};
    for (const [ingId, amount] of Object.entries(needed)) {
      const inStock = inventory[ingId] || 0;
      const shortfall = amount - inStock;
      if (shortfall > 0) {
        // Round up to nearest whole unit for purchase
        suggestions[ingId] = Math.ceil(shortfall);
      }
    }
    return suggestions;
  },

  /**
   * Check if the player can afford total planned expenses.
   */
  canAfford(state, totalCost) {
    return state.cash >= totalCost;
  },

  /**
   * Calculate total planned expenses before opening.
   */
  calculatePlannedExpenses(decisions, state) {
    const purchaseCost = this.calculatePurchaseCost(
      decisions.purchaseOrder || {}, state.ingredientPrices
    );
    const location = LOCATIONS[decisions.location];
    const fixedCosts = GAME_CONFIG.fuelCost + GAME_CONFIG.permitFee + GAME_CONFIG.commissaryFee;
    const parkingFee = location ? location.parkingFee : 0;
    const hoursOpen = decisions.hoursOpen || GAME_CONFIG.defaultHoursOpen;
    const laborCost = decisions.hireHelper ? GAME_CONFIG.helperHourlyWage * hoursOpen : 0;
    const marketingCost = decisions.marketingSpend || 0;

    return {
      purchaseCost,
      fixedCosts,
      parkingFee,
      laborCost,
      marketingCost,
      total: Math.round((purchaseCost + fixedCosts + parkingFee + laborCost + marketingCost) * 100) / 100
    };
  }
};
