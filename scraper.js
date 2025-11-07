import { chromium } from "@playwright/test";

const seeds = [39,40,41,42,43,44,45,46,47,48];
const urls = seeds.map(s => `https://sanand0.github.io/tdsdata/js_table/?seed=${s}`);

function extractNumbers(text: string): number[] {
  // Match integers or decimals, with optional sign and thousand separators
  const re = /[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g;
  const matches = text.match(re) ?? [];
  return matches.map(m => Number(m.replace(/,/g, ""))).filter(n => Number.isFinite(n));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let grandTotal = 0;

  for (const url of urls) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
    // Wait for any table to appear (pages are JS-generated)
    await page.waitForSelector("table", { timeout: 60_000 });

    const pageText = await page.evaluate(() => {
      // Gather text only from tables to avoid counting numbers elsewhere
      const tables = Array.from(document.querySelectorAll("table"));
      return tables.map(t => t.innerText).join("\n");
    });

    const nums = extractNumbers(pageText);
    const pageSum = nums.reduce((a, b) => a + b, 0);
    console.log(`Sum for ${url}: ${pageSum}`);
    grandTotal += pageSum;
  }

  console.log(`GRAND_TOTAL=${grandTotal}`);
  await browser.close();

  // Exit non-zero if nothing was found to surface issues
  if (!Number.isFinite(grandTotal)) {
    console.error("No numbers found or invalid total");
    process.exit(1);
  }
})();
