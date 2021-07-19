// JS Imports
import L from "leaflet";
import Topology from "./Topology.js";
import Point from "./Point.js";
import Line from "./Line.js";
import Tooltip from "./Tooltip.js";
import Legend from "./Legend.js";
import Editor from "./Editor.js";
import OverlayTopology from "./OverlayTopology.js";
import "../extensions/L.Control.Atlas.js";

// HTML Imports
import lineTooltip from "../html/tooltip_line.html";
import pointTooltip from "../html/tooltip_point.html";
import loader from "../html/loader.html";

// CSS Imports
import "Modules/leaflet/dist/leaflet.css";
import "../css/Tooltip.css";
import "../css/Loader.css";

/** Atlas
Used by the application to create a new Atlas map
Creates and updates topology layers
Handles leaflet map changes
*/

export default class Atlas {
    /** CONSTRUCTOR */
    constructor(container, options) {
        // Debug Mode
        this.debug = options.map.debug;

        // Atlas Classes Options
        this.options = {};
        this.options.map = options.map;
        this.options.leaflet = options.leaflet;
        this.options.tiles = options.tiles;
        this.options.overlayTiles = options.overlayTiles || [];
        this.options.point = options.point;
        this.options.line = options.line;
        this.options.legend = options.legend;
        this.options.topology = options.topology;
        this.options.tooltip = options.tooltip;
        this.options.controls = options.map.controls || {};
        this.options.overlayTopology = options.overlayTopology || {};

        this.options.minimap = options.map.minimap || false;
        this.options.minimapConfig = {
            map: options.map.minimapNetwork,
            data: options.map.minimapData,
        };

        // Set default options for all classes from the passed in options
        this.createLineDefaults();
        this.createPointDefaults();
        this.createTooltipDefaults();
        Legend.prototype.defaults = options.legend;

        // ID of Map Container
        this.container = container;

        // Collections of Class Instances
        this.topologies = {};
        this.legends = {};
        this.overlayTopologies = {};

        // Map Statistics
        this.stats = {
            topologies: 0,
            lines: 0,
            points: 0,
        };

        // Fix for Leaflet Popup bluriness due to fractional transform values in CSS
        window.L_DISABLE_3D = true;

        // Extra Leaflet Control Defaults
        this.options.controls.zoomMin =
            typeof this.options.controls.zoomMin == "undefined"
                ? true
                : this.options.controls.zoomMin;
        this.options.controls.allLayers =
            typeof this.options.controls.allLayers == "undefined"
                ? false
                : this.options.controls.allLayers;
        this.options.controls.editor =
            typeof this.options.controls.editor == "undefined"
                ? true
                : this.options.controls.editor;
        this.options.leaflet.atlas4 = this.options.controls;

        // Initialize Leaflet Map
        this.map = L.map(container, this.options.leaflet);

        // Initialize Leaflet Tileset
        this.tiles = {};
        if (this.options.tiles) {
            this.createTiles();
        }

        // Initialize Leaflet Overlay Tileset
        this.overlayTiles = {};
        if (this.options.overlayTiles) {
            this.createOverlayTiles();
        }

        // Set a Default View
        this.setView({ view: [0, 0], zoom: 1 });

        // Add L.Control.ZoomMin Extension and flag for show/hide all layers
        // Remove the existing control before adding the new control
        // Add and extra control to the map
        this.layersOn = true;
        if (this.options.controls.zoomMin || this.options.controls.allLayers) {
            this.map.removeControl(this.map.zoomControl);
            this.map.addControl(
                new L.Control.Atlas({
                    minBounds: this.map.getBounds(),
                    atlas: this,
                })
            );
        }

        // Initialize Legends
        Legend.createParent(this.container, this.options.legend);
        for (let id of Object.keys(this.options.legend.legends)) {
            this.legends[id] = new Legend(
                id,
                this.options.legend,
                this.container
            );
            this.legends[id].hide();
        }

        //!! DEVELOPMENT FUNCTIONALITIES !!//
        this.map.addEventListener("click", this.onMapClick, { passive: true }); // Returns coords of pointer when map is clicked
        this.map.addEventListener("zoomend", this.redraw.bind(this), {
            passive: true,
        });

        // Creating Atlas Editor
        this.editor = new Editor(this);

        console.debug(`Initialized Atlas map in "#${container}"`);

        if (this.options.minimap) {
            this.showLoader();
            this.drawMiniMap();
        }

        this.map.on("zoomend", () => {
            this.checkForOverlaps();
        });

        this.events = {};
    }

