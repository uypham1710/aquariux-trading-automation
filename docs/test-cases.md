# Test Cases

Test cases for the Aquariux web trader, mapped to the 7 functional scopes of the assessment.
Domain rules and the UI map they rely on are in [CLAUDE.md](../CLAUDE.md).

## Conventions

| Item | Meaning |
|---|---|
| ID | `TC-<scope>.<number>`, e.g. `TC-1.03`. The automated test title keeps the same ID. |
| P1 | Core money flow. A failure means users cannot trade or records are wrong. |
| P2 | Important variant or rule. A failure has a workaround or affects fewer users. |
| Tag | `@smoke` = a few P1 cases run on every change. Every case is also `@regression`. |
| Status | **Ready** = can be automated now. **Blocked (Qn)** = waits for open question `Qn` at the end of this file. |

Only P1 and P2 cases are listed. Low-priority edge cases and display details are left out on purpose.

## Common preconditions and cleanup

- Logged in to the demo account (setup project, saved storageState).
- One Click Trading is OFF unless the case says otherwise.
- Default symbol XAUUSD, default volume = minimum volume (0.1).
- SL, TP and pending prices are computed from the price shown at runtime, never hard-coded.
  Pending orders are placed about 5% away from market so they do not fill during the test.
- Executed prices and P/L are compared with a tolerance, because prices move.
- Every order is tracked by its Order No. History tables contain data from earlier runs.
- Every case closes or cancels what it created, one by one by Order No., even when it fails.

---

## Scope 1 - Market orders with Stop Loss and Take Profit

| ID | Test case | Expected result | Priority | Status |
|---|---|---|---|---|
| TC-1.01 | should place Buy market order with valid SL and TP `@smoke` | New position in Open Positions with Type Buy, volume 0.1, Entry Price close to the Ask shown before placing, SL and TP equal to the values entered. | P1 | Ready |
| TC-1.02 | should place Sell market order with valid SL and TP `@smoke` | Same as TC-1.01 for Sell. Entry Price close to the Bid shown before placing. | P1 | Ready |
| TC-1.03 | should place Buy market order without SL and TP | Position created. SL and TP columns show "--". | P2 | Ready |
| TC-1.04 | should place Buy market order with SL and TP entered in Points | SL and TP in the position = entry price -/+ (points x point size). XAUUSD point = 0.01. | P2 | Ready |
| TC-1.05 | should not place Buy market order when SL is above the Sell price | Message "Stop Loss must be less than Sell Price." under the input. Confirmation dialog does not open, so no order is sent. | P1 | Ready |
| TC-1.06 | should not place Buy market order when TP is below the Sell price | Same as TC-1.05, message "Take Profit must be greater than Sell Price." | P1 | Ready |
| TC-1.07 | should not place Sell market order when SL is below the Buy price | Same as TC-1.05, message "Stop Loss must be greater than Buy Price." | P1 | Ready |
| TC-1.08 | should not place Sell market order when TP is above the Buy price | Same as TC-1.05, message "Take Profit must be less than Buy Price." | P1 | Ready |
| TC-1.09 | should not place market order with volume below the minimum | Message "Minimum volume is 0.1." Confirmation dialog does not open. | P2 | Ready |

## Scope 2 - Market orders with One Click Trading

Cleanup for every case in this scope: turn One Click Trading OFF again.

| ID | Test case | Expected result | Priority | Status |
|---|---|---|---|---|
| TC-2.01 | should enable and disable One Click Trading from Settings | Switching ON shows "One-Click Trading Terms and Conditions" that must be accepted (AGREE AND CONTINUE). Switching OFF needs no confirmation. The toggle shows the state through its test id (toggle-oct / toggle-oct-checked). | P2 | Ready |
| TC-2.02 | should place Buy market order without confirmation when One Click Trading is ON `@smoke` | PLACE BUY ORDER sends the order straight away: no Order Confirmation dialog. Toast "Position has been created." and a new Order No. in Open Positions. | P1 | Ready |
| TC-2.03 | should place Sell market order without confirmation when One Click Trading is ON | Same as TC-2.02 for Sell. | P1 | Ready |
| TC-2.04 | should place market order with SL and TP when One Click Trading is ON | Position has the SL and TP entered before clicking. | P2 | Ready |
| TC-2.05 | should ask for confirmation when One Click Trading is OFF | PLACE ORDER opens the "Order Confirmation" dialog (CANCEL / CONFIRM) before anything is sent. | P2 | Ready |

## Scope 3 - Pending orders

Order types: Limit, Stop, Stop Limit. Pending orders show Fill Policy "Return".

