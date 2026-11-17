import { test, expect, APIRequestContext } from '@playwright/test';

const USER_KEYS = ['bio', 'email', 'image', 'token', 'username'];
const ARTICLE_KEYS = [
  'author',
  'body',
  'createdAt',
  'description',
  'favorited',
  'favoritesCount',
  'slug',
  'tagList',
  'title',
  'updatedAt',
];
const PROFILE_KEYS = ['bio', 'following', 'image', 'username'];

async function signUp(request: APIRequestContext, name: string) {
  const unique = `${name}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const response = await request.post('/api/users', {
    data: {
      user: {
        username: unique,
        email: `${unique}@example.in`,
        password: 'Password@123',
      },
    },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return json.user as { username: string; email: string; token: string };
}

async function createArticle(request: APIRequestContext, token: string, title: string) {
  const response = await request.post('/api/articles', {
    headers: { Authorization: `Token ${token}` },
    data: {
      article: {
        title,
        description: 'Contract check article',
        body: 'Price ₹499, call +91 98765 43210, PIN 560001.',
        tagList: ['testing'],
      },
    },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return json.article as { slug: string; title: string };
}

test.describe('schema', () => {
  test('GET /api/articles/:slug answers with the Article shape', async ({ request }) => {
    const author = await signUp(request, 'schema-author');
    const created = await createArticle(request, author.token, `Schema article ${Date.now()}`);

    const response = await request.get(`/api/articles/${created.slug}`);

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(Object.keys(json)).toEqual(['article']);
    expect(json).toMatchObject({
      article: {
        slug: created.slug,
        title: created.title,
        description: expect.any(String),
        body: expect.any(String),
        tagList: expect.any(Array),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        favorited: expect.any(Boolean),
        favoritesCount: expect.any(Number),
        author: {
          username: author.username,
          bio: null,
          image: null,
          following: expect.any(Boolean),
        },
      },
    });
    expect(Object.keys(json.article).sort()).toEqual(ARTICLE_KEYS);
    expect(Object.keys(json.article.author).sort()).toEqual(PROFILE_KEYS);
  });

  test('GET /api/user answers with the User shape', async ({ request }) => {
    const user = await signUp(request, 'schema-user');

    const response = await request.get('/api/user', {
      headers: { Authorization: `Token ${user.token}` },
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(Object.keys(json)).toEqual(['user']);
    expect(json).toMatchObject({
      user: {
        email: user.email,
        token: expect.any(String),
        username: user.username,
        bio: null,
        image: null,
      },
    });
    expect(Object.keys(json.user).sort()).toEqual(USER_KEYS);
  });
});

test.describe('auth', () => {
  test('GET /api/user without a token gives 401 "is missing"', async ({ request }) => {
    const response = await request.get('/api/user');

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ errors: { token: ['is missing'] } });
  });

  test('GET /api/user with a wrong token gives 401 "is invalid"', async ({ request }) => {
    const response = await request.get('/api/user', {
      headers: { Authorization: 'Token not-a-real-token' },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ errors: { token: ['is invalid'] } });
  });

  test("PUT on someone else's article gives 403 and changes nothing", async ({ request }) => {
    const author = await signUp(request, 'owner');
    const other = await signUp(request, 'intruder');
    const created = await createArticle(request, author.token, `Owned article ${Date.now()}`);

    const response = await request.put(`/api/articles/${created.slug}`, {
      headers: { Authorization: `Token ${other.token}` },
      data: { article: { title: 'Changed by someone else' } },
    });

    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ errors: { article: ['forbidden'] } });

    const after = await request.get(`/api/articles/${created.slug}`);
    expect(after.status()).toBe(200);
    expect((await after.json()).article.title).toBe(created.title);
  });
});
