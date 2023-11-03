const express = require('express');
const { exec } = require('child_process');
const Queue = require('bull');

const app = express();
const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const scrapeQueue = new Queue('scrapeQueue', REDIS_URL);

app.use(express.json());

// Improved error handling for exec
const executePythonScript = (url) => {
  return new Promise((resolve, reject) => {
    exec(`python scrape_external_links.py "${url}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return reject(new Error(stderr));
      }
      try {
        const data = JSON.parse(stdout);
        resolve(data);
      } catch (parseError) {
        console.error(`Error parsing stdout: ${stdout}`);
        reject(parseError);
      }
    });
  });
};

// Queue a scraping job
app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  // Add the URL to the queue
  try {
    const job = await scrapeQueue.add({ url });
    res.json({ message: 'Scraping job queued', jobId: job.id });
  } catch (error) {
    console.error(`Failed to queue the scraping job: ${error}`);
    res.status(500).json({ error: 'Failed to queue the scraping job.' });
  }
});

// Process the scraping jobs in the queue
scrapeQueue.process(async (job) => {
  try {
    const externalLinks = await executePythonScript(job.data.url);
    // You may want to do something with the externalLinks here,
    // like storing them in a database or sending them somewhere else
    return externalLinks;
  } catch (error) {
    console.error(`Error processing job ${job.id}: ${error}`);
    throw error; // Bull will retry the job depending on your settings
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    scrapeQueue.close().then(() => console.log('Queue closed')).catch((err) => console.error('Error closing the queue', err));
  });
});
