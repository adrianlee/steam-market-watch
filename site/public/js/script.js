var App = angular.module('App', []);

// configure our routes
App.config(function($routeProvider, $locationProvider, $httpProvider) {
  $routeProvider
    // route for the home page
    .when('/', {
      templateUrl : 'static/pages/home.html',
      controller  : 'mainController'
    })

  //$locationProvider.html5Mode(true);

  $httpProvider.defaults.useXDomain = true;
  delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

// create the controller and inject Angular's $scope
App.controller('mainController', function($scope, $http) {
  // create a message to display in our view
  $scope.message = 'Steam Market Watch';
  $scope.items = JSON.parse(localStorage.getItem("items")) || [];

  $scope.submit = function () {
    if (!$scope.newItem.targetPrice || !$scope.newItem.url) {
      return;
    }

    if (!validateUrl($scope.newItem.url)) {
      alert("Please enter a valid URL")
      return;
    }

    if ($scope.newItem.targetPrice <= 0) {
      alert("Enter a proper target price value!");
      return;
    }

    addWatcher($scope.newItem);
  };

  $scope.remove = function (item) {
    // console.log(item);
    $scope.items.splice($scope.items.indexOf(item), 1);
    save();
  }

  function addWatcher(newItem) {
    // parse name
    newItem.name = decodeURIComponent(newItem.url.substr(newItem.url.lastIndexOf('/') + 1));

    for (var i in $scope.items) {
      if ($scope.items[i].url == newItem.url) {
        return alert("You already have this item in your watch list");
      }
    }

    requestUrl(newItem.url, function (price) {
      newItem.currentPrice = price;
      newItem.updated = new Date();

      if (price > 0) {
        // add item to items list
        $scope.items.push(newItem);

        // clear form
        $scope.newItem = {};

        // save items list to localStorage
        save();
      } else {
        alert("Unable to add item to list. Check your URL.")
      }
    });
    
  }

  function save() {
    localStorage.setItem("items", JSON.stringify($scope.items));
  }

  function validateUrl(url) {
    // requestUrl(url);
    return url.indexOf("http://steamcommunity.com/market/listings/") >= 0;
  }

  function requestUrl(url, cb) {
    $http.get("/check?url="+encodeURIComponent(url)).
      success(function(data) {
        cb(data);
      });
  }

  function playSound() {
    document.getElementById('audiotag1').play();
  }

  function scan() {
    for (var item in $scope.items) {
      (function (item) {
        requestUrl($scope.items[item].url, function (price) {
          if (price == -1 || !price) {
            return;
          }

          if ($scope.items[item].targetPrice > price) {
            playSound();
            alert("PRICE DROP! " + $scope.items[item].name + " costs " + price);
          }
          $scope.items[item].currentPrice = price;
          $scope.items[item].updated = new Date();
          save();
        });
      })(item);
    }
  }

  setInterval(scan, 25000);
  scan();
});