    /** GET, SET+UPDATE, & PROPERTIES */

    // Get the value of the property
    get(property) {
        return this[property];
    }
    // Set property to a new value
    set(property, value) {
        let props = property.split(".");

        // Single Key
        if (props.length === 1) {
            this[property] = value;
            this.update(property);
        }
        // Multi Key
        else {
            let ref = this;
            for (let i = 0; i < props.length; i++) {
                if (i === props.length - 1) {
                    ref[props[i]] = value;
                    this.update(props[i]);
                } else {
                    ref = ref[props[i]];
                }
            }
        }
    }
    // Recalculate any computed properties here
    update(property) {
        if (property === "tiles" || property === "options.tiles") {
            this.removeTiles();
            this.addTiles();
        }
    }
    // Get the class property names and their values
    properties() {
        return Object.entries(this);
    }

    /** CLASS METHODS */

    //---- DATA

    /* Set the data model for Lines to a new object */
    lineDataModel(model) {
        if (!model instanceof Object || model instanceof Array) {
            console.error(
                `The input Line data model is not an object. Type is ${typeof model}`
            );
        }

        Line.prototype.dataModel = model;
    }

    /* Set the data model for Points to a new object */
    pointDataModel(model) {
        if (!model instanceof Object || model instanceof Array) {
            console.error(
                `The input Point data model is not an object. Type is ${typeof model}`
            );
        }

        Point.prototype.dataModel = model;
    }

    //---- VIEW

    /* Set view for the map with {view: coords, zoom: value} */
    setView(options) {
        this.map.setView(options.view, options.zoom);
    }

    /* Focus the map view around a topology */
    setFocus(topology, removeOthers = false) {
        if (typeof topology == "undefined") {
            console.error("Setting focus on an undefined topology");
        }

        if (removeOthers) {
            this._showOnly(topology);
        }

        // Only the Topology's name was given
        if (typeof topology == "string" && this.topologies[topology]) {
            topology = this.topologies[topology];
        }

        if (topology.active === false) {
            topology.show();
        }
        if (topology.view) {
            this.map.fitBounds(topology.view);
        }
    }

    //---- TILES

    /** Create the tile URL from tile options */
    createTileUrl(tileConfig) {
        let url = tileConfig.url;
        if (tileConfig.token) {
            url += `?access_token=${tileConfig.token}`;
        }
        return url;
    }

    /** Add the tile layer to the map using tile options*/
    createTiles() {
        for (const tile of this.options.tiles) {
            this.tiles[tile.name] = L.tileLayer(this.createTileUrl(tile), tile);
            if (tile.default) this.tiles[tile.name].addTo(this.map);
        }
    }

    showTile(name) {
        for (const key in this.tiles) {
            if (key !== name) this.hideTile(key);
            else this.tiles[key].addTo(this.map);
        }
        this.redrawOverlayTiles();
    }

    hideTile(name) {
        if (this.tiles[name]) this.tiles[name].removeFrom(this.map);
    }

    /** Remove the tiles from the map */
    removeTiles() {
        for (const tile in this.tiles) {
            this.tiles[tile].removeFrom(this.map);
        }
    }

    // Overlay Tile Methods
    createOverlayTiles() {
        for (const tile of this.options.overlayTiles) {
            this.overlayTiles[tile.name] = L.tileLayer(
                this.createTileUrl(tile),
                tile
            );
        }
    }

    showOverlayTile(name) {
        if (this.overlayTiles[name]) this.overlayTiles[name].addTo(this.map);
    }

    hideOverlayTile(name) {
        if (this.overlayTiles[name]) {
            this.overlayTiles[name].removeFrom(this.map);
        }
    }

