/* Main JavaScript file */

// GLOBAL VARIABLES //
var map;
var placesService;
var viewmodel = {};
var markers = [];
var bounds;

//Marker colors:
var markerColorHome = '19B5FE';
var markerColorDefault = 'F22613';
var markerColorHover = '26C281';

//Find current location and set as default center for map
var defaultLocation = {
    lat: 37.7749,
    lng: 122.4194
};

function setCurrentLocation() {
    var pos;
    var geolocOptions = {
        maximumAge: 10 * 60 * 1000, //Cache current location for 10 minutes
        timeout: 20 * 1000, //Timeout in 20 seconds.
        enableHighAccuracy: false //Low accuracy for faster detection time
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos);
            googleNearbySearch(pos);
            //Add a marker for current location
            addMarker(pos, "You are here", "", markerColorHome, "home");
            //Find formatted address of current location
            reverseGeoCode(pos, '#2ECC71');
        }, geolocErrorHandler, geolocOptions);
    }
}

//Function to handle Geo-locator errors.
function geolocErrorHandler(error) {
    //console.log("Error code: " + error.code);
    map.setCenter(defaultLocation);
    reverseGeoCode(defaultLocation, '#F64747');
    googleNearbySearch(defaultLocation);
    addMarker(defaultLocation, "You are here", "H", markerColorHome);
}

// Function to reverse geo-code from a lat,lng 
function reverseGeoCode(position, color) {
    var geocoder = new google.maps.Geocoder();
    var formattedAddress = "";
    geocoder.geocode({
        'location': position
    }, function (results, status) {
        if (status === "OK") {
            formattedAddress = results[1].formatted_address;

        } else {
            formattedAddress = "Failed to reverse geo-code";
        }

        $('.location').text(formattedAddress);
        $('.indicator').css({
            'background-color': color
        });

    });
}

function addMarker(position, title, markerText, markerColor, id) {
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + markerText + "|" + markerColor + "|FFF");

    var marker = new google.maps.Marker({
        position: position,
        map: map,
        //animation: google.maps.Animation.DROP,
        icon: pinImage,
        title: title,
        id: id
    });
    bounds.extend(marker.position);
    map.setCenter(bounds.getCenter());
    map.setZoom(12);
    markers.push(marker);
}

function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function reCenterBounds() {
    bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

function updatePlaceObject(p) {

    var place = {};

    place.id = p.place_id;

    if (p.name) {
        place.name = p.name;
    } else {
        place.name = "N/A";
    }

    if (p.address_components.length > 0) {
        place.address = p.address_components[0].short_name + " " + p.address_components[1].short_name + ", " + p.address_components[2].short_name + " " + p.address_components[4].short_name + " " + p.address_components[6].short_name;
    } else {
        place.address = "N/A";
    }

    //Phone number
    if (p.formatted_phone_number) {
        place.phone = p.formatted_phone_number;
    } else {
        place.phone = "N/A";
    }

    //Thumbnail
    if (p.photos) {
        place.thumbnail = p.photos[0].getUrl({
            'maxWidth': 100,
            'maxHeight': 100
        });
    } else {
        place.thumbnail = '';
    }

    //Add Lat Lng Info
    if (p.geometry.location) {
        place.latlng = {
            lat: p.geometry.location.lat(),
            lng: p.geometry.location.lng()
        };
    }

    //Add index to find where this object is in listOfPlaces list
    place.index = viewModel.listOfPlaces().length;

    //Add marker for each place
    viewModel.listOfPlaces.push(place);
    addMarker({
        lat: p.geometry.location.lat(),
        lng: p.geometry.location.lng()
    }, p.name, viewModel.listOfPlaces().length, markerColorDefault, place.id);
}

function googleTextSearch(position, queryText) {
    clearMarkers();
    var placesService = new google.maps.places.PlacesService(map);
    var request = {
        location: position,
        radius: '6000',
        query: queryText
    };
    placesService.textSearch(request, callback);
}

function googleNearbySearch(position) {
    placesService = new google.maps.places.PlacesService(map);
    var currentLatLng = map.getCenter();
    var initialRequest = {
        location: position,
        radius: 6000,
        types: ['restaurant', 'cafe', 'bus_station', 'city_hall', 'department_store', 'home_goods_store', 'transit_station', 'train_station', 'subway_station', 'shopping_mall', 'museum', 'library', 'hospital']
    };
    placesService.nearbySearch(initialRequest, callback);
}

function callback(results, status) {
    //Clear list of places before updating it with search results
    viewModel.listOfPlaces.removeAll();

    //Clear all markers before updating results

    for (var i = 0; i < results.length; i++) {
        var place = placesService.getDetails({
            placeId: results[i].place_id
        }, function (p, status) {
            if (status === "OK") {
                updatePlaceObject(p);
            }
        });
    }
}

function startSearch() {
    //Listen to click events of search icon
    var searchQuery;
    searchQuery = $('input').val();
    googleTextSearch(map.getCenter(), searchQuery);
    reCenterBounds();
}

//Google maps initiates from Here. This can be treated as the starting point/main() of this application.
function initMap() {

    //Initialize Google maps
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13
    });

    /* Re-center map based on user's current location */
    setCurrentLocation();
    reCenterBounds();
    $('.search-icon').click(startSearch);

}

/* KO Starts Here */
viewModel = {
    listOfPlaces: ko.observableArray(),
    highlightMarker: function () {
        //        console.log("calling highlight marker for " + this.index);
        var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + (this.index + 1) + "|" + markerColorHover + "|FFF");
        markers[this.index + 1].setIcon(pinImage);
    },
    resetMarkerColor: function () {
        //        console.log("calling highlight marker for " + this.index);
        var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + (this.index + 1) + "|" + markerColorDefault + "|FFF");
        markers[this.index + 1].setIcon(pinImage);
    }
};

ko.applyBindings(viewModel);