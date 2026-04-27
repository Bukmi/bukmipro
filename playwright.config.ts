import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — used exclusively for accessibility (axe-core) tests.
 * Tests run against the staging URL by default; override with BASE_URL env var.
 *
 * Local usage:
 *   BASE_URL=https://staging.bukmi.pro npx playwright test tests/a11y/
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? "https://staging.bukmi.pro",
    // Don't keep trace by default — only on failure in CI
    trace: "on-first-retry",
    // Accept cookies automatically so cookie banner doesn't interfere
    storageState: undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
