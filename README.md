# PrizePicks World Cup Soccer Scraper

A specialized Apify Actor for scraping World Cup soccer player props, betting lines, and odds data from PrizePicks.

## Features

⚽ **World Cup Focused**: Optimized for World Cup soccer matches
📊 **Comprehensive Data**: Player names, prop lines, stat categories, teams, and images
🚀 **Fast & Reliable**: Uses Playwright for headless browser automation
📦 **Easy Integration**: Works with Apify platform and ChatGPT custom actions
🔍 **Debug Mode**: Optional screenshots and detailed logging
⚙️ **Configurable**: Customize timeout, max props, scroll depth, and more

## Quick Start

### Installation

```bash
# Using Apify CLI
npx apify-cli create my-world-cup-scraper

# Or clone this repo
git clone https://github.com/dpw6fmt62c-stack/prizepicks-world-cup-scraper.git
cd prizepicks-world-cup-scraper
npm install
```

### Local Usage

```bash
# Run locally with default settings
npm start

# Or with custom input
apify run
```

### With Apify Platform

```bash
# Deploy to Apify
apify push

# Or run via CLI
apify call <ACTOR_ID>
```

## Input Configuration

The actor accepts the following input parameters:

```json
{
  "maxProps": 100,
  "headless": true,
  "debug": false,
  "includeImages": true,
  "timeout": 30000,
  "scrollPages": 5
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxProps` | integer | `100` | Maximum number of player props to extract |
| `headless` | boolean | `true` | Run browser in headless mode |
| `debug` | boolean | `false` | Enable debug mode (screenshots and verbose logging) |
| `includeImages` | boolean | `true` | Include player image URLs in results |
| `timeout` | integer | `30000` | Page load timeout in milliseconds (5000-120000) |
| `scrollPages` | integer | `5` | Number of scroll iterations to load more props (1-20) |

## Output

The actor outputs a dataset containing World Cup soccer player props:

```json
[
  {
    "playerName": "Kylian Mbappé",
    "propLine": "1.5",
    "statCategory": "Goals",
    "team": "FRA",
    "playerImageUrl": "https://...",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
]
```

## World Cup Prop Categories

The scraper captures:
- **Goals** - Number of goals scored
- **Assists** - Number of assists
- **Shots** - Total shots taken
- **Shots on Target** - Shots on goal
- **Corners** - Corner kicks
- **Cards** - Yellow/Red cards
- **Fouls** - Fouls committed

## Usage with ChatGPT

### Custom GPT Action

1. Go to ChatGPT > Create Custom GPT > Configure > Actions
2. Add your Apify API token for authentication
3. Example prompt: *"Scrape World Cup soccer player props from PrizePicks"*

### Python Integration

```python
from apify_client import ApifyClient

client = ApifyClient(token='YOUR_APIFY_TOKEN')
run = client.actor('YOUR_ACTOR_ID').call({'maxProps': 100})
dataset_items = client.dataset(run['defaultDatasetId']).list_items()

for prop in dataset_items['items']:
    print(f"{prop['playerName']}: {prop['statCategory']} {prop['propLine']}")
```

## License

Apache License 2.0

## Support

- 📚 [Apify Documentation](https://docs.apify.com/)
- 🎬 [Crawlee Documentation](https://crawlee.dev/)
- 💬 [Discord Community](https://discord.gg/jyEM2PRvMU)

---

**Made with ⚽ using Apify & Crawlee**
