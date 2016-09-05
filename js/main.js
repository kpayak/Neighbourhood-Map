/* Main JavaScript file */

// GLOBAL VARIABLES //
var map;
var placesService;
var viewmodel = {};

//Marker colors:
var markerColorHome = '19B5FE';
var markerColorDefault = 'F22613';

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
            addMarker(pos, "You are here", "H", markerColorHome);

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
    addMarker(defaultLocation, "You are here");
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
            formattedAddress = "Failed to reverse geo-code"
        }

        $('.location').text(formattedAddress);
        $('.indicator').css({
            'background-color': color
        });

    });
}




function addMarker(position, title, markerText, markerColor) {
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + markerText + "|" + markerColor + "|FFF");

    var marker = new google.maps.Marker({
        position: position,
        map: map,
        //animation: google.maps.Animation.DROP,
        icon: pinImage,
        title: title
    });
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
    if (p.photos.length > 0) {
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


    //Add marker for each place
    viewModel.listOfPlaces.push(place);
    addMarker({
        lat: p.geometry.location.lat(),
        lng: p.geometry.location.lng()
    }, p.name, viewModel.listOfPlaces().length, markerColorDefault);
}


function initMap() {

    //Initialize Google maps
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13
    });

    /* Re-center map based on user's current location */
    setCurrentLocation();
}


function googleTextSearch(position, queryText) {
    var placesService = new google.maps.places.PlacesService(map);
    var request = {
        location: position,
        radius: '10000',
        query: queryText
    };

    placesService.textSearch(request, textSearchCB);
}

function textSearchCB(results, status) {
    console.log(status);
    console.log(results);
}

function googleNearbySearch(position) {
    placesService = new google.maps.places.PlacesService(map);
    var currentLatLng = map.getCenter();
    var initialRequest = {
        location: position,
        radius: 6000,
        types: ['restaurant', 'cafe']
    };
    placesService.nearbySearch(initialRequest, callback);
}

function callback(results, status) {
    for (var i = 0; i < results.length; i++) {
        var place = placesService.getDetails({
            placeId: results[i].place_id
        }, function (p, status) {
            if (status === "OK") {
                updatePlaceObject(p);
                //Add marker for each place

            }
        });
    }
}

/* KO Starts Here */
$(document).ready(function () {
        viewModel = {
            listOfPlaces: ko.observableArray(),
            place: {
                name: ko.observable('N/A'),
                address: ko.observable('N/A'),
                phone: ko.observable('N/A'),
                thumbnail: '',
                yelpReviews: ko.observable('N/A')
            }
        };
        ko.applyBindings(viewModel);
        console.log(viewModel.listOfPlaces());
        googleTextSearch({
            lat: 37.4167317,
            lng: -121.90103529999999
        }, "Indian");
    }) //Main ends here