# Tests from Playwright's agents, and my review (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you saw and decided.

App: Conduit practice app on my laptop · Date: 2026-11-19

## 1. How I set up the agents
- **Command:** `npx playwright init-agents --loop=claude` (TESTS terminal, in `P4`)
- **What it made:** `.claude/agents/playwright-test-planner.md`, `.claude/agents/playwright-test-generator.md`, `.claude/agents/playwright-test-healer.md`, `.mcp.json`, `specs/README.md`, `tests/seed.spec.ts`
- **Browser hidden:** `"--headless"` added to `P4/.mcp.json`: yes
- **Where I started Claude for the agents:** in `P4`, because Claude finds the agents and their browser only there

## 2. What I asked the agents
- **Area:** the profile page and following an author
- **My prompt** (`P4/prompts/agents.md`):
  - Task: First use the playwright-test-planner agent to plan tests for the profile page and following an author. Save the plan as specs/profile-follow.md. Then use the playwright-test-generator agent to write one test for each scenario in the plan, in the folder tests/profile-follow/.
  - Material: Start on the page /profile/practice-author. For steps that need a signed-in user, use a practice user from README.md.
  - Rules: Plan at most 2 short scenarios, with at most 5 steps each. Do not change any other test file. Do not run the test suite. After following an author, check with the API that the profile shows following: true, not only that the button text changed.
- **The plan the planner saved:** `specs/profile-follow.md` (2 scenarios: "Guest sees the profile and has no follow control"; "practice-reader follows practice-author, API confirms, clean-up")
- **The test files the generator wrote:** `tests/profile-follow/guest-profile.spec.ts`, `tests/profile-follow/reader-follow.spec.ts`
- `tests/seed.spec.ts` is the agents' start file. It checks nothing about the app, so it is not reviewed here.

## 3. My review of every generated test
- **The teammate's question:** "Claude says it puts back the follow state it found at the start. So we can keep this test in our suite as it is, right?"
- **My answer:** Not as it is. It uses the shared practice-reader user, and other tests use that user too, so if they run at the same time they can change its follow state and make this test flaky. The clean-up helps, but it’d be better if the test made its own new user with the API, like our other tests.
- "practice-reader follows practice-author, API confirms, clean-up" · **changed**, because it checks something useful, the follow with the API, but it uses the shared practice-reader user. It should sign up its own new user with the API instead.
- "Guest sees the profile and has no follow control" · **changed**, because it does check what its title says (lines 22–23, no follow buttons for a guest), which is useful. But line 17 expects exactly 7 articles from the shared practice-author, so it breaks as soon as anyone adds or deletes an article there. It should make its own author with the API, or drop the count. A few checks also just use toBeVisible() where toHaveText would be stronger, like the bio on line 11.

## 4. What I asked Claude to change, and the result
- **My change** (the Changes line of `P4/prompts/stronger.md`): In @P4/tests/profile-follow/reader-follow.spec.ts: Changed. It checks something useful, the follow with the API, but it uses the shared practice-reader user. It should sign up its own new user with the API instead. In @P4/tests/profile-follow/guest-profile.spec.ts: Changed. It does check what its title says (lines 22–23, no follow buttons for a guest), which is useful. But line 17 expects exactly 7 articles from the shared practice-author, so it breaks as soon as anyone adds or deletes an article there. It should make its own author with the API, or drop the count. A few checks also just use toBeVisible() where toHaveText would be stronger, like the bio on line 11.
- **Result:** No fault: 22 passed, 0 failed (my second fault run)
