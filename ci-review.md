# My CI workflow and review (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you saw and decided.

Repository: the P4 folder · Workflow: `.github/workflows/playwright.yml` · Date: 2026-11-21

## 1. What my project needs
- **Node.js on my laptop (`node -v`):** v24.21.0
- **My whole suite on my laptop:** `npx playwright test` → 22 passed, 0 failed
- **What the GitHub computer needs (my words):**
  - Node.js: Node 24, the same as my laptop (v24.21.0). That also fits the app's rule of 22.13 or newer.
  - Packages: npm ci, because it installs exactly the versions in package-lock.json, the same ones my tests passed with.
  - Browser: Chromium only (from the example)

## 2. My prompt to Claude
```text
Task: Write a GitHub Actions workflow that runs this Playwright suite on every push and keeps the HTML report. My GitHub repository is the P4 folder, so save it as P4/.github/workflows/playwright.yml. After the file, write one line for each step: what it does.
Material: @P4/package.json @P4/playwright.config.ts @P4/README.md
Rules: Use actions/checkout@v6, actions/setup-node@v6 and actions/upload-artifact@v6. Do not run anything. Do not commit or push. Use Node 24, install packages with npm ci, and install only Chromium with npx playwright install --with-deps chromium.
```

## 3. What Claude's workflow got wrong for my project
- **Claude's workflow:** my rule asked for Node 24, so Claude's `Set up Node.js` step already had `node-version: 24`. In another test, with no Node.js rule, Claude wrote `node-version: 22`.
- **Claude said:** (in that other test) "ASSUMPTION: `node-version: 22` gets the newest Node 22, which is 22.13 or later. You could use 24 instead. Nothing in the material asks for a specific version."
- **My project needs:** Node 24, the same as my laptop (v24.21.0). That also fits the app's rule of 22.13 or newer.
- **My answer to the developer:** Not yet. Claude picked Node 22 as a guess, it even marked it as an assumption. 22 is allowed by package.json, but our tests were proven on Node 24, so I'd change it to 24 before merging.
- **My line to Claude:** In @P4/.github/workflows/playwright.yml, add a comment above line 17 saying Node 24 is used because the suite was proven green on my laptop with v24.21.0. Change nothing else. Do not run anything.

## 4. My reading of the workflow
- **When, where, the code and Node.js (lines 1–18):** Lines 3–4 run it on every push, to any branch. Line 8 runs it on a fresh Linux computer at GitHub. Lines 11–12 copy the code onto that computer. Lines 14–18 install Node 24, with the comment on line 17 explaining why it's 24.
- **Packages, browser, tests and the report (lines 19–35):** Lines 20–21 install the exact package versions from package-lock.json. Lines 23–24 install only Chromium, plus what Linux needs to run it. Lines 26–27 run the tests. Lines 29–35 save the HTML report as a download called playwright-report for 30 days, and it runs even if the tests fail, just not if the run is cancelled.

## 5. The first run on GitHub
- **Run:** Add the CI workflow · **Result:** … · **Tests:** …
- **The report (artifact):** …

## 6. A red run on purpose
- **The change:** `tests/example.spec.ts` line 6, `toBe(200)` → `toBe(201)`
- **My prediction:** …
- **What GitHub showed:** …

## 7. Fixed, and green again
- **The fix:** line 6 back to `toBe(200)` · **Run:** Fix the expected status · **Result:** …

## 8. Review notes for my other AI-written tests (written while CI ran)
The API checklist: status · body · shape · negative cases (a refused request changes nothing) · own test data.
Monday's and Tuesday's tests that I did not review in depth on those days. Each one: kept, changed or removed, and why.

### Monday: `tests/api.spec.ts`
- "…": **kept / changed / removed**, because …

### Tuesday: `tests/contract.spec.ts`
- "…": **kept / changed / removed**, because …
