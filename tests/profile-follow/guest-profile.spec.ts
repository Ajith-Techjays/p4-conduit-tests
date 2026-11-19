// spec: specs/profile-follow.md
// seed: tests/seed.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Profile page and follow', () => {
  let author: { token: string; username: string } | undefined;

  test.afterEach(async ({ request }) => {
    if (!author) return;
    const auth = { Authorization: `Token ${author.token}` };
    const name = encodeURIComponent(author.username);
    const list = await request.get(`/api/articles?author=${name}&limit=100`);
    expect(list.status()).toBe(200);
    for (const article of (await list.json()).articles) {
      const deleted = await request.delete(`/api/articles/${article.slug}`, { headers: auth });
      expect(deleted.status()).toBe(204);
    }
    const after = await request.get(`/api/articles?author=${name}`);
    expect((await after.json()).articlesCount).toBe(0);
    author = undefined;
  });

  test('Guest sees the profile and has no follow control', async ({ page, request }) => {
    // 1. Set up by API: a new author with a bio and two articles.
    const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const signUp = await request.post('/api/users', {
      data: { user: { username: `author${id}`, email: `author${id}@example.in`, password: 'Passw0rd!2026' } },
    });
    expect(signUp.status()).toBe(201);
    const { token, username } = (await signUp.json()).user;
    author = { token, username };
    const auth = { Authorization: `Token ${token}` };

    const bio = `I test UPI payments of ₹ 499 in PIN 560001 ${id}`;
    const updated = await request.put('/api/user', { headers: auth, data: { user: { bio } } });
    expect(updated.status()).toBe(200);
    expect((await updated.json()).user.bio).toBe(bio);

    const titles = [`Paneer tikka order ${id}`, `Filter coffee order ${id}`];
    for (const title of titles) {
      const created = await request.post('/api/articles', {
        headers: auth,
        data: { article: { title, description: 'Order for ₹ 250', body: 'Call +91 98765 43210 before delivery.' } },
      });
      expect(created.status()).toBe(201);
    }

    // 2. Signed out (fresh browser). Open the author's profile.
    await page.goto(`/profile/${username}`);
    await expect(page).toHaveTitle(`${username} | Conduit`); // ASSUMPTION: same title pattern as practice-author's profile
    await expect(page.getByRole('heading', { level: 1, name: username })).toHaveText(username);
    await expect(page.getByText(bio, { exact: true })).toHaveText(bio);

    // 3. Check the article list and the profile nav.
    const profileNav = page.getByRole('navigation', { name: 'Profile articles' });
    await expect(profileNav.getByRole('link', { name: 'My Articles' })).toHaveText('My Articles');
    await expect(profileNav.getByRole('link', { name: 'Favorited Articles' })).toHaveText('Favorited Articles');
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(2);
    for (const title of titles) {
      await expect(page.getByRole('heading', { level: 2, name: title })).toHaveText(title);
    }

    // 4. Look for the Follow and Unfollow buttons.
    await expect(page.getByRole('button', { name: `Follow ${username}` })).toHaveCount(0);
    await expect(page.getByRole('button', { name: `Unfollow ${username}` })).toHaveCount(0);

    // 5. Check the nav bar.
    await expect(page.getByRole('link', { name: 'Sign in' })).toHaveText('Sign in');
    await expect(page.getByRole('link', { name: 'Sign up' })).toHaveText('Sign up');

    // 6. API check for a guest.
    const response = await request.get(`/api/profiles/${username}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.profile.username).toBe(username);
    expect(body.profile.bio).toBe(bio);
    expect(body.profile.following).toBe(false);
  });
});
