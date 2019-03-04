'use strict';

var Typeahead = require('suggestions');
var debounce = require('lodash.debounce');
var extend = require('xtend');
var EventEmitter = require('events').EventEmitter;

/**
* A geocoder component using Mapbox Geocoding API
* @class MapboxGenericGeocoder
*
* @param {Object} options
* @param {Number} [options.zoom=16] On geocoded result what zoom level should the map animate to when a `bbox` isn't found in the response. If a `bbox` is found the map will fit to the `bbox`.
* @param {Boolean} [options.flyTo=true] If false, animating the map to a selected result is disabled.
* @param {String} [options.placeholder="Search for Place or Address"] Override the default placeholder attribute value.
* @param {Number} [options.minLength=2] Minimum number of characters to enter before results are shown.
* @param {Number} [options.limit=5] Maximum number of results to show.
* @param {Function} geocodeRequest A function that take a object containing the query text, current map bounds, and options.  It returns a promise with an array of result.  A result should look like something like this: { "name": "Denver", "lat": 39.742043, "lon": -104.991531, "bbox": ["-105.1098845", "39.6143154","-104.5996889","39.9142087"]}
* @example
* var geocoder = new MapboxGenericGeocoder();
* map.addControl(geocoder);
* @return {MapboxGenericGeocoder} `this`
*/
function MapboxGenericGeocoder(options, geocodeRequest) {
	this._eventEmitter = new EventEmitter();
	this.options = extend({}, this.options, options);
	this.geocodeRequest = geocodeRequest;
}

MapboxGenericGeocoder.prototype = {

	options: {
		placeholder: 'Search for Place or Address',
		zoom: 16,
		flyTo: true,
		minLength: 2,
		limit: 5,
		fitBoundsOptions: { }
	},

	onAdd: function(map) {
		this._map = map;
		this._onChange = this._onChange.bind(this);
		this._onKeyDown = this._onKeyDown.bind(this);
		this._clear = this._clear.bind(this);

		var el = this.container = document.createElement('div');
		el.className = 'mapboxgl-ctrl-generic-geocoder mapboxgl-ctrl';

		var icon = document.createElement('span');
		icon.className = 'geocoder-icon geocoder-icon-search';

		this._inputEl = document.createElement('input');
		this._inputEl.type = 'text';
		this._inputEl.placeholder = this.options.placeholder;

		this._inputEl.addEventListener('keydown', this._onKeyDown);
		this._inputEl.addEventListener('change', this._onChange);

		var actions = document.createElement('div');
		actions.classList.add('geocoder-pin-right');

		this._clearEl = document.createElement('button');
		this._clearEl.className = 'geocoder-icon geocoder-icon-close';
		this._clearEl.setAttribute('aria-label', 'Clear');
		this._clearEl.addEventListener('click', this._clear);

		this._loadingEl = document.createElement('span');
		this._loadingEl.className = 'geocoder-icon geocoder-icon-loading';

		actions.appendChild(this._clearEl);
		actions.appendChild(this._loadingEl);

		el.appendChild(icon);
		el.appendChild(this._inputEl);
		el.appendChild(actions);

		this._typeahead = new Typeahead(this._inputEl, [], {
			filter: false,
			minLength: this.options.minLength,
			limit: this.options.limit
		});
		this._typeahead.getItemValue = function(item) { return item.name; };

		return el;
	},

	onRemove: function() {
		this.container.parentNode.removeChild(this.container);
		this._map = null;
		return this;
	},

	_onKeyDown: debounce(function(e) {
		if (!e.target.value) {
			return this._clearEl.style.display = 'none';
		}

		// TAB, ESC, LEFT, RIGHT, ENTER, UP, DOWN
		if (e.metaKey || [9, 27, 37, 39, 13, 38, 40].indexOf(e.keyCode) !== -1) return;

		if (e.target.value.length >= this.options.minLength) {
			this._geocode(e.target.value);
		}
	}, 500),

	_onChange: function() {
		if (this._inputEl.value) this._clearEl.style.display = 'block';
		var selected = this._typeahead.selected;
		if (selected) {
			if (this.options.flyTo) {
				var bbox = selected.bbox;
				if (bbox) {
						this._map.fitBounds([[bbox[0], bbox[1]],[bbox[2], bbox[3]]], this.options.fitBoundsOptions);
					} else {
						this._map.flyTo({
							center: [selected.lon, selected.lat],
							zoom: this.options.zoom
						});
					}
				}
				this._eventEmitter.emit('result', { result: selected });
			}
		},

		_geocode: function(searchInput) {
			this._loadingEl.style.display = 'block';
			this._eventEmitter.emit('loading', { query: searchInput });

			this.geocodeRequest(searchInput, this._map.getBounds(), this.options).then(function(results) {
				this._loadingEl.style.display = 'none';
				if (results.length) {
					results = results.slice(0, this.options.limit);
					this._clearEl.style.display = 'block';
				} else {
					this._clearEl.style.display = 'none';
					this._typeahead.selected = null;
				}

				this._eventEmitter.emit('results', results);
				this._typeahead.update(results);
			}.bind(this)).catch(function(error) {
				this._loadingEl.style.display = 'none';
				this._eventEmitter.emit('error', { text: error.message, err: error });
			}.bind(this));
		},

		_clear: function(ev) {
			if (ev) ev.preventDefault();
			this._inputEl.value = '';
			this._typeahead.selected = null;
			this._typeahead.clear();
			this._onChange();
			this._inputEl.focus();
			this._clearEl.style.display = 'none';
			this._eventEmitter.emit('clear');
		},

		/**
		* Subscribe to events that happen within the plugin.
		* @param {String} type name of event. Available events and the data passed into their respective event objects are:
		*
		* - __clear__ `Emitted when the input is cleared`
		* - __loading__ `{ query } Emitted when the geocoder is looking up a query`
		* - __results__ `{ results } Fired when the geocoder returns a response`
		* - __result__ `{ result } Fired when input is set`
		* - __error__ `{ error } Error as string
		* @param {Function} fn function that's called when the event is emitted.
		* @returns {MapboxGenericGeocoder} this;
		*/
		on: function(type, fn) {
			this._eventEmitter.on(type, fn);
			return this;
		},

		/**
		* Remove an event
		* @returns {MapboxGenericGeocoder} this
		* @param {String} type Event name.
		* @param {Function} fn Function that should unsubscribe to the event emitted.
		*/
		off: function(type, fn) {
			this._eventEmitter.removeListener(type, fn);
			return this;
		}
	};

	module.exports = MapboxGenericGeocoder;
