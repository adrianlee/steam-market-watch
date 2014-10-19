var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var request = require('superagent');

var r = request.agent();

var database = {};
var databaseCurrentPrice = {};
var lastItems = [];
var filter = [];

server.listen(3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});

io.on('connection', function (socket) {
  // socket.emit('news', { hello: 'world' });

  socket.on('filter', function (data) {
    filter = data;
  });
});


function ping() {
  r
    .get('http://steamcommunity.com/market/recent?country=US&language=english&currency=1')
    .set('Accept', 'application/json')
    .end(function(res){
      if (res.ok) {
        if (!res.body)
          return;

        var assets = res.body.assets["730"];
        var listingInfo = res.body.listinginfo;

        if (!assets || assets == 0)
          return;

        var items = getListings(assets);
        var prices = getPrices(listingInfo, items);
        var items = filterItemData(items);

        lastItems = removeDupItems(lastItems, items);

        if (items)
          io.emit('news', JSON.stringify(items));
      } else {
        console.log('Oh no!');
      }
    });
}

function getListings(assets) {
  var items = [];
  // each weapon
  for (var i in assets) {
    var listings = assets[i];
    for (var item in listings) {
      for (var index=0; index < filter.length; index++) {
        if (listings[item]["market_name"].indexOf(filter[index]) >= 0) {
          items.push(listings[item]);
        }
      }
    }
  }

  return items;
}

function getPrices(listingInfo, items) {
  for (var i in listingInfo) {
    for (var j in items) {
      if (items[j].id == listingInfo[i].asset.id) {
        items[j].listingInfo = listingInfo[i];
      }
    }
  }
}

function filterItemData(items) {
  var filtered = [];

  for (var i in items) {
    var market_hash_name = items[i]["market_hash_name"];
    // average
    if (!database[market_hash_name]) {
      database[market_hash_name] = [ items[i].listingInfo.converted_price + items[i].listingInfo.converted_fee ];
    } else {
      database[market_hash_name].push(items[i].listingInfo.converted_price + items[i].listingInfo.converted_fee);
      if (database[market_hash_name].length > 20) {
        database[market_hash_name].shift();
      }
    }

    items[i].current_price = getCurrentPrice(items[i], items[i].market_hash_name);

    // filter
    filtered.push(createResponse(items[i]));
  }
  return filtered;
}

function createResponse(item) {
  var self = this;

  return {
    market_name: item.market_name,
    price: item.listingInfo.price,
    average_price: database[item.market_hash_name],
    current_price: item.current_price,
    converted_currencyid: item.listingInfo.converted_currencyid,
    converted_fee: item.listingInfo.converted_fee,
    converted_price: item.listingInfo.converted_price,
    currencyid: item.listingInfo.currencyid,
    fee: item.listingInfo.fee,
    price: item.listingInfo.price,
    listingid: item.listingInfo.listingid,
    id: item.id
  }
}

function removeDupItems(lastItems, items) {
  var newLastItems = [];
  for (var i in items) {
    var currentItem = items[i];
    if (currentItem && currentItem.listingid) {
      for (var j in lastItems) {
        if (lastItems[j] == currentItem.listingid) {
          delete items[i];
        }
      }
      newLastItems.push(currentItem.listingid);
    }
  }
  return newLastItems;
}

function getCurrentPrice(item, name) {
  var clone = item;

  r
    .get("http://steamcommunity.com/market/listings/730/" + name + "/render/?query=&country=US&language=english&currency=1")
    .end(function (res) {
      if (!res.body)
        return;

      var listing = res.body.listinginfo;
      var key;
      var price = 0;

      for (key in listing) break;

      if (listing[key]) {

        price = parseFloat(listing[key].converted_price) + parseFloat(listing[key].converted_fee);
       
        console.log(price);

        if (!databaseCurrentPrice[name]) {
          databaseCurrentPrice[name] = { price: price, timestamp: new Date() };
          console.log("new", name);
          clone.current_price = price;
          io.emit('news', JSON.stringify([createResponse(clone)]));
        } else {
          var then = new Date(databaseCurrentPrice[name].timestamp);
          if (new Date() > then.setMinutes(then.getMinutes() + 5) || databaseCurrentPrice[name].price == 0) {
            databaseCurrentPrice[name] = { price: price, timestamp: new Date() };
            console.log("asd", name);
          } else {
            console.log("123", name);
            return databaseCurrentPrice[name].price;
          }
        }

        return price;
      }

    });

  return databaseCurrentPrice[name] && databaseCurrentPrice[name].price || 0;
}

setInterval(ping, 2000);
ping();