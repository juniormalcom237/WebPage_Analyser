// index.js

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const urlModule = require('url');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Route to fetch HTML page and extract information
app.get('/scrape', async (req, res) => {
    const {url} = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        // Fetch HTML content from the provided URL
        const response = await axios.get(url);
        const html = response.data;

        // Load HTML into cheerio
        const $ = cheerio.load(html);

        // Extract HTML version
        const htmlVersion = getHtmlVersion($);

        // Extract page title
        const title = $('title').text().trim();

        // Count headings grouped by level
        const headings = countHeadings($);

        // Count internal and external hypermedia links
        const links = countLinks(url, $);

        // Check if the page contains a login form
        const hasLoginForm = checkLoginForm(url, $);

        // Validate links and collect results
        const linkValidationResults = await validateLinks(links);

        // Construct response object
        const pageInfo = {
            url,
            htmlVersion,
            pageTitle: title,
            headings,
            links,
            hasLoginForm,
            linkValidationResults
        };

        res.json(pageInfo);
    } catch (error) {
        console.error('Error fetching URL:', error.message);
        res.status(500).send('Error fetching URL');
    }
});

// Function to determine HTML version
function getHtmlVersion($) {
    const doctype = $(':root')[0].childNodes[0];
    if (doctype && doctype.nodeType === 8 && /^DOCTYPE/i.test(doctype.nodeValue)) {
        return doctype.nodeValue.replace(/^DOCTYPE\s+/, '').toUpperCase();
    }
    return 'HTML5'; // Default assumption
}

// Function to count headings grouped by level
function countHeadings($) {
    const headingCounts = {
        h1: $('h1').length,
        h2: $('h2').length,
        h3: $('h3').length,
        h4: $('h4').length,
        h5: $('h5').length,
        h6: $('h6').length
    };
    return headingCounts;
}

// Function to count internal and external links
function countLinks(baseUrl, $) {
    const internalLinks = new Set();
    const externalLinks = new Set();

    $('a').each((index, element) => {
        const href = $(element).attr('href');
        if (href) {
            if (href.startsWith('/')) {
                internalLinks.add(urlModule.resolve(baseUrl, href));
            } else if (href.startsWith('http')) {
                const linkUrl = new URL(href);
                if (linkUrl.hostname === new URL(baseUrl).hostname) {
                    internalLinks.add(href);
                } else {
                    externalLinks.add(href);
                }
            }
        }
    });

    return {
        internal: Array.from(internalLinks),
        external: Array.from(externalLinks)
    };
}

// Function to check if the page contains a login form
function checkLoginForm(url, $) {
    // Example specific logic for detecting login forms
    const loginForms = [
        { url: 'https://github.com/login', selector: 'form[action="/session"]' },
        { url: 'https://linkedin.com', selector: 'form[action="/uas/login-submit"]' }
        // Add more examples as needed
    ];

    for (const form of loginForms) {
        if (url.startsWith(form.url) && $(form.selector).length > 0) {
            return true;
        }
    }

    return false;
}

// Function to validate links
async function validateLinks(links) {
    const results = [];

    for (const link of links.internal.concat(links.external)) {
        const result = await isLinkAvailable(link);
        results.push({ link, available: result.available, error: result.error });
    }

    return results;
}

// Function to check if a link is available via HTTP(S)
function isLinkAvailable(link) {
    return new Promise(resolve => {
        let protocol = link.startsWith('https') ? https : http;
        protocol.get(link, (res) => {
            resolve({ available: res.statusCode === 200, error: null });
        }).on('error', (err) => {
            resolve({ available: false, error: err.message });
        });
    });
}


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; // Export app for testing
