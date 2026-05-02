import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (A11y) checks', () => {
  test('Pilot home page should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Operate view should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Navigate to a known operate route, assuming /operate or similar exists
    // Using /runs as a proxy for an operate view
    await page.goto('/runs');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
