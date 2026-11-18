# My end-to-end tests and review (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you found and decided.

App: Conduit practice app · Test file: `P4/tests/e2e.spec.ts` · Date: 2026-11-18

## 1. My first look
- **After I published an article by hand, I would check:** I’d check the article page shows my exact title and body, and the URL has the article’s slug. Then I’d send a GET to /api/articles/<slug> and check it returns 200 with the same title, so I know it was really saved, not just shown on the screen.
- **Where the page keeps my sign-in:** localStorage, key `jwtToken`

## 2. Practice
- **Worked example (the like test):** it signs in through the form as a practice user, so other tests can change its data.
- **Does its check at the end prove the journey?** No. The heading was already there before the click, so it would pass even if the like didn’t work. It should check that the button now shows the like (like the count going up), or read the article with the API and check favorited is true and favoritesCount went up.

## 3. My prompt
```text
Task: Write 2 end-to-end tests in P4/tests/e2e.spec.ts. Test 1: a signed-in user publishes a new article in the editor. Test 2: a signed-in user posts a comment on an article. Make a new user with the API, give the page its token, do the journey in the page, and check the result with the API at the end. After the file, write one line per test: what it checks.
Material: @P4/API.md @P4/app/public/app.js app.js is the page's code: take the labels and button names from it. The page keeps the sign-in token in localStorage, key jwtToken.
Rules: Use app.js only for the labels and button names. Do not change the app. Do not run the tests. At the end, read the saved data with the API and check the exact values you typed, like the article title and body or the comment text.
```

## 4. The run
- **Claude's 2 tests:** 2 passed, 0 failed

## 5. The teammate's question
- **Claude said:** "Each test makes its own new user with `POST /api/users` and puts the token in localStorage under `jwtToken` before the page opens." At the end: "I added no teardown. Each run leaves behind a new user, an article, and in test 2 a comment."
- **My answer:** No. Each run leaves behind a new user, an article, and a comment from test 2, because there’s no clean-up. Making its own data keeps the tests apart, but the data stays in the app and keeps piling up every run.

## 6. What I saw on the home page
- idli breakfast order 1794983137404466 ,masala dosa order 1794983136724695

## 7. My change
- **My line to Claude:** In @P4/tests/e2e.spec.ts, both tests leave behind a new user, an article, and a comment from test 2. Delete it in test.afterEach, so it runs even when a check fails. Do not run the tests.
- **The clean-up Claude added:** `test.afterEach` finds the test user's articles, deletes their comments and the articles, then checks the user has 0 articles.

## 8. Proof
- **Each test twice, on an app that keeps its data:** `npx playwright test tests/e2e.spec.ts --repeat-each=2` → 4 passed, 0 failed
- **The newest article on the home page after the run:** Your first end-to-end test
