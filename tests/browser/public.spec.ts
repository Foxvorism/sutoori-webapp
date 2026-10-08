import { test, expect } from "@playwright/test";
for (const width of [390, 768, 1440])
  test(`public layout and lightbox at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Creating Stories");
    await expect(page.locator(".hero-image")).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/placeholder|layout preview|stock photograph|independent creative production/i);
    await expect(page.locator(".hero-image")).toHaveAttribute("src", "/images/portfolio/graduation.webp");
    await page
      .locator(".hero-image")
      .evaluate((img: HTMLImageElement) => img.decode());
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({ path: `.tmp/home-${width}.png`, fullPage: true });
    await page.screenshot({ path: `.tmp/hero-${width}.png` });
    await page.locator("#services").scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `.tmp/services-${width}.png` });
    await page.getByRole("link", { name: "View All Work" }).click();
    await expect(page).toHaveURL(/\/work/);
    await expect(page.locator("h1")).toContainText("Every frame.");
    await expect(page.locator(".media-card")).toHaveCount(7);
    await expect(page.locator("main")).not.toContainText(/placeholder|layout preview|stock photograph/i);
    await page.locator(".media-card img").evaluateAll(async (images) => {
      await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
    });
    const first = page.locator(".media-card").first();
    await first.click();
    await expect(page.locator("dialog")).toBeVisible();
    for (let tab = 0; tab < 8; tab++) {
      await page.keyboard.press("Tab");
      const focus = await page
        .locator("dialog")
        .evaluate((el) => ({
          inside: el.contains(document.activeElement),
          open: (el as HTMLDialogElement).open,
          active: document.activeElement?.outerHTML.slice(0, 160),
        }));
      expect(focus.inside, `Tab ${tab}: ${JSON.stringify(focus)}`).toBe(true);
    }
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#lightbox-title")).toHaveText(
      "Family Gathering",
    );
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog")).not.toBeVisible();
    await expect(first).toBeFocused();
    await page.getByRole("link", { name: "Graduation", exact: true }).click();
    await expect(page).toHaveURL(/category=graduation/);
    await expect(page.locator(".media-card")).toHaveCount(1);
    await expect(page.locator(".media-card img")).toHaveAttribute("src", "/images/portfolio/graduation-female-thumb.webp");
    await page.reload();
    await expect(page.locator(".media-card")).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
    const signIn = page.getByRole("button", { name: "Sign in →" });
    if (await page.getByText("The studio is not connected yet.", { exact: false }).isVisible())
      await expect(signIn).toBeDisabled();
    else
      await expect(signIn).toBeEnabled();
    expect(errors).toEqual([]);
  });
test("reduced motion, mobile menu, and direct API protection", async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Services" })
    .click();
  await expect(page.locator("#mobile-nav")).toHaveCount(0);
  expect(await page.locator(".pin-spacer").count()).toBe(0);
  await expect(page.locator(".statement h2")).toBeVisible();
  for (const endpoint of [
    "/api/admin/media",
    "/api/admin/settings",
    "/api/admin/session",
  ])
    expect((await request.get(endpoint)).status()).toBe(401);
  expect(
    (await request.post("/api/admin/media", { data: "invalid" })).status(),
  ).toBe(401);
  expect((await request.get("/api/work?page=-1")).status()).toBe(400);
  expect((await request.get("/api/work")).headers()["cache-control"]).toBe(
    "no-store",
  );
  await page.goto("/work?category=missing");
  await expect(
    page.getByRole("heading", { name: "No stories in this selection yet." }),
  ).toBeVisible();
});

test("content remains readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3017/");
  await expect(page.locator("h1")).toContainText("Creating Stories");
  await expect(page.locator(".statement h2")).toHaveCSS("opacity", "1");
  await expect(page.locator(".services-list details")).toHaveCount(9);
  await context.close();
});
test("scroll motion reverses and does not accumulate after navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".pin-spacer")).toHaveCount(1);
  const track = page.locator(".hero-line").first();
  const pin = page.locator(".opening-scene");
  const top = await pin.evaluate(
    (el) => el.getBoundingClientRect().top + window.scrollY,
  );
  await page.evaluate(
    (y) => window.scrollTo({ top: y + 500, behavior: "instant" }),
    top,
  );
  await page.waitForTimeout(1100);
  const shifted = await track.evaluate((el) => getComputedStyle(el).transform);
  expect(shifted).not.toBe("none");
  const card = page.locator('.work-track .media-card').first();
  await card.focus();
  await page.waitForTimeout(1000);
  const beforeDialog = await page.evaluate(() => scrollY);
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(card).toBeFocused();
  expect(Math.abs(await page.evaluate(() => scrollY) - beforeDialog)).toBeLessThan(3);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(1100);
  const reversed = await track.evaluate((el) => getComputedStyle(el).transform);
  expect(reversed).not.toBe(shifted);
  for (let i = 0; i < 2; i++) {
    await page.getByRole("link", { name: "View All Work" }).click();
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    await page.getByRole("link", { name: "Sutoori Production home" }).click();
    await expect(page.locator(".pin-spacer")).toHaveCount(1);
  }
});


