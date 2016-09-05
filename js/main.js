/* Main JavaScript file */

// GLOBAL VARIABLES //
var map;
var placesService;
var googleNearbySearchResults = ko.observableArray();
var viewmodel = {};
//Find current location and set as default center for map
var defaultLocation = {
    lat: 37.7749,
    lng: 122.4194
};

function initMap() {
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
                addMarker(pos, "You are here");

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



    //Initialize Google maps
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14
    });

    /* Re-center map based on user's current location */
    setCurrentLocation();
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
                //console.log(p);
                googleNearbySearchResults.push(p);
                updatePlaceObject(p);
            }
        });
    }
}


function addMarker(position, title) {
    var marker = new google.maps.Marker({
        position: position,
        map: map,
        animation: google.maps.Animation.DROP,
        icon: '/img/icons/flag_green.png',
        title: title
    });
}

function updatePlaceObject(p) {
    var place = {};

    //place.id = p.place_id;

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

    if (p.formatted_phone_number) {
        place.phone = p.formatted_phone_number;
    } else {
        place.phone = "N/A";
    }
    viewModel.listOfPlaces.push(place);
}


/* KO Starts Here */
$(document).ready(function () {
        viewModel = {
            listOfPlaces: ko.observableArray(),
            place: {
                name: ko.observable('N/A'),
                address: ko.observable('N/A'),
                phone: ko.observable('N/A'),
                yelpReviews: ko.observable('N/A')
            }
        };
        ko.applyBindings(viewModel);
        console.log(viewModel.listOfPlaces());
        //console.log(googleNearbySearchResults());
    }) //Main ends here