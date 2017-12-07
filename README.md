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

var geocodeNominatimRequest = function(query, mapBounds, options) {
	const params = { format: "json", q: query, limit: options.limit };
	const urlParams = new URLSearchParams(Object.entries(params));

	return fetch("http://nominatim.openstreetmap.org/search?" + urlParams).then(function(results) {
		if(results.length) {
			return results.map(function(result) {
				{
					name: result.display_name,
					lat: result.lat,
					lon: result.lon,
					bbox: result.bbox
				}
			});
		} else {
			return null;
		}
	});
};

mapboxglmap.addControl(new MapboxGenericGeocoder({}, geocodeNominatimRequest));
