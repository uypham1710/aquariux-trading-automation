# Aquariux Trading Automation

End-to-end UI tests for the Aquariux web trading platform (`/web/trade`, demo account),
written with Playwright and TypeScript for the QA Automation technical assessment.

## Prerequisites

- Node.js (developed with v24) and npm.
- A demo account for https://aqxtrader.aquariux.com.
- Network access to the Aquariux domains. From Vietnam this needs a VPN; see
  [docs/assumptions-limitations.md](docs/assumptions-limitations.md).
- The market for the test symbol (XAUUSD) must be open for the trading tests to run.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Fill in `.env`:

| Variable | Meaning |
|---|---|
| `BASE_URL` | App URL, e.g. `https://aqxtrader.aquariux.com` |
| `DEMO_USERNAME` | Demo account login |
| `DEMO_PASSWORD` | Demo account password |

`.env` and `.auth/` (the saved login session) are gitignored. A missing variable stops the run
with a message naming it (`utils/env.ts`).

## Running the tests

| Command | What it runs |
|---|---|
| `npm test` | All tests |
| `npm run test:smoke` | Tests tagged `@smoke` |
| `npm run test:regression` | Tests tagged `@regression` |
| `npm run test:headed` | All tests with a visible browser |
| `npm run report` | Opens the last HTML report |
| `npm run typecheck` | TypeScript check, no tests |

A single file or test: `npx playwright test tests/positions.spec.ts` or
`npx playwright test -g "TC-4.02"`.

The `setup` project logs in once (`tests/auth.setup.ts`) and saves the session to
`.auth/user.json`. Every other test reuses it, so the login page is not opened per test.

Reports: HTML report in `playwright-report/`. On failure a screenshot and a trace are kept in
`test-results/`; open a trace with `npx playwright show-trace <path-to-trace.zip>`.

Before running, make sure nobody else is running the suite on the same account (see
"Shared account" below).

## Project structure

```
pages/        Full pages: LoginPage, TradePage
components/   Parts of the trade page: order panel, tables, dialogs, menus, toasts
fixtures/     trading.ts: page-object fixtures, cleanup trackers, custom matcher
data/         Instruments, order distances, expected UI messages
utils/        Env, number parsing, price maths, server date parsing, Order No. lookup
tests/        One spec file per scope, plus login setup and a smoke check
docs/         Test cases, assumptions and limitations
```

## Scope to file mapping

Test titles start with the test case ID (`TC-<scope>.<number>`). The full list of cases, with
expected results, priorities and open questions, is in [docs/test-cases.md](docs/test-cases.md).

| Scope | Spec file | Cases |
|---|---|---|
| 1 Market orders with SL/TP | `tests/market-orders.spec.ts` | TC-1.01 to 1.09 |
| 2 Market orders with One Click Trading | `tests/one-click-trading.spec.ts` | TC-2.01 to 2.05 |
| 3 Pending orders and expiry options | `tests/pending-orders.spec.ts` | TC-3.01 to 3.12 |
| 4 View, modify, partially close, close positions | `tests/positions.spec.ts` | TC-4.01 to 4.05 |
| 5 Bulk close / bulk delete | `tests/bulk-actions.spec.ts` | TC-5.01 to 5.05 |
| 6 Transactions, notifications, history | `tests/notifications-history.spec.ts` | TC-6.01 to 6.06 |
| 7 Cross-record verification | `tests/cross-records.spec.ts` | TC-7.01 to 7.06 |
| Login and page load | `tests/auth.setup.ts`, `tests/smoke.spec.ts` | - |

TC-7.03 (canceled pending order in Orders & Deals) lives in the cross-records spec but uses the
pending order flow from scope 3.

## Design decisions

**Simple page objects.** One class per page or component, no base class. Locators are
`readonly` properties, mostly `getByTestId` because the app exposes stable `data-testid`
attributes. Methods are business actions (`placeMarketOrder`, `closeVolume`) and return typed
data (`PositionRecord`, `OrderRecord` with a `deals` array). Assertions are only in spec files.

**Shared account, so every test cleans up.** All tests use one demo account. The fixtures
`openPosition` and `placePendingOrder` record the Order No. of everything a test creates.
After the test, even when it failed, `trackedPositions` and `trackedPendingOrders` reload the
page and close or delete each item one by one by Order No. Bulk Close is never used for cleanup
because it is a feature under test.

**Orders are tracked by Order No., never by row position.** History tables hold data from
earlier runs. A new Order No. is found by reading the table before and after the action and
taking the number that was not there before (`utils/orders.ts`).

**Prices are never hard-coded.** SL, TP and pending prices are computed from the Ask/Bid shown
at runtime (`utils/prices.ts`). Pending orders are placed about 5% away from the market so they
do not fill during the test. Fill prices and P/L are compared with
`expect(...).toBeWithinTolerance(expected, tolerance)`, because prices move between reading
and filling.

**Numbers are parsed in one place.** The UI shows thousand separators and `--` for empty
values; `utils/numbers.ts` handles both before any comparison.

**One worker.** Tests run one at a time (`workers: 1`) because they share the account and the
tables. Parallel tests would see each other's orders.

**Timeouts are tuned for the VPN**, not for flakiness. Every value in `playwright.config.ts` has
a comment. There is no `waitForTimeout`; tests rely on auto-waiting, web-first assertions and
`expect.poll` where the server needs a few seconds to show a new row.

**One Click Trading is OFF by default.** The setting is stored on the server, so a test that
switches it ON uses the `oneClickTrading` fixture, which switches it OFF again afterwards. That
fixture is torn down before the cleanup trackers, because cleanup expects the confirmation
dialogs.

**Toasts are checked right after the action.** They disappear quickly. The tables and the bell
list are the stable source of truth for later checks.

**Environment problems skip, they do not fail.** When the market is closed the order button
shows "Market Closed"; the affected specs read that and skip with the reason. Bulk Close /
Bulk Delete tests skip when the account holds positions or orders the test did not create,
because a bulk action would close or delete them too.

## Shared account

- Run one suite at a time per account. `workers: 1` only protects tests inside one run; a second
  run on the same account can create orders that the first run mistakes for its own.
- If a run is killed (Ctrl+C, crash), fixture teardown may not run. Check Open Positions and
  Pending Orders afterwards and close what is left, and check that One Click Trading is OFF.

## Verification status

Run against the live demo account over the VPN:

| Scope | Status |
|---|---|
| 1, 4 | Passing |
| 2 | TC-2.05 passing. TC-2.01 to 2.04 written, not run yet (market closed). |
| 3 | Passing except TC-3.01, 3.05, 3.10 and TC-3.12, which failed only because of a cleanup bug that has since been fixed; re-run pending. |
| 5 | Written, not run (market closed). Menu option labels and the confirmation dialog still carry `TODO(locator)` in `components/BulkActionsMenu.ts`. |
| 6, 7 | Passing |

## Limitations and future improvements

Limitations are listed in [docs/assumptions-limitations.md](docs/assumptions-limitations.md).

Possible next steps:

- Create and clean up test data through the trading API instead of the UI, so setup is faster
  and cleanup does not depend on the UI state.
- Add a global teardown that finds and removes anything the suite left behind (for example by
  marking orders with a comment), to cover the case where an Order No. was never captured.
- Apply the market-closed skip to every trading spec, not only scopes 1, 4 and 5.
- Run the main scopes for more than one instrument (e.g. an FX pair from `data/instruments.ts`).
- Run in CI with credentials from secrets, a dedicated demo account per pipeline, and a
  schedule inside market hours.
