var cheerio = require('cheerio');
var request = require('superagent');
var accounting = require('accounting');
var fx = require('money');
var open = require('open');
var q = require('q');
var $, steam;


var lowest = {};
var watch = [];

watch.push({
  name: "Glock-18 - Fade (Factory New)",
  url: "http://steamcommunity.com/market/listings/730/Glock-18%20%7C%20Fade%20%28Factory%20New%29",
  targetPrice: 60
});

watch.push({
  name: "Glock-18 - Fade (Minimal Wear)",
  url: "http://steamcommunity.com/market/listings/730/Glock-18%20%7C%20Fade%20%28Minimal%20Wear%29",
  targetPrice: 60
});


function run() {
  var self = this;
  for (var i in watch) {
    (function (i) {
      var prices = scrape(watch[i].url).then(function (prices) {
        if (!prices) return;
        if (!prices[0]) return;

        var convertedPrice = convertPrice(prices[0]);
        
        console.log(new Date().toLocaleTimeString(), watch[i].name, convertedPrice, "(" + prices[0] + ")");

        if (checkPrice(watch[i].targetPrice, convertedPrice)) {
          console.log("NEW LOW PRICE FOR", watch[i].name);
          // setNewLowest(watch[i].url, convertedPrice);
          open(watch[i].url);      
        }
      });
    })(i);
  }
}

function scrape(url) {
  var deferred = q.defer();
  
  request
    .get(url)
    .end(function (res) {
      $ = cheerio.load(res.text);
      var prices = $('.market_listing_price_with_fee').text().trim().replace(/\t/g, '').split('\r\n');

      deferred.resolve(prices);
    });

  return deferred.promise;
}

function convertPrice(price) {
  // euros
  price = price.replace(",", ".")

  var unformatedPrice = accounting.unformat(price);

  if (price.indexOf("$") > -1) {
    return unformatedPrice;
  }

  if (price.indexOf("€") > -1) {
    return round(unformatedPrice * 1.36);
  }

  if (price.indexOf("£") > -1) {
    return round(unformatedPrice * 1.70);
  }
}

function round(num) {
  return Math.round(num * 100) / 100;
}

function checkPrice(target, current) {
  return current < target;
}

function setNewLowest(url, price) {
  lowest[url] = price;
}

if (!module.parent) {
  run();
  setInterval(run, 10000);
}

module.exports = function (url, cb) {
  scrape(url).then(function (prices) {
    if (!prices) return cb(-1);
    if (!prices[0]) return cb(-1);

    var convertedPrice = convertPrice(prices[0]);

    cb(convertedPrice);
  });
};