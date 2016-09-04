/* Main JavaScript file */

// GLOBAL VARIABLES //
var map;
var placesService;
var googleNearbySearchResults = ko.observableArray();
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

/* KO Starts Here */
$(document).ready(function () {
        var viewModel = {
            place: {
                name: ko.observable('N/A'),
                address: ko.observable('N/A'),
                phone: ko.observable('N/A'),
                yelpReviews: ko.observable('N/A')
            }

            //            add: function () {}
        };
        ko.applyBindings(viewModel);

        var places = ko.observableArray();
        var noOfPlaces = ko.observable(googleNearbySearchResults().length);
        console.log(noOfPlaces());
        for (var p = 0; p < noOfPlaces(); p++) {
            console.log(googleNearbySearchResults()[p].name);
        }

        //console.log(googleNearbySearchResults().length);
    }) //Main ends here