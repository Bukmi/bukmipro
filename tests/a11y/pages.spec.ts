/**
 * Accessibility audit — WCAG 2.1 AA (axe-core)
 *
 * Runs against BASE_URL (default: staging.bukmi.pro).
 * Failures at severity "serious" or "critical" block the CI.
 *
 * axe tags used:
 *   wcag2a   — WCAG 2.0 Level A
 *   wcag2aa  — WCAG 2.0 Level AA
 *   wcag21a  — WCAG 2.1 Level A
 *   wcag21aa — WCAG 2.1 Level AA
 *   best-practice — Common best practices (warnings, not failures)
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

/** Dismiss the cookie banner before running axe so it doesn't pollute results */
async function dismissCookieBanner(page: import("@playwright/test").Page) {
  await page.evaluate(() =>
    localStorage.setItem("bukmi-cookie-consent", "rejected")
  );
  await page.reload();
  // Wait for the page to be stable (no pending navigations / animations)
  await page.waitForLoadState("networkidle");
}

/** Run axe with WCAG 2.1 AA tags and return any violations */
async function runAxe(page: import("@playwright/test").Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // cookie-banner is tested separately below
    .exclude("#cookie-banner")
    .analyze();
}

// -------------------------------------------------------------------
// Public pages (no auth required)
// -------------------------------------------------------------------

const publicPages: Array<{ name: string; path: string }> = [
  { name: "Home", path: "/" },
  { name: "Login", path: "/login" },
  { name: "Signup", path: "/signup" },
  { name: "Artistas directorio", path: "/artistas" },
];

for (const { name, path } of publicPages) {
  test(`${name} (${path}) — WCAG 2.1 AA`, async ({ page }) => {
    await page.goto(path);
    await dismissCookieBanner(page);

    const results = await runAxe(page);

    // Pretty-print violations for easier debugging in CI logs
    if (results.violations.length > 0) {
      console.error(
        `\n[axe] ${results.violations.length} violation(s) on ${path}:\n` +
          results.violations
            .map(
              (v) =>
                `  [${v.impact}] ${v.id}: ${v.description}\n` +
                v.nodes
                  .slice(0, 3)
                  .map((n) => `    → ${n.html}`)
                  .join("\n")
            )
            .join("\n")
      );
    }

    expect(results.violations).toEqual([]);
  });
}

// -------------------------------------------------------------------
// Cookie banner — tested in isolation
// -------------------------------------------------------------------

test("Cookie banner — WCAG 2.1 AA", async ({ page }) => {
  // Navigate without pre-set consent so the banner appears
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Wait for the banner to hydrate and appear
  const banner = page.getByRole("alertdialog");
  await expect(banner).toBeVisible({ timeout: 5_000 });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .include('[role="alertdialog"]')
    .analyze();

  expect(results.violations).toEqual([]);
});

test("Cookie banner — keyboard operability", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const banner = page.getByRole("alertdialog");
  await expect(banner).toBeVisible({ timeout: 5_000 });

  // Escape should dismiss (reject) the banner
  await page.keyboard.press("Escape");
  await expect(banner).not.toBeVisible({ timeout: 3_000 });

  // Check that the consent was stored as "rejected"
  const stored = await page.evaluate(() =>
    localStorage.getItem("bukmi-cookie-consent")
  );
  expect(stored).toBe("rejected");
});

test("Cookie banner — accept stores consent", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const banner = page.getByRole("alertdialog");
  await expect(banner).toBeVisible({ timeout: 5_000 });

  await page.getByRole("button", { name: "Aceptar todo" }).click();
  await expect(banner).not.toBeVisible();

  const stored = await page.evaluate(() =>
    localStorage.getItem("bukmi-cookie-consent")
  );
  expect(stored).toBe("accepted");
});
