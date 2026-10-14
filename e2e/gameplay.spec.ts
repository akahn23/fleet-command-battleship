import { expect, test, type Locator, type Page } from '@playwright/test';
import { createGame, gameReducer, shipCells, type Coord, type ShipPlacement } from '../src/engine';

const SEED = 7;
const enemyFleet = createGame({ seed: SEED }).boards.computer.ships;
const autoPlacedFleet = gameReducer(createGame({ seed: SEED }), { type: 'AUTO_PLACE' }).boards
  .player.ships;

const board = (page: Page, side: 'player' | 'enemy') => page.getByTestId(`${side}-board`);
const cell = (page: Page, side: 'player' | 'enemy', { row, col }: Coord) =>
  board(page, side).locator(`[data-row="${row}"][data-col="${col}"]`);
const headline = (page: Page) => page.getByTestId('turn-headline');

async function box(locator: Locator) {
  const result = await locator.boundingBox();
  if (!result) throw new Error('element has no bounding box');
  return result;
}

async function startWithAutoPlacement(page: Page) {
  await page.goto(`/?seed=${SEED}`);
  await page.getByRole('button', { name: 'Auto-Place Fleet' }).click();
  await page.getByRole('button', { name: 'Start Battle' }).click();
  await expect(headline(page)).toHaveText(/your turn/i);
}

async function fireAt(page: Page, coord: Coord) {
  await cell(page, 'enemy', coord).click();
  await expect(headline(page)).toHaveText(/your turn|victory|defeat/i);
}

async function expectShipCoversCells(page: Page, side: 'player' | 'enemy', ship: ShipPlacement) {
  const shipBox = await box(board(page, side).getByTestId(`ship-${ship.shipId}`));
  const boxes = await Promise.all(shipCells(ship).map((c) => box(cell(page, side, c))));
  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const right = Math.max(...boxes.map((b) => b.x + b.width));
  const bottom = Math.max(...boxes.map((b) => b.y + b.height));
  expect(Math.abs(shipBox.x - left)).toBeLessThanOrEqual(1);
  expect(Math.abs(shipBox.y - top)).toBeLessThanOrEqual(1);
  expect(Math.abs(shipBox.x + shipBox.width - right)).toBeLessThanOrEqual(1);
  expect(Math.abs(shipBox.y + shipBox.height - bottom)).toBeLessThanOrEqual(1);
}

async function expectSquareCells(page: Page, side: 'player' | 'enemy') {
  const sizes = await board(page, side)
    .locator('[data-row]')
    .evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect()).map((r) => [r.width, r.height]),
    );
  expect(sizes).toHaveLength(100);
  const [w] = sizes[0]!;
  for (const [width, height] of sizes) {
    expect(Math.abs(width! - w!)).toBeLessThanOrEqual(1);
    expect(Math.abs(height! - w!)).toBeLessThanOrEqual(1);
  }
}

let consoleErrors: string[] = [];

test.beforeEach(({ page }) => {
  consoleErrors = [];
  page.on('console', (msg) => msg.type() === 'error' && consoleErrors.push(msg.text()));
  page.on('pageerror', (err) => consoleErrors.push(err.message));
});

test.afterEach(() => {
  expect(consoleErrors).toEqual([]);
});

test('manual placement: place, rotate, reject off-board, and lift a ship', async ({ page }) => {
  await page.goto(`/?seed=${SEED}`);
  await expect(page.getByRole('button', { name: 'Start Battle' })).toBeDisabled();

  await cell(page, 'player', { row: 0, col: 7 }).click();
  await expect(page.getByText(/run aground/i)).toBeVisible();
  await expect(board(page, 'player').getByTestId('ship-greatLongship')).toHaveCount(0);

  await cell(page, 'player', { row: 0, col: 0 }).click();
  await page.keyboard.press('r');
  await cell(page, 'player', { row: 2, col: 9 }).click();
  await expectShipCoversCells(page, 'player', {
    shipId: 'greatLongship',
    origin: { row: 0, col: 0 },
    orientation: 'horizontal',
  });
  await expectShipCoversCells(page, 'player', {
    shipId: 'dragonship',
    origin: { row: 2, col: 9 },
    orientation: 'vertical',
  });

  await cell(page, 'player', { row: 3, col: 9 }).click();
  await expect(board(page, 'player').getByTestId('ship-dragonship')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Dragonship/, pressed: true })).toBeVisible();
});

test('board geometry: square cells and every ship aligned to its squares', async ({ page }) => {
  await page.goto(`/?seed=${SEED}`);
  await page.getByRole('button', { name: 'Auto-Place Fleet' }).click();
  await expectSquareCells(page, 'player');
  for (const ship of autoPlacedFleet) await expectShipCoversCells(page, 'player', ship);

  await page.getByRole('button', { name: 'Start Battle' }).click();
  await expectSquareCells(page, 'enemy');
  await expectSquareCells(page, 'player');
  for (const ship of autoPlacedFleet) await expectShipCoversCells(page, 'player', ship);
});

test('layout fits the viewport with no horizontal scrolling', async ({ page }) => {
  await startWithAutoPlacement(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(board(page, 'enemy')).toBeInViewport();
});

test('battle: hidden enemy fleet, miss/hit markers, no turn lost on a repeated square', async ({
  page,
}) => {
  await startWithAutoPlacement(page);
  await expect(board(page, 'enemy').locator('[data-testid^="ship-"]')).toHaveCount(0);

  const occupied = new Set(enemyFleet.flatMap(shipCells).map((c) => `${c.row},${c.col}`));
  const miss = [...Array(100).keys()]
    .map((i) => ({ row: Math.floor(i / 10), col: i % 10 }))
    .find((c) => !occupied.has(`${c.row},${c.col}`))!;
  const hit = shipCells(enemyFleet[0]!)[0]!;

  await fireAt(page, miss);
  await expect(cell(page, 'enemy', miss)).toHaveAttribute('data-state', 'miss');
  await fireAt(page, hit);
  await expect(cell(page, 'enemy', hit)).toHaveAttribute('data-state', 'hit');
  await expect(board(page, 'enemy').getByTestId('marker')).toHaveCount(2);
  await expect(board(page, 'player').getByTestId('marker')).toHaveCount(2);

  const log = page.getByRole('list', { name: 'Battle log' }).getByRole('listitem');
  await expect(log).toHaveCount(5);
  // The square is aria-disabled; force the click to prove the game itself ignores it.
  await cell(page, 'enemy', hit).click({ force: true });
  await page.waitForTimeout(900);
  await expect(log).toHaveCount(5);
  await expect(headline(page)).toHaveText(/your turn/i);
});

test('full game to victory, then New Battle resets everything', async ({ page }) => {
  test.setTimeout(90_000);
  await startWithAutoPlacement(page);
  for (const ship of enemyFleet) {
    for (const coord of shipCells(ship)) await fireAt(page, coord);
    await expectShipCoversCells(page, 'enemy', ship);
  }

  const dialog = page.getByRole('dialog', { name: 'Victory' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('17', { exact: true }).first()).toBeVisible();
  await expect(cell(page, 'enemy', { row: 9, col: 9 })).toHaveAttribute('aria-disabled', 'true');

  await dialog.getByRole('button', { name: 'New Battle' }).click();
  await expect(page.getByRole('heading', { name: 'Muster Your Fleet' })).toBeVisible();
  await expect(board(page, 'player').locator('[data-testid^="ship-"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start Battle' })).toBeDisabled();
});
