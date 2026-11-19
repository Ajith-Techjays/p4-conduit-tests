import { test, expect, APIRequestContext } from '@playwright/test';

type User = { token: string; username: string };

function uniqueId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function signUp(request: APIRequestContext): Promise<User> {
  const id = uniqueId();
  const response = await request.post('/api/users', {
    data: { user: { username: `cmt${id}`, email: `cmt${id}@example.in`, password: 'Passw0rd!2026' } },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return { token: json.user.token, username: json.user.username };
}

async function createArticle(request: APIRequestContext, user: User): Promise<string> {
  const response = await request.post('/api/articles', {
    headers: { Authorization: `Token ${user.token}` },
    data: {
      article: {
        title: `vada pav order ${uniqueId()}`,
        description: 'Order for ₹ 60, delivery to PIN 400001',
        body: 'Call +91 98765 43210 before delivery.',
      },
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).article.slug;
}

test.describe('Comments API', () => {
  let createdUser: User | undefined;

  test.afterEach(async ({ request }) => {
    if (!createdUser) return;
    const auth = { Authorization: `Token ${createdUser.token}` };
    const author = encodeURIComponent(createdUser.username);
    const list = await request.get(`/api/articles?author=${author}&limit=100`);
    expect(list.status()).toBe(200);
    for (const article of (await list.json()).articles) {
      const commentsResponse = await request.get(`/api/articles/${article.slug}/comments`);
      expect(commentsResponse.status()).toBe(200);
      for (const comment of (await commentsResponse.json()).comments) {
        if (comment.author.username !== createdUser.username) continue;
        const deleted = await request.delete(`/api/articles/${article.slug}/comments/${comment.id}`, { headers: auth });
        expect(deleted.status()).toBe(204);
      }
      const deleted = await request.delete(`/api/articles/${article.slug}`, { headers: auth });
      expect(deleted.status()).toBe(204);
    }
    const after = await request.get(`/api/articles?author=${author}`);
    expect((await after.json()).articlesCount).toBe(0);
    createdUser = undefined;
  });

  test('a new user posts a comment and it is saved', async ({ request }) => {
    const user = await signUp(request);
    createdUser = user;
    const slug = await createArticle(request, user);
    const commentText = `Delivered to PIN 560034, paid ₹ 60 ${uniqueId()}`;

    const posted = await request.post(`/api/articles/${slug}/comments`, {
      headers: { Authorization: `Token ${user.token}` },
      data: { comment: { body: commentText } },
    });
    expect(posted.status()).toBe(201);
    const { comment } = await posted.json();
    expect(comment.body).toBe(commentText);
    expect(comment.author.username).toBe(user.username);

    const list = await request.get(`/api/articles/${slug}/comments`);
    expect(list.status()).toBe(200);
    const { comments } = await list.json();
    expect(comments).toHaveLength(1);
    expect(comments[0].id).toBe(comment.id);
    expect(comments[0].body).toBe(commentText);
    expect(comments[0].author.username).toBe(user.username);
  });

  test('a comment with no token gets 401 and is not saved', async ({ request }) => {
    const user = await signUp(request);
    createdUser = user;
    const slug = await createArticle(request, user);

    const posted = await request.post(`/api/articles/${slug}/comments`, {
      data: { comment: { body: `No token comment, PIN 110001 ${uniqueId()}` } },
    });
    expect(posted.status()).toBe(401);
    expect(await posted.json()).toEqual({ errors: { token: ['is missing'] } });

    const list = await request.get(`/api/articles/${slug}/comments`);
    expect(list.status()).toBe(200);
    expect((await list.json()).comments).toEqual([]);
  });
});
