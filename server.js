const express = require('express');
const requestPromise = require('request-promise');
const cheerio = require('cheerio');
const cors = require('cors');  // Make sure you've installed the 'cors' package

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());  // This enables CORS for all routes. Adjust as needed.

app.post('/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required.' });
    }

    try {
        const body = await requestPromise(url);
        const $ = cheerio.load(body);
        const externalLinks = [];

        $('a').each((index, element) => {
            const link = $(element).attr('href');
            if (link && link.startsWith('http')) {
                externalLinks.push(link);
            }
        });

        res.json({ externalLinks });
    } catch (error) {
        console.error("Error scraping:", error.message);
        res.status(500).json({ error: `Failed to scrape the website. Reason: ${error.message}` });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
