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
var fqPlacesMap = {};


//Marker colors:
var markerColorHome = '19B5FE';
var markerColorDefault = 'F22613';
var markerColorHover = '26C281';

//Find current location and set as default center for map
var defaultLocation = {
    lat: 37.7749,
    lng: -122.4194
};

function callback(results, status) {
    //Clear list of places before updating it with search results
    viewModel.listOfPlaces.removeAll();
    console.log("########Calling cb##########");
    if (status === "OK" && results.length > 1) {
        console.log(results);
        //Clear any lingering html
        $('.locations-list').html("");
        console.log("results length:" + results.length);
        for (var i = 0; i < results.length; i++) {

            var place = placesService.getDetails({
                placeId: results[i].place_id
            }, function (p, status) {
                console.log("status=" + status);
                if (status === "OK") {
                    console.log("about to call update place");
                    updatePlaceObject(p);
                    //                    console.log(p);
                }
            });
        }
    } else {
        $('.locations-list').html("No results match your query.");
    }
    console.log("------------");
    console.log(viewModel.listOfPlaces().length);
    //console.log(viewModel.fQratings());
    //console.log(viewModel.fQratings()["(408) 719-1344"]);
    //    for (var i = 0; i < viewModel.listOfPlaces().length; i++) {
    //        if ("(408) 719-1344" in fqPlacesMap) {
    //            console.log("coming in if");
    //            viewModel.listOfPlaces()[i].rating(fqPlacesMap[viewModel.listOfPlaces()[i].phone]);
    //        }
    //    }
    map.fitBounds(bounds);
}

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

    var currentLatLng = map.getCenter();
    var initialRequest = {
        location: position,
        radius: 10000,
        types: ['restaurant', 'cafe', 'bus_station', 'city_hall', 'department_store', 'home_goods_store', 'transit_station', 'train_station', 'subway_station', 'shopping_mall', 'museum', 'library']
    };
    placesService.nearbySearch(initialRequest, callback);
}

function setCurrentLocation() {
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
    //    console.log("Error code: " + error.code);
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
        title: title,
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
    bounds = new google.maps.LatLngBounds();
    var place = {};
    //console.log(p);
    //Flag to show/hide in "view". Default set to true
    place.show = ko.observable(true);

    //Place id
    place.id = p.place_id;

    //Place icon
    place.icon = p.icon;

    if (p.name) {
        place.name = p.name;
    } else {
        place.name = "N/A";
    }

    if (p.address_components) {
        //        place.address = p.address_components[0].short_name + " " + p.address_components[1].short_name + ", " + p.address_components[2].short_name + " " + p.address_components[4].short_name + " " + p.address_components[6].short_name;
        place.address = p.formatted_address;
    } else {
        place.address = "N/A";
    }

    //Phone number
    if (p.formatted_phone_number) {
        place.phone = p.formatted_phone_number;
    } else {
        place.phone = "N/A";
    }

    //place.phone = (condition)?true:false
    //place.phone = (p.formatted_phone_number)?p.formatted_phone_number:"N/A"
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

    //Add website info
    if (p.website) {
        place.website = p.website;
    } else {
        place.website = "No Website found for this place."
    }

    //Add Open Hours info
    if (p.opening_hours) {
        if (p.opening_hours.open_now) {
            place.hours = "Open Now";
        } else {
            place.hours = "Closed for today";
        }

    } else {
        place.hours = "N/A";
    }

    place.index = viewModel.listOfPlaces().length + 1;

    //FourSquare rating of this place, initialize to N/A
    place.rating = ko.observable("N/A");

    //Prepare marker object for each place
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" + place.index + "|" + markerColorDefault + "|FFF");

    place.marker = new google.maps.Marker({
        position: place.latlng,
        //animation: google.maps.Animation.DROP,
        icon: pinImage,
        title: place.name,
        id: place.id
    });

    //Add marker for each place
    place.addMarker = function () {
        bounds.extend(place.marker.position);
        map.setZoom(13);
        map.setCenter(bounds.getCenter());
        place.marker.visible = place.show();
        place.marker.setMap(map);
        //Add click listener to markers
        place.marker.addListener('click', function () {
            populateInfoWindow(place);
        });
    }

    place.addMarker();

    viewModel.listOfPlaces.push(place);
    console.log("inside update:" + viewModel.listOfPlaces().length);

    //Build query for FourSquare Request

    var query = "https://api.foursquare.com/v2/venues/explore?client_id=" + clientID + "&client_secret=" + clientSecret + "&v=20160918&ll=";
    query += place.latlng.lat + "," + place.latlng.lng + "&query=" + place.name;
    requestFourSquare(query, place);
    if (place.phone in viewModel.fQratings()) {
        place.rating(viewModel.fQratings()[place.phone]);
    }
    //console.log(place.rating());
    //    console.log(fqPlacesMap);
    //    console.log(place.rating);
    //    console.log(place.phone);
}

function requestFourSquare(url, place) {
    $.ajax({
        url: url,
        dataType: 'json'
    }).done(function (data) {
        var str = "";
        //        console.log(data.response.groups[0].items);
        for (var i = 0; i < data.response.groups[0].items.length; i++) {
            if (data.response.groups[0].items[i].venue.contact.formattedPhone) {
                str = data.response.groups[0].items[i].venue.contact.formattedPhone.toString();
                viewModel.fQratings()[str] = data.response.groups[0].items[i].venue.rating;
            }

        }
    });
}


function show() {
    console.log(viewModel.listOfPlaces().length);
    for (var i = 0; i < viewModel.listOfPlaces().length; i++) {
        console.log("showing");
        console.log(viewModel.listOfPlaces()[i].name);
    }
}

function filter() {
    var searchQuery = $('input').val().toLocaleLowerCase();
    var lowerCaseName = "";
    for (var i = 0; i < viewModel.listOfPlaces().length; i++) {
        lowerCaseName = viewModel.listOfPlaces()[i].name.toLowerCase();
        if (lowerCaseName.search(searchQuery) !== -1) {
            viewModel.listOfPlaces()[i].show(true);
            viewModel.listOfPlaces()[i].addMarker();
        } else {
            viewModel.listOfPlaces()[i].show(false);
            viewModel.listOfPlaces()[i].addMarker();
        }
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
            console.log(activeMarkerIndex);
            setMarkerColor(viewModel.listOfPlaces()[activeMarkerIndex - 1], markerColorDefault);
        }

    });

    /* Re-center map based on user's current location */
    setCurrentLocation();
    $('.search').keyup(filter);
    $('.search-icon').click(startSearch);
}

/* KO Starts Here */
viewModel = {
    listOfPlaces: ko.observableArray(),
    fQratings: ko.observableArray(),
    //    noOfPlaces: ko.observable(this.listOfPlaces.length),
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

viewModel.noOfPlaces = ko.observable(0);
ko.applyBindings(viewModel);