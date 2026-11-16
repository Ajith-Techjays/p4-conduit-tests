# API review: Claude's first API tests (week 4, project P4)

The coach fills this in from your answers. Check that every line is what you decided and what you saw.

- **App:** Conduit, the practice app on your own laptop (`http://127.0.0.1:3000`)
- **API description:** `P4/API.md`
- **Test file:** `P4/tests/api.spec.ts`, written by Claude
- **Prompt file:** `P4/prompts/api.md`

## 1. My first look, by hand
The request my comment sent in the app, and the status that came back.
- get method 200 ok status

## 2. My predictions and the real answers
One line per request: what I predicted, and what the app really answered.
- **A** (a comment, with the token): I predicted 201, with the comment body “Clear and useful.” The app answered 201, `{"comment":{"id":5, ..., "body":"Clear and useful.","author":{"username":"practice-reader", ...}}}`
- **B** (the same comment, with no token): I predicted 401, errors: token is missing. The app answered 401, `{"errors":{"token":["is missing"]}}`
- **C** (a comment on an article that does not exist): I predicted 404, errors: article not found. The app answered 404, `{"errors":{"article":["not found"]}}`

Nothing really surprised me, but I was least sure about C. I wasn’t sure if the app would check the token first or the article first. Since the token was fine, it moved on, found no article, and gave 404.

## 3. My prompt to Claude
```text
Task: Write at least 6 Playwright API tests for articles in the Conduit API: create, read, change and delete an article. At least 3 positive and at least 3 negative tests. Save them in P4/tests/api.spec.ts. After the file, write one line per test: what it checks.
Material: @P4/API.md @P4/tests/example.spec.ts Send requests with the request fixture, like this example.
Rules: Write the tests from API.md only. Do not read the app's code in P4/app. Do not run the tests. Check the exact status and the important fields in the body, like the title or the error message, not just that the request worked.
```

## 4. The run
- **Result:** 8 passed, 1 failed (9 tests).
- **A red test, and who is wrong** (only if a test failed): "the author can change the title, and fields not sent stay the same". Expected tagList `["food", "delivery"]`, Received `[]`. API.md says: "Updating: every field is optional. A field you do not send stays as it was." My answer: The app is wrong. API.md says a field you don’t send stays as it was, and the test only sent a new title. So the tags should still be food and delivery, but the app wiped them. The test is right, so we keep it and report a bug.
- **My note** (only if I kept a red test with `test.fail()`): When only the title is changed, the app removes all the tags, but API.md says fields not sent should stay the same.

## 5. The developer's question
The test I looked at, and my answer to: "So the app saved nothing, right?"
- **Test:** "creating an article without a title returns 422 "can't be blank""
- **My answer:** Not really. The test only checks the answer, not what’s saved. The app could still have saved the article and just sent back the error. To be sure, the test should also read the author’s articles afterwards and check there’s no new one.

## 6. Tests I reviewed with the API checklist
The API checklist: status · body · shape · negative cases (a refused request changes nothing) · own test data.

### "creating an article returns 201 and the article as sent"
- **My decision:** Keep it, but add one thing. It checks the exact status, exact values and makes its own user, which is good. But it doesn’t read the article again with a GET, so it only proves what the app said, not that it really saved it. I’d add a GET on the new slug and check the title is there.

## 7. My API rules
The rules I added to my `playwright-quality` skill, under `## API rules`:
1. Check the exact status from API.md and the exact values in the body, not just that a field is there.
2. After any request that creates, changes or deletes data, read it again with a GET and check the change really happened.
3. After a request the app refuses, read the data again with a GET and check nothing was saved or changed.
