# My schema, auth and contract checks (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you saw and decided.

App: Conduit practice app on my laptop · Date: 2026-11-17

## 1. My first look
How I would check that an article answer has the right shape: I’d check that the answer still has every key API.md lists, like slug, title, tagList and author, and that each one is the right type: text for title, a list for tagList, true/false for favorited, a number for favoritesCount, and an object for author.

## 2. Practice: the key list check
File: `P4/materials/contract-example.spec.ts` (the sign-up answer).
Three changes: `bio` is missing · a new field `password` is added · `token` becomes a number.
- **The toMatchObject check (worked example):** missing: passes · new field: passes · number: fails
- **The key list check (my answer):** missing: fails (bio is in its list) · new field: fails (password isn’t in its list) · number: passes (it only checks the names, not the type)

## 3. My prompt for Claude
```text
Task: Write Playwright API tests in P4/tests/contract.spec.ts. Schema checks: the answers of GET /api/articles/:slug and GET /api/user have the shape that API.md gives, checked with toMatchObject and expect.any. Auth tests: no token, a wrong token, and changing someone else's article. After the file, write one line per test: what it checks.
Material: @P4/API.md @P4/tests/example.spec.ts Send requests with the request fixture, like this example.
Rules: Write the tests from API.md only. Do not read the app's code in P4/app. Do not run the tests. In every schema test, also check the exact key list from API.md, so a missing or extra field fails the test.
```

## 4. Claude's tests and my run
- **Run:** `npx playwright test tests/contract.spec.ts` · **Result:** 5 passed, 0 failed
- **A red test, and who was wrong:** No test failed.

## 5. The teammate's question
- **Claude's test:** "GET /api/articles/:slug answers with the Article shape" (from another tester's run, checked with toMatchObject only)
- **Claude said:** "an anonymous reader gets 200 and the full Article shape."
- **My answer:** No, it stays green. toMatchObject only checks the fields it lists, so an extra field like password would slip through. It needs an exact key list check too, like Object.keys(json.article).sort() compared with the list from API.md.

## 6. My change
- **What I asked Claude:** "In every schema test, also check the exact key list from API.md, so a missing or extra field fails the test." (my rule in the prompt; my article test already has the key lists on lines 80 and 81, so no extra change was needed)
- **The run after it:** 5 passed, 0 failed

## 7. Proof: the contract test fails when the answer changes
- **My prediction before the run:** The article shape test will fail. One field is gone, so the key list on line 80 won’t match ARTICLE_KEYS, and if that field is also in the toMatchObject part, that fails too. The other tests should still pass, unless one of them also reads the article answer.
- **Run with the practice fault F2 on:** `$env:CONDUIT_FAULT = "F2"`, then `npx playwright test tests/contract.spec.ts` · **Result:** 4 passed, 1 failed ("GET /api/articles/:slug answers with the Article shape")
- **What Playwright showed:** `-     "body": Any<String>,` (at the toMatchObject on line 61)
- **My answer about a red test:** The body field is gone. You can see it because that line has a - in front of it, which means the test expected it but the answer didn’t have it.
- **Run with the fault off again:** `$env:CONDUIT_FAULT = ""`, then the same run · **Result:** 5 passed, 0 failed