    // Draws the overlay tiles again to bring them to the top of the map
    redrawOverlayTiles() {
        for (const tile in this.overlayTiles) {
            if (this.map.hasLayer(this.overlayTiles[tile])) {
                this.overlayTiles[tile].removeFrom(this.map);
                this.overlayTiles[tile].addTo(this.map);
            }
        }
    }

    // Overlay Topology Methods
    addOverlayTopology(data) {
        let ot = new OverlayTopology(data.config, this.options.overlayTopology);
        this.overlayTopologies[data.name] = ot;
    }

    drawOverlayTopology(name) {
        if (this.overlayTopologies[name]) {
            this.overlayTopologies[name].drawOverlayTopology(this.map);
        }
    }

    removeOverlayTopology(name) {
        if (this.overlayTopologies[name]) {
            this.overlayTopologies[name].hideOverlayTopology(this.map);
        }
    }

    //---- STATS

    updateStats() {
        this.stats = {
            topologies: 0,
            lines: 0,
            points: 0,
        };

        for (let name of Object.keys(this.topologies)) {
            let topology = this.topologies[name];
            this.stats.topologies += topology.active ? 1 : 0;
            this.stats.lines += topology.stats.lines;
            this.stats.points += topology.stats.points;
        }
    }

    //---- TOPOLOGY

    /** Set topology layer on the map */
    addTopology(json, options) {
        if (typeof json === "string") {
            json = JSON.parse(json);
        }
        console.debug(
            `Setting the Topology for ${json.name} in "#${this.container}"`
        );

        options = options || this.options.topology;
        // Pass the legends to Topologies
        options.legends = this.legends;

        //this.checkForOverlaps(json)

        // Create a new Topology and add it to the topologies object
        this.topologies[json.name] = new Topology(this, json, options);
        // Draw the map on creation by default
        this.drawTopology(this.topologies[json.name]);

        // Dispatch Topology Added Event
        this.dispatch("topology-added");

        // Return the topology for application convenience
        return this.topologies[json.name];
    }
    /** Render the given topology object as paths, endpoints */
    drawTopology(topology) {
        console.debug(
            `Drawing topology for ${topology.name} in "#${this.container}"`
        );

        // Add all the lines of a topology to the map
        for (let line of topology.lines) {
            // Add the first Line layer
            line.layer[0].addTo(this.map);

            // Add second Line layer if twins
            if (line.layer.length === 2) {
                line.layer[1].addTo(this.map);
            }
        }

        // Add all the points of the topology to the map
        for (let point of topology.points) {
            point.layer.addTo(this.map);
        }
        this.updateStats();
        this.checkForOverlaps();
    }

    hideTopology(topology) {
        this.topologies[topology].hide();
        this.updateStats();
    }

    showTopology(topology) {
        this.topologies[topology].show();
        this.updateStats();
    }

    _showOnly(topology) {
        let name;
        if (typeof topology != "string") {
            name = topology.name;
        } else {
            name = topology;
        }

        let bounds = [];

        for (let t of Object.keys(this.topologies)) {
            if (t == name) {
                if (!this.topologies[t].active) {
                    this.topologies[t].show();
                }
            } else {
                this.topologies[t].hide();
            }
        }
        this.fitToView();
        this.updateStats();
    }

    showAll() {
        for (let t of Object.keys(this.topologies)) {
            if (!this.topologies[t].active) {
                this.topologies[t].show();
            }
        }
        this.fitToView();
        this.updateStats();
    }

    fitToView() {
        let bounds = [];
        for (const topology in this.topologies) {
            let map = this.topologies[topology];
            if (map.active) {
                for (const point of map.points) {
                    bounds.push(point.layer.getLatLng());
                }
            }
        }
        if (bounds && bounds.length > 0) this.map.fitBounds(bounds);
    }

    // Wipes the topology from existence
    removeTopology(name) {
        if (this.topologies[name]) {
            let topology = this.topologies[name];
            for (const point of topology.points) {
                point.layer.removeFrom(this.map);
            }

            for (const line of topology.lines) {
                line.layer.forEach((element) => {
                    element.removeFrom(this.map);
                });
            }

            delete this.topologies[name];
            return true;
        }
        return false;
    }

