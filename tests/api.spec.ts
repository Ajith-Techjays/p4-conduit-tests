import { test, expect, APIRequestContext } from '@playwright/test';

type Author = { token: string; username: string };

function uniqueId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function signUp(request: APIRequestContext): Promise<Author> {
  const id = uniqueId();
  const response = await request.post('/api/users', {
    data: { user: { username: `tester${id}`, email: `tester${id}@example.in`, password: 'Passw0rd!2026' } },
  });
  expect(response.status()).toBe(201);
  const json = await response.json();
  return { token: json.user.token, username: json.user.username };
}

function articleData(id: string) {
  return {
    title: `paneer tikka order ${id}`,
    description: 'Order for ₹ 450, delivery to PIN 560001',
    body: 'Call +91 98765 43210 before delivery.',
    tagList: ['food', 'delivery'],
  };
}

async function createArticle(request: APIRequestContext, author: Author, data = articleData(uniqueId())) {
  const response = await request.post('/api/articles', {
    headers: { Authorization: `Token ${author.token}` },
    data: { article: data },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).article;
}

test.describe('Conduit articles API', () => {
  test('creating an article returns 201 and the article as sent', async ({ request }) => {
    const author = await signUp(request);
    const id = uniqueId();
    const data = articleData(id);

    const response = await request.post('/api/articles', {
      headers: { Authorization: `Token ${author.token}` },
      data: { article: data },
    });

    expect(response.status()).toBe(201);
    const { article } = await response.json();
    expect(article.title).toBe(data.title);
    expect(article.description).toBe(data.description);
    expect(article.body).toBe(data.body);
    expect(article.tagList).toEqual(['food', 'delivery']);
    // ASSUMPTION: the slug is the title in lower case with hyphens (API.md example: my-title).
    expect(article.slug).toBe(`paneer-tikka-order-${id}`);
    expect(article.favorited).toBe(false);
    expect(article.favoritesCount).toBe(0);
    expect(article.author.username).toBe(author.username);
  });

  test('reading an article by its slug returns 200 and the full article', async ({ request }) => {
    const author = await signUp(request);
    const created = await createArticle(request, author);

    const response = await request.get(`/api/articles/${created.slug}`);

    expect(response.status()).toBe(200);
    const { article } = await response.json();
    expect(article.slug).toBe(created.slug);
    expect(article.title).toBe(created.title);
    expect(article.description).toBe(created.description);
    expect(article.body).toBe(created.body);
    expect(article.tagList).toEqual(created.tagList);
    expect(article.author.username).toBe(author.username);
  });

  test('the author can change the title, and fields not sent stay the same', async ({ request }) => {
    // When only the title is changed, the app removes all the tags, but API.md says fields not sent should stay the same.
    test.fail();
    const author = await signUp(request);
    const created = await createArticle(request, author);
    const newTitle = `veg biryani order ${uniqueId()}`;

    const response = await request.put(`/api/articles/${created.slug}`, {
      headers: { Authorization: `Token ${author.token}` },
      data: { article: { title: newTitle } },
    });

    expect(response.status()).toBe(200);
    const { article } = await response.json();
    expect(article.title).toBe(newTitle);
    expect(article.slug).not.toBe(created.slug);
    expect(article.description).toBe(created.description);
    expect(article.body).toBe(created.body);
    expect(article.tagList).toEqual(created.tagList);

    const reread = await request.get(`/api/articles/${article.slug}`);
    expect(reread.status()).toBe(200);
    expect((await reread.json()).article.title).toBe(newTitle);
  });

  test('the author can delete an article, and then it is not found', async ({ request }) => {
    const author = await signUp(request);
    const created = await createArticle(request, author);

    const response = await request.delete(`/api/articles/${created.slug}`, {
      headers: { Authorization: `Token ${author.token}` },
    });

    expect(response.status()).toBe(204);
    expect(await response.text()).toBe('');

    const reread = await request.get(`/api/articles/${created.slug}`);
    expect(reread.status()).toBe(404);
    expect(await reread.json()).toEqual({ errors: { article: ['not found'] } });
  });

  test('creating an article without a token returns 401 "is missing"', async ({ request }) => {
    const response = await request.post('/api/articles', {
      data: { article: articleData(uniqueId()) },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ errors: { token: ['is missing'] } });
  });

  test('creating an article with a wrong token returns 401 "is invalid"', async ({ request }) => {
    const response = await request.post('/api/articles', {
      headers: { Authorization: 'Token not-a-real-token' },
      data: { article: articleData(uniqueId()) },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ errors: { token: ['is invalid'] } });
  });

  test('creating an article without a title returns 422 "can\'t be blank"', async ({ request }) => {
    const author = await signUp(request);
    const { title, ...withoutTitle } = articleData(uniqueId());

    const response = await request.post('/api/articles', {
      headers: { Authorization: `Token ${author.token}` },
      data: { article: withoutTitle },
    });

    expect(response.status()).toBe(422);
    expect(await response.json()).toEqual({ errors: { title: ["can't be blank"] } });
  });

  test('another user cannot change the article: 403 and the article stays the same', async ({ request }) => {
    const author = await signUp(request);
    const otherUser = await signUp(request);
    const created = await createArticle(request, author);

    const response = await request.put(`/api/articles/${created.slug}`, {
      headers: { Authorization: `Token ${otherUser.token}` },
      data: { article: { title: `changed by someone else ${uniqueId()}` } },
    });

    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ errors: { article: ['forbidden'] } });

    const reread = await request.get(`/api/articles/${created.slug}`);
    expect(reread.status()).toBe(200);
    expect((await reread.json()).article.title).toBe(created.title);
  });

  test('deleting an article that does not exist returns 404 "not found"', async ({ request }) => {
    const author = await signUp(request);

    const response = await request.delete(`/api/articles/no-such-article-${uniqueId()}`, {
      headers: { Authorization: `Token ${author.token}` },
    });

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ errors: { article: ['not found'] } });
  });
});
