import { expect, test } from './fixtures';

test('sound is available on computers and absent on coarse-pointer mobile', async ({
  page,
  isMobile,
}) => {
  await page.goto('/?seed=7');

  const soundButton = page.getByRole('button', { name: /^Sound:/ });
  if (isMobile) {
    expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    await expect(soundButton).toHaveCount(0);
  } else {
    await expect(soundButton).toBeVisible();
  }
});
