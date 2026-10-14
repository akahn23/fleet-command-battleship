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

    const logItems = page.getByRole('list', { name: 'Battle log' }).getByRole('listitem');
    for (const [index, coord] of [
      { row: 0, col: 0 },
      { row: 5, col: 5 },
      { row: 9, col: 9 },
    ].entries()) {
      await page
        .getByTestId('enemy-board')
        .locator(`[data-row="${coord.row}"][data-col="${coord.col}"]`)
        .click();
      await expect(logItems).toHaveCount((index + 1) * 2);
      await expect(page.getByTestId('turn-headline')).toHaveText(/your turn/i);
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    const enemyFrame = page.getByTestId('enemy-board').locator('xpath=..');
    const playerFrame = page.getByTestId('player-board').locator('xpath=..');
    const enemySection = page.locator('.battle-layout > .board-section').first();
    const enemyHeading = enemySection.locator('h2');
    const fleetPanels = page.locator('.battle-panels > .fleet-status');
    const battleLog = page.locator('.battle-panels > .battle-log');
    const rail = page.locator('.battle-panels');
    const measurements = {
      viewport,
      enemyBoard: await box(enemyFrame),
      playerBoard: await box(playerFrame),
      enemyFleet: await box(fleetPanels.nth(0)),
      playerFleet: await box(fleetPanels.nth(1)),
      battleLog: await box(battleLog),
      rail: await box(rail),
      enemyHeading: await box(enemyHeading),
      logClientHeight: await page
        .locator('.battle-log ol')
        .evaluate((element) => element.clientHeight),
      document: await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      })),
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
      Math.abs(measurements.rail.y - measurements.enemyHeading.y),
      'fleet rail should align with the board-section heading',
    ).toBeLessThanOrEqual(2);
    expect(measurements.rail.bottom).toBeLessThanOrEqual(measurements.enemyBoard.bottom + 2);
    expect(measurements.logClientHeight).toBeGreaterThanOrEqual(96);
    expect(measurements.document.scrollHeight).toBeLessThanOrEqual(
      measurements.document.innerHeight + 1,
    );
    expect(
      measurements.document.scrollWidth - measurements.document.clientWidth,
    ).toBeLessThanOrEqual(0);
  }
});
