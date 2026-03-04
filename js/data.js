/**
 * =============================================================================
 * SOCAL FOOD TRUCK SIM — Game Data
 * =============================================================================
 * All game constants, menu items, ingredients, locations, weather, and events.
 * Everything is data-driven so you can tweak balance or add content by editing
 * these objects without touching engine or UI code.
 */

// =============================================================================
// INGREDIENTS
// =============================================================================
// Each ingredient has:
//   name         — display name
//   unit         — purchase unit (for display)
//   basePrice    — baseline wholesale cost per unit
//   spoilRate    — fraction of inventory lost each night (0 = non-perishable)
//   category     — grouping for UI
const INGREDIENTS = {
  carneAsada: {
    name: "Carne Asada",
    unit: "lb",
    basePrice: 8.99,
    spoilRate: 0.25,
    category: "meat"
  },
  chicken: {
    name: "Chicken",
    unit: "lb",
    basePrice: 5.49,
    spoilRate: 0.25,
    category: "meat"
  },
  alPastor: {
    name: "Al Pastor Pork",
    unit: "lb",
    basePrice: 6.99,
    spoilRate: 0.25,
    category: "meat"
  },
  tortillas: {
    name: "Tortillas",
    unit: "pack (20ct)",
    basePrice: 3.49,
    spoilRate: 0.12,
    category: "carb"
  },
  fries: {
    name: "Frozen Fries",
    unit: "bag (5lb)",
    basePrice: 4.99,
    spoilRate: 0.03,
    category: "carb"
  },
  rice: {
    name: "Rice",
    unit: "lb",
    basePrice: 1.99,
    spoilRate: 0.01,
    category: "carb"
  },
  beans: {
    name: "Beans",
    unit: "can",
    basePrice: 1.49,
    spoilRate: 0.01,
    category: "carb"
  },
  cheese: {
    name: "Cheese",
    unit: "lb",
    basePrice: 4.99,
    spoilRate: 0.15,
    category: "dairy"
  },
  salsa: {
    name: "Salsa",
    unit: "pint",
    basePrice: 2.99,
    spoilRate: 0.15,
    category: "condiment"
  },
  avocados: {
    name: "Avocados",
    unit: "each",
    basePrice: 1.50,
    spoilRate: 0.35,
    category: "produce"
  },
  sourCream: {
    name: "Sour Cream",
    unit: "tub",
    basePrice: 2.99,
    spoilRate: 0.10,
    category: "dairy"
  },
  onions: {
    name: "Onions",
    unit: "lb",
    basePrice: 1.29,
    spoilRate: 0.08,
    category: "produce"
  },
  cilantro: {
    name: "Cilantro",
    unit: "bunch",
    basePrice: 0.79,
    spoilRate: 0.40,
    category: "produce"
  },
  limes: {
    name: "Limes",
    unit: "bag (6ct)",
    basePrice: 2.49,
    spoilRate: 0.12,
    category: "produce"
  },
  cookingOil: {
    name: "Cooking Oil",
    unit: "bottle",
    basePrice: 5.99,
    spoilRate: 0.0,
    category: "supply"
  },
  cups: {
    name: "Cups",
    unit: "sleeve (50ct)",
    basePrice: 3.99,
    spoilRate: 0.0,
    category: "supply"
  },
  napkinsFoil: {
    name: "Napkins & Foil",
    unit: "pack",
    basePrice: 4.99,
    spoilRate: 0.0,
    category: "supply"
  },
  horchataBase: {
    name: "Horchata Mix",
    unit: "bag",
    basePrice: 3.99,
    spoilRate: 0.06,
    category: "supply"
  }
};

