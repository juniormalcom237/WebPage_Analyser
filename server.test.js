// tests/index.test.js

const request = require('supertest');
const app = require('./server'); // Assumes your main file is named index.js

describe('GET /scrape', () => {
    test('should fetch HTML details for a valid URL', async () => {
        const mockUrl = 'http://localhost:3000/allhtml';
        const mockUrl2 = 'http://localhost:3000';
        const mockHtml = `
            <html>
            <head><title>Example Page</title></head>
            <body>
                <h1>Heading 1</h1>
                <h2>Heading 2</h2>
                <a href="/internal">Internal Link</a>
                <a href="https://external.com">External Link</a>
                <form action="/login" method="post"><input type="text" name="username" /></form>
            </body>
            </html>
        `;

        // Mock axios get request
        // jest.mock('axios');
        // const axios = require('axios');
        // axios.get.mockResolvedValue({ data: mockHtml });

        const response = await request(app)
            .get(`/scrape?url=${mockUrl}`)
            .expect('Content-Type', /json/)
            .expect(200);

        // Assert the response structure
        expect(response.body.url).toBe(mockUrl);
        expect(response.body.htmlVersion).toBe('HTML5');
        expect(response.body.pageTitle).toBe('Example Page');
        expect(response.body.headingCounts).toEqual({ h1: 1, h2: 1, h3: 0, h4: 0, h5: 0, h6: 0 });
        expect(response.body.links.internal).toBe(1);
        expect(response.body.links.external).toBe(1);
        expect(response.body.isLoginForm).toBe(false);
        expect(response.body.linkValidationResults.length).toBe(2); // Assuming two links for testing
    });

    test('Check weither an page contain a login Form', async () => {
        const mockUrl = 'http://localhost:3000/login'

        const response = await request(app)
            .get(`/scrape?url=${mockUrl}`)
            .expect('Content-Type', /json/)
            .expect(200);

        // Assert the response structure
        expect(response.body.isLoginForm).toBe(true);
    });

    
});



// Close the server after tests
afterAll(done => {
    app.close();
    done();
});
