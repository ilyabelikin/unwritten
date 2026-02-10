# Settlement Treasury System

**Goal:** Implement proper money management where settlements have treasuries and traders get funded from those treasuries, creating a realistic economic cycle.

## Overview

Settlements now have **treasuries** (money reserves) that fund their trade operations. Traders receive starting capital from their home settlement's treasury and return profits back to it.

## Changes Made

### 1. Settlement Economy - Treasury Field

**Added to `SettlementEconomy`:**
```typescript
private treasury: number; // Settlement's money for trade

// Methods
getTreasury(): number
setTreasury(amount: number): void
addMoney(amount: number): void
removeMoney(amount: number): boolean
hasMoney(amount: number): boolean
```

### 2. Treasury Initialization

**Formula:** `(Population × 10 gold) + Type Bonus`

**Type Bonuses:**
- **Cities**: +500g (large capital reserves)
- **Villages**: +200g (modest reserves)
- **Hamlets**: +50g (minimal reserves)

**Example Starting Treasuries:**
```
Hamlet (8 people):  80g + 50g = 130g
Village (25 people): 250g + 200g = 450g
City (60 people):    600g + 500g = 1,100g
```

### 3. Trader Funding from Treasury

**Old System:**
```typescript
this.money = 100; // Hardcoded, money from thin air
```

**New System:**
```typescript
// Calculate starting capital based on settlement type
let startingCapital = 50;  // Hamlet
if (city) startingCapital = 150;
if (village) startingCapital = 100;

// Emergency traders get double funding
if (hasUrgentNeeds) startingCapital *= 2;

// Withdraw from settlement treasury
economy.removeMoney(startingCapital);
trader.money = startingCapital;
```

**Trader Capital by Type:**
- **Hamlet traders**: 50g (or 100g if emergency)
- **Village traders**: 100g (or 200g if emergency)
- **City traders**: 150g (or 300g if emergency)

### 4. Money Flow Through Trade

#### When Trader Buys Goods
```typescript
// Trader pays → Selling settlement's treasury receives
trader.money -= totalCost;
economy.addMoney(totalCost);
```

**Example:**
```
Trader buys 20 wheat for 40g at Village A
- Trader: 100g → 60g
- Village A treasury: 450g → 490g
```

#### When Trader Sells Goods
```typescript
// Buying settlement's treasury pays → Trader receives
const revenue = sellPrice * quantity;

if (economy.hasMoney(revenue)) {
  economy.removeMoney(revenue);
  trader.money += revenue;
} else {
  // Humanitarian aid - trader breaks even
  trader.money += originalCost;
}
```

**Example:**
```
Trader sells 20 wheat for 60g at City B
- City B treasury: 1100g → 1040g
- Trader: 60g → 120g (20g profit)
```

#### When Trader Returns Home
```typescript
// Deposit profits, keep working capital
const profit = trader.money - baseCapital;
economy.addMoney(profit);
trader.money = baseCapital;
```

**Example:**
```
Trader returns home with 120g (started with 100g)
- Deposits: 70g to settlement treasury
- Keeps: 50g for next trade
- Settlement treasury: 450g → 520g
```

### 5. Humanitarian Aid System

**Problem:** What if a starving settlement has no money?

**Solution:** Traders deliver goods anyway, break even on the trade

```typescript
if (!economy.hasMoney(revenue)) {
  // Settlement can't pay - humanitarian aid
  trader.money += originalCost; // No loss, no profit
  console.log("UNPAID - treasury empty");
}
```

**Example:**
```
Trader bought food for 100g
Settlement has 0g in treasury
- Goods still delivered to settlement
- Trader gets 100g back (breaks even)
- No profit, but no loss
- Settlement saved from starvation
```

### 6. Money Returns on Death

**When trader dies or is removed:**
```typescript
if (trader.money > 0) {
  economy.addMoney(trader.money);
  // Money returns to settlement treasury
}
```

## Complete Money Flow Example

### Turn 1: Trade Cycle
```
Village A (farming, 25 people)
- Treasury: 450g
- Stockpile: 200 wheat (surplus)

City B (mining, 60 people)  
- Treasury: 1,100g
- Stockpile: 10 wheat (shortage)

Step 1: Spawn Trader
- Village A spawns trader "Marcus"
- Withdraws 100g from treasury
- Village A treasury: 450g → 350g
- Marcus: 100g

Step 2: Marcus Travels to Buy
- Marcus buys 50 wheat from Village A for 50g
- Village A treasury: 350g → 400g
- Marcus: 100g → 50g
- Marcus carries: 50 wheat

Step 3: Marcus Travels to Sell
- Marcus sells 50 wheat to City B for 150g
- City B treasury: 1,100g → 950g
- Marcus: 50g → 200g
- Marcus profit: 100g

Step 4: Marcus Returns Home
- Marcus deposits 150g profit to Village A
- Village A treasury: 400g → 550g
- Marcus keeps: 50g working capital
- Village A net gain: 100g
```

