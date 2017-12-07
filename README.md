# Mapbox GL Generic Geocoder

Bring your own geocoding srevice to [mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js).  Based on [Mapbox GL Geocoder](https://github.com/mapbox/mapbox-gl-geocoder/)

### Usage

See example/index.js
Similar to [Mapbox GL Geocoder](https://www.mapbox.com/mapbox-gl-js/example/mapbox-gl-geocoder/)

## Usage with a module bundler

This module exports a single class called MapboxGenericGeocoder as its default export,
so in browserify or webpack, you can require it like:

```js
var MapboxGenericGeocoder = require('mapbox-gl-generic-geocoder');
```

## Example
```js
var geocodeNominatimRequest = function(query, mapBounds, options) {
	var params = { format: "json", q: query, limit: options.limit };
	var urlParams = new URLSearchParams(Object.entries(params));

	return fetch("http://nominatim.openstreetmap.org/search?" + urlParams).then(function(response) {
		if(response.ok) {
			return response.json();
		} else {
			return [];
		}
	}).then(function(json) {
		return json.map(function(result) {
			return {
				name: result.display_name,
				lat: result.lat,
				lon: result.lon,
				bbox: result.bbox
			};
		});
	});
};

mapboxglmap.addControl(new MapboxGenericGeocoder({}, geocodeNominatimRequest));
```
