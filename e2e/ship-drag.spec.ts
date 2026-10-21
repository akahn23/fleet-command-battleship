import { expect, test, type Locator, type Page } from './fixtures';
import type { Coord, ShipPlacement } from '../src/engine';
import { expectShipCoversCells } from './helpers';

const cell = (page: Page, { row, col }: Coord) =>
  page.getByTestId('player-board').locator(`[data-row="${row}"][data-col="${col}"]`);

async function drag(page: Page, start: Locator, target: Locator, touch: boolean) {
  const startBox = await start.boundingBox();
  const targetBox = await target.boundingBox();
  if (!startBox || !targetBox) throw new Error('drag cell has no bounding box');
  const startPoint = {
    x: startBox.x + startBox.width / 2,
    y: startBox.y + startBox.height / 2,
  };
  const targetPoint = {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2,
  };
  if (!touch) {
    await page.mouse.move(startPoint.x, startPoint.y);
    await page.mouse.down();
    await page.mouse.move(targetPoint.x, targetPoint.y, { steps: 4 });
    await page.mouse.up();
    return;
  }

  await page.evaluate(
    ({ start, target }) => {
      const source = document.elementFromPoint(start.x, start.y)?.closest('button.cell');
      if (!source) throw new Error('starting cell not found');
      const event = (type: string, point: { x: number; y: number }) =>
        new PointerEvent(type, {
          bubbles: true,
          pointerId: 7,
          pointerType: 'touch',
          isPrimary: true,
          button: 0,
          clientX: point.x,
          clientY: point.y,
        });
      source.dispatchEvent(event('pointerdown', start));
      source.dispatchEvent(event('pointermove', target));
      source.dispatchEvent(event('pointerup', target));
    },
    { start: startPoint, target: targetPoint },
  );
}

test('dragging moves a ship, rejects an invalid drop, and click still lifts', async ({
  page,
  isMobile,
}) => {
  await page.goto('/?seed=7');
  await cell(page, { row: 4, col: 4 }).click();

  const moved: ShipPlacement = {
    shipId: 'greatLongship',
    origin: { row: 5, col: 4 },
    orientation: 'horizontal',
  };
  await drag(page, cell(page, { row: 4, col: 5 }), cell(page, { row: 5, col: 5 }), isMobile);
  await expectShipCoversCells(page, 'player', moved);
  await expect(page.getByText('The Great Longship is moved to E6.')).toBeVisible();

  await drag(page, cell(page, { row: 5, col: 4 }), cell(page, { row: 9, col: 9 }), isMobile);
  await expectShipCoversCells(page, 'player', moved);
  await expect(page.getByText(/run aground/i)).toBeVisible();

  await cell(page, { row: 5, col: 4 }).click();
  await expect(page.getByTestId('ship-greatLongship')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Great Longship/, pressed: true })).toBeVisible();
});