// =============================================================================
// MENU ITEMS
// =============================================================================
// Each menu item has:
//   name            — display name
//   emoji           — icon for UI
//   category        — "heavy" | "medium" | "light" | "drink" (affects location fit)
//   basePopularity  — base fraction of foot traffic interested (0–1)
//   prepTime        — minutes per serving (affects throughput)
//   referencePrice  — balanced price point used in demand formula
//   priceRange      — [min, max] reasonable price range
//   ingredients     — map of ingredientId → quantity consumed per serving
//   description     — flavor text
const MENU_ITEMS = {
  carneAsadaFries: {
    name: "Carne Asada Fries",
    emoji: "\u{1F35F}",
    category: "heavy",
    basePopularity: 0.22,
    prepTime: 6,
    referencePrice: 12.00,
    priceRange: [9, 16],
    ingredients: {
      carneAsada: 0.33,
      fries: 0.20,
      cheese: 0.15,
      avocados: 0.5,
      sourCream: 0.05,
      salsa: 0.10,
      cookingOil: 0.02,
      napkinsFoil: 0.04
    },
    description: "Loaded fries with grilled carne asada, cheese, guac, sour cream & salsa"
  },
  caliBurrito: {
    name: "Cali Burrito",
    emoji: "\u{1F32F}",
    category: "heavy",
    basePopularity: 0.25,
    prepTime: 5,
    referencePrice: 11.00,
    priceRange: [8, 15],
    ingredients: {
      carneAsada: 0.30,
      fries: 0.10,
      tortillas: 0.10,
      cheese: 0.10,
      avocados: 0.5,
      sourCream: 0.05,
      salsa: 0.08,
      napkinsFoil: 0.04
    },
    description: "The SoCal classic: carne asada, fries, cheese, guac in a flour tortilla"
  },
  streetTacosAsada: {
    name: "Street Tacos (Asada)",
    emoji: "\u{1F32E}",
    category: "medium",
    basePopularity: 0.28,
    prepTime: 4,
    referencePrice: 9.00,
    priceRange: [6, 13],
    ingredients: {
      carneAsada: 0.25,
      tortillas: 0.15,
      onions: 0.05,
      cilantro: 0.15,
      limes: 0.08,
      salsa: 0.08,
      napkinsFoil: 0.03
    },
    description: "3 tacos on corn tortillas with onion, cilantro & lime"
  },
  streetTacosPollo: {
    name: "Street Tacos (Pollo)",
    emoji: "\u{1F32E}",
    category: "medium",
    basePopularity: 0.22,
    prepTime: 4,
    referencePrice: 8.50,
    priceRange: [5, 12],
    ingredients: {
      chicken: 0.25,
      tortillas: 0.15,
      onions: 0.05,
      cilantro: 0.15,
      limes: 0.08,
      salsa: 0.08,
      napkinsFoil: 0.03
    },
    description: "3 chicken tacos on corn tortillas with onion, cilantro & lime"
  },
  streetTacosPastor: {
    name: "Street Tacos (Al Pastor)",
    emoji: "\u{1F32E}",
    category: "medium",
    basePopularity: 0.20,
    prepTime: 4,
    referencePrice: 9.00,
    priceRange: [6, 13],
    ingredients: {
      alPastor: 0.25,
      tortillas: 0.15,
      onions: 0.05,
      cilantro: 0.15,
      limes: 0.08,
      salsa: 0.08,
      napkinsFoil: 0.03
    },
    description: "3 al pastor tacos with pineapple, onion & cilantro"
  },
  quesadilla: {
    name: "Quesadilla",
    emoji: "\u{1F9C0}",
    category: "medium",
    basePopularity: 0.18,
    prepTime: 4,
    referencePrice: 8.00,
    priceRange: [5, 11],
    ingredients: {
      tortillas: 0.10,
      cheese: 0.25,
      chicken: 0.15,
      sourCream: 0.05,
      salsa: 0.08,
      cookingOil: 0.01,
      napkinsFoil: 0.03
    },
    description: "Crispy flour tortilla stuffed with cheese & chicken, served with salsa"
  },
  chipsAndGuac: {
    name: "Chips & Guac",
    emoji: "\u{1F951}",
    category: "light",
    basePopularity: 0.15,
    prepTime: 2,
    referencePrice: 6.00,
    priceRange: [4, 9],
    ingredients: {
      tortillas: 0.05,
      avocados: 1.0,
      onions: 0.03,
      cilantro: 0.10,
      limes: 0.08,
      cookingOil: 0.02,
      napkinsFoil: 0.02
    },
    description: "Fresh-made guacamole with crispy tortilla chips"
  },
  horchata: {
    name: "Horchata",
    emoji: "\u{1F964}",
    category: "drink",
    basePopularity: 0.20,
    prepTime: 1,
    referencePrice: 4.00,
    priceRange: [2, 6],
    ingredients: {
      horchataBase: 0.10,
      cups: 0.02,
      limes: 0.02
    },
    description: "Sweet cinnamon rice milk \u2014 the perfect SoCal refresher"
  }
};

