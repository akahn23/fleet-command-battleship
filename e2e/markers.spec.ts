import { expect, test, type Locator, type Page } from '@playwright/test';
import { createGame, shipCells, type Coord } from '../src/engine';

const SEED = 7;
const enemyFleet = createGame({ seed: SEED }).boards.computer.ships;
const board = (page: Page, side: 'player' | 'enemy') => page.getByTestId(`${side}-board`);
const cell = (page: Page, side: 'player' | 'enemy', { row, col }: Coord) =>
  board(page, side).locator(`[data-row="${row}"][data-col="${col}"]`);

async function box(locator: Locator) {
  const result = await locator.boundingBox();
  if (!result) throw new Error('element has no bounding box');
  return result;
}

async function startWithAutoPlacement(page: Page) {
  await page.goto(`/?seed=${SEED}`);
  await page.getByRole('button', { name: 'Auto-Place Fleet' }).click();
  await page.getByRole('button', { name: 'Start Battle' }).click();
  await expect(page.getByTestId('turn-headline')).toHaveText(/your turn/i);
}

async function fireAt(page: Page, coord: Coord) {
  await cell(page, 'enemy', coord).click();
  await expect(page.getByTestId('turn-headline')).toHaveText(/your turn|victory|defeat/i);
}

test('settled hit and miss markers fill at least 40% of a 360px cell', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await startWithAutoPlacement(page);
  const occupied = new Set(enemyFleet.flatMap(shipCells).map(({ row, col }) => `${row},${col}`));
  const miss = [...Array(100).keys()]
    .map((index) => ({ row: Math.floor(index / 10), col: index % 10 }))
    .find(({ row, col }) => !occupied.has(`${row},${col}`))!;
  const hit = shipCells(enemyFleet[0]!)[0]!;

  await fireAt(page, miss);
  await fireAt(page, hit);
  await page.waitForTimeout(700);

  const missMarker = board(page, 'enemy').locator('.marker[data-kind="miss"] .marker__miss-static');
  const hitMarker = board(page, 'enemy').locator('.marker[data-kind="hit"] .marker__flame');
  await expect(missMarker).toHaveCount(1);
  await expect(hitMarker).toHaveCount(1);
  const missMarkerBox = await box(missMarker);
  const missCellBox = await box(cell(page, 'enemy', miss));
  const hitMarkerBox = await box(hitMarker);
  const hitCellBox = await box(cell(page, 'enemy', hit));
  expect(missMarkerBox.width).toBeGreaterThanOrEqual(missCellBox.width * 0.4);
  expect(hitMarkerBox.width).toBeGreaterThanOrEqual(hitCellBox.width * 0.4);
});
