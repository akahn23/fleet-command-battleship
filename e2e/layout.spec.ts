import { expect, test, type Locator } from '@playwright/test';

const SEED = 7;

async function box(locator: Locator) {
  const result = await locator.boundingBox();
  if (!result) throw new Error('element has no bounding box');
  return {
    x: result.x,
    y: result.y,
    width: result.width,
    height: result.height,
    bottom: result.y + result.height,
  };
}

test('desktop battle panels fit beside both boards at laptop sizes', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop-only viewport measurements');

  const viewports = [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto(`/?seed=${SEED}`);
    await page.getByRole('button', { name: 'Auto-Place Fleet' }).click();
    await page.getByRole('button', { name: 'Start Battle' }).click();
    await expect(page.getByTestId('turn-headline')).toHaveText(/your turn/i);
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    const enemyFrame = page.getByTestId('enemy-board').locator('xpath=..');
    const playerFrame = page.getByTestId('player-board').locator('xpath=..');
    const fleetPanels = page.locator('.battle-panels > .fleet-status');
    const battleLog = page.locator('.battle-panels > .battle-log');
    const measurements = {
      viewport,
      enemyBoard: await box(enemyFrame),
      playerBoard: await box(playerFrame),
      enemyFleet: await box(fleetPanels.nth(0)),
      playerFleet: await box(fleetPanels.nth(1)),
      battleLog: await box(battleLog),
    };
    console.log(
      `Battle layout ${viewport.width}x${viewport.height}: ${JSON.stringify(measurements)}`,
    );

    expect(measurements.enemyBoard.width).toBeGreaterThanOrEqual(440);
    for (const item of [
      measurements.enemyBoard,
      measurements.playerBoard,
      measurements.enemyFleet,
      measurements.playerFleet,
      measurements.battleLog,
    ]) {
      expect(item.bottom).toBeLessThanOrEqual(viewport.height);
    }
    expect(
      Math.abs(measurements.enemyFleet.y - measurements.enemyBoard.y),
      'fleet rail should align with the board-frame top',
    ).toBeLessThanOrEqual(2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(0);
  }
});
