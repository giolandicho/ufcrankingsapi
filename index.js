import express from 'express';
import * as Cheerio from 'cheerio';

const PORT = process.env.PORT || 8000;
const app = express();

let cache = { data: null, fetchedAt: null };
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

class Ranking {
  constructor(weightClass) {
    this.weightClass = weightClass;
    this.fighters = [];
  }
}

async function fetchRankings() {
  if (cache.data && cache.fetchedAt && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  console.log('Scraping UFC rankings...');
  const res = await fetch('https://www.ufc.com/rankings', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  const $ = Cheerio.load(await res.text());
  const rankings = [];

  $('.view-grouping').each((_, groupEl) => {
    const headerEl = $(groupEl).find('.view-grouping-header');
    // Strip the "Top Rank" span text and trim
    headerEl.find('span').remove();
    const weightClass = headerEl.text().trim();

    const ranking = new Ranking(weightClass);

    // Champion
    const championLink = $(groupEl).find('.rankings--athlete--champion h5 a');
    if (championLink.length) {
      const href = championLink.attr('href');
      ranking.fighters.push({
        fighter_ranking: 'CHAMPION',
        fullName: championLink.text().trim().toUpperCase(),
        url: `https://www.ufc.com${href}`,
      });
    }

    // Ranked fighters (1-15)
    $(groupEl).find('tbody tr').each((_, row) => {
      const rankCell = $(row).find('td.views-field-weight-class-rank');
      const nameLink = $(row).find('td.views-field-title a');
      if (!rankCell.length || !nameLink.length) return;

      const rankNum = rankCell.text().trim();
      const href = nameLink.attr('href');
      ranking.fighters.push({
        fighter_ranking: rankNum,
        fullName: nameLink.text().trim().toUpperCase(),
        url: `https://www.ufc.com${href}`,
      });
    });

    rankings.push(ranking);
  });

  cache = { data: rankings, fetchedAt: Date.now() };
  console.log(`Scraped ${rankings.length} weight classes.`);
  return rankings;
}

const normalize = (str) => str.toLowerCase().replace(/[\s-]+/g, '');

app.get('/', async (req, res) => {
  try {
    const rankings = await fetchRankings();
    res.json(rankings);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    lastScraped: cache.fetchedAt ? new Date(cache.fetchedAt).toISOString() : null,
    cacheAgeMinutes: cache.fetchedAt ? Math.floor((Date.now() - cache.fetchedAt) / 60000) : null,
  });
});

app.get('/rankings/:weightClass', async (req, res) => {
  try {
    const rankings = await fetchRankings();
    const param = normalize(req.params.weightClass);
    const match = rankings.find((r) => normalize(r.weightClass) === param);
    if (!match) {
      return res.status(404).json({ error: 'Weight class not found' });
    }
    res.json(match);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
