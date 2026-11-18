import { test, expect, APIRequestContext, Page } from '@playwright/test';

type User = { token: string; username: string };

function uniqueId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function signUp(request: APIRequestContext): Promise<User> {
  const id = uniqueId();
  const response = await request.post('/api/users', {
    data: { user: { username: `e2e${id}`, email: `e2e${id}@example.in`, password: 'Passw0rd!2026' } },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return { token: json.user.token, username: json.user.username };
}

async function giveTokenToPage(page: Page, user: User) {
  // The page reads the token from localStorage before its first render, so it must be there before page.goto.
  await page.addInitScript((token) => localStorage.setItem('jwtToken', token), user.token);
}

test.describe('Conduit end to end', () => {
  let createdUser: User | undefined;

  test.afterEach(async ({ request }) => {
    if (!createdUser) return;
    const auth = { Authorization: `Token ${createdUser.token}` };
    const author = encodeURIComponent(createdUser.username);
    const list = await request.get(`/api/articles?author=${author}&limit=100`);
    expect(list.status()).toBe(200);
    const { articles } = await list.json();
    for (const article of articles) {
      const commentsResponse = await request.get(`/api/articles/${article.slug}/comments`);
      expect(commentsResponse.status()).toBe(200);
      const { comments } = await commentsResponse.json();
      for (const comment of comments) {
        if (comment.author.username !== createdUser.username) continue;
        const deleted = await request.delete(`/api/articles/${article.slug}/comments/${comment.id}`, { headers: auth });
        expect(deleted.status()).toBe(204);
      }
      const deleted = await request.delete(`/api/articles/${article.slug}`, { headers: auth });
      expect(deleted.status()).toBe(204);
    }
    const after = await request.get(`/api/articles?author=${author}`);
    expect(after.status()).toBe(200);
    expect((await after.json()).articlesCount).toBe(0);
    createdUser = undefined;
  });

  test('a signed-in user publishes a new article in the editor', async ({ page, request }) => {
    const user = await signUp(request);
    createdUser = user;
    await giveTokenToPage(page, user);
    const id = uniqueId();
    const title = `masala dosa order ${id}`;
    const description = 'Order for ₹ 180, delivery to PIN 560001';
    const body = 'Call +91 98765 43210 before delivery.';

    await page.goto('/editor');
    await expect(page.getByRole('link', { name: user.username })).toHaveText(user.username);
    await page.getByRole('textbox', { name: 'Title' }).fill(title);
    await page.getByRole('textbox', { name: "What's this article about?" }).fill(description);
    await page.getByRole('textbox', { name: 'Write your article' }).fill(body);
    await page.getByRole('textbox', { name: 'Tags' }).fill('food, delivery');
    await page.getByRole('button', { name: 'Publish Article' }).click();

    await page.waitForURL(/\/article\//);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    const slug = decodeURIComponent(new URL(page.url()).pathname.split('/')[2]);

    const response = await request.get(`/api/articles/${slug}`);
    expect(response.status()).toBe(200);
    const { article } = await response.json();
    expect(article.title).toBe(title);
    expect(article.description).toBe(description);
    expect(article.body).toBe(body);
    expect(article.tagList).toEqual(['food', 'delivery']);
    expect(article.author.username).toBe(user.username);
  });

  test('a signed-in user posts a comment on an article', async ({ page, request }) => {
    const user = await signUp(request);
    createdUser = user;
    const id = uniqueId();
    const created = await request.post('/api/articles', {
      headers: { Authorization: `Token ${user.token}` },
      data: {
        article: {
          title: `idli breakfast order ${id}`,
          description: 'Order for ₹ 120, delivery to PIN 600001',
          body: 'Call +91 91234 56789 before delivery.',
          tagList: ['food'],
        },
      },
    });
    expect(created.status()).toBe(201);
    const { slug } = (await created.json()).article;
    await giveTokenToPage(page, user);
    const commentText = `Delivered to PIN 560034 on time, paid ₹ 120 ${id}`;

    await page.goto(`/article/${slug}`);
    await page.getByRole('textbox', { name: 'Write a comment' }).fill(commentText);
    await page.getByRole('button', { name: 'Post Comment' }).click();

    await expect(page.getByText(commentText, { exact: true })).toHaveText(commentText);

    const response = await request.get(`/api/articles/${slug}/comments`);
    expect(response.status()).toBe(200);
    const { comments } = await response.json();
    expect(comments).toHaveLength(1);
    expect(comments[0].body).toBe(commentText);
    expect(comments[0].author.username).toBe(user.username);
  });
});
