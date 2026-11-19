# Profile page and follow author

## Application Overview

Conduit practice app at http://127.0.0.1:3000. Page under test: /profile/practice-author. Seen in the live app on 2026-11-19. Guest page: h1 "practice-author", bio "I write about testing and quality.", nav "Profile articles" with links "My Articles" and "Favorited Articles", 7 articles (first: "Your first end-to-end test"; last: "How to write a good bug report"). A guest sees NO follow button and no button at all in main. Signed in as practice-reader (email practice-reader@example.com, password Practice123, README.md), the page shows button "Unfollow practice-author" at the start, because practice-reader follows practice-author by seed. After a click it becomes button "Follow practice-author", and back. The visible text equals the accessible name. Sign-in form: textbox "Email", textbox "Password", button "Sign in"; after sign-in the app goes to / . Locators: role + name only. No getByTestId was needed. ASSUMPTION: the token is in the response of POST /api/users/login as user.token (API.md). The seed leaves practice-reader following practice-author. Scenario 1.2 records the start state and its clean-up puts that state back, so other tests see the same data as before. QUESTION for product owner: should the page show a sign-in prompt for guests instead of nothing?

## Test Scenarios

### 1. Profile page and follow

**Seed:** `tests/seed.spec.ts`

#### 1.1. Guest sees the profile and has no follow control

**File:** `tests/profile-follow/guest-profile.spec.ts`

**Steps:**
  1. Signed out (fresh browser). Open /profile/practice-author.
    - expect: Page title is 'practice-author | Conduit'.
    - expect: Heading level 1 'practice-author' is visible.
    - expect: Bio text 'I write about testing and quality.' is visible.
  2. Check the article list and the profile nav.
    - expect: Links 'My Articles' and 'Favorited Articles' are visible in navigation 'Profile articles'.
    - expect: Seven article headings (level 2) show, including 'Your first end-to-end test' and 'How to write a good bug report'.
  3. Look for getByRole('button', { name: 'Follow practice-author' }) and getByRole('button', { name: 'Unfollow practice-author' }).
    - expect: Neither button is present (count 0). Anchor: the same check finds 'Unfollow practice-author' for practice-reader in scenario 2.
  4. Check the nav bar.
    - expect: Links 'Sign in' (/login) and 'Sign up' (/register) are visible.
  5. API check for a guest: GET /api/profiles/practice-author with no Authorization header. No clean-up needed: nothing was changed, so practice-reader state stays as it was.
    - expect: Status 200. profile.username is 'practice-author'. profile.following is false.

#### 1.2. practice-reader follows practice-author, API confirms, clean-up

**File:** `tests/profile-follow/reader-follow.spec.ts`

**Steps:**
  1. Set up by API: POST /api/users/login with {"user":{"email":"practice-reader@example.com","password":"Practice123"}}, keep user.token. GET /api/profiles/practice-author with the token and keep profile.following as the start state. Then DELETE /api/profiles/practice-author/follow with header 'Authorization: Token <token>', so the start state is not following. Sign in in the browser: fill textbox 'Email' and textbox 'Password', click button 'Sign in'.
    - expect: Login status 200. DELETE status 200 and profile.following false. Browser lands on / .
  2. Open /profile/practice-author.
    - expect: Button 'Follow practice-author' is visible. Button 'Unfollow practice-author' is not present.
  3. Click button 'Follow practice-author'.
    - expect: Button 'Unfollow practice-author' becomes visible (text and name are the same). Button 'Follow practice-author' is gone.
  4. GET http://127.0.0.1:3000/api/profiles/practice-author with header 'Authorization: Token <practice-reader token>'.
    - expect: Status 200. profile.username 'practice-author'. profile.following is true (not only the button text).
  5. Clean-up (in afterEach so it runs on failure): put back the start state. If the start state was following true, POST /api/profiles/practice-author/follow; if it was false, DELETE it. Then GET the profile again.
    - expect: profile.following equals the start state from step 1.
