const PORT = 4000;
const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");
const puppeteer = require('puppeteer');

const app = express();

app.get("/", (req, res) => {
  res.json("This is an API data!");
});

app.get("/news", (req, res) => {
  const urlList = [
    'https://www.bbc.co.uk/search?q=Ai+new&d=HOMEPAGE_GNL',
    'https://www.bbc.co.uk/search?q=Ai+new&d=HOMEPAGE_GNL&page=2'
  ];

  const browserPromise = puppeteer.launch({ headless: 'new' });

  Promise.all(urlList.map(url => processURL(url, browserPromise)))
    .then(newsList => {
      res.json(newsList);
    })
    .catch(error => {
      console.error(error);
      res.status(500).json("Internal server error");
    });
});

async function processURL(url, browserPromise) {
  const browser = await browserPromise;
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const imgList = await page.$$eval('img', imgs => imgs.map(img => img.src));
  await page.close();

  const response = await axios.get(url, { timeout: 10000 });
  const html = response.data;
  const $ = cheerio.load(html);

  const dataList = [];

  $('a:contains("AI")').each(function() {
    const title = $(this).text();
    const url = $(this).attr('href');
    const para = $(this).next('p').text();

    dataList.push({ title, url, para });
  });

  const combinedList = imgList.map((src, index) => {
    const data = dataList[index];
    return { ...data, imgSrc: src };
  });

  return combinedList;
}

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
