import { expect, test } from './fixtures';

test('app loads with the Ravenfjord title and no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /ravenfjord/i })).toBeVisible();
  await expect(page.locator('.site-header__tagline')).toHaveText(
    'A Viking war of Battleship upon the northern sea',
  );
  expect(errors).toEqual([]);
});

test('loads the harbour backdrop assets and header emblem', async ({ page }) => {
  const responses: { url: string; status: number }[] = [];
  page.on('response', (response) => {
    responses.push({ url: response.url(), status: response.status() });
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const backgroundImage = await page
    .locator('.backdrop')
    .evaluate((element) => getComputedStyle(element).backgroundImage);
  expect(backgroundImage).toContain('harbour-');

  const harbourResponses = responses.filter(({ url }) =>
    /harbour-\d+(?:-[A-Za-z0-9_-]+)?\.(?:avif|webp)(?:[?#]|$)/.test(url),
  );
  expect(harbourResponses.some(({ status }) => status === 200)).toBe(true);
  expect(responses.filter(({ status }) => status >= 400)).toEqual([]);

  const raven = page.locator('svg.site-header__raven');
  await expect(raven).toBeVisible();
  const bounds = await raven.boundingBox();
  expect(bounds?.width ?? 0).toBeGreaterThanOrEqual(40);
});
