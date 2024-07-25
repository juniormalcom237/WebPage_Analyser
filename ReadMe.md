
# NodeJs - Website Scraper

This app take a url(Uniform Resource Locator) that return an html and perform the following:


## Features

- Return the Html document version.
- Return the Page title.
- Return the occurrence of headings according to their different hierarchy.
- Return the occurrence of hyperlinks group as internal and external link.
- Return if the different resources are reachable or not.
- Return if Html page is a login page or not.



## Run Locally

Open the project

Install dependencies

```bash
  npm install
```

Start the server

```bash
  node server.js
```


## Running Tests

To run tests, run the following command

```bash
  npm test
```


## API Reference

#### Get item the parse html json

```https
  GET /scrape?url={url}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `url`      | `string` | **Required**. URL of the html page |



## Constraints Of the solution

- **Performance Issues:**  If the html page return have several links the server will take alot of time to test if the link is reachable or not.
- **Determine Login Issues**: We will need to have a url that contains a login and an input field with with type password. "**❌Doesn't work with social Authentication** "
- **Couldn't Handle Server Timeout**: Unreachable URL will take alot of time due to the fact that we may have request that takes a lot of time test if link is reachable it wasn't possible only if we use pagination for the cheching the url availabilty