    removeAllTopologies() {
        let topologies = Object.keys(this.topologies);
        topologies.forEach((topology) => this.removeTopology(topology));
    }

    /** Add Point or Line Object if not added to map,
     * If Point or Line already exists in map, then just redraw it. */
    updateTopology(vectorObj) {
        // TODO: something.setStyle({color: 'red', weight: 10})
        if (Topology.isPoint(vectorObj)) {
            let ep = vectorObj.get("layer");
            if (!this.map.hasLayer(ep)) {
                ep.addTo(this.map);
            }
        } else if (Topology.isLine(vectorObj)) {
            if (!this.map.hasLayer(vectorObj.line)) {
                // Add Line To Map
            }
        }
    }

    checkForOverlaps() {
        if (!this.options.controls.editor) return;
        let zoom = this.map.getZoom();
        if (Object.keys(this.topologies).length < 1) return;
        for (const t in this.topologies) {
            let topology = this.topologies[t];
            for (const line of topology.lines) {
                if (
                    line.options.color == this.options.map.overlapCircuitColor
                ) {
                    line.options.color = this.options.line.color;
                    for (const layer of line.layer) {
                        layer.setStyle({ color: this.options.line.color });
                    }
                }
            }
            let zoom_threshold = {
                1: 3.5306537,
                1.5: 2.0216982,
                2: 1.7653677,
                2.5: 1.2801464,
                3: 0.8826941,
                3.5: 0.6495934,
                4: 0.4394531,
                4.5: 0.2962163,
                5: 0.2215501,
                5.5: 0.172205,
                6: 0.1178134,
                6.5: 0.0629858,
                7: 0.0553852,
                7.5: 0.0408117,
                8: 0.0276925,
                8.5: 0.0175293,
                9: 0.0137329,
                9.5: 0.0116625,
                10: 0.0068664,
                10.5: 0.0049127,
                11: 0.0034615,
                11.5: 0.0025313,
                12: 0.0017307,
                12.5: 0.0012784,
                13: 0.0008583,
                13.5: 0.0006193,
                14: 0.0004291,
                14.5: 0.0003137,
                15: 0.0001738,
                15.5: 0.0001613,
                16: 0.0001287,
                16.5: 0.0000703,
                17: 0.000054,
                17.5: 0.0000403,
                18: 0.000027,
                18.5: 0.0000211,
                19: 0.0000138,
                19.5: 0.0000096,
                20: 0.0000067,
            };
            for (const i of topology.lines) {
                if (i.path.length > 4) continue;
                for (const j of topology.lines) {
                    if (j.path.length > 4) continue;
                    let displayingBothCircuits = true;
                    for (const layer of i.layer) {
                        if (!this.map.hasLayer(layer)) {
                            displayingBothCircuits = false;
                        }
                    }
                    for (const layer of j.layer) {
                        if (!this.map.hasLayer(layer)) {
                            displayingBothCircuits = false;
                        }
                    }
                    if (j.layer.length == 0 || i.layer.length == 0) {
                        displayingBothCircuits = false;
                    }
                    if (i == j || !displayingBothCircuits) continue;
                    let AA = euclideanDistance(i.a, j.a);
                    let BB = euclideanDistance(i.b, j.b);
                    let AB = euclideanDistance(i.a, j.b);
                    let BA = euclideanDistance(i.b, j.a);
                    let thresholdDist = zoom_threshold[zoom];
                    if (!thresholdDist) return;
                    if (
                        ((AA < thresholdDist && BB < thresholdDist) ||
                            (AB < thresholdDist && BA < thresholdDist)) &&
                        i.options.color == this.options.line.color
                    ) {
                        i.options.color = this.options.map.overlapCircuitColor;
                        for (const layer of i.layer) {
                            layer.setStyle({
                                color: this.options.map.overlapCircuitColor,
                            });
                        }
                    }
                }
            }
        }
        function euclideanDistance(a, b) {
            return Math.sqrt(
                Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2)
            );
        }
    }

    //---- MAP

    resize() {
        this.map.invalidateSize();
    }

    onMapClick(e) {
        console.debug([e.latlng.lat, e.latlng.lng]);
    }

    redraw() {
        console.debug("Redraw of the map triggered");
    }

    //---- TOOLTIPS

    customLineTooltip(html) {
        for (let topology of this.topologies) {
            for (let line of topology.lines) {
                line.set("html", html);
            }
        }
    }

    customPointTooltip(html) {
        for (let topology of this.topologies) {
            for (let point of topology.points) {
                point.set("html", html);
            }
        }
    }

    customTooltip(type, options) {
        let properties = ["html", "css", "vars"];

        // Check for key errors in type and options arguments
        if (type != "point" && type != "line") {
            console.error(
                `Unrecognized tooltip type "${type}" given to customTooltip(). Valid types are "point" and "line"`
            );
        }
        for (let key in options) {
            if (properties.indexOf(key) == -1) {
                console.error(
                    `Unrecognized key "${key}" given in custom tooltip options. Valid keys are "css", "html", and "vars"`
                );
            }
        }

        // Call update on all of the tooltips to refresh their contents
        for (let topology of Object.values(this.topologies)) {
            for (let property of properties) {
                if (!options[property]) {
                    continue;
                }
                for (let line of topology.lines) {
                    line.set(property, options[property]);
                }
                for (let point of topology.points) {
                    point.set(property, options[property]);
                }
            }
        }
    }

    // Sets the global default options for all new Tooltip instances
    createTooltipDefaults() {
        // Get any options that were in configuration
        let options = this.options.tooltip;

        // Set the default Options for tooltips using default HTML
        let defaults = {
            point: {
                html: pointTooltip,
                css: undefined,
                vars: undefined,
            },
            line: {
                html: lineTooltip,
                css: undefined,
                vars: undefined,
            },
        };

        // Overwrite the default Tooltip options with those given
        if (options) {
            for (let type of ["point", "line"]) {
                if (options[type]) {
                    if (options[type].html) {
                        defaults[type].html = options[type].html;
                    }
                    if (options[type].css) {
                        defaults[type].css = options[type].css;
                    }
                    if (options[type].vars) {
                        defaults[type].vars = options[type].vars;
                    }
                }
            }
        }

        if (options.autoPan) defaults.autoPan = options.autoPan;
        // Assign to the prototype so this.templates returns the templates across Tooltip instances
        Tooltip.prototype.defaults = defaults;
    }

    //---- LINES

    createLineDefaults() {
        let options = this.options.line;

        let defaults = {
            weight: 1,
            opacity: 1,
            smoothFactor: 1,
            color: "#555555",
            units: "bits",
            dataAggregate: "first",
            dataTarget: "max",
            colorCriteria: "now",
        };

        // TODO: Add key-checking for all possible options
        if (options) {
            for (let key in options) {
                defaults[key] = options[key];
            }
        }

        Line.prototype.defaults = defaults;
    }

    //---- POINTS

    createPointDefaults() {
        let options = this.options.point;

        let defaults = {
            size: 4,
            shape: "circle",
            color: "black",
            stroke: 1,
            fill: "white",
            fillOpacity: 1,
            staticTooltip: false,
        };

        if (options) {
            for (let key in options) {
                defaults[key] = options[key];
            }
        }
        Point.prototype.defaults = defaults;
    }

    drawMiniMap() {
        console.log("Drawing map....");
        fetch(this.options.minimapConfig.map)
            .then((data) => data.json())
            .then((data) => {
                for (const map of data) {
                    this.addTopology(map);
                    this.fitToView();
                    if (!map.tile) this.hideLoader();
                    this.colorCircuits(this.get("topologies")[map.name]);
                }
            })
            .catch((err) => {
                console.log(err);
                this.showError();
            });
    }

    colorCircuits(topology) {
        this.requestCircuitData(topology);
    }

    requestCircuitData(topology, subqueries) {

        let applyData = this.applyData.bind(this);
        let url = this.options.minimapConfig.data;
        fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: topology.name,
                start: 'now-15m',
                end: 'now'
            })
        })
            .then((data) => data.json())
            .then((data) => {
                applyData(data.results, topology.name);
            })
            .catch((e) => {
                console.log(e);
                this.showError();
            });
    }

    showLoader() {
        let container = document.getElementById(this.container);
        let loader_elem = document.querySelector(
            `#${this.container} .atlas4-loader`
        );
        if (loader_elem) loader_elem.remove();

        var node = document.createElement("DIV");
        node.classList.add("atlas4-loader");
        node.innerHTML = loader;
        container.appendChild(node);
    }

    hideLoader() {
        let loader_elem = document.querySelector(
            `#${this.container} .atlas4-loader`
        );
        if (loader_elem) loader_elem.remove();
    }

    showError() {
        let container = document.getElementById(this.container);
        let loader_elem = document.querySelector(
            `#${this.container} .atlas4-loader`
        );
        if (loader_elem) loader_elem.remove();

        var node = document.createElement("DIV");
        node.classList.add("atlas4-loader");
        node.innerHTML = loader;
        node.getElementsByTagName("svg")[0].remove();
        node.getElementsByTagName("p")[0].innerHTML =
            "Error Loading Map.<br>Please Refresh Page To Try Again.";
        node.getElementsByTagName("div")[0].style.width = "200px";
        container.appendChild(node);
    }

    // Legend Methods:
    changeLegendProperty(id, property, value) {
        if (this.legends[id]) {
            this.legends[id][property] = value;
            this.legends[id].rerender();
            this.updateTopologyData();
        }
    }

    changeLegendValues(id, threshold, colors) {
        if (threshold.length - colors.length == 1) {
            let min = threshold[0];
            let max = threshold[threshold.length - 1];
            let correctedThreshold = threshold.slice(1, threshold.length - 1);
            this.legends[id].min = Number(min);
            this.legends[id].max = Number(max);
            this.legends[id].thresholds = correctedThreshold;
            this.legends[id].colors = colors;
            this.legends[id].rerender();
            this.updateTopologyData();
        }
    }

    // Tooltip Methods
    changeTooltipContent(TopologyLayer, content) {
        let topologies = this.topologies;
        for (const topology in topologies) {
            topologies[topology][TopologyLayer].forEach(
                (l) => (l.tooltip.html = content)
            );
        }
        this.updateTopologyData();
    }

    updateTopologyData() {
        let topologies = this.topologies;
        for (const topology in topologies) {
            topologies[topology].lines.forEach((l) => l.update("data"));
            topologies[topology].points.forEach((p) => p.update("data"));
        }
    }

    getJSON() {
        let topologies = [];
        for (const t in this.topologies) {
            const topology = this.topologies[t];

            let json = {};
            json.name = topology.name;
            json.legend = topology.legend;
            if (topology.image) json.image = topology.image;
            json.metadata = topology.metadata;

            let eps = {};
            for (const point of topology.points) {
                let obj = {};
                obj.id = point.id;
                obj.label = point.data.label;
                obj.shape = point.shape;
                obj.size = point.size;
                obj.lat = point.coord[0];
                obj.lng = point.coord[1];
                obj.fill = point.fill;
                obj.stroke = point.stroke;
                obj.color = point.color;
                obj.opacity = point.opacity;

                eps[point.point.name] = obj;
            }
            json.endpoints = eps;

            let adjs = [];
            for (const line of topology.lines) {
                let obj = {};
                obj.a = line.a.name;
                obj.b = line.b.name;
                obj.anchors = line.anchors;
                obj.metadata = line.metadata;
                adjs.push(obj);
            }
            json.adjacencies = adjs;

            topologies.push(json);
        }
        return topologies;
    }

    on(event, callback) {
        if (this.events[event]) this.events[event].push(callback);
        else this.events[event] = [callback];
    }

    dispatch(event) {
        if (this.events[event]) {
            for (const callback of this.events[event]) {
                callback();
            }
        }
    }

    applyData(data, topology = 'all') {
        let topologies;

        if (!topology || topology === 'all') {
            topologies = this.get('topologies')
        } else {
            topologies = {}
            topologies[topology] = this.get('topologies')[topology]
        }

        if (!Object.keys(topologies).length) return

        for (const topologyName in topologies) {
            let topology = topologies[topologyName]
            if (!topology) {
                console.info(`Topology - ${topologyName} doesn't exists!`)
                continue
            }
            let lines = topology.lines

            for (const line of lines) {
                let lineData = {
                    ...line.metadata,
                    label: line.label,
                    dataValues: {

                    }
                }

                let lineDataTargets = line.metadata?.data_targets || []

                // Will be used to prevent summing duplicate data target names
                let dataTargetCache = []

                for (const dataPoint of data) {
                    let aggregateGroup;
                    let aggregateGroupName;
                    if (lineDataTargets.includes(dataPoint.data_target)) {
                        if (!dataPoint?.values) continue;
                        let values = dataPoint.values.reverse()

                        let now = values.reduce(getNow, null)
                        let min = values.reduce(getMin, null)
                        let max = values.reduce(getMax, null)

                        let sum = values.reduce(getSum, 0)
                        let count = values.reduce(getCount, 0)
                        let avg = count === 0 ? 0 : count ? sum / count : undefined

                        aggregateGroupName = dataPoint.aggregate_group ? dataPoint.aggregate_group : undefined;
                        aggregateGroup = {
                            now,
                            min,
                            max,
                            avg
                        }
                    }

                    if (line.dataAggregate == 'first') {
                        if (!isAggregateGroupAlreadyDefined(aggregateGroupName, lineData) && isDataDefined(aggregateGroup)) {
                            lineData['dataValues'][aggregateGroupName] = aggregateGroup;
                        }
                    } else if (line.dataAggregate == 'sum' && !dataTargetCache.includes(dataPoint.data_target)) {
                        if (!isAggregateGroupAlreadyDefined(aggregateGroupName, lineData) && isDataDefined(aggregateGroup)) {
                            lineData['dataValues'][aggregateGroupName] = aggregateGroup;
                            dataTargetCache.push(dataPoint.data_target)
                        } else if (isAggregateGroupAlreadyDefined(aggregateGroupName, lineData) && isDataDefined(aggregateGroup)) {
                            sumData(lineData['dataValues'][aggregateGroupName], aggregateGroup)
                            dataTargetCache.push(dataPoint.data_target)
                        }
                    }
                }

                line.set('data', lineData)
            }


        }


        function getNow(now, currentValue) {
            if (!now) {
                now = currentValue[1]
            }
            return now
        }

        function getMin(min, currentValue) {
            if ((!min && currentValue[1] != undefined) || (min > currentValue[1] && currentValue[1] != undefined)) {
                min = currentValue[1]
            }
            return min
        }

        function getMax(max, currentValue) {
            if ((!max && currentValue[1] != undefined) || (max < currentValue[1] && currentValue[1] != undefined)) {
                max = currentValue[1]
            }
            return max
        }

        function getSum(sum, currentValue) {
            return sum + currentValue[1]
        }

        function getCount(count, currentValue) {
            if (currentValue[1]) count++;
            return count
        }

        function isAggregateGroupAlreadyDefined(aggregateGroupName, lineData) {
            let aggregateGroup = lineData?.['dataValues']?.[aggregateGroupName]
            return isDataDefined(aggregateGroup)
        }

        function isDataDefined(aggregateGroup) {
            return aggregateGroup != undefined &&
                aggregateGroup.now != undefined &&
                aggregateGroup.min != undefined &&
                aggregateGroup.max != undefined &&
                aggregateGroup.avg != undefined ? true : false
        }

        function sumData(currentAggregateGroup, newAggregateGroup) {
            currentAggregateGroup.now += newAggregateGroup.now
            currentAggregateGroup.min += newAggregateGroup.min
            currentAggregateGroup.max += newAggregateGroup.max
            currentAggregateGroup.avg += newAggregateGroup.avg
        }
    }
}
