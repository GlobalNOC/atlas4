
import L from 'leaflet';
import Line from './Line.js';
import Point from './Point.js';
import Legend from './Legend.js';

export default class Tooltip {

    constructor(source) {

        /** Leaflet Map Reference */
        this.map = source.map;
        this.data = source.data || {};
        this.topology = source.topology;
        this.image = source.image;
        this.sourceLayer = source.layer;
        this.units = source.units;
        this.legend = source.legend;
        this.staticTooltip = source.staticTooltip || false;
        if (source instanceof Line) {
            this.source = 'Line';
            this.html = this.defaults.line.html;
        }
        else if (source instanceof Point) {
            this.source = 'Point';
            this.html = this.defaults.point.html;
        }

        // Flag for hover behavior after clicking the layer
        this.clicked = false;

        /** Tooltip Layer */
        this.makeTooltip()

        // Put points in array for looping
        if (!Array.isArray(this.sourceLayer)) {
            this.sourceLayer = [this.sourceLayer];
        }


        /** Bind the Tooltip Event Handlers */
        for (let l of this.sourceLayer) {
            l.bindPopup(this.layer);
            l.on('click', function (e) {
                let tooltip = this.getPopup();
                tooltip.setLatLng(e.latlng);
                tooltip.openOn(this._map);
                this.clicked = true;
            });
            l.on('popupclose', function (e) {
                this.clicked = false;
            });
            l.on('mouseover', function (e) {
                if (!this.clicked) {
                    let tooltip = this.getPopup();

                    // Initializing a random position
                    tooltip.setLatLng(e.latlng);

                    // Creating the actual HTML element
                    tooltip.openOn(this._map);

                    let tooltipDetails = tooltip._wrapper.getBoundingClientRect();
                    console.log(tooltipDetails)

                    if (e.containerPoint.y < tooltipDetails.height) {
                        let newTooltipPosContainerY = e.containerPoint.y + tooltipDetails.height + 30;
                        let newTooltipPos = this._map.containerPointToLatLng({x: e.containerPoint.x, y: newTooltipPosContainerY});
                        tooltip.setLatLng(newTooltipPos);
                    }
                    
                }
            });
            l.on('mouseout', function (e) {
                if (!this.clicked) {
                    setTimeout(function () {
                        e.target.closePopup();
                    }, 200);
                }
            });
            this.update(l, this.data);
        }

        if (source.staticTooltip) this.activateTooltip(source)
    }

    /** GET, SET+UPDATE, & PROPERTIES */

    // Get the value of the property
    get(property) {
        return this[property];
    }
    // Set property to a new value
    set(property, value) {
        let props = property.split('.');
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
                }
                else {
                    ref = ref[props[i]];
                }
            }
        }
    }
    // Recalculate any computed properties here
    update(property) {
        if (property === 'html' || property === 'data' || property === 'image') {
            this.layer.setContent(this.replaceVars());
        }
    }
    // Get the class property names and their values
    properties() {
        return Object.entries(this);
    }

    /** VISUAL ON/OFF METHODS
        * show()    - Turn on tooltip
        * hide()    - Turn off tooltip
        * toggle()  - Turn on/off tooltip depending on its current state
        **/
    show() {
        for (let l of this.sourceLayer) {
            // if there's no popup, bind popup
            if (!l.getPopup()) {
                l.bindPopup(this.layer);
                l.on('click', function (e) {
                    let tooltip = this.getPopup();
                    tooltip.setLatLng(e.latlng);
                    tooltip.openOn(this._map);
                    this.clicked = true;
                });
                l.on('popupclose', function (e) {
                    this.clicked = false;
                });
                l.on('mouseover', function (e) {
                    if (!this.clicked) {
                        let tooltip = this.getPopup();
                        tooltip.setLatLng(e.latlng);
                        tooltip.openOn(this._map);
                    }
                });
                l.on('mouseout', function (e) {
                    if (!this.clicked) {
                        setTimeout(function () {
                            e.target.closePopup();
                        }, 200);
                    }
                });
            }
        }
        if (this.staticTooltip) this.activateTooltip()
    }

    hide() {
        for (let l of this.sourceLayer) {
            // if there's an existing popup, unbind it
            if (l.getPopup()) {
                l.removeEventListener('mouseover');
                l.removeEventListener('popupclose');
                l.removeEventListener('click');
                l.removeEventListener('mouseout');
                l.unbindPopup(this.layer);
                this.layer.remove()
            }
        }
    }

    toggle() {
        for (let l of this.sourceLayer) {
            if (!l.getPopup()) {
                l.bindPopup(this.layer);
            } else {
                l.unbindPopup(this.layer);
            }
        }
    }

    makeTooltip() {
        this.layer = L.popup({
            autoPan: this.defaults.autoPan,
            autoClose: this.staticTooltip ? false : true,
            closeOnClick: this.staticTooltip ? false : true,
            className: 'atlas4-tt',
        });
        this.layer.setContent(this.replaceVars(this.data));
    }

    makeStatic(staticFlag) {
        this.hide()
        if (staticFlag) this.staticTooltip = true;
        else this.staticTooltip = false;
        this.makeTooltip()
        this.show()
    }


    /** CLASS METHODS */

    readDataTargets(data, source) {

        let output = [];
        let keys = Object.keys(data);

        for (let key of keys) {

            let str = source ? `${source}.${key}` : key;

            if (Object.prototype.toString.call(data[key]) === '[object Object]') {
                output = [...output, ...this.readDataTargets(data[key], str)];
            }
            else {
                output.push([str, data[key]]);
            }
        }
        return output;
    }

    createDataTargets(data) {
        if (data) {
            let targets = this.readDataTargets(data);
            return targets.reduce((output, [key, val]) => (output[key] = val, output), {});
        }
        else {
            console.error('Could not create data targets! No data was given')
        }
    }

    activateTooltip() {
        // calling hide to remove all the listeners from tooltip
        this.hide()
        for (let l of this.sourceLayer) {
            l.bindPopup(this.layer);
            let tooltip = l.getPopup();
            tooltip.setLatLng(l.getLatLng());
            tooltip.openOn(this.map);
            this.clicked = true;

        }
    }

    replaceVars() {

        /*
        let output = document.createElement('div');
        output.innerHTML = this.html
        */
        let html = this.html;
        let data = this.createDataTargets(this.data);

        data.image = this.image;
        data.topology = this.topology;

        var div = document.createElement("DIV"); 
        div.innerHTML = html

        if (!data.image && div.getElementsByClassName('atlas4-tt-image').length) div.getElementsByClassName('atlas4-tt-image')[0].remove()
        
        html = div.innerHTML

        for (let field of Object.keys(data)) {
            
            let re = new RegExp(`\\$${field.replace(/\./g, '\\.')}`, 'g');
            let value = data[field] != null ? data[field] : 'No data';
            
            if (this.legend && !isNaN(value)) {
                value = this.legend.toSI(value);
            }
            html = html.replace(re, value);
            const imgSrcRegex = /img_src=/gm
            html = html.replace(imgSrcRegex, "src=");
        }
        html = html.replace(/\$(.+?)</g, 'N/A<')
        return html;
    }
};