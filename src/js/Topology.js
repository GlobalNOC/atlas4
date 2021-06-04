import Line from './Line.js';
import Point from './Point.js';
import Tile from './Tile.js';

/** Topology
Contains all Lines and Points for a particular topology
Responsible to update styles for lines and points based on the data
USED BY: Atlas
*/

export default class Topology {

    /** CONSTRUCTOR */
    constructor(atlas, config, options) {

        console.debug(`Creating new Topology for ${config.name}`);

        /** Leaflet Map Reference */
        this.map = atlas.map;
        this.atlas = atlas;

        /** Topology JSON Configuration*/
        this.config = config;
        this.name = config.name;
        this.image = config.image || config?.metadata?.image || config?.metadata?.logo;
        this.legend = config.legend;
        this.endpoints = config.endpoints;
        this.adjacencies = config.adjacencies;
        this.metadata = config.metadata || {}
        /** Atlas Topology Options */
        this.options = options;

        /** Add the name to options to pass to Line/Point for tooltips */
        this.options.name = this.name;

        if (config.tile) {
            setTimeout(() => {
                this.tile = new Tile(config.tile, this)
                this.tile.display()
            }, 500)
        }

        /** Twin-Line Flag */
        this.twins = false;
        /** Topology Defaults */
        this.active = true;
        this.view = this.createView();
        this.points = this.createPoints();
        this.lines = this.createLines();

        /** Topology Stats */
        this.stats = {
            points: this.points.length,
            lines: this.lines.length,
        };

        console.debug(`Finished creating Topology for ${config.name}!`);
    }

    createTile(config) {
        this.tile = new Tile(config, this)
        return this.tile
    }

    /** GET, SET+UPDATE, & PROPERTIES */

    // Get the value of the property
    get(property) {
        return this[property];
    }
    // Set property to a new value
    set(property, value) {
        this[property] = value;
        this.update(property);
    }
    // Recalculate any computed properties here
    update(property) {
        if (property == 'active') {
            if (this.active) {
                this.show();
            }
            else {
                this.hide();
            }
        }
        this.view = this.createView();
    }
    // Get the class property names and their values
    properties() {
        return Object.entries(this);
    }

    /** CLASS METHODS */

    show() {
        if (!this.active) {
            for (let layer of [...this.lines, ...this.points]) {
                layer.show()
                this.active = true;
            }
            this.stats = { lines: this.lines.length, points: this.points.length };
        }
    }
    hide() {
        if (this.active) {
            for (let layer of [...this.lines, ...this.points]) {
                layer.hide()
                this.active = false;
            }
            this.stats = { lines: 0, points: 0 };
        }
    }
    toggle() {
        if (this.active) {
            this.hide();
        }
        else {
            this.show();
        }
    }

    /** Return endpoint coords <lat,lng> **/
    getLatLng(endpoint) {
        return { lat: endpoint.lat, lng: endpoint.lng }
    }

    /** Helper function to set a view for the topology */
    createView() {
        console.debug(`Getting the best view for this.name...`);

        let lats = [];
        let lngs = [];

        for (let point in this.endpoints) {
            if (typeof point != 'undefined') {
                lats.push(this.endpoints[point].lat);
                lngs.push(this.endpoints[point].lng);
            }
        }

        let minLat = Math.min.apply(null, lats);
        let minLng = Math.min.apply(null, lngs);

        let maxLat = Math.max.apply(null, lats);
        let maxLng = Math.max.apply(null, lngs);

        let modLng = [];
        if (maxLng > 90 && minLng < -90) {

            for (let point in this.endpoints) {

                let lng = parseFloat(point.lng);

                if (lng > 90) {
                    lng = (180 - lng) - 180
                }
                modLng.push(lng);
            }
        }

        if (modLng.length == lngs.length) {
            minLng = Math.min.apply(null, modLng);
            maxLng = Math.max.apply(null, modLng);
        }

        return [[minLat, minLng], [maxLat, maxLng]];
    }

    /* TODO: change method name */
    removeFrom(map) {
        map.eachLayer(layer => {
            if (!layer._tileSize) {
                map.removeLayer(layer);
            }
        });
    }

    /* Creates a new line object for each adjacency in the topology JSON */
    createLines() {
        console.debug('Getting adjacency lines...');
        let lines = [];
        for (let adj of this.adjacencies) {
            lines.push(new Line(adj, this));
        }

        // Return for application convenience
        this.lines = lines;
        return this.lines;
    }

    createLine(adj, ep_a, ep_b) {
        let line = new Line(adj, this);
        this.lines.push(line);
        line.layer[0].addTo(this.map);
        return line;
    }

    createPoints() {
        console.debug('Getting endpoint markers...');
        this.points = Object.keys(this.endpoints).map(name => {
            return new Point(name, this);
        });
        // Return for application convenience
        return this.points;
    }

    /* Add a new point for this topology (Used by map builder) */
    createPoint(name) {
        let newPoint = new Point(name, this);
        newPoint.newPoint = true;
        this.points.push(newPoint);
        return newPoint;
    }

    drawEndpoints(map) {
    }

    draw(map) {
        this.drawAdjacencies(map);
        this.drawEndpoints(map);
    }

    // Returns true if Object is a line
    static isLine(obj) {
        return obj instanceof Line ? true : false;
    }

    // Returns true if Object is a Point
    static isPoint(obj) {
        return obj instanceof Point ? true : false;
    }

};
