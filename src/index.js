#!/usr/bin/env node
const program = require('commander');
const axios = require('axios');
const ora = require('ora');
const cfonts = require('cfonts');
const Table = require('cli-table2');
const colors = require('colors');
const humanize = require('humanize-plus');
const blessed = require('blessed');

const list = val => val.split(',')

program
  .version('0.1.0')
  .option('-c, --convert [currency]', 'Convert to your fiat currency', 'usd')
  .option('-f, --find [symbol]', 'Find specific coin data with coin symbol (can be a comma seperated list)', list, [])
  .option('-t, --top [index]', 'Show the top coins ranked from 1 - [index] according to the market cap', null)
  .option('-H, --humanize [enable]', 'Show market cap as a humanized number, default true', true)
  .parse(process.argv);

const convert = program.convert.toUpperCase()
const availableCurrencies = ['USD', 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR']
if (availableCurrencies.indexOf(convert) === -1) {
  return console.log('We cannot convert to your fiat currency.'.red)
}
const find = program.find;
const top = !isNaN(program.top) && +program.top > 0 ? +program.top : find.length > 0 ? 1500 : 10;
const humanizeIsEnabled = program.humanize !== 'false';

var screen = blessed.screen({
  smartCSR: true,
  fullUnicode: true,
});

screen.title = 'The Cryptocurrency Price Tool on CLI';

const container = blessed.box({
  parent: screen,
  scrollable: true,
  left: 'center',
  top: 'center',
  width: '100%',
  height: '100%',
  content: '{center}Welcome to Coinmon: \n The Cryptocurrency Price Tool on CLI \n To Refresh Click on The Terminal, To Scroll Use the Arrow Keys ↑↓,\n Quit on Escape, q, or Control-C.{/center}',
  tags: true,
  style: {
    fg: 'white',
    bg: 'black'
  },
  border: 'line',
  keys: true,
  vi: true,
  alwaysScroll: true,
  scrollbar: {
    ch: ' ',
    inverse: true
  }
});

const coinmonStart = () => {
  const tables = [['Rank', 'Coin', `Price (${convert})`, 'Change (24H)', 'Change (1H)', `Market Cap (${convert})`]];
  const spinner = ora('Loading data').start();
  const sourceUrl = `https://api.coinmarketcap.com/v1/ticker/?limit=${top}&convert=${convert}`;
  axios.get(sourceUrl).then(function (response) {
    spinner.stop();
    response.data.filter(record => {
      if (find.length > 0) {
        return find.some(keyword => record.symbol.toLowerCase() === keyword.toLowerCase());
      }
      return true;
    }).map(record => {
      const percentChange24h = record.percent_change_24h;
      const textChange24h = `${percentChange24h}%`;
      const change24h = percentChange24h ? percentChange24h > 0 ? textChange24h.green : textChange24h.red : 'NA';
      const percentChange1h = record.percent_change_1h;
      const textChange1h = `${percentChange1h}%`;
      const change1h = percentChange1h ? percentChange1h > 0 ? textChange1h.green : textChange1h.red : 'NA';
      const marketCap = record[`market_cap_${convert}`.toLowerCase()];
      const displayedMarketCap = humanizeIsEnabled ? humanize.compactInteger(marketCap, 3) : marketCap;
      return [record.rank, `${record.symbol}`, record[`price_${convert}`.toLowerCase()], change24h, change1h, displayedMarketCap];
    }).forEach(record => tables.push(record));

    const table = blessed.table({
      parent: container,
      top: 4,
      tags: true,
      width: '98%',
    });
    if (table.length === 0) {
      console.log('We are not able to find coins matching your keywords'.red);
    } else {
      table.setData(tables);
      container.append(table);
      console.log(`Data source from coinmarketcap.com at ${new Date().toLocaleTimeString()}`);
      screen.render();

    }
  }).catch(function (error) {
    console.log(error);
    console.error('Coinmon is not working now. Please try again later.'.red);
  });
};

container.on('click', function (data) {
  coinmonStart();
});

screen.key(['escape', 'q', 'C-c'], function (ch, key) {
  return process.exit(0);
});
coinmonStart();
