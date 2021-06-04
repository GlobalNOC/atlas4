# Atlas4

A network map creating/editing library

## Dev Setup
Run `npm install` to install package dependencies
```
npm install
```
And `npm run build` to create a build version of atlas4
```
npm run build
```
Create an Atlas Project directory and copy the library into the project folder. Eg.
```
mkdir -p ./Atlas4\ Project
mv lib ./Atlas4\ Project
```

## Usage
### Directory Structure
```
Atlas4 Project
├── index.html
├── js
│   ├── options.js
│   └── script.js
└── lib
    ├── 2273e3d8ad9264b7daa5bdbf8e6b47f8.png
    ├── 4f0283c6ce28e888000e978e537a6a56.png
    ├── Atlas4.js
    ├── Atlas4.js.map
    └── a6137456ed160d7606981aa57c559898.png
```

### HTML
```
<!DOCTYPE  html>
<html  lang="en">
<head>
	<meta  charset="UTF-8">
	<meta  name="viewport"  content="width=device-width, initial-scale=1.0">
	<meta  http-equiv="X-UA-Compatible"  content="ie=edge">
	<title>Atlas4</title>
</head>
<body>
	<div  id="map-container"></div>

	<script  src="lib/Atlas4.js"></script>
	<script  src="js/options.js"></script>
	<script  src="js/script.js"></script>
</body>
</html>
```

### Options.js
The Options.js file lets you define the default values when creating the map. Here are all the options that can be defined.
```
let  lineHtml  =  `HTML Text to define custom tooltip when hovering over a circuit`
let  pointHtml  =  `HTML Text to define custom tooltip when hovering over a point`

const  mapOptions  = {
	debug:  true,
	controls: {
		allLayers:  false,
		zoomMin:  false,
		editor:  false,
	},
};

const  legendOptions  = {
	position:  'bottom-left',
	orientation:  'vertical',
	size:  '100%',
	legends: {
		lines: {
			type:  'percent',
			units:  'bps',
			min:  0,
			max:  100,
			thresholds: [1.9, 3.2, 4.9, 7.4, 11, 16.1, 23.3, 33.6, 48.3, 69.2, 99],
			colors: ['#77BEFC', '#37A1FB', '#A2FEAF', '#76F588', '#2BE690', '#FFE13B', '#F2D236', '#F2A82A', '#FF5459', '#F20544', '#E846A5', '#bf70f9']
		},
	}
};

// Leaflet Options
// See https://leafletjs.com/reference-1.7.1.html#map-option
const  leafletOptions  = {
	minZoom:  2,
	maxZoom:  20,
	attributionControl:  false,
	zoomControl:  true,
	zoomSnap:  0.5,
	zoomDelta:  1,
	boxZoom:  true,
	doubleClickZoom:  true,
	dragging:  true,
	scrollWheelZoom:  true,
	updateWhenZooming:  false,
	updateWhenIdle:  true,
};

  
// Map Tiles
// Define more than one tiles to switch between programatically
const  tileOptions  = [
	{
		url:  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
		token:  'Map_Tile_Access_Token',
		maxZoom:  20,
		default:  true,
		name:  'map'
	},
	{
		`url:  'https://api.mapbox.com/styles/v1/mapbox/satellite-v8/tiles/{z}/{x}/{y}',
		token:  'Map_Tile_Access_Token',
		maxZoom:  20,
		name:  'satellite'
	}
]
  
// LEGACY, This option will be removed in a future release
// Still needed right now
const  topologyOptions  = {
	twins:  false,
};

  

const  pointOptions  = {
	size:  3,
	shape:  'circle',
	color:  'rgba(40, 40, 40, 1)',
	stroke:  1,
	fill:  'rgba(40, 40, 40, 1)',
	fillOpacity:  1,
	staticTooltip:  true
}

  

const  lineOptions  = {
	dataTarget:  'input.now',
	weight:  3,
	opacity:  1,
	smoothFactor:  1,
	color:  'rgba(120,120,120,0.5)',
};

  

const  tooltipOptions  = {
	autoPan:  false,
	line: {
		html:  lineHtml,
	},
	point: {
		html:  pointHtml,
	}
}

  

let  atlasOptions  = {
	map:  mapOptions,
	legend:  legendOptions,
	leaflet:  leafletOptions,
	tiles:  tileOptions,
	topology:  topologyOptions,
	point:  pointOptions,
	line:  lineOptions,
	tooltip:  tooltipOptions,
	overlayTiles:  overlayTileOptions,
	overlayTopology:  overlayTopologyOptions
};
```

### Script.js
The Script.js file will be used to initialize the Atlas4 Object
```
	let atlas  =  new  Atlas('map-container', atlasOptions);

	// Add Topology
	let network = {
		name: "Atlas4 Network",
		endpoints: {
			"100": {
				"id": "100",
				"label": "Endpoint 1",
				"lat": 42.345,
				"lng": -96.167448,
			},
			"101": {
				"id": "101",
				"label": "Endpoint 2",
				"lat": 22.669533,
				"lng": -86.25606,
			}
		},
		adjacencies: [
			{
				"a": "100",
				"b": "101",
				"id": "581223"
			}	
		]
	}
	
	atlas.addTopology(network)
```

