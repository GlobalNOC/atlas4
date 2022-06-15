import L from "leaflet";
import Tooltip from "./Tooltip.js";
import tooltipHtml from "../html/tooltip_point.html";

/** Point
Contains all values and method necessary for a point on the map
USED BY: Topology
*/

export default class Point {
    /** CONSTRUCTOR */
    constructor(label, topology) {
        // Use the class-global default options
        this.options = this.defaults;
        this.dataTarget = this.options.dataTarget;
        // Point parameters from Topology
        this.point = topology.endpoints[label];

        this.map = topology.map;
        this.endpoint = topology.endpoints;
        this.endpoint[label].name = label;
        this.image = topology.image;
        this.topology = topology.name;
        this.options = topology.options.pointOptions || this.defaults;
        this.legend = topology.options.legends.points;
        // /* DEVELOPMENT FIX FOR OLD MAP SOURCES */
        /* 
            104°E is slightly east of Singapore, which is our temporary cutoff point.
            Circuits that cross this longitude, for the time being, will need to have their 
            nodes that are west of 104°E moved manually with map-builder, 360°E, as is done below.
        */
        if (this.point.lng > 104 && !topology.tile) {
            this.point.lng = this.point.lng - 360;
        }

        this.coord = [Number(this.point.lat), Number(this.point.lng)];
        this.id = this.point.id || this.generateID(6);
        this.point.id = this.id;
        this.target = this.point.targets;
        this.label = this.point.label || label;
        this.min = this.point.min || this.options.min;
        this.max = this.point.max || this.options.max;
        this.shape = this.point.shape || this.options.shape || "circle";
        this.size = this.point.size || this.options.size || 6;
        this.stroke = this.point.stroke || this.options.stroke || undefined;
        this.color = this.point.color || this.options.color || undefined;
        this.fill = this.point.fill || this.options.fill || "#000000";
        this.opacity = this.point.fillOpacity || this.options.fillOpacity || 1;
        this.staticTooltip = this.options.staticTooltip || false;

        // TODO: These defaults only apply to circles
        this.options = {
            radius: this.size,
            shape: this.shape,
            color: this.color,
            stroke: this.stroke,
            fillColor: this.fill,
            fillOpacity: this.opacity,
            staticTooltip: this.staticTooltip,
        };

        this.data = { label: this.label };

        this.color = this._color();
        this.layer = this._createLayer();

        // Create and bind the tooltip
        this.tooltip = new Tooltip(this);

        console.debug(`Point made at ${this.coord} for ${this.label}`);
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
    set(property, value) {
        this[property] = value;
        this.update(property);
    }
    update(property) {
        // Set new data on the Point's tooltip
        if (property === "data") {
            this.tooltip.set("data", this.data);
            this.data.label = this.label;
            //this.color = this._color();
        }

        // Update the point options
        this.options = {
            radius: this.size,
            shape: this.shape,
            color: this.color,
            stroke: this.stroke,
            fillColor: this.fill,
            fillOpacity: this.opacity,
            opacity: this.opacity,
        };
        //Apply style changes to the layer object
        this.layer.setStyle(this.options);
    }
    properties() {
        return Object.entries(this);
    }

    /** VISUAL ON/OFF METHODS
     * show()   - Display the point
     * hide()   - Remove the point from display
     * toggle() - Toggle the current display of the point
     **/
    show() {
        this.layer.addTo(this.map);
        this.layer._path.style.display = "block";
    }
    hide() {
        this.layer._path.style.display = "none";
    }
    remove() {
        if (this.layer) {
            this.layer.remove();
            this.layer = undefined;
        }
    }
    toggle() {
        let state = this.layer._path.style.display;
        if (state == "block") {
            this.hide();
        } else {
            this.show();
        }
    }

    /** CORE CLASS METHODS
     * _color()       - Returns a color according to the Line's data and the Legend
     * _createLayer() - Creates the Leaflet layer object
     **/
    _createLayer() {
        if (this.options.shape === "circle") {
            return L.circleMarker(this.coord, this.options);
        }
    }

    // Gets a color from the legend for a given dataTarget
    _color(dataTarget = "node.now") {
        let value;
        let color;
        let criteria = dataTarget.split(".");

        // Select the correct value from the data using the dataTarget
        if (!dataTarget) {
            value = undefined;
        } else if (criteria.length < 2) {
            value = this.data[dataTarget];
        } else {
            let ref = this.data;
            for (let i = 0; i < criteria.length; i++) {
                if (!ref) {
                    value = undefined;
                    break;
                }
                if (i === criteria.length - 1) {
                    value = ref[criteria[i]];
                } else {
                    ref = ref[criteria[i]];
                }
            }
        }

        // Get the color from the legend with the value retrieved
        if (this.legend) {
            color = this.legend.color(value, this.min, this.max);
        }

        if (!color) {
            color = this.defaults.color;
        }

        return color;
    }

    hideToolTip() {
        this.tooltip.hide();
    }

    showToolTip() {
        this.tooltip.show();
    }

    makeStatic(staticFlag) {
        this.staticTooltip = staticFlag;
        this.tooltip.makeStatic(staticFlag);
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
