//Setup web server and socket
var twitter = require('twitter'),
    express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
	mysql = require("mysql");




// First you need to create a connection to the db
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "nodetest"
}),
  POLLING_INTERVAL = 10000,
  pollingTimer;

//Setup twitter stream api
var twit = new twitter({
  consumer_key: 'oDOqczexP76PtvoyMfICGragO',
  consumer_secret: 'm935j6FwAppFeG9UN3m65rZ4EM9dTyYNEfbA0jkb7v0cUYoQUA',
  access_token_key: '708959820485943297-yOfnHKSaw6Bc5Fs2KOXAzKGzAVSXng3',
  access_token_secret: 'tmsAVRo2XJyQ9ReuJszJB1pkdKssVpKMqVkE5CS1ypOq8'
}),
stream = null;

//Use the default port (for beanstalk) or default to 8081 locally
server.listen(process.env.PORT || 3000);

//Setup rotuing for app
app.use(express.static(__dirname + '/public'));

 var i = 0;

//Create web sockets connection.
io.sockets.on('connection', function (socket) {

		// work with mysql;





  socket.on("start tweets", function() {

    if(stream === null) {
      //Connect to twitter stream passing in filter for entire world.
      twit.stream('statuses/filter', {'locations':'-180,-90,180,90'}, function(stream) {
          stream.on('data', function(data) {
              // Does the JSON result have coordinates

              if (data.coordinates){
                if (data.coordinates !== null){
                  //If so then build up some nice json and send out to web sockets
                  var outputPoint = {"lat": data.coordinates.coordinates[0],"lng": data.coordinates.coordinates[1]};

                  socket.broadcast.emit("twitter-stream", outputPoint);

                  //Send out to web sockets channel.
                  socket.emit('twitter-stream', outputPoint);
                }
                else if(data.place){
                  if(data.place.bounding_box === 'Polygon'){
                    // Calculate the center of the bounding box for the tweet
                    var coord, _i, _len;
                    var centerLat = 0;
                    var centerLng = 0;

                    for (_i = 0, _len = coords.length; _i < _len; _i++) {
                      coord = coords[_i];
                      centerLat += coord[0];
                      centerLng += coord[1];
                    }
                    centerLat = centerLat / coords.length;
                    centerLng = centerLng / coords.length;

                    // Build json object and broadcast it
                    var outputPoint = {"lat": centerLat,"lng": centerLng};
                    socket.broadcast.emit("twitter-stream", outputPoint);

                  }
                }
              }
              stream.on('limit', function(limitMessage) {
                return console.log(limitMessage);
              });

              stream.on('warning', function(warning) {
                return console.log(warning);
              });

              stream.on('disconnect', function(disconnectMessage) {
                return console.log(disconnectMessage);
              });
          });
      });


   twit.stream('statuses/filter', {track: 'java,scala,akka,lightbend,typesafe'}, function(stream) {
   stream.on('data', function(tweet) {
    // console.log(tweet.text);
	if (tweet){

                  //If so then build up some nice json and send out to web sockets
                  var outputPoint = {"text": tweet.text,"created_at": tweet.created_at, "user": tweet.user.name, "imageurl": tweet.user.profile_image_url};
                  socket.broadcast.emit("twitter-java", outputPoint);
                  socket.emit('twitter-java', outputPoint);

				  // na sekoj tweet sto se pojavuva gi osvezuva zapisite od mysql - treba da e nezavisno


                }
  });

  stream.on('error', function(error) {
    throw error;
  });
});

   }
  });


	setInterval(function() {
    if ( new Date().getSeconds() === 0  || new Date().getSeconds() === 30 )  pollingLoop(socket);;
},1000);

	// pollingTimer = setTimeout(pollingLoop(socket), POLLING_INTERVAL);

    // Emits signal to the client telling them that the
    // they are connected and can start receiving Tweets
    socket.emit("connected");
});



// zemi od mysql baza

var pollingLoop = function(socket) {

  // Doing the database query

  var query = con.query('SELECT * FROM locations where solved =0'),
    locations = []; // this array will contain the result of our db query

  // setting the query listeners
  query
    .on('error', function(err) {
      // Handle error, and 'end' event will be emitted after this as well
      console.log(err);
      updateSockets(err);
    })
    .on('result', function(location) {
      // it fills our array looping on each user row inside the db
      locations.push(location);
      console.log(location);
	 /*  socket.broadcast.emit("mysql-data", locations);
	  socket.emit('mysql-data', locations); */
    })
    .on('end', function() {
      // loop on itself only if there are sockets still connected
      //  pollingTimer = setTimeout(pollingLoop(socket), POLLING_INTERVAL);
	  console.log("pooling dddd");
		 updateSockets(socket, {
          locations: locations
        });
    });
};


var updateSockets = function(socket, data) {
  // adding the time of the last update
  data.time = new Date();
    socket.volatile.emit('mysql-data', data);
};
