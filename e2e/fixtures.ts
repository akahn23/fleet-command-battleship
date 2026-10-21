import { expect, test as base } from '@playwright/test';

type SharedOptions = {
  introSeen: boolean;
};

export const test = base.extend<SharedOptions>({
  introSeen: [true, { option: true }],
  page: async ({ page, introSeen }, runFixture) => {
    if (introSeen) {
      await page.addInitScript(() => localStorage.setItem('ravenfjord.introSeen', '1'));
    }
    await runFixture(page);
  },
});

export { expect };
export type { Locator, Page } from '@playwright/test';
