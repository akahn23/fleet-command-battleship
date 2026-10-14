import { expect, test } from '@playwright/test';

test('app loads with the Ravenfjord title and no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /ravenfjord/i })).toBeVisible();
  expect(errors).toEqual([]);
});