// =============================================================================
// LOCATIONS
// =============================================================================
// Each location has:
//   name              — display name
//   description       — flavor text
//   baseTraffic       — foot traffic by day-of-week (0=Mon .. 6=Sun)
//   weatherSensitivity — multiplier applied to weather's traffic effect
//   itemFit           — demand multiplier by menu category at this location
//   parkingFee        — daily cost to park here
//   priceMultiplier   — customer willingness to pay (>1 = premium, <1 = discount)
const LOCATIONS = {
  beach: {
    name: "Pacific Beach",
    description: "Popular beach spot. Weekend crowds, weather-dependent. Tourists love drinks & snacks.",
    baseTraffic: { 0: 60, 1: 55, 2: 60, 3: 65, 4: 80, 5: 120, 6: 110 },
    weatherSensitivity: 1.5,
    itemFit: { heavy: 0.7, medium: 0.9, light: 1.3, drink: 1.5 },
    parkingFee: 15,
    priceMultiplier: 1.10
  },
  downtown: {
    name: "Downtown Financial District",
    description: "Hungry office workers on weekdays. They want big meals, fast. Weekends are dead.",
    baseTraffic: { 0: 100, 1: 110, 2: 115, 3: 110, 4: 95, 5: 40, 6: 30 },
    weatherSensitivity: 0.8,
    itemFit: { heavy: 1.2, medium: 1.3, light: 0.7, drink: 0.9 },
    parkingFee: 25,
    priceMultiplier: 1.15
  },
  college: {
    name: "State University",
    description: "Price-sensitive students with big appetites. Afternoon rush. Love variety & deals.",
    baseTraffic: { 0: 80, 1: 85, 2: 90, 3: 85, 4: 75, 5: 50, 6: 35 },
    weatherSensitivity: 1.0,
    itemFit: { heavy: 1.0, medium: 1.2, light: 1.0, drink: 1.3 },
    parkingFee: 10,
    priceMultiplier: 0.85
  },
  industrial: {
    name: "Industrial Park",
    description: "Steady blue-collar crowd. Reliable but price-conscious. They want filling food.",
    baseTraffic: { 0: 70, 1: 70, 2: 70, 3: 70, 4: 70, 5: 25, 6: 20 },
    weatherSensitivity: 0.6,
    itemFit: { heavy: 1.3, medium: 1.1, light: 0.5, drink: 0.8 },
    parkingFee: 5,
    priceMultiplier: 0.90
  }
};

// =============================================================================
// WEATHER TYPES
// =============================================================================
// Each weather type has:
//   name            — display name
//   emoji           — icon
//   trafficMult     — base multiplier to foot traffic
//   drinkBoost      — extra multiplier for drink category
//   heavyMealMult   — multiplier for heavy meal category
//   priceTolerance  — willingness to accept higher prices
//   probability     — chance of occurring (should sum to ~1)
const WEATHER_TYPES = {
  sunny: {
    name: "Sunny",
    emoji: "\u2600\uFE0F",
    trafficMult: 1.10,
    drinkBoost: 1.30,
    heavyMealMult: 0.95,
    priceTolerance: 1.05,
    probability: 0.40
  },
  cloudy: {
    name: "Marine Layer",
    emoji: "\u{1F325}\uFE0F",
    trafficMult: 0.95,
    drinkBoost: 0.90,
    heavyMealMult: 1.05,
    priceTolerance: 1.00,
    probability: 0.30
  },
  rain: {
    name: "Rainy",
    emoji: "\u{1F327}\uFE0F",
    trafficMult: 0.55,
    drinkBoost: 0.50,
    heavyMealMult: 1.10,
    priceTolerance: 0.90,
    probability: 0.10
  },
  heatwave: {
    name: "Heat Wave",
    emoji: "\u{1F525}",
    trafficMult: 0.90,
    drinkBoost: 1.80,
    heavyMealMult: 0.75,
    priceTolerance: 1.10,
    probability: 0.20
  }
};

// =============================================================================
// RANDOM EVENTS
// =============================================================================
// Each event has:
//   name          — display name
//   description   — what happened
//   probability   — chance per day (checked once per day)
//   effects       — object with effect keys (applied by engine)
const EVENTS = [
  {
    name: "Street Festival",
    description: "A street festival nearby brings a huge crowd your way!",
    probability: 0.08,
    effects: { trafficMult: 1.8 }
  },
  {
    name: "Competitor Truck",
    description: "A rival taco truck parks right next to you, splitting the crowd.",
    probability: 0.10,
    effects: { trafficMult: 0.70 }
  },
  {
    name: "Avocado Shortage",
    description: "Supply chain issues cause avocado prices to spike!",
    probability: 0.06,
    effects: { ingredientPriceSpike: { avocados: 2.5 } }
  },
  {
    name: "Viral TikTok",
    description: "Someone posted your truck on TikTok and it blew up!",
    probability: 0.05,
    effects: { trafficMult: 1.5, reputationBonus: 5 }
  },
  {
    name: "Health Inspection",
    description: "The health inspector drops by for a surprise visit!",
    probability: 0.07,
    effects: { healthInspection: true }
  },
  {
    name: "Local News Feature",
    description: "A local news crew stops by to film your truck!",
    probability: 0.04,
    effects: { trafficMult: 1.3, reputationBonus: 3 }
  },
  {
    name: "Meat Price Spike",
    description: "Wholesale meat prices jump due to supply issues!",
    probability: 0.06,
    effects: { ingredientPriceSpike: { carneAsada: 1.8, chicken: 1.6, alPastor: 1.7 } }
  },
  {
    name: "Food Blogger Visit",
    description: "A popular food blogger is reviewing trucks in your area today!",
    probability: 0.05,
    effects: { reputationMultiplier: 1.5 }
  },
  {
    name: "Construction Detour",
    description: "Road construction nearby diverts some foot traffic away.",
    probability: 0.07,
    effects: { trafficMult: 0.80 }
  },
  {
    name: "Company Catering Order",
    description: "A nearby company places a bulk order for their team lunch!",
    probability: 0.05,
    effects: { bonusOrders: 15 }
  }
];

