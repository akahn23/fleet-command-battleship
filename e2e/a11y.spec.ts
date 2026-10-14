import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { createGame, shipCells, type Coord } from '../src/engine';

const SEED = 7;
const enemyFleet = createGame({ seed: SEED }).boards.computer.ships;
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const board = (page: Page) => page.getByTestId('enemy-board');

const cell = (page: Page, { row, col }: Coord) =>
  board(page).locator(`[data-row="${row}"][data-col="${col}"]`);

const headline = (page: Page) => page.getByTestId('turn-headline');

async function startWithAutoPlacement(page: Page) {
  await page.goto(`/?seed=${SEED}`);
  await page.getByRole('button', { name: 'Auto-Place Fleet' }).click();
  await page.getByRole('button', { name: 'Start Battle' }).click();
  await expect(headline(page)).toHaveText(/your turn/i);
}

async function fireAt(page: Page, coord: Coord) {
  await cell(page, coord).click();
  await expect(headline(page)).toHaveText(/your turn|victory|defeat/i);
}

async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
  expect(
    violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    })),
  ).toEqual([]);
}

test('Axe finds no WCAG violations during placement', async ({ page }) => {
  await page.goto(`/?seed=${SEED}`);
  await expectNoAxeViolations(page);
});

test('Axe finds no WCAG violations with an overflowing battle log', async ({ page }) => {
  await startWithAutoPlacement(page);
  for (let shot = 0; shot < 8; shot++) {
    await fireAt(page, { row: Math.floor(shot / 10), col: shot % 10 });
  }

  const log = page.getByRole('list', { name: 'Battle log' });
  expect(await log.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await expectNoAxeViolations(page);
});

test('Axe finds no WCAG violations in the victory dialog', async ({ page }) => {
  await startWithAutoPlacement(page);
  for (const ship of enemyFleet) {
    for (const coord of shipCells(ship)) await fireAt(page, coord);
  }
  await expect(page.getByRole('dialog', { name: 'Valhalla Awaits' })).toBeVisible();
  await expectNoAxeViolations(page);
});

test('sunk fleet names and state labels meet 4.5:1 contrast', async ({ page }) => {
  await startWithAutoPlacement(page);
  for (const coord of shipCells(enemyFleet[0]!)) await fireAt(page, coord);
  await expect(page.locator('.fleet-status li.is-sunk').first()).toBeVisible();

  const contrast = await page.evaluate(() => {
    const parse = (color: string) => {
      const values = color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
      return { r: values[0]!, g: values[1]!, b: values[2]!, a: values[3] ?? 1 };
    };
    const luminance = ({ r, g, b }: ReturnType<typeof parse>) =>
      [r, g, b]
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0);
    const backgroundOf = (element: HTMLElement) => {
      for (let current: HTMLElement | null = element; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        const stops = style.backgroundImage.match(/rgba?\([^)]*\)/g);
        if (stops && style.backgroundImage.includes('gradient')) {
          return {
            source: `${current.className} (gradient last stop)`,
            color: parse(stops[stops.length - 1]!),
          };
        }
        const color = parse(style.backgroundColor);
        if (color.a > 0.5) return { source: current.className, color };
      }
      return { source: 'none', color: { r: 11, g: 21, b: 28, a: 1 } };
    };

    return [
      '.fleet-status li.is-sunk .fleet-status__name',
      '.fleet-status li.is-sunk .fleet-status__state',
    ].flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector), (element) => {
        const style = getComputedStyle(element);
        let opacity = 1;
        for (let current: HTMLElement | null = element; current; current = current.parentElement) {
          opacity *= Number(getComputedStyle(current).opacity);
        }
        const background = backgroundOf(element);
        const foreground = parse(style.color);
        const alpha = foreground.a * opacity;
        const mixed = {
          r: foreground.r * alpha + background.color.r * (1 - alpha),
          g: foreground.g * alpha + background.color.g * (1 - alpha),
          b: foreground.b * alpha + background.color.b * (1 - alpha),
        };
        const foregroundLuminance = luminance(mixed);
        const backgroundLuminance = luminance(background.color);
        return {
          selector,
          background: background.source,
          ratio:
            (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
            (Math.min(foregroundLuminance, backgroundLuminance) + 0.05),
        };
      }),
    );
  });

  expect(contrast).toHaveLength(2);
  for (const result of contrast) {
    expect(
      result.ratio,
      `${result.selector}: ${result.ratio.toFixed(2)}:1 on ${result.background}`,
    ).toBeGreaterThanOrEqual(4.5);
  }
});
