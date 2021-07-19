import L from "leaflet";
import Tooltip from "./Tooltip.js";
import tooltipHtml from "../html/tooltip_line.html";
import "../extensions/Curve.js";
import Anchor from "./Anchor.js";
import Waypoint from "./Waypoint.js";

/** Line
Stores and creates all properties needed by the map to produce a line
USED BY : Topology, Atlas
*/

export default class Line {
    /** CONSTRUCTOR */
    constructor(adjacency, topology) {
        /** Set the Line options to the global default set by Atlas on the prototype*/
        this.options = JSON.parse(JSON.stringify(this.defaults));
        // Note: Without the JSON parse, the options become a reference to the prototype.
        // This will break everything about the default/config system

        /** Set the dataTarget from the options */
        this.dataTarget = adjacency.metadata?.dataTarget || this.options.dataTarget || 'chooseMax';
        this.dataAggregate = adjacency.metadata?.dataAggregate || this.options.dataAggregate || 'first';
        this.colorCriteria = adjacency.metadata?.colorCriteria || this.options.colorCriteria || 'now';
        this.units = this.options.units;

        /** Line options from the Topology */
        this.map = topology.map;
        this.topology = topology.name;
        this.image = topology.image;
        this.legend = topology.options.legends.lines;
        this.twins = topology.options.twins;

        /** Line Endpoints */
        this.a = topology.endpoints[adjacency.a];
        this.b =
            topology.endpoints[adjacency.b] ||
            this.createNeighbourEndpoint(adjacency, this.a, topology);

        /** Line parameters from the adjacency config */
        this.a.name = adjacency.a;
        this.b.name = adjacency.b;
        this.id = adjacency.id || this.generateID(6);
        this.min = adjacency.min || 0;
        this.max = adjacency.max || NaN;
        this.description = adjacency.description || "";
        this.color = adjacency.color;
        this.label = adjacency.label || `${this.a.name} - ${this.b.name}`;
        this.anchors = adjacency.anchors || ["L"];
        if (this.anchors.length == 0) this.anchors = ["L"];
        this.targets = adjacency.targets;

        /** Coloring criteria
         ** Supported values: now, min, max, avg
         ** Default value: now
         **/

        this.anchorpoints = [];
        this.waypoints = [];
        /** Line Path Default */
        /** Initialize data with the label */
        this.metadata = adjacency.metadata || {};
        this.data = { label: this.label, ...this.metadata };

        /** SVG Path array for the line */
        this.path = this._createPath();

        /** Line option defaults */
        this.options.weight = adjacency.weight || this.options.weight || "5";
        this.options.color = this._color();

        /** Leaflet Layer Element */
        this.layer = this._createLayer();

        /** Tooltip bound to the Line instance */
        this.tooltip = new Tooltip(this);

        console.debug(`Line created for ${this.a.name} to ${this.b.name}`);
    }

