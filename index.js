const PORT = 4000;

const express = require("express")
const cheerio = require("cheerio");
const axios = require("axios");
const puppeteer = require('puppeteer');

const app = express();

app.get("/", (req, res) => {
  res.json("This is an API data!");
});

app.get("/news", async (req, res) => {
  const url = 'https://www.bbc.co.uk/search?q=Ai+new&d=HOMEPAGE_GNL';

  // Get the list of image sources using Puppeteer
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' }); // wait for page to load
  const imgList = await page.$$eval('img', imgs => imgs.map(img => img.src));
  await browser.close();

  // Get the list of data from `a` tags using Cheerio
  const dataList = [];
  axios.get(url).then((response) => {
    const html = response.data
    const $ = cheerio.load(html);

    $('a:contains("AI")').each(function() {
      const title = $(this).text();
      const url = $(this).attr('href');
      const para = $(this).next('p').text();

      dataList.push({ title, url, para });
    });

    // Combine the list of image sources and the list of data
    const newsList = imgList.map((src, index) => {
      const data = dataList[index];
      return { ...data, imgSrc: src };
    });

    res.json(newsList);
  }).catch((e) => console.log(e));
});

app.listen(PORT, () => console.log(`server is running on PORT ${PORT}`));
