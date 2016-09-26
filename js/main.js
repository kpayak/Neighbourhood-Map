/* Main JavaScript file */

// GLOBAL VARIABLES //
var map;
var placesService;
var viewmodel = {};
var bounds;
var infowindow;
var activeMarkerIndex;
var clientID = "C1VSX4Z10JN5IVAZG54PHQZIHKOWHCLT1HV5OBI5HDI3G2BP";
var clientSecret = "BRVRMH3JTY4DA2ACVBHC5YDPKAHU354HOYO4V3MUNYESPJWV";

//Marker colors:
var markerColorHome = '19B5FE';
var markerColorDefault = 'F22613';
var markerColorHover = '26C281';

//Find current location and set as default center for map
var defaultLocation = {
    lat: 37.7749,
    lng: -122.4194
};

function googleTextSearch(position, queryText) {
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
    var query1 = "new query";
    var currentLatLng = map.getCenter();
    var initialRequest = {
        location: position,
        radius: 10000,
        types: ['restaurant', 'cafe', 'bus_station', 'department_store', 'home_goods_store', 'transit_station', 'train_station', 'subway_station', 'shopping_mall']
    };
    placesService.nearbySearch(initialRequest, callback);
}

function callback(results, status) {
    console.log(results);
    viewModel.listOfPlaces.removeAll();
    //Remove error box
    removeErrorBox();
    console.log(status);
    if (status === "OK") {
        bounds = new google.maps.LatLngBounds();
        results.forEach(getFourSqRating);
    } else if (status === "ZERO_RESULTS") {
        showErrorBox("Cannont find results matching your query");
    } else {
        showErrorBox("Oops..Something went wrong with Google Maps API");
    }
}

function showErrorBox(errorMessage) {
    $('.error-box').css({
        "transform": "translateX(0px)"
    });
    $('.error-box').html(errorMessage);
}

function removeErrorBox() {
    $('.error-box').html("");
    $('.error-box').css({
        "transform": "translateX(-1200px)"
    });
}

function getFourSqRating(item) {
    var trimmedGName = item.name.toLowerCase().replace(/\s/g, "");
    var lat = item.geometry.location.lat();
    var lng = item.geometry.location.lng();
    var fSQRequest = "https://api.foursquare.com/v2/venues/explore?client_id=" + clientID + "&client_secret=" + clientSecret + "&v=20160918&ll=";
    fSQRequest += lat + "," + lng + "&radius=250&venuePhotos=1&limit=20";
    var latDiff = 100;
    var lngDiff = 100;
    var fqvenue = {};
    $.ajax({
        url: fSQRequest,
        dataType: 'json'
    }).done(function (data) {
        for (var i = 0; i < data.response.groups[0].items.length; i++) {
            var venue = data.response.groups[0].items[i].venue;
            var venueName = venue.name.toLowerCase().replace(/\s/g, "");
            var venueLat = venue.location.lat;
            var venueLng = venue.location.lng;

            //Find closest location from current google maps location
            if (latDiff > Math.abs((venue.location.lat - lat) * 100 / lat) && lngDiff > Math.abs((venue.location.lng - lng) * 100 / lng) && (trimmedGName.indexOf(venueName) !== -1)) {
                latDiff = Math.abs((venue.location.lat - lat) * 100 / lat);
                lngDiff = Math.abs((venue.location.lng - lng) * 100 / lng);
                fqvenue = venue;
            }
        }
        //Call Update place object if there is a match betweeen google maps location and foursquare location
        if (fqvenue.name) {
            fqvenue.icon = item.icon;
            updatePlaceObject(fqvenue);
        }
        map.fitBounds(bounds);
    }).error(function () {
        showErrorBox("Oops..something went wrong with FourSquare API");
    });
}

//This function gets user's current location and then searches for places nearby
function getCurrentLocation() {
    var pos;
    var geolocOptions = {
        maximumAge: 10 * 60 * 1000, //Cache current location for 10 minutes
        timeout: 20 * 1000, //Timeout in 20 seconds.
        enableHighAccuracy: false //Low accuracy for faster detection time
    };

    //Find user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos);
            googleNearbySearch(pos, bounds);
            //Add a marker for current location
            addMarker(pos, "You are here", "", markerColorHome);
            //Find formatted address of current location
            reverseGeoCode(pos, '#2ECC71');
        }, geolocErrorHandler, geolocOptions);
    } else {
        //If user device does not have location services then set map to default location
        map.setCenter(defaultLocation);
        reverseGeoCode(defaultLocation, '#F64747');
        googleNearbySearch(defaultLocation, bounds);
        addMarker(defaultLocation, "Default Marker", "", markerColorHome);
    }
}

//Function to handle Geo-locator errors.
function geolocErrorHandler(error) {
    map.setCenter(defaultLocation);
    reverseGeoCode(defaultLocation, '#F64747');
    addMarker(defaultLocation, "Default Marker", "", markerColorHome);
    googleNearbySearch(defaultLocation);
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

function addMarker(position, title, markerText, markerColor) {
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + markerText + "|" + markerColor + "|FFF");
    var bounds = new google.maps.LatLngBounds();
    var marker = new google.maps.Marker({
        position: position,
        map: map,
        //animation: google.maps.Animation.DROP,
        icon: pinImage,
        title: title
    });
    bounds.extend(marker.position);
}

