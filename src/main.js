import { Actor } from 'apify';
import { PlaywrightCrawler, Dataset, log } from '@crawlee/playwright';

// Initialize Actor
await Actor.init();

try {
  // Get input parameters
  const input = await Actor.getInput();
  
  if (!input) {
    throw new Error('No input provided to actor');
  }

  const {
    maxProps = 100,
    headless = true,
    debug = false,
    includeImages = true,
    timeout = 30000,
    scrollPages = 5,
  } = input;

  log.info('PrizePicks World Cup Scraper starting', {
    maxProps,
    headless,
    debug,
    scrollPages,
  });

  // World Cup soccer URL on PrizePicks
  const startUrl = 'https://www.prizepicks.com/sports/soccer';
  log.info(`Starting URL: ${startUrl}`);

  // Create and configure crawler
  const crawler = new PlaywrightCrawler({
    headless,
    navigationTimeoutSecs: timeout / 1000,
    requestHandlerTimeoutSecs: 120,
    
    async requestHandler({ request, page, log: crawlerLog }) {
      crawlerLog.info(`Processing page: ${request.url}`);

      // Wait for player cards to load
      try {
        await page.waitForSelector('[class*="player"], [class*="card"]', {
          timeout: 15000,
        }).catch(() => {
          crawlerLog.warn('Player cards not found, trying alternative selectors');
        });
      } catch (e) {
        crawlerLog.warn('Timeout waiting for player cards');
      }

      // Scroll to load more props
      for (let i = 0; i < scrollPages; i++) {
        crawlerLog.info(`Scrolling page ${i + 1}/${scrollPages}`);
        
        try {
          await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
          });
          
          await page.waitForTimeout(2000); // Wait for content to load
        } catch (e) {
          crawlerLog.warn(`Error scrolling: ${e.message}`);
          break;
        }
      }

      // Optional: take screenshot for debugging
      if (debug) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        try {
          await page.screenshot({
            path: `./storage/screenshots/debug-${timestamp}.png`,
            fullPage: true,
          });
          crawlerLog.info('Screenshot saved');
        } catch (e) {
          crawlerLog.debug('Screenshot capture failed');
        }
      }

      // Extract World Cup player props data
      const props = await page.evaluate(
        (includeImages) => {
          const playerData = [];
          
          // Try multiple selectors for player cards
          const playerCards = document.querySelectorAll(
            '[class*="player"], [class*="card"], [data-testid*="player"]'
          );

          playerCards.forEach((card, index) => {
            try {
              // Extract player information
              const nameEl = card.querySelector('[class*="name"]');
              const priceEl = card.querySelector('[class*="price"], [class*="line"], [class*="odd"]');
              const imageEl = card.querySelector('img');
              const teamEl = card.querySelector('[class*="team"]');
              const statEl = card.querySelector('[class*="stat"], [class*="prop"], [class*="category"]');
              
              // Try to get the text content which often contains all the information
              const allText = card.textContent?.trim() || '';

              if (nameEl || allText.length > 5) {
                const playerInfo = {
                  playerName: nameEl?.textContent?.trim() || extractPlayerName(allText) || `Player ${index}`,
                  propLine: priceEl?.textContent?.trim() || extractLine(allText) || 'N/A',
                  statCategory: statEl?.textContent?.trim() || extractStat(allText) || 'N/A',
                  team: teamEl?.textContent?.trim() || extractTeam(allText) || 'N/A',
                  fullText: allText,
                  timestamp: new Date().toISOString(),
                };

                if (includeImages && imageEl?.src) {
                  playerInfo.playerImageUrl = imageEl.src;
                }

                // Add raw HTML attributes if available
                if (card.dataset) {
                  playerInfo.rawData = { ...card.dataset };
                }

                playerData.push(playerInfo);
              }
            } catch (e) {
              console.warn('Error extracting player data:', e.message);
            }
          });

          return playerData;
        },
        [includeImages]
      );

      crawlerLog.info(`Extracted ${props.length} player props from page`);

      // Save data to dataset
      if (props.length > 0) {
        await Dataset.pushData(props);
        crawlerLog.info(`Saved ${props.length} props to dataset`);
      } else {
        crawlerLog.warn('No player props found on page');
      }
    },

    failedRequestHandler({ request, log: crawlerLog, error }) {
      crawlerLog.error(`Request failed: ${request.url}`, { error: error.message });
    },
  });

  // Run the crawler
  log.info('Starting crawler...');
  await crawler.run([startUrl]);

  // Get dataset stats
  const dataset = await Dataset.open();
  const datasetInfo = await dataset.getInfo();
  
  log.info('Scraping completed', {
    totalProps: datasetInfo?.itemCount || 0,
    url: startUrl,
  });

  // Store metadata
  const metadata = {
    competition: 'World Cup Soccer',
    scrapedAt: new Date().toISOString(),
    totalPropsScraped: datasetInfo?.itemCount || 0,
    url: startUrl,
  };

  await Actor.setValue('METADATA', metadata);
  log.info('Actor completed successfully', metadata);

} catch (error) {
  log.error('Actor error:', {
    message: error.message,
    stack: error.stack,
  });
  throw error;
} finally {
  await Actor.exit();
}

/**
 * Helper functions to extract data from text
 */
function extractPlayerName(text) {
  // Try to find a player name pattern
  const lines = text.split('\n');
  if (lines.length > 0) {
    return lines[0].trim();
  }
  return null;
}

function extractLine(text) {
  // Extract numerical values that look like prop lines (e.g., 2.5, 3.5)
  const match = text.match(/(\d+\.?\d*)\s*(?:over|under|o\/u|\/)/ i);
  return match ? match[1] : null;
}

function extractStat(text) {
  // Common soccer prop categories
  const stats = ['Goals', 'Assists', 'Shots', 'Shots on Target', 'Corners', 'Cards', 'Fouls'];
  for (const stat of stats) {
    if (text.toLowerCase().includes(stat.toLowerCase())) {
      return stat;
    }
  }
  return null;
}

function extractTeam(text) {
  // Try to find team abbreviations or names
  const teamPattern = /\b([A-Z]{2,3}|Argentina|Brazil|France|Germany|Spain|England|Netherlands|Portugal)\b/;
  const match = text.match(teamPattern);
  return match ? match[1] : null;
}
