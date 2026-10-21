import { expect, test } from './fixtures';

test.use({ introSeen: false });

test('first visit guide can be dismissed, stays dismissed, and reopens from the header', async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/?seed=7');

  const dialog = page.getByRole('dialog', { name: 'How to Play' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Begin' })).toBeFocused();
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  if (isMobile) {
    await expect(dialog.locator('.only-coarse').first()).toHaveText('Tap');
    await expect(dialog.locator('.only-coarse').nth(1)).toHaveText('drag with your finger');
    await expect(dialog.locator('.only-fine').first()).toBeHidden();
  } else {
    await expect(dialog.locator('.only-fine').first()).toHaveText('Click');
    await expect(dialog.locator('.only-fine').nth(1)).toContainText('R');
    await expect(dialog.locator('.only-coarse').first()).toBeHidden();
  }

  await dialog.getByRole('button', { name: 'Begin' }).click();
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('ravenfjord.introSeen'))).toBe('1');

  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const reopen = page.getByRole('button', { name: 'How to Play' });
  await reopen.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(reopen).toBeFocused();
});
