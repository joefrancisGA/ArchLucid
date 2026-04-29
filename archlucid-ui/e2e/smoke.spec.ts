import { expect, test } from "@playwright/test";

test.describe("operator shell smoke", () => {
  test("home renders shell headings", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "ArchLucid", level: 1 })).toBeVisible();
    await expect(page.getByText("Create Request")).toBeVisible();
  });

  test("runs list renders without generic error boundary", async ({ page }) => {
    await page.goto("/runs");

    await expect(page.getByRole("heading", { name: /^Architecture runs$/i })).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test("Ask page renders without generic error boundary", async ({ page }) => {
    await page.goto("/ask");

    await expect(page.getByRole("heading", { name: /^Ask ArchLucid$/i })).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test("Help page renders primary heading", async ({ page }) => {
    await page.goto("/help");

    await expect(page.getByRole("heading", { name: /^Help$/i, level: 1 })).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test("new request page renders without generic error boundary", async ({ page }) => {
    await page.goto("/runs/new");

    await expect(page.getByRole("heading", { name: /new architecture request/i })).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
  });
});
