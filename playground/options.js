var lineHtml = `<div class=\"atlas4-tt-container\" style=\"width: 250px;background: #ffffffd4;box-shadow: 0 3px 14px rgba(0,0,0,0.4);border-radius: 5px;\/* box-sizing: border-box; *\/padding: 10px 0;\">\r\n    <h4 class=\"atlas4-tt-topology\" style=\"\r\n        font-size: 18px;\r\n        font-weight: 500;\r\n        color: #4f505f;\r\n        text-align: center;\r\n        text-transform: uppercase;\r\n    \">$topology<\/h4>\r\n    <h6 class=\"atlas4-tt-label\" style=\"\r\n        font-size: 12px;\r\n        color: #4f505f;\r\n        font-weight: 500;\r\n        text-align: center;\r\n    \">$label<\/h6>\r\n    <img class=\"atlas4-tt-image\" src=\"$image\" alt=\"$topology\" style=\"\r\n        display: block;\r\n        margin: 10px auto;\r\n        height: 50px;\r\n    \"\/>\r\n    <div class=\"atlas4-tt-column atlas4-tt-column-line\" style=\"padding: 0px 20px;font-size: 0;\">\r\n        <p style=\"\r\n            margin: 0;\r\n            font-size: 12px;\r\n            display: inline-block;\r\n            width: 20%;\r\n        \">Input<\/p>\r\n                <p style=\"\r\n            margin: 0;\r\n            font-size: 12px;\r\n            display: inline-block;\r\n            width: 80%;\r\n            text-align: end;\r\n        \">$dataValues.input.now<\/p>\r\n    <\/div>\r\n    <div class=\"atlas4-tt-column atlas4-tt-column-line\" style=\"padding: 0px 20px;font-size: 0;\">\r\n        <p style=\"\r\n            margin: 0;\r\n            font-size: 12px;\r\n            display: inline-block;\r\n            width: 20%;\r\n        \">Output<\/p>\r\n                <p style=\"\r\n            margin: 0;\r\n            font-size: 12px;\r\n            display: inline-block;\r\n            width: 80%;\r\n            text-align: end;\r\n        \">$dataValues.output.now<\/p>\r\n    <\/div>\r\n<\/div>`
var pointHtml = `<div class=\"atlas4-tt-container\" style=\"\r\n    width: 100px;\r\n    background: #ffffffd4;\r\n    box-shadow: 0 0px 8px rgba(0,0,0,0.4);\r\n    border-radius: 5px;\r\n    padding: 10px 10px;\r\n    \">\r\n    <div>\r\n        <h4 class=\"atlas4-tt-topology\" style=\"\r\n            font-size: 16px;\r\n            text-align: center;\r\n            text-transform: uppercase;\r\n        \">$topology<\/h4>\r\n        <img class=\"atlas4-tt-image\" src=\"$image\" style=\"\r\n            margin: 6px 0px;\">\r\n    <\/div>\r\n    <h6 class=\"atlas4-tt-label\" style=\"\r\n          text-align: center;\r\n          font-size: 14px;\r\n          font-weight: 500;\r\n      \">$label<\/h6>\r\n<\/div>`

const mapOptions = {
  debug: true,
  controls: {
    allLayers: false,
    zoomMin: false,
    editor: false
  },
  minimap: true,
  minimapNetwork: 'https://carto.net.internet2.edu/mb/public/get_atlas?name=Internet2',
  minimapData: 'https://carto.net.internet2.edu/mb/public/get_interface_data'
};

const legendOptions = {
  position: 'bottom-left',
  orientation: 'vertical',
  size: '60%',
  legends: {
    lines: {
      type: 'percent',
      units: 'bps',
      min: 0,
      max: 100,
      thresholds: [1.9,   3.2,       4.9,        7.4,       11,       16.1,       23.3,      33.6,      48.3,      69.2,     99],
      colors: ['#77BEFC', '#37A1FB', '#A2FEAF', '#76F588', '#2BE690', '#FFE13B', '#F2D236', '#F2A82A', '#FF5459', '#F20544', '#E846A5', '#bf70f9']
    },
  }
};

const leafletOptions = {
  minZoom: 2,
  maxZoom: 20,
  attributionControl: false,
  zoomControl: true,
  zoomSnap: 0.5,
  zoomDelta: 1,
  boxZoom: true,
  doubleClickZoom: true,
  dragging: true,
  scrollWheelZoom: true,
  updateWhenZooming: false,
  updateWhenIdle: true,
};

const tileOptions = [
  {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    token: 'pk.eyJ1Ijoic3JlZW11a2hhIiwiYSI6ImNqYXRxeGc0YjU1c3gyenBsbmFtdDFudXMifQ.asGA_AB68fXU91Hw3nsUJQ',
    maxZoom: 20,
    attribution: 'Nope',
    id: 'mapbox.streets',
    default: true,
    name: 'map'
  },
  {
    url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-v8/tiles/{z}/{x}/{y}',
    token: 'pk.eyJ1Ijoic3JlZW11a2hhIiwiYSI6ImNqYXRxeGc0YjU1c3gyenBsbmFtdDFudXMifQ.asGA_AB68fXU91Hw3nsUJQ',
    maxZoom: 20,
    attribution: 'Nope',
    id: 'mapbox.satellite',
    name: 'satellite'
  }
]

const overlayTileOptions = [
  {
    name: 'weather_tile',
    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
    maxZoom: 20,
    attribution: 'Nope',
    id: 'mesonet',
  }
]

const overlayTopologyOptions = {
  earthquake: {
    shape: 'circle',
    style: {
      stroke: 1,
      fillOpacity: 0.5,
      opacity: 1
    },
    colorThreshold: ['#9EDFE5', '#74D3DC', '#70C2DF', '#77ADE6', '#7D99ED', '#7E84F3', '#7E6CFB', '#7354F4', '#6146D9', '#5038BC'],
    sizeThreshold: [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]
  },
  'quarry blast': {
    shape: 'circle',
    style: {
      stroke: 1,
      fillOpacity: 0.5,
      opacity: 1
    },
    colorThreshold: ['#FFD161',  '#FFBC64', '#FFA768', '#FF946C', '#FE7E6D', '#FE6975', '#FF5477', '#FF407C', '#FE2B80', '#E00E72'],
    sizeThreshold: [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]
  },
}

const topologyOptions = {
  twins: false,
};

const pointOptions = {
  size: 3,
  shape: 'circle',
  color: '#353a40',
  stroke: 1,
  fill: '#353a40',
  fillOpacity: 1
}

const lineOptions = {
      dataTarget: 'chooseMax',
    dataAggregate: 'first',
    colorCriteria: 'now',
  weight: 5,
  opacity: 1,
  smoothFactor: 1,
  color: 'rgba(120,120,120,0.5)',
};

const tooltipOptions = {
  autoPan: false,
  line: {
    html: lineHtml,
    vars: {
      test: 'This is a test string for lines',
    },
  },
  point: {
    html: pointHtml,
    vars: {
      test: 'This is a test string for points',
    }
  }
}

var testOptions = {
  map: mapOptions,
  legend: legendOptions,
  leaflet: leafletOptions,
  tiles: tileOptions,
  topology: topologyOptions,
  point: pointOptions,
  line: lineOptions,
  tooltip: tooltipOptions,
  overlayTiles: overlayTileOptions,
  overlayTopology: overlayTopologyOptions
};