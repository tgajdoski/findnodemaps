
//Calling the locateme function when the document finishes loading

 $(document).ready(function() {
    locateMe();
});

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
					  map: map, title: loan , position: latlngset  
					});
					// map.setCenter(marker.getPosition())


					var content = "Marker text: " + loan +  '</h3>';

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
	  
	$.ajax({
			type: 'get',
			url: '/getlocs',
			success: function(data) {
				
				
				
				//Adding markers to it
				
				var markers =[];
				
								
								
				var $mapDiv = $('#map');

				
				var mapDim = {
					height: $mapDiv.height(),
					width: $mapDiv.width()
				}

				
				for(var i=0;i<data.length;i++){
					 markers[i] = new google.maps.Marker({
					  position: new google.maps.LatLng(data[i].latitude, data[i].longitude),
					  map: map,
					  title: 'Marker ' + i,
					  markertext : data[i].markertext
					});
				};
				
				var bounds = (markers.length > 0) ? createBoundsForMarkers(markers) : null;
				//Initializing the options for the map
			/* 	var myOptions = {
				 center: myLatlng,
				 zoom: 8,
				 mapTypeId: google.maps.MapTypeId.ROADMAP,
				};
				 */
				
				
				console.log( bounds.getCenter().lat());
				console.log( bounds.getCenter().lng());
				//Creating the map in teh DOM
				var map_element=document.getElementById("map");
			//	var map = new google.maps.Map(map_element,myOptions);
				
				var map = new google.maps.Map(map_element, {
				center: (bounds) ?  bounds.getCenter() : new google.maps.LatLng(0, 0),
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				zoom: (bounds) ? getBoundsZoomLevel(bounds, mapDim) : 0
				});
				//now fit the map to the newly inclusive bounds

				
				setMarkers(map,markers);
				
			},
			error: function(err) {
				 console.log(err);
			}

		});
 
};
