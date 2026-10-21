import { expect, type Page } from './fixtures';
import { shipCells, type Coord, type ShipPlacement } from '../src/engine';

const board = (page: Page, side: 'player' | 'enemy') => page.getByTestId(`${side}-board`);
const cell = (page: Page, side: 'player' | 'enemy', { row, col }: Coord) =>
  board(page, side).locator(`[data-row="${row}"][data-col="${col}"]`);

async function box(locator: ReturnType<Page['getByTestId']>) {
  const result = await locator.boundingBox();
  if (!result) throw new Error('element has no bounding box');
  return result;
}

export async function expectShipCoversCells(
  page: Page,
  side: 'player' | 'enemy',
  ship: ShipPlacement,
) {
  const shipBox = await box(board(page, side).getByTestId(`ship-${ship.shipId}`));
  const boxes = await Promise.all(shipCells(ship).map((coord) => box(cell(page, side, coord))));
  const left = Math.min(...boxes.map((item) => item.x));
  const top = Math.min(...boxes.map((item) => item.y));
  const right = Math.max(...boxes.map((item) => item.x + item.width));
  const bottom = Math.max(...boxes.map((item) => item.y + item.height));
  expect(Math.abs(shipBox.x - left)).toBeLessThanOrEqual(1);
  expect(Math.abs(shipBox.y - top)).toBeLessThanOrEqual(1);
  expect(Math.abs(shipBox.x + shipBox.width - right)).toBeLessThanOrEqual(1);
  expect(Math.abs(shipBox.y + shipBox.height - bottom)).toBeLessThanOrEqual(1);
}
