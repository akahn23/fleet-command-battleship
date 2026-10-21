import { expect, test, type Locator, type Page } from './fixtures';
import { createGame, gameReducer, shipCells, type Coord, type ShipPlacement } from '../src/engine';
import { expectShipCoversCells } from './helpers';

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

async function expectShipArtworkFillsCell(page: Page, ship: ShipPlacement) {
  const artBox = await box(
    board(page, 'player').getByTestId(`ship-${ship.shipId}`).getByTestId('artwork-bounds'),
  );
  const cellBox = await box(cell(page, 'player', shipCells(ship)[0]!));
  const paintedCrossAxis = ship.orientation === 'horizontal' ? artBox.height : artBox.width;
  const cellCrossAxis = ship.orientation === 'horizontal' ? cellBox.height : cellBox.width;
  expect(paintedCrossAxis).toBeGreaterThanOrEqual(cellCrossAxis * 0.55);
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

async function expectMinimumCellSize(page: Page, side: 'player' | 'enemy', minimum: number) {
  const smallest = await board(page, side)
    .locator('[data-row]')
    .evaluateAll((els) =>
      Math.min(
        ...els.map((el) => {
          const rect = el.getBoundingClientRect();
          return Math.min(rect.width, rect.height);
        }),
      ),
    );
  expect(smallest).toBeGreaterThanOrEqual(minimum);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function expectControlsAtLeast40px(page: Page) {
  const smallest = await page
    .locator('button:not(.cell)')
    .evaluateAll((buttons) =>
      Math.min(...buttons.map((button) => button.getBoundingClientRect().height)),
    );
  expect(smallest).toBeGreaterThanOrEqual(40);
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
  for (const ship of autoPlacedFleet) {
    await expectShipCoversCells(page, 'player', ship);
    await expectShipArtworkFillsCell(page, ship);
  }

  await page.getByRole('button', { name: 'Start Battle' }).click();
  await expectSquareCells(page, 'enemy');
  await expectSquareCells(page, 'player');
  for (const ship of autoPlacedFleet) {
    await expectShipCoversCells(page, 'player', ship);
    await expectShipArtworkFillsCell(page, ship);
  }
});

test('placement and battle remain responsive from 360px to 1440px', async ({ page }) => {
  const viewports = [
    { width: 360, height: 740 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 900 },
    { width: 1440, height: 900 },
  ];

  await page.goto(`/?seed=${SEED}`);
  await page.getByRole('button', { name: 'Auto-Place Fleet' }).click();
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectNoHorizontalOverflow(page);
    await expectMinimumCellSize(page, 'player', 28);
    await expectControlsAtLeast40px(page);
  }

  await page.getByRole('button', { name: 'Start Battle' }).click();
  await expect(headline(page)).toHaveText(/your turn/i);
  const sections = page.locator('.battle-layout > .board-section');
  await expect(sections.nth(0)).toContainText('Enemy Waters');
  await expect(sections.nth(1)).toContainText('Your Waters');
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectNoHorizontalOverflow(page);
    await expect(board(page, 'enemy')).toBeInViewport();
    await expectMinimumCellSize(page, 'enemy', 28);
    await expectMinimumCellSize(page, 'player', 28);
    await expectControlsAtLeast40px(page);
  }
});

test('battle effects show splashes, hit flames, and sunk ships', async ({ page }) => {
  await startWithAutoPlacement(page);
  const occupied = new Set(enemyFleet.flatMap(shipCells).map(({ row, col }) => `${row},${col}`));
  const miss = [...Array(100).keys()]
    .map((index) => ({ row: Math.floor(index / 10), col: index % 10 }))
    .find(({ row, col }) => !occupied.has(`${row},${col}`))!;
  const ship = enemyFleet[0]!;
  const coords = shipCells(ship);

  await fireAt(page, miss);
  await expect(board(page, 'enemy').getByTestId('splash-effect')).toHaveCount(1);
  await fireAt(page, coords[0]!);
  await expect(board(page, 'enemy').getByTestId('flame-marker')).toHaveCount(1);
  await expect(board(page, 'enemy').getByTestId('hit-burst')).toHaveCount(1);

  for (const coord of coords.slice(1)) await fireAt(page, coord);
  const sunk = board(page, 'enemy').getByTestId(`ship-${ship.shipId}`);
  await expect(sunk).toHaveAttribute('data-variant', 'sunk');
  await expect(sunk).toHaveClass(/ship--sunk/);
  await expect(sunk.getByTestId('sunk-smoke')).toHaveCount(1);
});

