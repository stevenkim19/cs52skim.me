/* SETUP */
var map = L.map('map',{
    tms: false
}).setView([42.755942, -72.8092041],3);

// map.on('zoomend', function() {
//   var currentZoom = map.getZoom();
//   facemarkers.eachLayer(function(marker) {
//     $(marker._icon).height(currentZoom * 20);
//     $(marker._icon).width(currentZoom * 20);
//   });
// });

var PersonIcon = L.Icon.extend({
    options: {
        iconSize: [
            60, 60
        ],
        className: 'circular',
        popupAnchor:  [0, -30],
    }
});

// load up the background tile layer
var Stamen_Watercolor = L.tileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg', {}).addTo(map);

// all the facemarkers will go into one layer
// var facemarkers = L.markerClusterGroup({
  // animate: true,
  // spiderfyDistanceMultiplier: 10.0,
  // maxClusterRadius: 50,

  // spiderLegPolylineOptions: {weight: 0},
  // clockHelpingCircleOptions: {weight: .7, opacity: 1, color: 'black', fillOpacity: 0, dashArray: '10 5'},
  // elementsPlacementStrategy: 'clock',
  // helpingCircles: true,
  // spiderfyDistanceSurplus: 25,
  // spiderfyDistanceMultiplier: 1,
  // elementsMultiplier: 1.4,
  // firstCircleElements: 8
// });

var facemarkers = L.layerGroup();

// function to add markers
var addMarker = function(options) {
  var icon = new PersonIcon({iconUrl: options.iconUrl});
  var marker = L.marker(options.lat_long, {icon: icon, url:  options.url, name: options.name, tags: [options.year]}).bindPopup(options.message);
  facemarkers.addLayer(marker);
};

// parse json and attempt to print out better error message
var parseJSON = function(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    var char = e.message.match(/position (\d*)/)
    if (char.length > 1) {
      var i = parseInt(char[1]);
      console.log('error is near: \n' + text.slice(i-50, i+50));
      console.log('probably somewhere right before: ' + text.slice(i, i+5));
      console.log('try running your JSON through: https://jsonformatter.curiousconcept.com/');
    } else {
      console.log('error in: \n' + char);
    }
    throw e;
  }
}

// load members json
// recursive function to load multiple files
var loadJSONFiles = function(index, accumulator, callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'people-'+index+'.json');
    xobj.onreadystatechange = function () {
      if (xobj.readyState == 4 && xobj.status == "200") {
        if (index > 0) {
          var newlist = parseJSON(xobj.responseText);
          loadJSONFiles(index - 1, accumulator.concat(newlist), callback);
        } else {
          var newlist = parseJSON(xobj.responseText);
          callback(accumulator.concat(newlist));
        }
      }
    };
    xobj.send(null);
};

// load and process members
loadJSONFiles(2, [], function(response) {
  var members = response;
  var years = [];
  Object.keys(members).forEach(function(member) {
    addMarker(members[member]);
    years.push(members[member].year);
  });
  var filterButton = L.control.tagFilterButton({
      data: years,
      icon: '<img src="filter.png">',
      filterOnEveryClick: 'true'
  }).addTo(map);

  facemarkers.eachLayer(function(marker) {
    marker.on('mouseover', function (e) {
      e.target.openPopup();
    });
    marker.on('mouseout', function (e) {
      e.target.closePopup();
    });
    marker.on('click', function (e) {
      eModal.iframe({url: e.target.options.url, title: e.target.options.name, size: 'lg'});
    });
  });

  map.addLayer(facemarkers);
  // facemarkers.refreshClusters();

});


// setup the info control layer
var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this._div.innerHTML = '<a href="https://dartmouth-cs52-18S.github.io/git-map/"><h4>CS52 18S</h4></a><p><a href="https://github.com/dartmouth-cs52-18S/git-map">code on github</p></a>';
    return this._div;
};


info.addTo(map);
