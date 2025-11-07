// scraper.js

const { chromium } = require('playwright');

// --- Configuration ---
// UPDATED with the correct base URL structure
const BASE_URL = 'https://sanand0.github.io/tdsdata/js_table/?seed='; 
const SEEDS = [39, 40, 41, 42, 43, 44, 45, 46, 47, 48];
// ---------------------

async function runScraper() {
    let grandTotal = 0;
    
    // Launch a headless browser
    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log('Starting DataDash QA Automation...');

    for (const seed of SEEDS) {
        const url = `${BASE_URL}${seed}`;
        console.log(`\n--- Processing Seed ${seed} (${url}) ---`);
        
        try {
            // Navigate to the page and wait for the DOM to be ready
            const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
            
            if (response.status() !== 200) {
                console.error(`ERROR: Could not load ${url}. Status: ${response.status()}`);
                continue;
            }

            // Wait for the dynamically loaded table data (assuming a short wait is enough)
            await page.waitForTimeout(1000); 

            // A Playwright locator to target all table cells (td or th) that contain text
            // The selector 'table * :is(td, th):not(:empty)' targets any non-empty td or th inside a table.
            const numberCells = page.locator('table * :is(td, th):not(:empty)');
            
            // Get all text contents from the selected cells
            const cellTexts = await numberCells.allTextContents();
            
            let seedTotal = 0;
            let numbersFound = 0;

            for (const text of cellTexts) {
                // Clean the text: remove commas and trim whitespace, then parse as float
                const numberMatch = text.replace(/[$,\s]/g, ''); 
                const number = parseFloat(numberMatch);

                if (!isNaN(number)) {
                    seedTotal += number;
                    numbersFound++;
                }
            }

            console.log(`Found ${numbersFound} valid numbers. Seed Total: ${seedTotal.toFixed(2)}`);
            grandTotal += seedTotal;

        } catch (error) {
            console.error(`An error occurred while processing seed ${seed}:`, error.message);
        }
    }

    await browser.close();

    // Print the final required total to the logs
    console.log('\n=======================================');
    console.log(`✅ FINAL GRAND TOTAL: ${grandTotal.toFixed(2)}`);
    console.log('=======================================');
}

runScraper().catch(error => {
    console.error('The scraper failed to complete:', error);
    process.exit(1);
});