### Turn 10: Economic Growth
```
Village A Stats:
- Starting treasury (turn 1): 450g
- Trade profits (9 turns): +900g
- Trader funding (9 spawns): -900g
- Current treasury: 450g + 900g - 900g = 450g (stable)
- Trade active, economy healthy

City B Stats:
- Starting treasury: 1,100g
- Trade purchases (9 turns): -1,350g
- Trade sales (9 turns): +450g
- Current treasury: 1,100g - 1,350g + 450g = 200g
- Food secure through trade
```

## Benefits

### 1. Realistic Economy
- ✅ Money doesn't appear from thin air
- ✅ Settlements fund their own traders
- ✅ Trade profits return to communities
- ✅ Economic activity creates wealth

### 2. Economic Constraints
- ✅ Poor settlements can't spam traders
- ✅ Treasury limits trader capacity
- ✅ Failed trades have consequences
- ✅ Settlements must manage money

### 3. Self-Regulating System
- ✅ Successful settlements earn more money
- ✅ More money → more traders → more trade
- ✅ Poor settlements get humanitarian aid
- ✅ Death returns money to community

### 4. Emergency Response
- ✅ Critical needs = double funding for traders
- ✅ Ensures help reaches struggling settlements
- ✅ Even broke settlements can get food delivered

## Edge Cases Handled

### Case 1: Settlement Has No Money
```
Hamlet treasury: 0g
Needs: Emergency food

Result:
- Cannot spawn new traders (needs 50g minimum)
- BUT: Existing traders will still deliver food
- Humanitarian aid: Trader breaks even, food arrives
- Settlement survives until it earns money
```

### Case 2: Trader Dies Mid-Journey
```
Trader carrying 200g dies

Result:
- Money returns to home settlement treasury
- Settlement recovers the capital
- Can fund new trader with returned money
```

### Case 3: Wealthy Settlement
```
City treasury: 5,000g
Many profitable trades

Result:
- Can afford maximum traders (3 base + extras)
- Emergency traders get 300g each
- More trade = more prosperity
- Stable economic powerhouse
```

### Case 4: Trade Route Failure
```
Village buys goods for 100g
Destination settlement collapses before delivery

Result:
- Trader returns home
- Deposits remaining money to treasury
- Small loss (transport costs)
- Treasury recovers most capital
```

## Future Enhancements

### Taxation System
```typescript
// Population pays taxes based on wealth/jobs
population.collectTaxes() → treasury
```

### Building Costs
```typescript
// Settlements spend treasury to build
economy.removeMoney(buildingCost);
```

### Trade Policies
```typescript
// Settlements set trade priorities
market.setExportTax(GoodType.Wheat, 0.1); // 10% tax
market.setImportSubsidy(GoodType.Meat, 0.2); // 20% subsidy
```

### Banking & Loans
```typescript
// Poor settlements can borrow
economy.takeLoan(amount, interestRate, turns);
```

### Investment
```typescript
// Wealthy settlements invest in infrastructure
economy.investInRoads(amount); // Better trade routes
economy.investInMarket(amount); // Better prices
```

## Technical Notes

### Initialization Order
```typescript
1. initializeEconomies()     // Create economies
2. initializePopulations()   // Create populations
3. initializeTreasuries()    // Calculate starting money
```

This order ensures treasury is calculated after population is known.

### Treasury Persistence
The treasury value persists in the `SettlementEconomy` instance and updates throughout the game as:
- Traders are funded
- Goods are bought/sold
- Traders return profits
- Traders die and money returns

### Console Logging
All money transactions are logged:
```
[Trade] Created trader Marcus with 100g from treasury (treasury now: 350g)
[Trade] Marcus bought 50 wheat for 50g (settlement treasury: 400g)
[Trade] Marcus sold 50 wheat for 150g (settlement treasury: 850g)
[Trade] Marcus returned home and deposited 150g (kept 50g for next trade)
```

## Summary

The treasury system creates a **realistic economic cycle**:

1. 🏛️ Settlements start with money proportional to population
2. 💰 Traders get funded from settlement treasury
3. 📦 Trade moves goods between settlements
4. 💵 Money flows through buy/sell transactions
5. 🔄 Profits return to settlement treasuries
6. 🚀 Successful settlements grow wealthier
7. 🆘 Poor settlements get humanitarian aid
8. ⚖️ Self-regulating economic system

**Result:** Proper money management with realistic constraints and economic growth!
