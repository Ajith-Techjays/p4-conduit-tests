// spec: specs/profile-follow.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Profile page and follow', () => {
  let token: string | undefined;

  const authHeaders = () => ({ Authorization: `Token ${token}` });

  test.afterEach(async ({ request }) => {
    if (!token) return;
    const unfollow = await request.delete('/api/profiles/practice-author/follow', { headers: authHeaders() });
    expect(unfollow.status()).toBe(200);
    const check = await request.get('/api/profiles/practice-author', { headers: authHeaders() });
    expect((await check.json()).profile.following).toBe(false);
    token = undefined;
  });

  test('a new reader follows practice-author, API confirms, clean-up', async ({ page, request }) => {
    // 1. Sign up a new reader by API, then sign in on the page
    const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `reader${id}@example.in`;
    const password = 'Passw0rd!2026';
    const signUp = await request.post('/api/users', {
      data: { user: { username: `reader${id}`, email, password } },
    });
    expect(signUp.status()).toBe(201);
    token = (await signUp.json()).user.token;

    const before = await request.get('/api/profiles/practice-author', { headers: authHeaders() });
    expect(before.status()).toBe(200);
    expect((await before.json()).profile.following).toBe(false);

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/$/);

    // 2. Open /profile/practice-author
    await page.goto('/profile/practice-author');
    await expect(page.getByRole('button', { name: 'Follow practice-author', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unfollow practice-author', exact: true })).toHaveCount(0);

    // 3. Click Follow
    await page.getByRole('button', { name: 'Follow practice-author', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Unfollow practice-author', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Follow practice-author', exact: true })).toHaveCount(0);

    // 4. API confirms
    const after = await request.get('/api/profiles/practice-author', { headers: authHeaders() });
    expect(after.status()).toBe(200);
    const body = await after.json();
    expect(body.profile.username).toBe('practice-author');
    expect(body.profile.following).toBe(true);
  });
});
