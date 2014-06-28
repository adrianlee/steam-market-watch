// node js module
// the request module makes REST(API) calls.
var r = require("request");
var _ = require("lodash"); // library with helper functions to do simple object operations.
var open = require('open');



function search() {
	// HTTP GET reqeust to steam market place (most recent)
	r.get("http://steamcommunity.com/market/recent?country=US&language=english&currency=1", function (err, res, body) {
		// request returns a response

		//response is a huge string, so parse it into a JSON object
		var obj = JSON.parse(body).assets["730"];
		var foundItems = firstTry(obj);

		var listingInfo = JSON.parse(body).listinginfo;
		//console.log(listingInfo);

		// console.log(foundItems);

		for (var i = 0; i < foundItems.length; i++) {
			findItemInListing(listingInfo, foundItems[i]);
		}
	});	
}

function scanItem(itemId, itemInfo) {
	console.log("***************itemInfo");
	console.log(itemInfo);
	console.log(itemInfo.name, itemInfo.id);
} 


function firstTry(obj) {
	var found = [];
	//console.log(obj);


	// we want to find cs go in our long response.. lets see where to navigate to in the JSON object.

	// we want to trigger an alert when it finds what i want.
	var find = "Sticker Capsule";

	var items;

	for (var key in obj) {
	  if (obj.hasOwnProperty(key)) {
	    items = obj[key];
	    // console.log(items);
	  }
	}

	if (!items)
		console.log("no new cs go guns!");

	for (var key in items) {
	  //scanItem(key, items[key]);

	  // if (items[key].name = "Sticker Capsule") {
		  // found.push(items[key]);
	  // }

	  // console.log(items[key]);

	  if (items[key].market_name.indexOf("Sticker Capsule") > -1) {
		  found.push(items[key]);
	  }

	  if (items[key].market_name.indexOf("Case") > -1) {
		  found.push(items[key]);
	  }

	  if (items[key].market_name.indexOf("AK-47") > -1) {
	  	  // console.log(items[key]);
		  found.push(items[key]);
	  }

	  // if (items[key].name = "eSports Winter Case") {
		 //  found.push(items[key]);
	  // }
	}

	return found;
}


function findItemInListing(listingInfo, item) {
	for (var key in listingInfo) {
		if (item.owner == listingInfo[key].steamid_lister) {
			console.log(item.name);
			// console.log("Price:", listingInfo[key].converted_price/100);
			// console.log("Fee:", listingInfo[key].converted_fee/100);
			console.log("Total:", "$"+(listingInfo[key].converted_price + listingInfo[key].converted_fee)/100);
			console.log("Lister:", listingInfo[key].steamid_lister);
			// console.log("------------------");
			// console.log(listingInfo[key]);
			// console.log(item);
			console.log("################################");

			// open('http://steamcommunity.com/market/listings/730/' + encodeURI(item.name));
		}
	}
}



setInterval(search, 2000);

//76561197961790405