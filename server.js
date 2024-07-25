// index.js

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
// Middleware to parse JSON requests
app.use(express.json());

// Route to fetch HTML page and extract information
app.get('/scrape', async (req, res) => {
    const { url } = req.query;

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
        const pageTitle = $('title').text().trim();

        // Count headings grouped by level
        const headingCounts = countHeadings($);

        // Count internal and external hypermedia links
        const links = countLinks(url, $);

        // Check if the page contains a login form
        const isLoginForm = checkLoginForm(url, $);
      
       

        // Validate links and collect results
        const linkValidationResults = await validateLinks(links);

        // Construct response object
        const pageInfo = {
            url,
            htmlVersion,
            pageTitle,
            headingCounts,
            links:{
                internal: links['internal'].length,
                external: links['external'].length
            },
            isLoginForm,
            linkValidationResults
        };

        res.json(pageInfo);
    } catch (error) {
        console.error('Error fetching URL:', error.message);
        res.status(500).json({'error':'Error fetching URL please verify your link and retry'});
    }
});

// Function to determine HTML version
function getHtmlVersion($) {
    const doctypeNode = $(':root')[0].childNodes[0];
    console.log(doctypeNode.parent.prev.type)
    if (doctypeNode && doctypeNode.parent.prev.type === 'directive' && doctypeNode.parent.prev.name.toLowerCase() === '!doctype') {
        const doctypeContent = doctypeNode.parent.prev.data.trim();
        console.log(doctypeContent)
        // Determine HTML version based on common patterns in doctype declarations
        if (doctypeContent.includes('HTML 4.01')) {
          return 'HTML 4.01';
        } if (doctypeContent.includes('HTML 3.2')) {
            return 'HTML 3';
        }
        if(doctypeContent.includes('HTML 2.0')) {
            return 'HTML 2';
        }else if (doctypeContent.includes('XHTML')) {
            return 'HTML 1';
        } else if (doctypeContent.includes('html')) {
            return 'HTML5';
        } else {
            return'Unknown HTML version';
        }
      } else {
        console.log('No valid doctype declaration found');
        return'No valid doctype declaration found';
      }// Default assumption
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
                internalLinks.add(new URL(href, baseUrl).href);
            } else if (href.startsWith('http')) {
                const linkUrl = new URL(href);
                if (linkUrl.hostname === new URL(baseUrl).hostname) {
                    internalLinks.add(linkUrl.href);
                } else {
                    externalLinks.add(linkUrl.href);
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
 // Check if the URL contains "login" or "signin"
 console.log(url)
 const urlContainsLoginOrSignin = url.includes('login') || url.includes('signin');
 const hasPasswordInput = $('form input[type="password"]').length > 0;
     
 // Determine if it's a login form based on both conditions
 const isLoginForm = hasPasswordInput && urlContainsLoginOrSignin;

return isLoginForm;
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
    console.log(link)
    return new Promise(resolve => {
        let protocol = link.startsWith('https') ? https : http;
        protocol.get(link, (res) => {
            resolve({ available: res.statusCode === 200, error: null });
            console.log("Infinity")
        }).on('error', (err) => {
            console.log("Infinity")
            resolve({ available: false, error: err.message });
        });
    });
}

app.get('/allhtml', async (req, res) => {
    const filePath = path.join(__dirname, 'Mock/login.html');
    try {
        const htmlContent = await fs.readFile(filePath, 'utf8');
        res.send(htmlContent);
    } catch (error) {
        console.error('Error reading HTML file:', error);
        res.status(500).send('Failed to read HTML file');
    }
  });
  app.get('/login', async (req, res) => {
    const filePath = path.join(__dirname, 'Mock/login.html');
    try {
        const htmlContent = await fs.readFile(filePath, 'utf8');
        res.send(htmlContent);
    } catch (error) {
        console.error('Error reading HTML file:', error);
        res.status(500).send('Failed to read HTML file');
    }
  });
// Start server
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = server; // Export server for testing
