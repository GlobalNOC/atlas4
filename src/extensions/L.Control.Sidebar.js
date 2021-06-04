import css from '../css/L.Control.Sidebar.css';

import sidebar from '../html/sidebar.html';
import metadata_kv from '../html/metadata_kv.html';

L.Control.Sidebar = L.Control.extend({
    options: {
        position: "topright"
    },

    onAdd: function (map) {
        let containerName = "atlas-editor-sidebar-container"
        this.sbContainer = L.DomUtil.create("div", containerName);
        let options = this.options;

        this._atlas = options.atlas;
        this._editor = this._atlas.editor;

        let mapContainer = this._atlas.map._container

        this.resizeObserver = new ResizeObserver(() => {
            // this.sbContainer.style.width = mapContainer.offsetWidth + 'px';
            this.sbContainer.style.height = mapContainer.offsetHeight + 'px';
        });
        this.resizeObserver.observe(mapContainer);

        this.sbContainer.innerHTML = sidebar

        this.listeners = {};

        return this.sbContainer;
    },

    sendToBack: function () {
        let parent = this.sbContainer.parentElement;
        let grandParent = parent.parentElement;
        grandParent.insertBefore(parent, grandParent.childNodes[0]);
    },

    registerElements: function () {
        if (!this.controls) {
            this.controls = {};
            let container = this.sbContainer;

            this.controls.sidebar = container.children[0];

            // General Info Window
            this.controls.workingTopology = container.getElementsByClassName('editor-gi-topology')[0];
            this.controls.currentTool = container.getElementsByClassName('editor-gi-tool')[0];

            // Tool Info Window
            this.controls.toolInfo = container.getElementsByClassName('sidebar-tool-info-description')[0];

            // NPW Controls
            this.controls.nodeName = document.getElementById('npw-name');
            // this.controls.nodeID = document.getElementById('npw-id');
            // this.controls.nodeIDLabel = document.getElementById('npw-id-label');
            this.controls.nodeLabel = document.getElementById('npw-label');
            this.controls.nodeSize = document.getElementById('npw-size');
            this.controls.nodeSizeLabel = document.getElementById('npw-size-label');
            this.controls.nodeColor = document.getElementById('npw-color');
            this.controls.nodeColorWrap = document.getElementById('npw-color-wrap');
            this.controls.nodeSave = document.getElementById('npw-save');
            this.controls.nodeCancel = document.getElementById('npw-cancel');
            this.controls.nodeDelete = document.getElementById('npw-delete');
            this.controls.nodeMore = document.getElementById('npw-more');
            this.controls.npwJSON = document.getElementById('sidebar-npw-properties-json');
            this.controls.npwJSONText = document.getElementById('sidebar-npw-json-textarea');
            this.controls.npwJSONStatus = document.getElementById('npw-json-status');
            this.controls.npwWindow = document.getElementById('sidebar-npw-window');

            // JSON Window
            this.controls.JSONText = document.getElementById('sidebar-json-textarea');
            this.controls.JSONButton = document.getElementById('sidebar-json-button');
            this.controls.JSONDescription = document.getElementById('sidebar-json-window-desc');

            // Line Properties Window
            this.controls.lpwWindow = document.getElementById('sidebar-lpw-window');
            this.controls.lineA = document.getElementById('lpw-epa');
            this.controls.lineB = document.getElementById('lpw-epb');
            this.controls.lineLabel = document.getElementById('lpw-label');
            this.controls.lineWeight = document.getElementById('lpw-weight');
            this.controls.lineWeightLabel = document.getElementById('lpw-weight-label');
            this.controls.lineColor = document.getElementById('lpw-color');
            this.controls.lineColorWrap = document.getElementById('lpw-color-wrap');

            this.controls.lineDelete = document.getElementById('lpw-delete');
            this.controls.lineMore = document.getElementById('lpw-more');

            this.controls.lpwJSON = document.getElementById('sidebar-lpw-properties-json');
            this.controls.lpwJSONText = document.getElementById('sidebar-lpw-json-textarea');
            this.controls.lpwJSONStatus = document.getElementById('lpw-json-status');

            this.controls.lpwMetadataWindow = document.getElementById('sidebar-lpw-metadata');
            this.controls.lpwManageProperties = document.getElementById('lpw-metadata-manage');
            this.controls.lpwSaveProperties = document.getElementById('lpw-metadata-save');

            // Line Editor Window
            let curveBtns = document.getElementById('sidebar-curve-opt-cont').children
            this.controls.lineCurveL = curveBtns[0]
            this.controls.lineCurveC = curveBtns[1]
            this.controls.lineCurveQ = curveBtns[2]
            let editAnchorButtons = document.getElementById('sidebar-edit-anchor-opt-cont').children
            this.controls.lineCurveAdd = editAnchorButtons[0]
            this.controls.lineCurveMinus = editAnchorButtons[1]
            this.controls.lineEditWindow = document.getElementById('sidebar-line-edit-window');

            // Topology Editor Window

            this.controls.tewWindow = document.getElementById('sidebar-topology-window');
            this.controls.tewMetadataWindow = document.getElementById('sidebar-tew-metadata');
            this.controls.tewManageProperties = document.getElementById('tew-metadata-manage');
            this.controls.tewDeleteTopology = document.getElementById('tew-delete-topology');
            this.controls.tewDeleteTopology = document.getElementById('tew-delete-topology');
            this.controls.tewChangeTile = document.getElementById('tew-change-map-tile');
            this.controls.tewTileHeight = document.getElementById('tew-tile-height');
            this.controls.tewTileWidth = document.getElementById('tew-tile-width');
            this.controls.tewTileAspect = document.getElementById('tew-tile-preserve-aspect-ratio');

            this.controls.sidebar.addEventListener('mouseover', () => this._atlas.map.scrollWheelZoom.disable())
            this.controls.sidebar.addEventListener('mouseout', () => this._atlas.map.scrollWheelZoom.enable())
        }
    },

    openTopologyEditWindow: function (topology) {
        this._atlas.map.dragging.disable();
        this._atlas.map.scrollWheelZoom.disable();

        let c = this.controls;
        let that = this;
        c.tewWindow.style.display = 'block';

        this.listeners.managePropertiesTEW = function () {
            that._editor.openTopologyKVModal(topology)
        }

        this.listeners.deleteSelectedTopology = function() {
            topology.hide()
        }

        this.listeners.changeMapTile = function() {
            that._editor.openTileUploadModal(topology)
        }

        this.listeners.changeTileHeight = function() {
            let height = Number(c.tewTileHeight.value)
            if (height > 0 && !isNaN(height)) {
                if (c.tewTileAspect.checked) {
                    let currentHeight = topology.tile.config.height
                    let currentWidth = topology.tile.config.width
                    let width = (height * currentWidth) / currentHeight
                    topology.tile.setDimensions(width, height)
                } else {
                    topology.tile.setDimensions(undefined, height)
                }  
                c.tewTileWidth.value = topology.tile.config.width
            }
        }

        this.listeners.changeTileWidth = function() {
            let width = Number(c.tewTileWidth.value)
            if (width > 0 && !isNaN(width)) {
                if (c.tewTileAspect.checked) {
                    let currentHeight = topology.tile.config.height
                    let currentWidth = topology.tile.config.width
                    let height = (width * currentHeight) / currentWidth
                    topology.tile.setDimensions(width, height)
                } else {
                    topology.tile.setDimensions(width, undefined)
                }  
                c.tewTileHeight.value = topology.tile.config.height
            }
        }

        this.listeners.zoomChange = function() {
            if (topology.tile) {
                topology.tile.updateStats()
                c.tewTileHeight.value = topology.tile.config.height
                c.tewTileWidth.value = topology.tile.config.width
            }
        }

        if (topology.tile) {
            c.tewTileHeight.value = topology.tile.config.height
            c.tewTileWidth.value = topology.tile.config.width
        }

        c.tewManageProperties.addEventListener('click', this.listeners.managePropertiesTEW)
        c.tewDeleteTopology.addEventListener('click', this.listeners.deleteSelectedTopology)
        c.tewChangeTile.addEventListener('click', this.listeners.changeMapTile)
        c.tewTileHeight.addEventListener('input', this.listeners.changeTileHeight)
        c.tewTileWidth.addEventListener('input', this.listeners.changeTileWidth)
        this._atlas.map.on('zoomend', this.listeners.zoomChange) 
    },

    changeTooltipImage: function(topology, img) {
        let points = topology.points
        let lines = topology.lines

        topology.image = img

        for (const point of points) {
            point.image = img
            point.tooltip.image = img
            point.tooltip.update("image")
        }
        
        for (const line of lines) {
            line.image = img
            line.tooltip.image = img
            line.tooltip.update("image")
        }
    },

    closeTopologyEditWindow: function(topology) {
        let c = this.controls;
        c.tewWindow.style.display = 'none'
        c.tewManageProperties.removeEventListener('click', this.listeners.managePropertiesTEW)
        c.tewDeleteTopology.removeEventListener('click', this.listeners.deleteSelectedTopology)
        c.tewChangeTile.removeEventListener('click', this.listeners.changeMapTile)
        this._atlas.map.dragging.enable();
        this._atlas.map.scrollWheelZoom.enable();
    },

    selectAnchor: function (anchor) {
        this.openLPW(anchor.line)
        let that = this;
        let line = anchor.line;
        let c = this.controls

        switch (anchor.type) {
            case 'L': {
                c.lineCurveL.setAttribute('selectedCurve', 'true')
                this._atlas.checkForOverlaps()
                break;
            }
            case 'C': {
                c.lineCurveC.setAttribute('selectedCurve', 'true')
                break;
            }
            case 'Q': {
                c.lineCurveQ.setAttribute('selectedCurve', 'true')
                break;
            }
        }

        c.lineEditWindow.style.display = 'block';
        this.listeners.changeToL = function () {
            let idx = anchor.changeCurveType("L");
            line.resetEditPoints(that._editor);
            that._atlas.dispatch('update')

            for (const anchor of line.anchorpoints) {
                if (anchor.position === idx) {
                    that._editor.selectAnchor(anchor);
                }
            }
        }

        this.listeners.changeToQ = function () {
            let idx = anchor.changeCurveType("Q");
            line.resetEditPoints(that._editor);
            that._atlas.dispatch('update')
            for (const anchor of line.anchorpoints) {
                if (anchor.position === idx) {
                    that._editor.selectAnchor(anchor);
                }
            }
        }

        this.listeners.changeToC = function () {
            let idx = anchor.changeCurveType("C");
            line.resetEditPoints(that._editor);
            that._atlas.dispatch('update')
            for (const anchor of line.anchorpoints) {
                if (anchor.position === idx) {
                    that._editor.selectAnchor(anchor);
                }
            }
        }

        this.listeners.addAnchor = function () {
            let idx = anchor.changeCurveType("add");
            line.resetEditPoints(that._editor);
            that._atlas.dispatch('update')

            for (const anchor of line.anchorpoints) {
                if (anchor.position === idx) {
                    that._editor.selectAnchor(anchor);
                }
            }
        }

        this.listeners.deleteAnchor = function () {
            let idx = anchor.changeCurveType("del");
            line.resetEditPoints(that._editor);
            that._atlas.dispatch('update')
            let found = false;
            for (const anchor of line.anchorpoints) {
                if (anchor.position === idx) {
                    that._editor.selectAnchor(anchor);
                    found = true;
                }
            }

            if (!found) that._editor.selectAnchor(line.anchorpoints[line.anchorpoints.length - 1]);
        }

        c.lineCurveL.addEventListener('click', this.listeners.changeToL);
        c.lineCurveC.addEventListener('click', this.listeners.changeToC);
        c.lineCurveQ.addEventListener('click', this.listeners.changeToQ);
        c.lineCurveAdd.addEventListener('click', this.listeners.addAnchor);
        c.lineCurveMinus.addEventListener('click', this.listeners.deleteAnchor);
    },

    deselectLineCurves: function () {
        this.closeLPW()
        let c = this.controls
        c.lineEditWindow.style.display = 'none'
        c.lineCurveL.setAttribute('selectedCurve', 'false')
        c.lineCurveC.setAttribute('selectedCurve', 'false')
        c.lineCurveQ.setAttribute('selectedCurve', 'false')
        c.lineCurveL.removeEventListener('click', this.listeners.changeToL);
        c.lineCurveC.removeEventListener('click', this.listeners.changeToC);
        c.lineCurveQ.removeEventListener('click', this.listeners.changeToQ);
        c.lineCurveAdd.removeEventListener('click', this.listeners.addAnchor);
        c.lineCurveMinus.removeEventListener('click', this.listeners.deleteAnchor);
    },

    changeGeneralInfo: function (info) {
        this.currentTopology = info.currentTopology;
        this.toolName = info.toolName;
        this.controls.workingTopology.textContent = this.currentTopology;
        this.controls.currentTool.textContent = this.toolName;
        if (info.toolInfo) {
            if (info.toolInfo === '-') {
                // this.controls.toolInfo.parentElement.style.display = 'none';
            } else {
                this.controls.toolInfo.parentElement.style.display = 'block';
                this.controls.toolInfo.innerHTML = info.toolInfo;
            }
        } else {
            this.controls.toolInfo.parentElement.style.display = 'none';
        }
    },

    openNPWEdit: function (node) {

        this._atlas.map.dragging.disable();
        this._atlas.map.scrollWheelZoom.disable();
        this._atlas.map.removeEventListener('mouseup');
        this._atlas.map.removeEventListener('dblclick');

        this.listeners.changeColor = function () {
            c.nodeColorWrap.style.background = c.nodeColor.value;
            node.set('fill', c.nodeColor.value);
            setNPWJSON(node)
        }

        this.listeners.changeSize = function () {
            c.nodeSizeLabel.textContent = c.nodeSize.value + 'px';
            node.set('size', parseInt(c.nodeSize.value))
            setNPWJSON(node)
        }

        this.listeners.changeName = function () {
            let topologyEPs = that._atlas.topologies[node.topology].endpoints;
            if (!topologyEPs[c.nodeName.value]) {
                topologyEPs[c.nodeName.value] = topologyEPs[node.point.name]
                delete topologyEPs[node.point.name]
                node.point.name = c.nodeName.value;
                c.nodeName.style.border = null
                setNPWJSON(node)
            } else {
                c.nodeName.style.border = "thick solid #FF0000"
            }
        }

        this.listeners.changeLabel = function () {
            node.data.label = c.nodeLabel.value;
            node.set('label', c.nodeLabel.value);
            setNPWJSON(node)
        }

        this.listeners.cancelChanges = function () {
            if (node.newPoint) {
                delete that._atlas.topologies[node.topology].endpoints[node.point.name];
                that._atlas.topologies[node.topology].points.pop();
                node.layer.remove()
                node.cancelled = true
            }
            // console.log('YOLO')
            // node.set('fill', staticfill);
            node.set('color', staticColor);
            node.set('size', staticSize);
            node.set('opacity', staticOpacity);
            node.set('stroke', staticStroke)
            node.point.name = staticName;
            node.set('id', staticID);
            node.data.label = staticLabel;

            node.layer.setLatLng(staticCoords);
            node.point.lat = staticCoords[0]
            node.point.lng = staticCoords[1]
            node.coord = staticCoords;

            let lines = that._atlas.topologies[node.topology].get('lines');
            for (const line of lines) {
                if (line.a.id === node.id) {
                    let path = line.get('path');
                    line.a.lat = staticCoords[0];
                    line.a.lng = staticCoords[1];
                    path[1] = [staticCoords[0], staticCoords[1]];
                    line.setPath(path, that._atlas.map);
                }
                if (line.b.id === node.id) {
                    let path = line.get('path');
                    line.b.lat = staticCoords[0];
                    line.b.lng = staticCoords[1];
                    path[path.length - 1] = [staticCoords[0], staticCoords[1]];
                    line.setPath(path, that._atlas.map);
                }
            }

            that.listeners.closeNPWindow();
        }

        this.listeners.closeNPWindow = function () {
            // debugger;
            let idCollision = that.checkForIDCollision(node);
            if (idCollision && !node.cancelled) {
                alert('Node ID Already Exists! Please Provide a Different ID.');
                return;
            }

            c.nodeColor.removeEventListener('input', that.listeners.changeColor)
            c.nodeSize.removeEventListener('input', that.listeners.changeSize)
            c.nodeName.removeEventListener('input', that.listeners.changeName);
            // c.nodeID.removeEventListener('input', that.listeners.changeID);
            c.nodeLabel.removeEventListener('input', that.listeners.changeLabel);
            c.nodeCancel.removeEventListener('click', that.listeners.cancelChanges);
            c.nodeMore.removeEventListener('click', that.listeners.showMoreNPW);
            c.nodeMore.setAttribute('activeOpen', 'false');
            c.npwJSON.style.display = 'none';
            c.npwJSONText.textContent = "";
            c.nodeMore.textContent = 'More'
            c.npwJSONText.removeEventListener('input', that.listeners.npwJSONChange);
            c.nodeDelete.removeEventListener('click', that.listeners.deleteButton);
            // document.removeEventListener('keydown', that.listeners.deleteKeyListener)

            if (node.newPoint) delete node.newPoint;
            staticName = node.point.name;
            staticID = node.id;
            staticLabel = node.data.label;
            staticSize = node.size;
            staticStroke = node.stroke;
            staticCoords = node.coord;
            staticfill = node.fill;
            staticColor = node.color;
            staticOpacity = node.opacity;
            c.npwWindow.style.display = 'none';
            that.loseFocus();
            that._atlas.map.dragging.enable();

            c.nodeSave.removeEventListener('click', that.listeners.closeNPWindow);

            that._atlas.map.on('mouseup', function (e) {
                that._atlas.map.removeEventListener('mousemove');
                that._atlas.map.dragging.enable();
            });
            that._atlas.map.scrollWheelZoom.enable();

            if (that.toolName === 'Add Node') {
                let topology = that.currentTopology
                that._editor.disableNodeAddMode(that._atlas.topologies[topology]);
                that._editor.enableNodeAddMode(that._atlas.topologies[topology]);
            }
        }

        this.listeners.npwJSONChange = function () {
            try {
                let obj = JSON.parse(c.npwJSONText.value);
                let name = Object.keys(obj)[0];
                let json = obj[name]
                c.npwJSONStatus.style.display = 'none';



                node.set('size', parseInt(json.size))
                node.set('stroke', parseInt(json.stroke))
                node.set('fill', json.fill)
                node.set('color', json.color)
                node.set('opacity', parseFloat(json.opacity))
                node.data.label = json.label;
                node.set('label', json.label);
                node.point.name = name;
                node.layer.setLatLng([json.lat, json.lng]);
                node.point.lat = json.lat
                node.point.lng = json.lng
                node.coord = [json.lat, json.lng];

                let lines = that._atlas.topologies[node.topology].get('lines');
                for (const line of lines) {
                    if (line.a.id === node.id) {
                        let path = line.get('path');
                        line.a.lat = json.lat;
                        line.a.lng = json.lng;
                        path[1] = [json.lat, json.lng];
                        line.setPath(path, map);
                    }
                    if (line.b.id === node.id) {
                        let path = line.get('path');
                        line.b.lat = json.lat;
                        line.b.lng = json.lng;
                        path[path.length - 1] = [json.lat, json.lng];
                        line.setPath(path, map);
                    }
                }

                c.nodeName.value = node.point.name;
                c.nodeLabel.value = node.data.label;
                c.nodeSize.value = node.size;
                c.nodeSizeLabel.textContent = node.size + 'px';
                c.nodeColor.value = node.fill;
                c.nodeColorWrap.style.background = node.fill;

            } catch (error) {
                c.npwJSONStatus.style.display = 'inline-block';
            }
        }

        this.listeners.showMoreNPW = function () {
            let activated = this.getAttribute('activeOpen');
            if (activated === 'false') {
                c.npwJSON.style.display = 'block';
                this.textContent = 'Less'
                this.setAttribute('activeOpen', 'true');
            } else {
                c.npwJSON.style.display = 'none';
                this.textContent = 'More'
                this.setAttribute('activeOpen', 'false');
            }
        }

        this.listeners.deleteKeyListener = function(e) {
            if ((e.key == 'Delete' || e.key == 'Backspace') && !['npw-label', 'npw-name', 'sidebar-npw-json-textarea'].includes(document.activeElement.id)) {
                for (let i = 0; i < that._atlas.topologies[node.topology].lines.length; i++) {
                    const line = that._atlas.topologies[node.topology].lines[i];
                    if (line.a.id == node.id || line.b.id == node.id) {
                        for (const layer of line.layer) {
                            layer.removeFrom(that._atlas.map)
                        }
                        that._atlas.topologies[node.topology].lines.splice(i, 1)
                        i--;
                    }
                }

                for (let i = 0; i < that._atlas.topologies[node.topology].points.length; i++) {
                    const point = that._atlas.topologies[node.topology].points[i];
                    if (point.id == node.id) {
                        point.layer.removeFrom(that._atlas.map)
                        that._atlas.topologies[node.topology].points.splice(i, 1)
                        break;
                    }
                }

                that.listeners.closeNPWindow()
            }
        }

        this.listeners.deleteButton = function() {
            let e = {key: 'Delete'}
            that.listeners.deleteKeyListener(e)
        }

        function setNPWJSON(point) {
            let result = {};
            let obj = {}
            obj.label = point.data.label;
            obj.shape = point.shape;
            obj.size = point.size;
            obj.stroke = point.stroke;
            obj.lat = point.coord[0];
            obj.lng = point.coord[1];
            obj.fill = point.fill;
            obj.color = point.color;
            obj.opacity = point.opacity;

            result[point.point.name] = obj;
            c.npwJSONText.value = JSON.stringify(result, null, "  ");
        }

        this.focusOnMe();
        let c = this.controls;
        let that = this;
        c.npwWindow.style.display = 'block';

        let staticName = node.point.name;
        let staticID = node.id;
        let staticLabel = node.data.label;
        let staticSize = node.size;
        let staticStroke = node.stroke;
        let staticCoords = node.coord;
        let staticfill = node.fill;
        let staticColor = node.color;
        let staticOpacity = node.opacity;

        // let idCollision = that.checkForIDCollision(node);
        // if (idCollision) c.nodeIDLabel.style.color = 'red';
        // else c.nodeIDLabel.style.color = '';

        c.nodeName.value = node.point.name;
        // c.nodeID.value = node.id;
        c.nodeLabel.value = node.data.label;
        c.nodeSize.value = node.size;
        c.nodeSizeLabel.textContent = node.size + 'px';
        c.nodeColor.value = node.fill;
        c.nodeColorWrap.style.background = node.fill;
        setNPWJSON(node)

        c.nodeColorWrap.addEventListener('click', () => c.nodeColor.click());
        c.nodeColor.addEventListener('input', that.listeners.changeColor)
        c.nodeSize.addEventListener('input', that.listeners.changeSize)
        c.nodeName.addEventListener('input', that.listeners.changeName);
        
        c.nodeLabel.addEventListener('input', that.listeners.changeLabel);
        c.npwJSONText.addEventListener('input', that.listeners.npwJSONChange);
        c.nodeSave.addEventListener('click', that.listeners.closeNPWindow);
        c.nodeCancel.addEventListener('click', that.listeners.cancelChanges);
        c.nodeDelete.addEventListener('click', that.listeners.deleteButton);
        c.nodeMore.addEventListener('click', that.listeners.showMoreNPW);
        // document.addEventListener('keydown', that.listeners.deleteKeyListener)
    },

    closeNPW: function () {
        this.listeners.cancelChanges();
        this._atlas.dispatch('update')
    },

    openLPW: function (line) {
        let c = this.controls;

        c.lineA.value = line.a.name;
        c.lineB.value = line.b.name;
        c.lineLabel.value = line.label;
        c.lineWeight.value = parseInt(line.options.weight);
        c.lineWeightLabel.textContent = line.options.weight;
        c.lineColor.value = line.options.color;
        c.lineColorWrap.style.background = line.options.color;

        this.setLPWJSON(line)
        c.lpwWindow.style.display = 'block'
        let that = this;

        this.listeners.manageProperties = function () {
            that._editor.openKVModal(line)
        }

        this.listeners.saveProperties = function () {
            line.metadata = {}
            let children = c.lpwMetadataWindow.children
            if (children.length > 3) {
                let loopTimes = children.length - 3
                for (let i = 0; i < loopTimes; i++) {
                    let divEl = children[i + 1]
                    let key = divEl.getElementsByClassName('sidebar-lpw-metadata-key')[0].value
                    let value = divEl.getElementsByClassName('sidebar-lpw-metadata-value')[0].value
                    if (IsJsonString(value)) value = JSON.parse(value)
                    if (key != "" && value != "") {
                        line.metadata[key] = value;
                    }
                }
                alert(`Properties added to adjacency: ${line.label}`)
            }
            that.setLPWJSON(line);
        }

        function IsJsonString(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        }

        this.listeners.changeLineLabel = function () {
            line.set('label', c.lineLabel.value);
            that.setLPWJSON(line);
            that._atlas.dispatch('update')
        }

        this.listeners.changeLineWeight = function () {
            line.options.weight = c.lineWeight.value;
            c.lineWeightLabel.textContent = c.lineWeight.value;
            that.setLPWJSON(line);
            try {
                line.layer[0].setStyle({ weight: c.lineWeight.value })
            } catch (error) {

            }
            that._atlas.dispatch('update')

        }

        this.listeners.changeLineColor = function () {
            line.options.color = c.lineColor.value;
            c.lineColorWrap.style.background = c.lineColor.value;
            line.layer[0].setStyle({ color: c.lineColor.value })
            that.setLPWJSON(line);
            that._atlas.dispatch('update')
        }

        this.listeners.lpwSliderTouched = function () {
            that._atlas.map.dragging.disable();
        }

        this.listeners.lpwSliderOff = function () {
            that._atlas.map.dragging.enable();
        }

        this.listeners.lpwShowMore = function () {
            let activated = this.getAttribute('activeOpen');

            if (activated === 'false') {
                c.lpwJSON.style.display = 'block';
                this.textContent = 'Less'
                this.setAttribute('activeOpen', 'true');
            } else {
                c.lpwJSON.style.display = 'none';
                this.textContent = 'More'
                this.setAttribute('activeOpen', 'false');
            }
        }

        this.listeners.lpwJSONChange = function () {
            try {
                let json = JSON.parse(c.lpwJSONText.value);
                c.lpwJSONStatus.style.display = 'none';

                line.set('label', json.label)
                try {
                    line.options.weight = parseInt(json.weight)
                    line.layer[0].setStyle({ weight: parseInt(json.weight) })
                } catch (error) { }
                line.options.color = json.color;
                line.layer[0].setStyle({ color: json.color })
                line.min = json.min;
                line.max = json.max;

                c.lineLabel.value = json.label;
                c.lineWeight.value = parseInt(json.weight);
                c.lineWeightLabel.textContent = json.weight;
                c.lineColorWrap.style.background = json.color
                c.lineColor.value = json.color

            } catch (error) {
                c.lpwJSONStatus.style.display = 'inline-block';
            }
        }

        this.listeners.deleteLine = function() {
            if (that._editor.selectedAnchor) {
                that._editor.deselectAnchor(that._editor.selectedAnchor);
            }
            line.removeAnchors();
            line.removeWaypoints();
            let topology = that._atlas.topologies[line.topology]
            for (const layer of line.layer) {
                layer.removeFrom(that._atlas.map)
            }

            for (let i = 0; i < topology.lines.length; i++) {
                const l = topology.lines[i];
                if (l == line) {
                    that._atlas.topologies[line.topology].lines.splice(i, 1)
                    break;
                }
            }
            that.closeLPW()
        }

        c.lineColorWrap.addEventListener('click', () => c.lineColor.click());
        c.lineColor.addEventListener('input', this.listeners.changeLineColor);
        c.lineWeight.addEventListener('input', this.listeners.changeLineWeight);
        c.lineWeight.addEventListener('mousedown', this.listeners.lpwSliderTouched);
        c.lineWeight.addEventListener('mouseup', this.listeners.lpwSliderOff);
        c.lineLabel.addEventListener('input', this.listeners.changeLineLabel);
        c.lineMore.addEventListener('click', this.listeners.lpwShowMore);
        c.lpwJSONText.addEventListener('input', this.listeners.lpwJSONChange);
        c.lpwManageProperties.addEventListener('click', this.listeners.manageProperties)
        c.lineDelete.addEventListener('click', this.listeners.deleteLine)
        //c.lpwSaveProperties.addEventListener('click', this.listeners.saveProperties)
    },

    closeLPW: function () {
        let c = this.controls;
        c.lpwWindow.style.display = 'none'
        c.lineColor.removeEventListener('input', this.listeners.changeLineColor);
        c.lineWeight.removeEventListener('input', this.listeners.changeLineWeight);
        c.lineWeight.removeEventListener('mousedown', this.listeners.lpwSliderTouched);
        c.lineWeight.removeEventListener('mouseup', this.listeners.lpwSliderOff);
        c.lineLabel.removeEventListener('input', this.listeners.changeLineLabel);
        c.lineMore.removeEventListener('click', this.listeners.lpwShowMore);
        c.lineDelete.removeEventListener('click', this.listeners.deleteLine)
        c.lpwManageProperties.removeEventListener('click', this.listeners.manageProperties)

        c.lineA.value = "";
        c.lineB.value = "";
        c.lineLabel.value = "";
        c.lineWeight.value = 1;
        c.lineWeightLabel.textContent = "1";

        c.lpwJSON.style.display = 'none';
        c.lineMore.textContent = 'More'
        c.lineMore.setAttribute('activeOpen', 'false');
    },

    setLPWJSON: function (line) {
        let obj = {}
        obj.a = line.a.name;
        obj.b = line.b.name;
        obj.label = line.label
        obj.weight = line.options.weight;
        obj.color = line.options.color;
        if (line.min) obj.min = line.min;
        if (line.min) obj.max = line.max;
        obj.targets = line.targets;
        obj.anchors = line.anchors;
        obj.metadata = line.metadata

        this.controls.lpwJSONText.value = JSON.stringify(obj, null, "  ");
    },

    showMapJSON: function (topology) {
        this.focusOnMe();
        this._atlas.map.scrollWheelZoom.disable();

        let json = {};
        json.name = topology.name;
        json.legend = topology.legend;
        if (topology.image) json.image = topology.image
        json.metadata = topology.metadata

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
            obj.targets = line.targets;
            adjs.push(obj);
        }
        json.adjacencies = adjs;

        this.controls.JSONText.parentElement.style.display = 'block'
        this.controls.JSONText.textContent = JSON.stringify(json, null, "  ");
        this.controls.JSONButton.textContent = 'Copy'

        let that = this;
        this.listeners.copyMapJSON = function () {
            that.controls.JSONText.select();
            document.execCommand("copy");
            window.getSelection().removeAllRanges();
            this.innerText = "Copied!";
            setTimeout(() => {
                this.innerText = "Copy";
            }, 1000);
        }

        this.controls.JSONButton.addEventListener('click', this.listeners.copyMapJSON);
    },

    hideMapJSON: function () {
        this.controls.JSONText.parentElement.style.display = 'none'
        this.controls.JSONText.textContent = '';
        this.controls.JSONButton.textContent = ''

        this.loseFocus();
        this._atlas.map.scrollWheelZoom.enable();
        this.controls.JSONButton.removeEventListener('click', this.listeners.copyMapJSON);
    },

    showAddJSONWindow: function () {
        this.focusOnMe();
        this._atlas.map.scrollWheelZoom.disable();

        this.controls.JSONText.parentElement.style.display = 'block';
        this.controls.JSONText.textContent = "";
        this.controls.JSONButton.textContent = 'Add'

        let that = this;
        this.listeners.addTopology = function () {
            let json = that.controls.JSONText.value;
            let obj = JSON.parse(json);

            that._editor.addTopology(obj)
            that._editor.disableSetTopologyMode();
        }

        this.controls.JSONButton.addEventListener('click', this.listeners.addTopology);
    },

    closeAddJSONWindow: function () {

        this.controls.JSONText.value = '';
        this.controls.JSONText.parentElement.style.display = 'none'
        this.controls.JSONButton.textContent = '';

        this.loseFocus();
        this._atlas.map.scrollWheelZoom.enable();
        this.controls.JSONButton.removeEventListener('click', this.listeners.addTopology);
    },

    focusOnMe: function () {
        let mapContainer = this._atlas.map._container;
        this.resizeObserver = new ResizeObserver(() => {
            this.sbContainer.style.width = mapContainer.offsetWidth + 'px';
        });
        this.resizeObserver.observe(mapContainer);
    },

    loseFocus: function () {
        let mapContainer = this._atlas.map._container;
        this.resizeObserver.disconnect();
        this.resizeObserver = new ResizeObserver(() => {
            this.sbContainer.style.height = mapContainer.offsetHeight + 'px';
        });
        this.resizeObserver.observe(mapContainer);
        this.sbContainer.style.width = 'var(--sidebar-width)';
    },

    checkForIDCollision: function (node) {
        let filtered = this._atlas.topologies[node.topology].points.filter(point => { if (node.id == point.id) return true; })
        if (filtered.length > 1) return true;
        else return false;
    }

});