| ID | Test case | Expected result | Priority | Status |
|---|---|---|---|---|
| TC-3.01 | should place Buy Limit order below market price `@smoke` | Order in Pending Orders with its Order No., Type, price and volume as entered. No new position. | P1 | Ready |
| TC-3.02 | should place Sell Limit order above market price | Same as TC-3.01. | P1 | Ready |
| TC-3.03 | should place Buy Stop order above market price | Same as TC-3.01. | P1 | Ready |
| TC-3.04 | should place Sell Stop order below market price | Same as TC-3.01. | P2 | Ready |
| TC-3.05 | should place Buy Stop Limit order with stop and limit price | Pending Orders shows "BUY STOP LIMIT" with the entered Price. | P2 | Ready |
| TC-3.06 | should place Buy Limit order with SL and TP relative to the pending price | Order saved with the SL and TP entered. SL < pending price < TP. | P1 | Ready |
| TC-3.07 | should not place Buy Limit order when SL is above the pending price | Message "Stop Loss must be less than price." The confirmation dialog does not open. | P2 | Ready |
| TC-3.08 | should not place Buy Limit order with price above market | The app opens the confirmation dialog (it does not check the side itself); the server rejects the order with the toast "Invalid Price submitted." No new pending order. | P2 | Ready |
| TC-3.09 | should modify the price of a pending order | CONFIRM in the edit dialog, then the Order Confirmation dialog. Toast "Order has been updated." Same Order No. shows the new price. | P1 | Ready |
| TC-3.10 | should modify SL and TP of a pending order | Pending Orders shows the new SL and TP for the same Order No. | P2 | Ready |
| TC-3.11 | should cancel a pending order | Confirm To Delete Order dialog. Toast "Order has been deleted." Order leaves Pending Orders. Orders & Deals shows it as CANCELED (see TC-7.03). | P1 | Ready |
| TC-3.12 | should place pending order with each supported expiry option | One test per option: Good Till Canceled (Expiry Date "--"), Good Till Day, Specified Date, Specified Date and Time (hour set one hour after server time). The row shows the chosen expiry. | P2 | Ready |

## Scope 4 - Open positions: view, modify, partial close, close

| ID | Test case | Expected result | Priority | Status |
|---|---|---|---|---|
| TC-4.01 | should show a new position with correct column values | Row found by Order No. shows Symbol, Type, Volume, Units, Entry Price, SL, TP as placed. | P1 | Ready |
| TC-4.02 | should modify SL and TP of an open position | Same Order No. shows the new SL and TP. | P1 | Ready |
| TC-4.03 | should not save SL above current price for a Buy position | Message "Stop Loss must be less than Sell Price." in the Edit dialog. Old SL kept. | P2 | Ready |
| TC-4.04 | should close an open position `@smoke` | Position leaves Open Positions. It appears in Positions History. A closing order exists in Orders & Deals (see TC-7.02). | P1 | Ready |
| TC-4.05 | should partially close an open position | Close dialog with a smaller volume. The same Order No. stays open with the remaining volume. | P1 | Ready (history records: Q4) |

## Scope 5 - Bulk close and bulk delete

Bulk Close acts on the whole account, so each case checks the Order No. list it created.
Cleanup closes anything left one by one, not with Bulk Close.
Because the action is account-wide, a case is skipped (with the reason) when the account already
holds positions or pending orders that the test did not create. Menu option labels and the
confirmation dialog are not verified yet (menus cannot be opened while the market is closed).

| ID | Test case | Expected result | Priority | Status |
|---|---|---|---|---|
| TC-5.01 | should close all open positions with Bulk Close "Close All" | All Order No. created by the test leave Open Positions and appear in history. | P1 | Ready |
| TC-5.02 | should close only Buy positions with Bulk Close "Buy" | Buy positions closed. Sell positions created by the test stay open. | P1 | Ready |
| TC-5.03 | should close only Sell positions with Bulk Close "Sell" | Mirror of TC-5.02. | P2 | Ready |
| TC-5.04 | should keep all positions when the Bulk Close confirmation is canceled | All positions still open. | P2 | Ready |
| TC-5.05 | should delete all pending orders with bulk delete | All pending Order No. created by the test become CANCELED. | P1 | Blocked (Q9) |

## Scope 6 - Transactions, notifications, order history

Toasts disappear quickly, so they are asserted right after the action. The bell list and
history tables are the stable source of truth.

