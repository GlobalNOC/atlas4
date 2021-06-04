import css from '../css/L.Control.Atlas.css';

L.Control.Atlas = L.Control.Zoom.extend({
    options: {
        position: "topleft",
        zoomInText: "+",
        zoomInTitle: "Zoom in",
        zoomOutText: "-",
        zoomOutTitle: "Zoom out",
        zoomMinText: "Zoom min",
        zoomMinTitle: "Zoom min",
        showAllText:  "Show all layers",
        showAllTitle: "Show all layers",
        hideAllText: "Hide all layers",
        hideAllTitle: "Hide all layers",

        toggleEditorText: "",
        toggleEditorTitle: "Toggle Atlas Editor"

    },

    onAdd: function (map) {
        var zoomName = "leaflet-control-zoom"
            , container = L.DomUtil.create("div", zoomName + " leaflet-bar")
            , options = this.options

        this._atlas = this.options.atlas;
        this._map = map;

        this._zoomInButton = this._createButton(options.zoomInText, options.zoomInTitle,
            zoomName + '-in', container, this._zoomIn, this);

        this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
            zoomName + '-out', container, this._zoomOut, this);

        if (this._map.options.atlas4.zoomMin) {
            this._zoomMinButton = this._createButton(options.zoomMinText, options.zoomMinTitle,
                zoomName + '-min', container, this._zoomMin, this);
        }

        if (this._map.options.atlas4.allLayers) {
            
            this._showAllButton = this._createButton(
                options.showAllText,
                options.showAllTitle,
                'show-all-layers',
                container,
                this._showAll,
                this
            );

            this._hideAllButton = this._createButton(
                options.hideAllText, 
                options.hideAllTitle, 
                'hide-all-layers', 
                container, 
                this._hideAll, 
                this
            );
        }

        this._updateDisabled();
        map.on('zoomend zoomlevelschange', this._updateDisabled, this);

        this._editorButton = this._createButton(options.toggleEditorText, options.toggleEditorTitle,
            'atlas-toggle-editor', container, this._toggleEditor, this);

        this.editorFlag = false;
        
        return container;
    },

    _toggleEditor: function () {
        if (!this.editorFlag) {
            this._atlas.editor.showToolbar();
            this._atlas.editor.showSidebar();
            this._atlas.editor.sidebar.sendToBack();
        } 
        else {
            this._atlas.editor.hideToolbar();
            this._atlas.editor.hideSidebar();
        }
        
        this.editorFlag = !this.editorFlag;
    },

    _zoomMin: function () {
        if (this.options.minBounds) {
            return this._map.fitBounds(this.options.minBounds);
        }
        this._map.setZoom(this._map.getMinZoom())
    },

    _showAll: function() {
        for (let topology in this._atlas.topologies) {
            if (!this._atlas.topologies[topology].active) {
                this._atlas.topologies[topology].toggle();
            }
        };
        this._atlas.setView([30, -110], 2);

        // Trigger update of the stat counts
        this._atlas.updateStats();

        // Set the layersOn flag for the map
        this._atlas.set('layersOn', true);
    },

    _hideAll: function() {
        for (let topology in this._atlas.topologies) {
            if (this._atlas.topologies[topology].active) {
                this._atlas.topologies[topology].toggle();
            }
        };
        // Trigger update of the stat counts
        this._atlas.updateStats();

        // Set the layersOn flag for the map
        this._atlas.set('layersOn', false);
    },

    _updateDisabled: function () {

        var map = this._map
        var className = "leaflet-disabled"


        L.DomUtil.removeClass(this._zoomInButton, className)
        L.DomUtil.removeClass(this._zoomOutButton, className)

        if (map.options.atlas4.zoomMin) {
            L.DomUtil.removeClass(this._zoomMinButton, className)
        }

        if (map._zoom === map.getMinZoom()) {
            L.DomUtil.addClass(this._zoomOutButton, className)
        }

        if (map._zoom === map.getMaxZoom()) {
            L.DomUtil.addClass(this._zoomInButton, className)
        }

        if (map._zoom === map.getMinZoom() && map.options.atlas4.zoomMin) {
            L.DomUtil.addClass(this._zoomMinButton, className)
        }
    }
});
