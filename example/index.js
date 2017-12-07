'use strict';
var mapboxgl = require('mapbox-gl');
var insertCss = require('insert-css');
var fs = require('fs');
var $ = require("jquery");

insertCss(fs.readFileSync('./lib/mapbox-gl-generic-geocoder.css', 'utf8'));
insertCss(fs.readFileSync('./node_modules/mapbox-gl/dist/mapbox-gl.css', 'utf8'));

var MapboxGenericGeocoder = require('../');

var mapDiv = document.body.appendChild(document.createElement('div'));
mapDiv.style = 'position:absolute;top:0;right:0;left:0;bottom:0;';

let osmStyle = {
			"version": 8,
			"sources": {
				"osm-tiles": {
					"type": "raster",
					"attribution": "© OpenStreetMap",
					"tiles": ["http://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
					"tileSize": 256
				}
			},
			"layers": [{
				"id": "base-tiles",
				"type": "raster",
				"source": "osm-tiles",
				"minzoom": 0,
				"maxzoom": 18
			}]
		};

var map = new mapboxgl.Map({
  container: mapDiv,
  style: osmStyle,
  center: [-79.4512, 43.6568],
  zoom: 13
});

var geocodeNominatimRequest = function(query, mapBounds, options) {
	const params = { format: "json", q: query, limit: options.limit };
	const urlParams = new URLSearchParams(Object.entries(params));

	return fetch("http://nominatim.openstreetmap.org/search?" + urlParams).then(function(results) {
		if(results.length) {
			return results.map(function(result) {
				return {
					name: result.display_name,
					lat: result.lat,
					lon: result.lon,
					bbox: result.bbox
				};
			});
		} else {
			return [];
		}
	});
};

var geocoder = new MapboxGenericGeocoder({}, geocodeNominatimRequest);

window.geocoder = geocoder;

var button = document.createElement('button');
button.textContent = 'click me';

var removeBtn = document.body.appendChild(document.createElement('button'));
removeBtn.style = 'position:absolute;z-index:10;top:10px;left:10px;';
removeBtn.textContent = 'Remove geocoder control';

map.getContainer().querySelector('.mapboxgl-ctrl-bottom-left').appendChild(button);
map.addControl(geocoder);

map.on('load', function() {
  button.addEventListener('click', function() {
    geocoder.query('Montreal Quebec');
  });
  removeBtn.addEventListener('click', function() {
    map.removeControl(geocoder);
  })
});

geocoder.on('results', function(e) {
  console.log('results: ', e.features);
});

geocoder.on('error', function(e) {
  console.log('Error is', e.error);
});