// =============================================================================
// REVIEW TEMPLATES
// =============================================================================
// Templates keyed by sentiment condition. Engine picks matching ones.
const REVIEW_TEMPLATES = {
  greatFood: [
    "This carne asada is the real deal! Best I've had outside of TJ.",
    "OMG the Cali burrito from this truck is life-changing.",
    "The guac is so fresh. You can tell they make it right there.",
    "These tacos slap. Worth every penny.",
    "Horchata was perfect on a hot day. Coming back tomorrow!"
  ],
  goodValue: [
    "Great food at fair prices. Hard to beat.",
    "Solid portions for the price. My go-to lunch spot.",
    "Better deal than most trucks around here."
  ],
  overpriced: [
    "Food was okay but way too expensive for a food truck.",
    "I can get the same thing cheaper down the street...",
    "Not worth the price. Won't come back at these prices.",
    "Portions feel small for what you're paying."
  ],
  soldOut: [
    "Got there and half the menu was already sold out. Frustrating.",
    "Why post a menu if you run out by noon?",
    "Wanted the carne asada fries but they were gone. Disappointing.",
    "Showed up at 1pm and they were closing. Come on!"
  ],
  longWait: [
    "Waited 25 minutes for tacos. Way too long.",
    "The line was insane. Almost left.",
    "Food was good but not worth a 30 minute wait."
  ],
  consistent: [
    "Always reliable. Know exactly what I'm getting.",
    "This truck never disappoints. Consistent quality every time.",
    "My favorite truck. Always on point."
  ],
  newCustomer: [
    "First time trying this truck. Pretty solid!",
    "Friend recommended this spot. Not bad!",
    "Saw the truck and decided to try it. Glad I did."
  ]
};

// =============================================================================
// GAME CONFIG
// =============================================================================
const GAME_CONFIG = {
  startingCash: 300,
  startingReputation: 50,
  totalDays: 30,
  winCash: 5000,
  winReputation: 80,
  loseCashThreshold: 0,
  loseReputationThreshold: 10,

  // Fixed daily costs
  fuelCost: 15,
  permitFee: 10,
  commissaryFee: 25,

  // Staffing
  helperHourlyWage: 16,
  soloServiceMultiplier: 1.0,
  helperServiceMultiplier: 1.6,

  // Default hours open
  defaultHoursOpen: 6,
  minHoursOpen: 3,
  maxHoursOpen: 10,

  // Marketing
  maxMarketingSpend: 150,
  // Marketing lift = sqrt(spend / maxSpend) * maxLift
  maxMarketingLift: 0.30,

  // Demand model parameters
  priceElasticity: 2.5,        // how sensitive demand is to price changes
  reputationDemandBonus: 0.006, // per reputation point above 50
  randomnessRange: 0.20,       // +/- 20% random demand variation

  // Reputation changes per day
  repSoldOutPenalty: -3,     // per item that sold out (ran out of stock)
  repLongWaitPenalty: -2,    // if service capacity was exceeded
  repOverpricePenalty: -2,   // per item priced > 130% of reference
  repGoodServiceBonus: 2,    // if demand was well-met
  repConsistencyBonus: 1,    // if all offered items were available
  repBaseDecay: -0.5,        // slight daily decay toward mean

  // Credit card processing fee
  ccFeeRate: 0.029,          // 2.9% per transaction

  // Ingredient price volatility
  priceVolatility: 0.10,     // +/- 10% daily random noise on ingredient prices

  // Days of week names
  dayNames: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
};
