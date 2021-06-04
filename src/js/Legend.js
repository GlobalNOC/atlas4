import css from '../css/Legend.css';

export default class Legend {

    constructor(id, options, container) {

        if (!document.querySelector(`#${container} .atlas4-legends`)) {
            console.error(`Legend(ID:${id}) created, but no parent container was initialized!`);
        }

        // Legend Global Options
        this.orientation = options.orientation.toLowerCase() || 'horizontal';
        this.size = options.size
        this.position = options.position
        // Legend Instance Options
        options = options.legends[id];

        this.id         = id;
        this.type       = options.type.toLowerCase() || 'percent';
        this.units      = options.units;
        this.min        = options.min;
        this.max        = options.max;
        this.colors     = options.colors;
        this.thresholds = options.thresholds || [];
        this.parentContainer = container 

        // Initialize the DOM element properties
        this.legend;
        this.colorBar;
        this.labelBar;

        // Some defaults for percentages
        if (this.type === 'percent') {
            this.min  = 0;
            this.max  = 100;
            this.unit = '%';
        }

        if (this.type === 'absolute') {
            if (!this.thresholds) {
                console.error('Absolute value legend created but no thresholds were given!')
            }
            if (this.thresholds.length != (this.colors.length - 1)) {
                console.error('Absolute value legend has a wrong number of thresholds! (Number of colors minus one)')
            }
        }

        // Expand cells in the correct direction
        this.expand;
        this._makeExpand();

        // Flexbox Settings
        this.flex
        this._makeFlex();

        // Initialize the DOM elements
        this.legend;
        this._makeLegendContainer();

        this.colorBar;
        this._makeColorBar();
        this._addColorBar();

        this.labelBar;
        this._makeLabelBar();
        this._addLabelBar();

        // Add the Legend DOM element to the Legends container
        document.querySelector(`#${this.parentContainer} .atlas4-legends`).appendChild(this.legend);

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
            for (let i=0; i < props.length; i++) {

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
        if (property === 'colors') {
            this.reload();
        }
        else if (property === 'orientation') {
            this._makeFlex();
            this._makeExpand();
            this.reload();
        }
    }
    // Get the class property names and their values
    properties() {
        return Object.entries(this);
    }

/** CLASS METHODS */

    show() {
        this.legend.style.display = 'flex';
    }

    hide() {
        this.legend.style.display = 'none';
    }

    toggle() {
        if (this.legend.style.display == 'flex') {
            this.hide();
        }
        else {
            this.show();
        }
    }

    reload() {
        this._removeLabelBar();
        this._removeColorBar();
        this._makeLabelBar();
        this._makeColorBar();
        this._addColorBar();
        this._addLabelBar();
    }

    removeParent() {
        this.legend.parentNode.remove()
    }

    // Remove whole legend and create and add again
    rerender() {
        this.removeParent()
        Legend.createParent(this.parentContainer, {
            orientation: this.orientation,
            size: this.size,
            orientation: this.orientation,
            position: this.position
        })

        // Expand cells in the correct direction
        this._makeExpand();
        // Flexbox Settings
        this._makeFlex();
        // Initialize the DOM elements
        this._makeLegendContainer();

        this._makeLabelBar();
        this._makeColorBar();
        this._addColorBar();
        this._addLabelBar();

        // Add the Legend DOM element to the Legends container
        document.querySelector(`#${this.parentContainer} .atlas4-legends`).appendChild(this.legend);
    }

    // Returns a color given a value
    color(value, min=this.min, max=this.max) {

        // Check for undefined values
        if (value === null || value === undefined) {
            return;
        }

        if (isNaN(value)) {
            console.warn(`Value passed for coloration is not a number: ${value}`);
        }

        // Percentage Legend
        if (this.type == 'percent') {
            if (!max) return undefined
            // Get the percentage out of the max of the value
            let pct = (value / max - min) * 100;

            if (isNaN(pct)) {
                console.warn(`Value passed for coloration is not a number: ${value}`);
            }
            // Check if the percentage is invalid
            if (pct <= 0) {
                return this.colors[0];
            }
            if (pct >= 100) {
                return this.colors[this.colors.length-1];
            }

            // If thresholds defined, use defined threshold buckets
            if (this.thresholds && this.thresholds.length > 0) {
                for (let i = 0; i < this.thresholds.length; i++) {
                    if (pct <= this.thresholds[i]) {
                        return this.colors[i];
                    }  
                }
                return this.colors[this.colors.length-1];
            }

            // Get the percent range that each color bucket represents
            let bucket = 100 / this.colors.length;

            // Check each color until the percentage is contained in the color bucket
            for (let i=1; i <= this.colors.length; i++) {
               
                // Bucket size is multiplied by the bucket number and compared
                if (pct <= i*bucket) {

                    // Get the color at its index (loop starts at 1)
                    return this.colors[i-1];
                }
            }
        }
        // Absolute Value Legend
        else if (this.type == 'absolute') {

            let len = this.thresholds.length;

            if (value <= this.min) {
                return this.colors[0];
            }
            if (value >= this.max) {
                return this.colors[this.colors.length-1];
            }

            // Check each color by threshold index
            for (let i=0; i < len; i++) {
                
                // Return the selected color if the value is below the threshold
                if (value < this.thresholds[i]) {
                    return this.colors[i];
                }
            }

            // Return the last color if the value is greater than the last threshold
            return this.colors[this.colors.length - 1];
        }
    }

    changeColors() {
        let container = document.getElementById(this.id).getElementsByClassName('legend-colors');
    }

    /** Sets expansion direction dynamically */
    _makeExpand() {
        this.expand = this.orientation === 'vertical' ? 'height' : 'width'; 
    }

    /** Sets flexbox orientations dynamically */
    _makeFlex() {
        let flex = {};
        if (this.orientation === 'vertical') {
            flex.legend = 'row nowrap';
            flex.colors = 'column-reverse nowrap';
            flex.labels = 'column-reverse nowrap';
        }
        else if (this.orientation === 'horizontal') {
            flex.legend = 'column nowrap';
            flex.colors = 'row nowrap';
            flex.labels = 'row nowrap';
        }
        else {
            console.error(`Legend(${this.id}): Invalid orientation "${this.orientation}" given!`);
        }
        this.flex = flex; 
    }

    /** Creates the Legend's main container */
    _makeLegendContainer() {
        let div = document.createElement('div');
        div.style[this.expand] = '100%';
        div.style.height       = 'auto';
        div.style['flex-flow'] = this.flex.legend;
        div.className          = 'atlas4-legend';
        div.setAttribute('legend-id', this.id);

        this.legend = div;        
    }

    /** Creates the colors container filled with color elements */
    _makeColorBar() {

        let size = this.colorSize();

        let container = document.createElement('div');
        container.style['flex-flow'] = this.flex.colors;
        container.className          = 'legend-colors';
       
        // Add a spacer
        let spacer = document.createElement('div');
        spacer.style[this.expand] = `${size}%`;
        container.appendChild(spacer);
        
        for (let i in this.colors) {
            let color = document.createElement('div');
            color.style[this.expand] = `${size}%`;
            color.style.background   = `${this.colors[i]}`;
            color.className          = 'legend-color';
            
            container.appendChild(color);    
        }

        // Add a spacer
        let spacer2 = document.createElement('div');
        spacer2.style[this.expand] = `${size}%`;
        container.appendChild(spacer2);

        this.colorBar = container;
    }

    /** Creates the labels container filled with label elements */
    _makeLabelBar() {

        let container = document.createElement('div');
        container.style['flex-flow'] = this.flex.labels;
        container.className          = 'legend-labels';
        if (this.expand == 'height') {
            container.style['align-items'] = 'flex-start';
            container.style['padding-left'] = '5px';
        }

        // No Thresholds
        if (this.thresholds.length < 1) {

            if (typeof this.min != 'undefined' && typeof this.max != 'undefined') {

                // Add a label for min and max
                for (let key of ['min', 'max']) {

                    let label = document.createElement('div');
                    label.style[this.expand] = '50%';

                    if (this.orientation === 'vertical') {
                        if (key === 'min') {
                            div.style['align-items'] = 'flex-end';
                        }
                        else {
                            div.style['align-items'] = 'flex-start';
                        }
                    }

                    label.className          = `legend-label ${key}`;
                    label.innerHTML          = this.toSI(this[key])
                
                    container.appendChild(label);
                }
            }
            else {
                console.error('The legend requires thresholds or a min and max value, but neither were given!');
            }
        }
        // Specified Thresholds
        else {

            let size = this.labelSize();
            let thresholds = [...this.thresholds];

            if (typeof this.min != 'undefined' && typeof this.max != 'undefined') {
                thresholds.unshift(this.min);
                thresholds.push(this.max);
            }

            // Add a spacer
            let spacer = document.createElement('div');
            spacer.style[this.expand] = `${size/2}%`;
            container.appendChild(spacer);

            // Add labels
            for (let i in thresholds) {
                let label = document.createElement('div');
                label.style[this.expand] = `${size}%`;
                label.className          = 'legend-label';
                label.innerHTML          = this.toSI(thresholds[i], undefined, true);
                container.appendChild(label);
            }

            // Add another spacer
            let spacer2 = document.createElement('div');
            spacer2.style[this.expand] = `${size/2}%`;
            container.appendChild(spacer2);
        }

        this.labelBar = container;
    }


    /** Adds Color and Label Bars to Legend Container */
    _addColorBar() {
        this.legend.appendChild(this.colorBar);
    }
    _addLabelBar() {
        this.legend.appendChild(this.labelBar);
    }

    /** Removes Color and Label Bars */
    _removeColorBar() {
        this.legend.removeChild(this.colorBar);
    }
    _removeLabelBar() {
        this.legend.removeChild(this.labelBar);
    }

    /** Gets bucket width percentage given an array */
    colorSize() {
        return Math.round((100 / this.colors.length + 2) * 100) / 100;
    }

    labelSize() {
        return Math.round((100 / this.thresholds.length + 3) * 100) / 100;
    }


/** STATIC METHODS */

    toSI(value, decimals = 2, forLegend = false) {

        if (value === undefined || value === null) {
            return;
        }

        let unit = this.units;

        if (this.type != 'percent' || !forLegend) {
            if (value === 0) {
                return `0 ${unit}`;
            }
    
            const d     = decimals < 0 ? 0 : decimals;
            const sizes = [`${unit}`, `K${unit}`, `M${unit}`, `G${unit}`, `T${unit}`, `P${unit}`, `E${unit}`, `Z${unit}`, `Y${unit}`];
    
            const i = Math.floor(Math.log(value) / Math.log(1000));
    
            return parseFloat((value / Math.pow(1000, i)).toFixed(d)) + ' ' + sizes[i];
        } else {
            return `${value}%`
        }
        
    } 

    static createParent(container, options) {

        let settings = {
            top: '',
            bottom: '',
            left: '',
            right: '',
            flex: 'column nowrap',
            size: options.size
        };
     
        // Set Position  
        for (let key of options.position.split('-')) {
            if (key === 'center') {
                let w = settings.size.substring(0, settings.size.length - 1);
                let left = (100 - w) / 2;
                settings.left = left + '%';
            }
            else{
                settings[key] = '0';
            }
        }

        let div = document.createElement('div');

        // Set Orientation
        if (options.orientation.toLowerCase() === 'vertical') {
            // Row of Columns
            settings.flex = 'row nowrap';
            div.style.height = options.size;
            div.style.marginLeft = '5px'
        }
        else {
            div.style.width = options.size;
            div.style.marginBottom = '5px'
        }

        div.style['flex-flow'] = settings.flex;
        div.style.top          = settings.top;
        div.style.bottom       = settings.bottom;
        div.style.left         = settings.left;
        div.style.right        = settings.right;
        div.style['z-index']   = '400'; // Above Map, Below Controls

        div.classList.add('atlas4-legends');
        document.getElementById(container).append(div)
    }
};
