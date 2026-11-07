# Assumptions and limitations

## Environment

The Aquariux domains are not reachable from my location (Vietnam) without a VPN. All manual exploration and local test runs were done over a VPN, which adds latency; timeouts were tuned accordingly. 

Market hours are an environment precondition. When the market for the test symbol is closed (weekends, holidays), the order button shows "Market Closed"; the market order and open position tests read that state from the UI and are reported as skipped with the reason, not failed. Smoke and login setup still run.

## Assumptions

- **One shared demo account.** All tests use the account from `.env`, which has $1,000,000 of
  virtual funds. Margin is never a limiting factor at the minimum volume.
- **XAUUSD is the test symbol.** Its specs (point 0.01, min volume 0.1, contract size 100) were
  checked in the app. The GBPCAD entry in `data/instruments.ts` is not used by any test, and its
  minimum volume is not verified.
- **Price tolerance.** Gold is assumed not to move more than 1.00 in the few seconds between
  reading the price and the fill. A fast market can break this and fail an entry-price check.
- **One Click Trading is OFF at the start of a run.** Only the `oneClickTrading` fixture
  switches it ON, and it switches it OFF again afterwards.
- **UI texts.** Expected toasts and validation messages in `data/messages.ts` were copied from the
  English UI. A different language or a reworded message fails the test.
- **Server Time.** The header "Server Time" and the record timestamps are in the same time zone
  and use the format `YYYY-MM-DD HH:mm:ss`. Date checks use Server Time, not the local clock.

## Limitations

### Market hours

- Only scopes 1, 4 and 5 skip when the market is closed. Scopes 2, 3, 6 and 7 do not check this
  yet, so they fail on a closed market instead of skipping.
- A pending order cannot be edited or deleted while the market is closed (its buttons are
  disabled). A test that fails close to the market close can therefore leave an order behind.

### Shared account and cleanup

- **Cleanup only covers what was tracked.** An item is tracked once its Order No. is read from the
  table. If the order is placed but the new number never appears (for example the server is
  slow beyond the 30 s poll), the test fails and that position or order is not cleaned up.
- **Concurrent runs.** `workers: 1` serialises tests inside one run only. A second run on the same
  account can create an order between the "before" and "after" reads, and the first run may
  pick up that Order No. as its own.
- **Killed runs.** If the process is stopped, teardown does not run: positions, pending orders
  and the One Click Trading setting must be checked by hand.


### Other

- Tests run in Chromium only.
- Toasts disappear quickly. A toast check can fail on a slow machine even though the order was
  placed; later checks use the tables instead.
- Out of scope: username masking, appearance, market display, change password, linked devices.
