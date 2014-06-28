/* Hapi Setup */
var Hapi = require("hapi");
var serverOptions = {
    cors: true,
    security: true,
    views: {
        engines: {
            jade: require("jade")
        },
        path: "./views"
    }
};
var server = new Hapi.Server("localhost", 8000, serverOptions);

var checker = require('../page');

/* Routes */
server.route({
    path: "/",  
    method: "GET",
    handler: function(request, reply) {
        reply.view("hello", {
            pageName: "Welcome"
        });
    }
});

server.route({
    path: "/check",  
    method: "GET",
    handler: function(request, reply) {
      checker(request.query.url, function (price) {
        reply(price);
      });
    }
});

server.route({
    path: "/static/{path*}",
    method: "GET",
    handler: {
        directory: {
            path: "./public",
            listing: false,
            index: false
        }
    }
});

/* Start Server */
server.start(function() {
    console.log("Hapi server started @", server.info.uri);
});