function populateInfoWindow(place) {
    var nameString = "<div class='infowindow-header'><div><h2>" + place.name + "</div></h2>";
    var iconString = "<div><img class='infowindow-img' src=" + place.icon + "></div></div>";
    var addressString = "<p class='infowindow-text'>" + place.address + "</p>";
    var phoneString = "<p class='infowindow-text'>" + place.phone + " | ";
    var websiteString = "<a href=" + place.website + ">Website</a>" + "</p>";
    var hoursString = "<p class='infowindow-text'>Current Status: " + place.hours + "</p>";
    console.log(iconString);
    contentString = iconString + nameString + addressString + phoneString + websiteString + hoursString;
    infowindow.setContent(contentString);
    setMarkerColor(place, markerColorHover);
    if (activeMarkerIndex) {
        setMarkerColor(viewModel.listOfPlaces()[activeMarkerIndex - 1], markerColorDefault);
    }
    activeMarkerIndex = place.index;
    infowindow.open(map, place.marker);
}

function setMarkerColor(place, color) {
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + place.index + "|" + color + "|FFF");
    place.marker.setIcon(pinImage);
}

function updatePlaceObject(p) {

    var place = {};
    //Flag to show/hide in "view". Default set to true
    place.show = ko.observable(true);

    //Place icon
    place.icon = p.icon;

    //Update Name property of name
    place.name = p.name ? p.name : "N/A";

    //Update Address attribute of place object
    place.address = p.location.formattedAddress ? p.location.formattedAddress[0] + " " + p.location.formattedAddress[1] : "N/A";

    //Phone number
    place.phone = p.contact.formattedPhone ? p.contact.formattedPhone : "N/A";

    //Update Photos for object
    place.thumbnail = (p.photos.count >= 1) ? p.photos.groups[0].items[0].prefix + "100x100" + p.photos.groups[0].items[0].suffix : '';

    //Add Lat Lng Info
    if (p.location) {
        place.latlng = {
            lat: p.location.lat,
            lng: p.location.lng
        };
    }

    //Add website info
    place.website = p.url ? p.url : "No Website found for this place.";

    //Add Open Hours info
    if (p.hours) {
        place.hours = p.hours.open ? "Open Now" : "Closed Now";
    } else {
        place.hours = "N/A";
    }

    //Add index property for easy searching 
    place.index = viewModel.listOfPlaces().length + 1;

    //FourSquare rating of this place, initialize to N/A
    place.rating = p.rating ? ko.observable(p.rating.toString()) : ko.observable("N/A");

    //Prepare marker object for each place
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + place.index + "|" + markerColorDefault + "|FFF");

    place.marker = new google.maps.Marker({
        position: place.latlng,
        icon: pinImage,
        title: place.name,
        id: place.id
    });

    //Add marker for each place
    place.addMarker = function () {
        bounds.extend(place.marker.position);
        place.marker.visible = place.show();
        place.marker.setMap(map);
        //Add click listener to markers
        place.marker.addListener('click', function () {
            populateInfoWindow(place);
        });
    }

    //Add marker for current place
    place.addMarker();

    //Update list of places observable array
    viewModel.listOfPlaces.push(place);
}

function filter() {
    var searchQuery = $('input').val().toLocaleLowerCase();
    var lowerCaseName = "";
    var counter = 1;
    var errorBox = $('.error-box');
    for (var i = 0; i < viewModel.listOfPlaces().length; i++) {
        lowerCaseName = viewModel.listOfPlaces()[i].name.toLowerCase();
        if (lowerCaseName.search(searchQuery) !== -1) {
            //Remove error box
            errorBox.html("");
            errorBox.css({
                "transform": "translateX(-1200px)"
            });
            viewModel.listOfPlaces()[i].show(true);
            viewModel.listOfPlaces()[i].addMarker();
        } else {
            counter++;
            viewModel.listOfPlaces()[i].show(false);
            viewModel.listOfPlaces()[i].addMarker();
        }
    }

    //If no results match query then show error box
    if (counter > viewModel.listOfPlaces().length) {
        //Show error box
        showErrorBox("No results match your query");
    }
}

function startSearch() {
    var searchQuery = $('input').val();
    googleTextSearch(map.getCenter(), searchQuery);
}

//Google maps initiates from Here. This can be treated as the starting point/main() of this application.
function initMap() {

    //Initialize Google maps
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        mapTypeControl: false
    });

    //Bounds object
    bounds = new google.maps.LatLngBounds();
    //Infowindow 
    infowindow = new google.maps.InfoWindow();

    //Remove infowindow if map is clicked
    google.maps.event.addListener(map, 'click', function () {
        infowindow.close();
        if (activeMarkerIndex) {
            setMarkerColor(viewModel.listOfPlaces()[activeMarkerIndex - 1], markerColorDefault);
        }
    });

    /* Re-center map based on user's current location */
    getCurrentLocation();
    $('.search').keyup(filter);
    $('.search-icon').click(startSearch);
}

/* KO Starts Here */
viewModel = {
    listOfPlaces: ko.observableArray(),
    highlightMarker: function () {
        var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + this.index + "|" + markerColorHover + "|FFF");
        this.marker.setIcon(pinImage);
    },
    resetMarkerColor: function () {
        var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + this.index + "|" + markerColorDefault + "|FFF");
        this.marker.setIcon(pinImage);
    },
    onClick: function () {
        populateInfoWindow(this);
    }
};
ko.applyBindings(viewModel);