function initialize() {
  //Setup Google Map
  var myLatlng = new google.maps.LatLng(17.7850,-12.4183);
  var light_grey_style = [{"featureType":"landscape","stylers":[{"saturation":-100},{"lightness":65},{"visibility":"on"}]},{"featureType":"poi","stylers":[{"saturation":-100},{"lightness":51},{"visibility":"simplified"}]},{"featureType":"road.highway","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"road.arterial","stylers":[{"saturation":-100},{"lightness":30},{"visibility":"on"}]},{"featureType":"road.local","stylers":[{"saturation":-100},{"lightness":40},{"visibility":"on"}]},{"featureType":"transit","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"administrative.province","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":-25},{"saturation":-100}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffff00"},{"lightness":-25},{"saturation":-97}]}];
  var myOptions = {
    zoom: 2,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.LEFT_BOTTOM
    },
    styles: light_grey_style
  };
  var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

 // console.log(map);

  //Setup heat map and link to Twitter array we will append data to
  var heatmap;
    var liveTweets = new google.maps.MVCArray();
  heatmap = new google.maps.visualization.HeatmapLayer({
    data: liveTweets,
    radius: 25
  });
  heatmap.setMap(map);

  if(io !== undefined) {
    // Storage for WebSocket connections
    var socket = io.connect('/');

    // This listens on the "twitter-steam" channel and data is
    // received everytime a new tweet is receieved.
    socket.on('twitter-stream', function (data) {

//	console.log("twit stream");
      //Add tweet to the heat map array.
      var tweetLocation = new google.maps.LatLng(data.lng,data.lat);
      liveTweets.push(tweetLocation);

      //Flash a dot onto the map quickly
      var image = "css/small-dot-icon.png";
      var marker = new google.maps.Marker({
        position: tweetLocation,
        map: map,
        icon: image
      });
      setTimeout(function(){
        marker.setMap(null);
      },600);

    });

	socket.on('twitter-java', function (data) {
//	console.log("twit java");
      var tweetData = data;
	//  console.log(tweetData);
			$('#tweetdate').text(tweetData.created_at);
			$('#tweetuser').text(tweetData.text);
			$('#tweettext').text(tweetData.user);
			$('#tweetimageurl').attr("src", tweetData.imageurl);
    });


	socket.on('mysql-data', function (data) {
		  					
				var $mapDiv = $('#map1');

				
				var mapDim = {
					height: $mapDiv.height(),
					width: $mapDiv.width()
				}

				var markers =[];
				
				for(var i=0;i<data.locations.length;i++){
				//	console.log(data.locations[i]);
				//	console.log(data.locations[i].latitude);
				//	console.log(data.locations[i].longitude);
					
					 markers[i] = new google.maps.Marker({
					  position: new google.maps.LatLng(data.locations[i].latitude, data.locations[i].longitude),
					  map: map,
					  title: 'Marker ' + i,
					  markertext : data.locations[i].markertext
					});
					
					markers[i].setAnimation(google.maps.Animation.BOUNCE);
				};
				

				var bounds = (markers.length > 0) ? createBoundsForMarkers(markers) : null;
				//Initializing the options for the map
			/* 	var myOptions = {
				 center: myLatlng,
				 zoom: 8,
				 mapTypeId: google.maps.MapTypeId.ROADMAP,
				};
				 */
				
				
			//	console.log( bounds.getCenter());
			//	console.log( bounds.getCenter().lng());
				//Creating the map in teh DOM
				var map_element=document.getElementById("map1");
			//	var map = new google.maps.Map(map_element,myOptions);
				
				var map = new google.maps.Map(map_element, {
				center: (bounds) ?  bounds.getCenter() : new google.maps.LatLng(0, 0),
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				zoom: (bounds) ? getBoundsZoomLevel(bounds, mapDim) : 0
				});
				//now fit the map to the newly inclusive bounds

				
				setMarkers(map,markers);
	  

    });


    // Listens for a success response from the server to
    // say the connection was successful.
    socket.on("connected", function(r) {

      //Now that we are connected to the server let's tell
      //the server we are ready to start receiving tweets.
      socket.emit("start tweets");

	  // try with timeout to invoce mysql query
	//  setTimeout( function() {socket.emit("start mysql");}, 5000);


    });
  }
}




//Calling the locateme function when the document finishes loading

 