| ID | Test case | Expected result | Priority | Status |
|---|---|---|---|---|
| TC-6.01 | should show a toast after placing a market order | Toast "Position has been created." The toast has no Order No., so the order is matched in the tables. | P1 | Ready |
| TC-6.02 | should list the order in the bell notifications | Bell list has an entry with the same Order No. | P2 | Ready |
| TC-6.03 | should notify when a position is closed | Toast and bell entry for the close. | P2 | Ready |
| TC-6.04 | should show a filled market order in Orders & Deals `@smoke` | Row with State FILLED and an expand arrow that shows its deals. | P1 | Ready |
| TC-6.05 | should show a closed position in Positions History | Row with the opening Order No., close price and P/L. | P2 | Ready |
| TC-6.06 | should find today's order when the date range covers today | Range computed at runtime. Order is listed. | P2 | Ready |

## Scope 7 - Order details and status across records

The same order must look the same everywhere it appears. Rows are matched by Order No.,
and deal rows by Deal ID, which is a different number series.

| ID | Test case | Expected result | Priority | Status |
|---|---|---|---|---|
| TC-7.01 | should show the same Buy market order details in toast, Open Positions and Orders & Deals `@smoke` | Toast "Position has been created.". Open Positions and Orders & Deals agree on Order No., symbol, volume, units, entry price, SL, TP and Open Date. Orders & Deals: State FILLED, Volume "0.1 / 0.1", Fill Policy "Fill or Kill", one "In" deal whose Deal ID differs from the Order No. | P1 | Ready |
| TC-7.02 | should record a closing Sell order and Out deal when a Buy position is closed | New Sell order, State FILLED, new Order No. Its deal has Type "Out" and P/L. Order row P/L is "--". Positions History row (opening Order No.) has the same P/L as the deal. | P1 | Ready |
| TC-7.03 | should record a canceled pending order with no deals | State CANCELED, Volume "0.1 / 0", no expand arrow, Fill Policy "Return". Automated with scope 3 (needs the pending order flow). | P1 | Ready |
| TC-7.04 | should show the same Sell market order details across records | Mirror of TC-7.01 and TC-7.02 for Sell. | P2 | Ready |
| TC-7.05 | should timestamp records close to Server Time | Open Date in format YYYY-MM-DD HH:mm:ss, within a small window of Server Time at placement. | P2 | Ready |
| TC-7.06 | should record a partial close consistently across records | New Sell order 0.1 with one "Out" deal. Same Order No. stays open with 0.1. Positions History row for that Order No. shows Volume "0.1 / 0.2" (closed / opened) and the deal P/L. | P2 | Ready |

---

## Summary

| Scope | Cases | P1 | P2 | Blocked |
|---|---|---|---|---|
| 1 Market orders with SL/TP | 9 | 6 | 3 | 0 |
| 2 One Click Trading | 5 | 2 | 3 | 0 |
| 3 Pending orders | 12 | 6 | 6 | 0 |
| 4 Open positions | 5 | 4 | 1 | 0 |
| 5 Bulk close / delete | 5 | 3 | 2 | 1 |
| 6 Notifications and history | 6 | 2 | 4 | 0 |
| 7 Cross-record verification | 6 | 3 | 3 | 0 |
| **Total** | **48** | **26** | **22** | **1** |

## Open questions

These come from CLAUDE.md. Blocked cases stay in the list so the gap is visible; they are
automated once the answer is verified manually.

| # | Question | Blocks |
|---|---|---|
| Q1 | Answered: the opening deal has Type "In" and P/L "0.00". | None |
| Q2 | What the deal Comment ("wt\|oc:...") contains and whether it links to a position. Seen so far: the position comment "wt\|o:CODE-D" and its closing deal "wt\|oc:CODE-DD" share the same code. Not relied on; tests match by Order No. | None |
| Q3 | Answered: no Position ID. The row uses the opening order's Order No. | None |
| Q4 | Answered: the remaining position keeps its Order No. The closed part is a new closing order plus a Positions History row with Volume "closed / opened". | None |
| Q5 | Answered: partial close is the volume field in the Close dialog. | None |
| Q6 | Answered: Good Till Canceled, Good Till Day, Specified Date, Specified Date and Time. | None |
| Q7 | Which Order State values exist besides FILLED and CANCELED? | None |
| Q8 | Answered: yes, the opening order row shows its SL and TP. | None |
| Q9 | Partly seen: the Pending Orders tab shows "Bulk Delete" in place of "Bulk Close". Options to be checked in Phase 6. | TC-5.05 |
| Q10 | Answered: stored on the server (preference OCT_ENABLE), so it survives reloads and other browsers. Its terms say close/delete in the positions module also skip confirmation; Bulk Close not checked yet. | None |
| Q11 | Where are trading transactions listed besides Orders & Deals? | None |

## Out of scope

Username masking, appearance, market display, change password, linked devices.