test('reduced motion leaves atmosphere and battle effects static', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startWithAutoPlacement(page);
  const occupied = new Set(enemyFleet.flatMap(shipCells).map(({ row, col }) => `${row},${col}`));
  const miss = [...Array(100).keys()]
    .map((index) => ({ row: Math.floor(index / 10), col: index % 10 }))
    .find(({ row, col }) => !occupied.has(`${row},${col}`))!;
  const ship = enemyFleet[0]!;
  const coords = shipCells(ship);

  await fireAt(page, miss);
  await fireAt(page, coords[0]!);
  for (const coord of coords.slice(1)) await fireAt(page, coord);

  const enemyBoard = board(page, 'enemy');
  await expect(enemyBoard.getByTestId('splash-effect')).toHaveCount(1);
  await expect(enemyBoard.getByTestId('hit-burst')).toHaveCount(coords.length);
  await expect(enemyBoard.getByTestId('flame-marker')).toHaveCount(coords.length);
  await expect(enemyBoard.getByTestId(`ship-${ship.shipId}`)).toHaveAttribute(
    'data-variant',
    'sunk',
  );
  await expect(page.locator('.board__water')).toHaveCount(2);
  await expect(page.locator('.backdrop__mist')).toHaveCount(2);

  const reducedMotionState = await page.evaluate(() => {
    const names = (selector: string) =>
      Array.from(
        document.querySelectorAll(selector),
        (element) => getComputedStyle(element).animationName,
      );
    const banner = document.querySelector('.turn-banner');
    return {
      animationNames: [
        ...names('.board__water'),
        ...names('.backdrop__mist'),
        ...(banner ? [getComputedStyle(banner, '::before').animationName] : []),
        ...names('.marker__splash'),
        ...names('.marker__impact'),
        ...names('.marker__flame'),
        ...names('.ship--sunk svg'),
        ...names('.ship__smoke'),
      ],
      pulseContent: banner ? getComputedStyle(banner, '::before').content : 'none',
    };
  });
  expect(reducedMotionState.pulseContent).not.toBe('none');
  expect(reducedMotionState.animationNames.length).toBeGreaterThan(0);
  expect(reducedMotionState.animationNames.every((name) => name === 'none')).toBe(true);
  const runningAnimations = await page.evaluate(
    () => document.getAnimations().filter((animation) => animation.playState === 'running').length,
  );
  expect(runningAnimations).toBe(0);
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

test('keyboard navigation fires at C1 and scrolls the overflowing battle log', async ({ page }) => {
  await startWithAutoPlacement(page);
  await cell(page, 'enemy', { row: 0, col: 0 }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');

  const target = cell(page, 'enemy', { row: 0, col: 2 });
  await expect(target).toBeFocused();
  await expect(target).toHaveAttribute('data-col', '2');
  await page.keyboard.press('Enter');
  await expect(target).toHaveAttribute('data-state', /^(miss|hit|sunk)$/);
  await expect(headline(page)).toHaveText(/your turn/i);

  for (const coord of [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 3 },
    { row: 0, col: 4 },
    { row: 0, col: 5 },
    { row: 0, col: 6 },
    { row: 0, col: 7 },
    { row: 0, col: 8 },
  ]) {
    await fireAt(page, coord);
  }

  const log = page.getByRole('list', { name: 'Battle log' });
  expect(await log.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await log.focus();
  await expect(log).toBeFocused();
  for (let press = 0; press < 5; press++) await page.keyboard.press('ArrowDown');
  await expect.poll(() => log.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
});

test('full game to victory, then New Battle resets everything', async ({ page }) => {
  test.setTimeout(90_000);
  await startWithAutoPlacement(page);
  for (const ship of enemyFleet) {
    for (const coord of shipCells(ship)) await fireAt(page, coord);
    await expectShipCoversCells(page, 'enemy', ship);
  }

  const dialog = page.getByRole('dialog', { name: 'Valhalla Awaits' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('17', { exact: true }).first()).toBeVisible();
  await expect(cell(page, 'enemy', { row: 9, col: 9 })).toHaveAttribute('aria-disabled', 'true');

  // Focus stays out of the page behind the dialog, in both Tab directions.
  for (const key of ['Shift+Tab', 'Shift+Tab', 'Tab', 'Tab', 'Tab']) {
    await page.keyboard.press(key);
    expect(await page.evaluate(() => !document.activeElement?.closest('main'))).toBe(true);
  }

  await dialog.getByRole('button', { name: 'New Battle' }).click();
  await expect(page.getByRole('heading', { name: 'Muster Your Fleet' })).toBeVisible();
  await expect(board(page, 'player').locator('[data-testid^="ship-"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start Battle' })).toBeDisabled();
});