function getBoundsZoomLevel(bounds, mapDim) {
    var WORLD_DIM = { height: 256, width: 256 };
    var ZOOM_MAX = 21;

    function latRad(lat) {
        var sin = Math.sin(lat * Math.PI / 180);
        var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

    var lngDiff = ne.lng() - sw.lng();
    var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
    var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
}



function createBoundsForMarkers(markers) {
    var bounds = new google.maps.LatLngBounds();
    $.each(markers, function() {
        bounds.extend(this.getPosition());
    });
    return bounds;
}




//Function to locate the user
var locateMe = function(){

	var map_element= $('#map');
		if (navigator.geolocation) {
		   var position= navigator.geolocation.getCurrentPosition(loadMap);
		} else {
		  map_element.innerHTML = "Geolocation is not supported by this browser.";
		}
  	
};

	function setMarkers(map,locations){
		var marker, i
		for (i = 0; i < locations.length; i++)
		{  

			 var loan = locations[i].markertext;
			 var lat =  locations[i].position.lat();
			 var long =  locations[i].position.lng();
			
		//	console.log ( locations[i].position);
			

			 latlngset = new google.maps.LatLng(lat, long);
				
				var marker = new google.maps.Marker({  
					  map: map, 
					  title: loan, 
					  position: latlngset,  
					});
					
					if (i==0){
					  marker.setAnimation(google.maps.Animation.BOUNCE)	;		  
					};
					// map.setCenter(marker.getPosition())
				 

					var content =  loan +  '</h3>';

			  var infowindow = new google.maps.InfoWindow();

			google.maps.event.addListener(marker,'click', (function(marker,content,infowindow){ 
					return function() {
					   infowindow.setContent(content);
					   infowindow.open(map,marker);
					};
				})(marker,content,infowindow)); 

		}
};
		   

//Lets load the mop using the position
var loadMap = function(position) {
  var loading= $('#loading');
  var latitude=position.coords.latitude;
  var longitude=position.coords.longitude;
  var myLatlng = new google.maps.LatLng(latitude, longitude);
     	//Initializing the options for the map
     	var myOptions = {
         center: myLatlng,
         zoom: 15,
         mapTypeId: google.maps.MapTypeId.ROADMAP,
      };
  		//Creating the map in teh DOM
      var map_element=document.getElementById("map2");
      var map = new google.maps.Map(map_element,myOptions);
  		//Adding markers to it
      var marker = new google.maps.Marker({
          position: myLatlng,
          map: map,
          title: 'You are here'
      });
  		//Adding the Marker content to it
      var infowindow = new google.maps.InfoWindow({
          content: "<h2>You are here :)</h2>",
        	//Settingup the maxwidth
          maxWidth: 300
      });
	  
	  
  		//Event listener to trigger the marker content
      google.maps.event.addListener(marker, 'click', function() {
          infowindow.open(map,marker);});
		  
		  
		  
		  
		  
		// location picker  for modal 
		var map_element2=document.getElementById("map_canvas_click");
		var settings = {
        zoom: 11,
        center: myLatlng,
        scaleControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        navigationControl: true,
        navigationControlOptions: {
            style: google.maps.NavigationControlStyle.DEFAULT
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
    };

    mapp = new google.maps.Map(map_element2, settings);
    google.maps.event.addListener(mapp, 'click', function(event)
	{
		// alert('Lat: ' + event.latLng.lat() + ' Lng: ' + event.latLng.lng())
			
		$('#latit').val(event.latLng.lat());
		$('#longit').val(event.latLng.lng());
		
	});
	
	
 
};


$(document).ready(function() {
    
				
	$('#modal-form').modal('hide');
	//$('#modal-form').hide();
	
	
	locateMe();
	
		$( "#addmarker" ).click(function() {
				
		// treba da se postira i da se fati na starna na node.js i da se insertira vo mysql
		var latitude = $('#latit').val();
		var longitude = $('#longit').val();
		var markertext = $('#markertext').val();
	/* 	var data = {};
		
		data.latitude =latitude;
		data.longitude = longitude;
		data.markertext = markertext;
		   */
		//  console.log(data);
		  
	 	$.ajax({
			type: 'post',
			url: '/setlocs?latitude='+ latitude+'&longitude='+ longitude+'&markertext='+ markertext,
			contentType: 'application/x-www-form-urlencoded',
			success: function(datana) {
				// console.log(datana);
				// $('#modal-form').hide();
				$('#modal-form').modal('hide');
				
				
				toastr["success"]( "please wait for main map to refresh", "successful insert of new location");

				toastr.options = {
				  "closeButton": false,
				  "debug": false,
				  "newestOnTop": false,
				  "progressBar": false,
				  "positionClass": "toast-top-right",
				  "preventDuplicates": false,
				  "onclick": null,
				  "showDuration": "300",
				  "hideDuration": "1000",
				  "timeOut": "5000",
				  "extendedTimeOut": "1000",
				  "showEasing": "swing",
				  "hideEasing": "linear",
				  "showMethod": "fadeIn",
				  "hideMethod": "fadeOut"
				}


			},
			error: function(err) {
				 console.log(err);
			}
		}); 
		
		
	});
	
	

		$( "#popupmarker" ).click(function() {
			
			
			
			$('#latit').val("");
			$('#longit').val("");
		 
			$('#markertext').val("");
			$('#modal-form').modal('show');
		 
					
					
					
 var myLatlng = new google.maps.LatLng(33.84981264529933,-84.29855352267623);
     	//Initializing the options for the map
     	
						var map=document.getElementById("map_canvas_click");
		var settings = {
        zoom: 8,
        center: myLatlng,
        scaleControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        navigationControl: true,
        navigationControlOptions: {
            style: google.maps.NavigationControlStyle.DEFAULT
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
    };

    mapp = new google.maps.Map(map, settings);
    google.maps.event.addListener(mapp, 'click', function(event)
	{
		// alert('Lat: ' + event.latLng.lat() + ' Lng: ' + event.latLng.lng())
			
		$('#latit').val(event.latLng.lat());
		$('#longit').val(event.latLng.lng());
		
	});
						
						
			 $('#modal-form').modal({
					backdrop: 'static',
					keyboard: false
				}).on('shown.bs.modal', function () {
					google.maps.event.trigger(map, 'resize');
					map.setCenter(center);
				});
	
	
	}); 


});

