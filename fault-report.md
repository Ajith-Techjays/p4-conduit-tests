# My practice fault report (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you saw and decided.

App: Conduit practice app on my laptop · Practice faults: `P4/faults/practice.json` (F1 to F6) · Date: 2026-11-19
**How to read it:** a "detect" fault is **caught** when at least one test that passed with no fault fails with it, and **missed** when every test still passes. A "robust" fault (the app is only slower) should **stay green**; if tests fail, it **went red**.

## 1. My guess this morning
- **The developer asked:** "Your suite is green. How many real problems would it catch?"
- **My answer:** Honestly, I don’t know just from it being green. Green only shows the tests pass, not what they’d catch. My guess is it’d catch some but not all. To find out, I’d turn on the practice faults one at a time, like F2, and see which ones make a test go red

## 2. Before: my suite against the practice faults
- **Command:** `node materials/faults-run.mjs` (TESTS terminal, in `P4`, with no app running)
- **My test files:** `api.spec.ts`, `contract.spec.ts`, `e2e.spec.ts`, `example.spec.ts`, `profile-follow/guest-profile.spec.ts`, `profile-follow/reader-follow.spec.ts`, `seed.spec.ts`
- **No fault:** 20 passed, 0 failed
- **F1:** caught (7 tests failed)
- **F2:** caught (3 tests failed)
- **F3:** caught (5 tests failed)
- **F4:** caught (1 test failed: e2e.spec.ts › a signed-in user posts a comment on an article)
- **F5:** stayed green
- **F6:** caught (1 test failed: e2e.spec.ts › a signed-in user posts a comment on an article)

## 3. The weak spot I chose, and why
Comments are the weakest part. F4 and F6 were each caught by just one test, the e2e comment test, so if that test breaks, nothing catches them. A good suite should also catch F4 (empty comments list) with an API test that posts a comment and reads the list back.

## 4. How I made the suite stronger
- **My request for Claude** (the New tests line of `P4/prompts/stronger.md`): Only one test checks comments. Write P4/tests/comments.spec.ts with 2 API tests, each making its own user and article: a new user posts a comment, the answer is 201 with the exact comment text, and a GET of the comments list shows that same comment; and a comment posted with no token gets 401, and a GET of the comments list shows nothing was saved.
- **New or changed test file:** `tests/comments.spec.ts` (new); `tests/profile-follow/reader-follow.spec.ts` and `tests/profile-follow/guest-profile.spec.ts` (changed)

## 5. After: the run again
- **Command:** `node materials/faults-run.mjs F4 F6`
- **No fault:** 22 passed, 0 failed
- **The fault I chose:** F4: caught (2 tests failed). F6: caught (3 tests failed).

## 6. What changed
Now I can actually answer. I switched on the practice faults one at a time, and every wrong answer made at least one test go red. Comments were the weak spot, caught by only one test, so I added 2 API tests. Now F4 is caught by 2 tests and F6 by 3, and the suite is still green with no fault: 22 passed.