    /** LINE PROPERTY METHODS
     * Generic get() and set() work for all properties.
     * When a property is set(), update() will be called.
     * update() should call any functions needed when a certain property changes.
     * properties() simply returns all of the Line's properties.
     **/
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
        this.path = this._createPath();
        if (property === "data") {
            this.data.label = this.label;

            // Set new data on the Line's tooltip
            this.tooltip.set(property, this.data);

            // Set the new line color
            this.options.color = this._color();

            // Apply style changes to the layer(s)
            for (let l of this.layer) {
                // Circumventing Leaflet Bug. When changing the weight property
                // the leaflet method loses its appropriate 'this' binding
                let opts = JSON.parse(JSON.stringify(this.options));
                if (opts.weight) delete opts.weight;
                l.setStyle(opts);
            }
        } else if (property === "criteria") {
            // Set the new line color for the updated criteria
            this.options.color = this._color(this.criteria);

            // Apply style changes to the layer(s)
            for (let l of this.layer) {
                // Circumventing Leaflet Bug. When changing the weight property
                // the leaflet method loses its appropriate 'this' binding
                let opts = JSON.parse(JSON.stringify(this.options));
                if (opts.weight) delete opts.weight;
                l.setStyle(opts);
            }
        } else if (property === "style") {
            // Apply style changes to the layer(s)
            for (let l of this.layer) {
                l.setStyle(this.options);
            }
        }
        // Tooltip HTML template changes
        else if (property === "html") {
            this.tooltip.set("html", this.html);
        }
    }
    properties() {
        return Object.entries(this);
    }

    /** VISUAL ON/OFF METHODS
     * show()   - Display the line
     * hide()   - Remove the line from display
     * toggle() - Toggle the current display of the line
     **/
    show() {
        this.remove();
        this.layer = this._createLayer();
        for (let line of this.layer) {
            line.addTo(this.map);
        }
    }
    hide() {
        for (let line of this.layer) {
            line._path.style.display = "none";
        }
    }
    toggle() {
        for (let line of this.layer) {
            let state = line._path.style.display;

            if (state == "block") {
                this.hide();
            } else {
                this.show();
            }
        }
    }
    remove() {
        for (let line of this.layer) {
            line.remove();
        }
        this.layer = [];
    }

    /** CORE CLASS METHODS
     * setPath()      - Editor function to set a new path
     * _color()       - Return a color according to the Line's data and the Legend
     * _createPath()  - creates the SVG Path array for the line
     * _createLayer() - Creates the Leaflet layer object(s)
     * _splitPath()   - Splits the Line's path into two
     **/
    setPath(path, map) {
        this.path = path;
        this.anchors = path.slice(2, path.length - 1);
        if (this.layer.length > 0 && this.layer.length === 2) {
            let split = this._splitPath(this.path, this.options.weight);

            // Probably easier to access split lines by their index. It's guaranteed to have a length of 2
            for (let i = 0; i < split.length; i++) {
                // setPath() method in the next line is the setPath function from L.Curve
                this.layer[i].setPath(split[i]);
            }
        } else if (this.layer.length > 0) {
            this.layer[0].setPath(this.path);
        }
    }

    // Gets a color from the legend given a dataTarget
    _color(dataTarget = this.dataTarget) {
        let value;
        let color;

        let dataValues = this.data?.dataValues
        let dataValuesKeys = dataValues ? Object.keys(dataValues) : []

        if (this.dataTarget === 'chooseMax' && dataValues) {
            let dataValueNames = Object.keys(dataValues)
            let values = dataValueNames.map(valueName => {
                return dataValues[valueName][this.colorCriteria]
            })

            if (values.length) {
                value = Math.max(...values)
            }
        } else if (this.dataTarget === 'chooseMin' && dataValues) {
            let dataValueNames = Object.keys(dataValues)
            let values = dataValueNames.map(valueName => {
                return dataValues[valueName][this.colorCriteria]
            })

            if (values.length) {
                value = Math.min(...values)
            }
        } else if (dataValuesKeys.includes(this.dataTarget) && dataValues) {
            value = dataValues[this.dataTarget][this.colorCriteria]
        }

        // Get the color from the legend with the value retrieved
        color =
            this.legend.color(value, this.min, this.max) ||
            this.color ||
            Line.prototype.defaults.color;

        return color;
    }

    _createPath() {
        // !!! Loop is a fix for old map sources using improper lng values
        for (let ep of [this.a, this.b]) {
            if (ep.lng && ep.lng > 20) {
                ep.lng = ep.lng - 360;
            }
        }
        return [
            "M",
            [this.a.lat, this.a.lng],
            ...this.anchors,
            [this.b.lat, this.b.lng],
        ];
    }

    _createLayer() {
        let layers = [];

        if (this.twins) {
            for (let path of this._splitPath()) {
                layers.push(L.curve(path, this.options));
            }
        } else {
            layers.push(L.curve(this.path, this.options));
        }

        // Return the layer object(s) for convenience
        return layers;
    }

    _splitPath() {
        // The start and end point of the path, as XY coordinates
        let a = this.map.latLngToContainerPoint(this.path[1]);
        let b = this.map.latLngToContainerPoint(
            this.path[this.path.length - 1]
        );

        // Slope of perpendicular line
        let m = -((b.x - a.x) / (b.y - a.y));
        let w = parseFloat(this.options.weight);

        // Amount of X and Y distance from the initial point
        let x_dist = w * (1 / Math.sqrt(1 + m * m));
        let y_dist = m * x_dist;

        // Create two path arrays, one for each line
        let tube1 = [];
        let tube2 = [];
        for (let i in this.path) {
            // Check for and skip SVG command characters in the path
            if (!Array.isArray(path[i])) {
                tube1.push(this.path[i]);
                tube2.push(this.path[i]);
                continue;
            }

            // A point in the path
            let p = this.map.latLngToContainerPoint(path[i]);

            // Add the X and Y dist and add to tube 1
            let one = this.map.containerPointToLatLng({
                x: p.x + x_dist,
                y: p.y + y_dist,
            });
            tube1.push([one.lat, one.lng]);

            // Subtract the X and Y dist and add to tube 2
            let two = this.map.containerPointToLatLng({
                x: p.x - x_dist,
                y: p.y - y_dist,
            });
            tube2.push([two.lat, two.lng]);
        }
        return [tube1, tube2];
    }

    /** DEVELOPMENT HELPER FUNCTIONS */

    /** Generates a random 3-hex color code */
    randomColor() {
        let color = "#";
        for (let i = 0; i < 3; i++) {
            color = color + Math.round(Math.random() * 9);
        }
        return color;
    }

    hideToolTip() {
        this.tooltip.hide();
    }

    showToolTip() {
        this.tooltip.show();
    }

    createNeighbourEndpoint(adj, a, topology) {
        let id = this.generateID(6);
        let obj = {
            id: id,
            label: `${adj.a}-Second-Node`,
            lat: a.lat - 0.01,
            lng: a.lng - 0.1,
            singleCircuitNode: true,
            node_name: `${adj.a}-Second-Node`,
        };
        topology.endpoints[id] = obj;
        let node = topology.createPoint(id);
        node.layer.setStyle({ fillColor: "#EF485D", color: "#EF485D" });
        node.newPoint = false;
        adj.b = obj.name;
        return topology.endpoints[id];
    }

    createAnchors() {
        let anchorOpts = {
            radius: 4,
            fillColor: "red",
            color: "red",
            fillOpacity: 1,
        };
        for (let i = 0; i < this.path.length; i++) {
            switch (this.path[i]) {
                case "L": {
                    this.anchorpoints.push(
                        new Anchor(
                            this.path[i + 1],
                            i + 1,
                            this,
                            "L",
                            anchorOpts
                        )
                    );
                    i++;
                    break;
                }
                case "Q": {
                    this.anchorpoints.push(
                        new Anchor(
                            this.path[i + 2],
                            i + 2,
                            this,
                            "Q",
                            anchorOpts
                        )
                    );
                    i += 2;
                    break;
                }
                case "C": {
                    this.anchorpoints.push(
                        new Anchor(
                            this.path[i + 3],
                            i + 3,
                            this,
                            "C",
                            anchorOpts
                        )
                    );
                    i += 3;
                    break;
                }
            }
        }
        return this.anchorpoints;
    }

    removeAnchors() {
        for (let anchor of this.anchorpoints) {
            anchor.marker.remove();
        }
        this.anchorpoints = [];
    }

    createWaypoints() {
        let waypointOpts = {
            radius: 4,
            fillColor: "#00FF00",
            color: "#00FF00",
            fillOpacity: 1,
        };
        for (let i = 0; i < this.path.length; i++) {
            switch (this.path[i]) {
                case "L": {
                    i++;
                    break;
                }
                case "Q": {
                    let waypoint = new Waypoint(
                        this.path[i + 1],
                        i + 1,
                        this,
                        "Q",
                        waypointOpts
                    );
                    waypoint.setTargetAnchors(
                        this.path[i - 1],
                        this.path[i + 2],
                        i - 1,
                        i + 2
                    );
                    this.waypoints.push(waypoint);
                    i += 2;
                    break;
                }
                case "C": {
                    let waypointA = new Waypoint(
                        this.path[i + 1],
                        i + 1,
                        this,
                        "C",
                        waypointOpts
                    );
                    waypointA.setTargetAnchors(
                        this.path[i - 1],
                        undefined,
                        i - 1
                    );
                    this.waypoints.push(waypointA);
                    let waypointB = new Waypoint(
                        this.path[i + 2],
                        i + 2,
                        this,
                        "C",
                        waypointOpts
                    );
                    waypointB.setTargetAnchors(
                        this.path[i + 3],
                        undefined,
                        i + 3
                    );
                    this.waypoints.push(waypointB);
                    i += 3;
                    break;
                }
            }
        }
        return this.waypoints;
    }

    removeWaypoints() {
        for (let waypoint of this.waypoints) {
            waypoint.marker.remove();
            waypoint.wpLineA.remove();
            if (waypoint.wpLineB) {
                waypoint.wpLineB.remove();
            }
        }
        this.waypoints = [];
    }

    resetEditPoints(editor) {
        this.removeAnchors();
        this.removeWaypoints();
        let anchors = this.createAnchors();
        let waypoints = this.createWaypoints();

        for (const waypoint of waypoints) {
            waypoint.draw(this.map);
            waypoint.setDragListener(editor);
        }

        for (const anchor of anchors) {
            anchor.draw(this.map);
            anchor.setDragListener(editor);
            anchor.setSelectListener(editor);
        }
    }

    updateWaypoints(pos, latlng) {
        for (const waypoint of this.waypoints) {
            if (waypoint.anchorAPos === pos) {
                waypoint.anchorA = latlng;
                waypoint.updateLines();
            } else if (waypoint.anchorBPos === pos) {
                waypoint.anchorB = latlng;
                waypoint.updateLines();
            }
        }
    }

    generateID(length) {
        let result = "";
        var characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }
        return result;
    }
}
