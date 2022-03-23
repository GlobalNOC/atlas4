import L, { circle } from "leaflet";
import "../extensions/L.Control.Toolbar.js";
import "../extensions/L.Control.Sidebar.js";
import EditorModal from "../extensions/EditorModal.js";

export default class Editor {
    constructor(atlas) {
        this.atlas = atlas;
        this.map = atlas.map;

        this.sidebar = new L.Control.Sidebar({ atlas: this.atlas });
        this.toolbar = new L.Control.Toolbar({ atlas: this.atlas });
        this.modal = new EditorModal(this, this.map._container);
        // this.modal.show()

        this.nodeAddMode = false;
        this.lineAddMode = false;
        this.nodeEditMode = false;
        this.lineEditMode = false;
        this.getJSONMode = false;
        this.setTopologyMode = false;
        this.topologyEditMode = false;

        this.selectedAnchor = undefined;
    }

    disableAllModes() {
        let topologies = this.atlas.topologies;
        switch (this.sidebar.toolName) {
            case "Add Line": {
                this.disableLineAddMode(
                    topologies[this.sidebar.currentTopology]
                );
                break;
            }
            case "Edit Node": {
                this.disableNodeEditMode(
                    topologies[this.sidebar.currentTopology]
                );
                break;
            }
            case "Add Node": {
                this.disableNodeAddMode(
                    topologies[this.sidebar.currentTopology]
                );
                break;
            }
            case "Edit Line": {
                this.disableLineEditMode(
                    topologies[this.sidebar.currentTopology]
                );
                break;
            }
            case "Get Map JSON": {
                this.disableGetJSONMode(
                    topologies[this.sidebar.currentTopology]
                );
                break;
            }
            case "Set Topology": {
                this.disableSetTopologyMode();
                break;
            }
            case "Edit Topology": {
                this.disableTopologyEditMode(
                    topologies[this.sidebar.currentTopology]
                );
                break;
            }
        }
        this.lineAddMode = false;
        this.nodeEditMode = false;
        this.nodeAddMode = false;
        this.getJSONMode = false;
        this.lineEditMode = false;
        this.setTopologyMode = false;
        this.topologyEditMode = false;
    }

    showSidebar() {
        if (!this.sidebar.sbContainer) {
            this.sidebar.addTo(this.map);
        } else {
            this.sidebar.sbContainer.style.display = "block";
        }

        this.sidebar.registerElements();
    }

    hideSidebar() {
        this.sidebar.sbContainer.style.display = "none";
    }

    showToolbar() {
        this.toolbar.addTo(this.map);
    }

    hideToolbar() {
        this.map.removeControl(this.toolbar);
    }

    enableNodeAddMode(topology) {
        this.disableAllModes();
        this.nodeAddMode = true;
        this.removeTooltips(topology);

        let toolInfo = "Double Click anywhere on the map to add a new node";
        this.sidebar.changeGeneralInfo({
            currentTopology: topology.name,
            toolName: "Add Node",
            toolInfo,
        });

        this.map._container.style.cursor = "crosshair";
        this.map.on("dblclick", (e) => {
            let name = this.createUniqueName(6);
            let obj = {
                id: this.createUniqueName(6),
                label: "NP",
                shape: "circle",
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                name,
            };
            topology.endpoints[name] = obj;
            let node = topology.createPoint(name);
            node.layer.addTo(this.map);
            this.sidebar.openNPWEdit(node);
        });
    }

    disableNodeAddMode(topology) {
        this.nodeAddMode = false;
        this.showTooltips(topology);

        this.sidebar.changeGeneralInfo({ currentTopology: "-", toolName: "-" });

        if (this.sidebar.listeners.closeNPWindow) {
            this.sidebar.closeNPW();
        }

        this.map._container.style.cursor = "default";
        this.map.removeEventListener("dblclick");
    }

    enableLineAddMode(topology) {
        this.disableAllModes();
        this.lineAddMode = true;
        this.removeTooltips(topology);

        let toolInfo = "Click on any two nodes to draw a line between them";
        this.sidebar.changeGeneralInfo({
            currentTopology: topology.name,
            toolName: "Add Line",
            toolInfo,
        });

        let points = topology.get("points");
        let that = this;
        let ep_a, ep_b;

        for (let point of points) {
            if (point.layer) {
                setAddListeners(point);
            }
        }

        function setAddListeners(point) {
            setHoverListener(point);
            setClickListener(point, topology);
        }

        function setHoverListener(point) {
            // Setting these variables to remember the color of the node before hovering
            let currentFill = point.layer.options.fillColor;
            let currentStroke = point.layer.options.color;

            // Turns node pink when hovered over
            point.layer.on("mouseover", function () {
                this.setStyle({ color: "#FE63FB", fillColor: "#FE63FB" });
            });

            // Returns node to its original color when cursor leaves its bounds
            point.layer.on("mouseout", function () {
                this.setStyle({ color: currentStroke, fillColor: currentFill });
            });
        }

        /* 
        The first node is stored as a variable (ep_a) when clicked.
        When another node (ep_b) is clicked, a line object is created
        between ep_a and ep_b and rendered onto the map. Both nodes are brought
        to the top of the map to ensure consistency. After creating the line,
        ep_a and ep_b are set to undefined again. 
    */
        function setClickListener(point, topology) {
            point.layer.on("mousedown", function () {
                if (!ep_a) {
                    ep_a = point;
                    this.removeEventListener("mouseover");
                    this.removeEventListener("mouseout");
                    this.setStyle({ color: "#47FF0A", fillColor: "#47FF0A" });
                } else {
                    ep_b = point;

                    let adj = {
                        a: ep_a.point.name,
                        b: ep_b.point.name,
                        anchors: ["L"],
                        targets: [],
                    };
                    let a = topology.get("endpoints")[ep_a.name];
                    let b = topology.get("endpoints")[ep_b.name];
                    let newLine = topology.createLine(adj, a, b);
                    newLine.hideToolTip();
                    ep_a.set("fill", ep_a.fill);
                    ep_a.layer.bringToFront();
                    ep_b.layer.bringToFront();
                    setHoverListener(ep_a);
                    //that.atlas.checkForOverlaps();
                    that.atlas.dispatch("update");
                    ep_a = undefined;
                    ep_b = undefined;
                }
            });
        }
    }

    disableLineAddMode(topology) {
        this.lineAddMode = false;
        this.showTooltips(topology);

        this.sidebar.changeGeneralInfo({ currentTopology: "-", toolName: "-" });

        let points = topology.get("points");
        for (const point of points) {
            point.layer?.removeEventListener("mouseover");
            point.layer?.removeEventListener("mouseout");
            point.layer?.removeEventListener("mousedown");
        }
    }

    enableNodeEditMode(topology) {
        this.disableAllModes();
        this.nodeEditMode = true;
        this.removeTooltips(topology);

        let sidebar = this.sidebar;
        let toolInfo =
            "Drag node to re-position it <br> Double click to edit properties";
        sidebar.changeGeneralInfo({
            currentTopology: topology.name,
            toolName: "Edit Node",
            toolInfo,
        });

        let nodes = topology.get("points");
        let map = this.map;
        let that = this;

        for (const node of nodes) {
            if (node.layer) {
                node.layer.on("mousedown", function () {
                    map.on("mousemove", (e) => {
                        map.dragging.disable();
                        this.setLatLng([e.latlng.lat, e.latlng.lng]);
                        node.point.lat = e.latlng.lat;
                        node.point.lng = e.latlng.lng;
                        node.coord = [e.latlng.lat, e.latlng.lng];
                        let lines = topology.get("lines");
                        for (const line of lines) {
                            if (line.a.id === node.id) {
                                let path = line.get("path");
                                line.a.lat = e.latlng.lat;
                                line.a.lng = e.latlng.lng;
                                path[1] = [e.latlng.lat, e.latlng.lng];
                                line.setPath(path, map);
                            }
                            if (line.b.id === node.id) {
                                let path = line.get("path");
                                line.b.lat = e.latlng.lat;
                                line.b.lng = e.latlng.lng;
                                path[path.length - 1] = [
                                    e.latlng.lat,
                                    e.latlng.lng,
                                ];
                                line.setPath(path, map);
                            }
                        }
                        that.atlas.checkForOverlaps();
                    });
                });

                node.layer.on("dblclick", function () {
                    sidebar.openNPWEdit(node);
                });

                map.on("mouseup", function (e) {
                    map.removeEventListener("mousemove");
                    map.dragging.enable();
                });
            }
        }
    }

    disableNodeEditMode(topology) {
        this.nodeEditMode = false;
        this.showTooltips(topology);

        this.sidebar.changeGeneralInfo({ currentTopology: "-", toolName: "-" });

        if (this.sidebar.listeners.closeNPWindow) {
            this.sidebar.closeNPW();
        }

        let nodes = topology.get("points");

        for (let node of nodes) {
            node.layer.removeEventListener("mousedown");
        }
    }

    enableTopologyEditMode(topology) {
        this.disableAllModes();
        this.topologyEditMode = true;

        let sidebar = this.sidebar;
        let toolInfo = `Edit/Add ${topology.name} metadata`;
        sidebar.changeGeneralInfo({
            currentTopology: topology.name,
            toolName: "Edit Topology",
            toolInfo,
        });

        sidebar.openTopologyEditWindow(topology);
    }

    disableTopologyEditMode(topology) {
        this.topologyEditMode = false;
        let sidebar = this.sidebar;

        sidebar.changeGeneralInfo({ currentTopology: "-", toolName: "-" });
        sidebar.closeTopologyEditWindow(topology);
    }

    updateTooltipImage(topology, img) {
        this.sidebar.changeTooltipImage(topology, img);
    }

    enableLineEditMode(topology) {
        this.disableAllModes();
        this.lineEditMode = true;
        this.removeTooltips(topology);

        let sidebar = this.sidebar;
        let toolInfo = `Click any line in ${topology.name} to show anchors.<br class="sidebar-br">Double Click on any red anchor to edit line segment.`;
        sidebar.changeGeneralInfo({
            currentTopology: topology.name,
            toolName: "Edit Line",
            toolInfo,
        });

        let lines = topology.get("lines");
        let map = this.map;
        let that = this;
        for (let line of lines) {
            setEditListeners(line);
        }

        function setEditListeners(line) {
            setHoverListener(line);
            setClickListener(line);
        }

        /*
        Changes Line color when hovered
    */
        function setHoverListener(line) {
            line.hideToolTip();

            for (const layer of line.layer) {
                layer.on("mouseover", function () {
                    this.setStyle({ color: "#FE63FB" });
                });

                layer.on("mouseout", function () {
                    this.setStyle({ color: line.options.color });
                });
            }
        }

        /*
        Renders the Line's anchorpoints and waypoints only when it is clicked.
        Removes them when clicked on again.
    */
        function setClickListener(line) {
            line.activated = false;

            for (const layer of line.layer) {
                layer.on("mousedown", () => {
                    for (const l of lines) {
                        if (l == line) continue;
                        if (l.activated) {
                            l.activated = false;
                            if (that.selectedAnchor) {
                                that.deselectAnchor(that.selectedAnchor);
                            }
                            l.removeAnchors();
                            l.removeWaypoints();
                        }
                    }

                    line.activated = !line.activated;
                    if (line.activated) {
                        that.selectedLine = line;
                        let anchors = line.createAnchors();
                        let waypoints = line.createWaypoints();

                        for (const waypoint of waypoints) {
                            waypoint.draw(map);
                            waypoint.setDragListener(that);
                        }

                        for (const anchor of anchors) {
                            anchor.draw(map);
                            anchor.setDragListener(that);
                            anchor.setSelectListener(that);
                        }
                        let isDoubleClickZoomEnabled = map.doubleClickZoom;
                        map.doubleClickZoom.disable();
                        let doubleClickEvent =
                            document.createEvent("MouseEvents");
                        doubleClickEvent.initEvent("dblclick", true, true);
                        anchors[anchors.length - 1].marker._path.dispatchEvent(
                            doubleClickEvent
                        );
                        if (isDoubleClickZoomEnabled)
                            map.doubleClickZoom.enable();
                    } else {
                        if (that.selectedAnchor) {
                            that.deselectAnchor(that.selectedAnchor);
                        }
                        line.removeAnchors();
                        line.removeWaypoints();
                    }
                });
            }
        }
    }

    updateLineProperties(line) {
        if (this.selectedAnchor && this.selectedAnchor.line === line) {
            this.sidebar.setLPWJSON(line);
        }
    }

    selectAnchor(anchor) {
        if (this.selectedAnchor) {
            this.deselectAnchor(this.selectedAnchor);
        }

        anchor.select();
        this.selectedAnchor = anchor;
        this.sidebar.selectAnchor(anchor);
    }

    deselectAnchor(anchor) {
        anchor.deselect();
        this.sidebar.deselectLineCurves();
        this.selectedAnchor = undefined;
    }

    disableLineEditMode(topology) {
        let lines = topology.get("lines");
        for (let line of lines) {
            delete line.activated;
            for (const layer of line.layer) {
                layer.removeEventListener("mouseover");
                layer.removeEventListener("mousedown");
            }

            line.removeAnchors();
            line.removeWaypoints();
            line.showToolTip();
        }
        if (this.selectedAnchor) {
            this.deselectAnchor(this.selectedAnchor);
        }
    }

    enableGetJSONMode(topology) {
        this.disableAllModes();
        this.getJSONMode = true;
        this.removeTooltips(topology);

        let sidebar = this.sidebar;
        let toolInfo = `JSON Data For ${topology.name}`;
        sidebar.changeGeneralInfo({
            currentTopology: topology.name,
            toolName: "Get Map JSON",
            toolInfo,
        });

        sidebar.showMapJSON(topology);
    }

    disableGetJSONMode(topology) {
        this.getJSONMode = false;
        this.showTooltips(topology);
        this.sidebar.changeGeneralInfo({ currentTopology: "-", toolName: "-" });
        this.sidebar.hideMapJSON();
    }

    enableSetTopologyMode(mode) {
        this.disableAllModes();
        this.setTopologyMode = true;

        let sidebar = this.sidebar;

        if (mode === "ADD") {
            let toolInfo = `Paste Map JSON Below To Add a New Topology`;
            sidebar.changeGeneralInfo({
                currentTopology: "-",
                toolName: "Set Topology",
                toolInfo,
            });
            sidebar.showAddJSONWindow();
        } else {
            let toolInfo = `Select Topology To Delete From Map`;
            sidebar.changeGeneralInfo({
                currentTopology: "-",
                toolName: "Set Topology",
                toolInfo,
            });
        }
    }

    addTopology(json) {
        if (this.atlas && this.atlas.map != undefined) {
            let topologies = Object.keys(this.atlas.get("topologies"));
            let bounds = [];
            for (const topology of topologies) {
                let eps = this.atlas
                    .get("topologies")
                    [topology].get("endpoints");
                let epKeys = Object.keys(eps);
                for (const ep of epKeys) {
                    let bound = [eps[ep].lat, eps[ep].lng];
                    bounds.push(bound);
                }
            }
            let locations = Object.keys(json.endpoints);
            for (let location of locations) {
                let bound = [
                    json.endpoints[location].lat,
                    json.endpoints[location].lng,
                ];
                bounds.push(bound);
            }
            this.atlas.map.fitBounds(bounds);
        }

        //this.toolbar.updateNewTopology(json.name);
        this.atlas.addTopology(json, { twins: false });
        this.atlas.drawTopology(this.atlas.get("topologies")[json.name]);

        this.hideToolbar();
        //this.toolbar = new L.Control.Toolbar({ atlas: this.atlas });
        this.showToolbar();
    }

    disableSetTopologyMode() {
        this.setTopologyMode = false;
        this.sidebar.changeGeneralInfo({ currentTopology: "-", toolName: "-" });
        this.sidebar.closeAddJSONWindow();
    }

    removeTooltips(topology) {
        let points = topology.get("points");
        let lines = topology.get("lines");

        for (const point of points) {
            point.hideToolTip();
        }

        for (const line of lines) {
            line.hideToolTip();
        }
    }

    showTooltips(topology) {
        let points = topology.get("points");
        let lines = topology.get("lines");

        for (const point of points) {
            point.showToolTip();
        }

        for (const line of lines) {
            line.showToolTip();
        }
    }

    createUniqueName(length) {
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

    keepScrollAndDragDisabled() {
        this.map.dragging.disable();
        this.map.scrollWheelZoom.disable();
    }
    // Modal
    openKVModal(line) {
        // this.disableScrollandDrag = setInterval(this.keepScrollAndDragDisabled.bind(this), 0)
        this.modal.show();
        this.modal.configureCircuitKVTable(line);
    }

    closeKVModal() {
        // clearInterval(this.disableScrollandDrag)
    }

    openTopologyKVModal(topology) {
        this.modal.show();
        this.modal.configureTopologyKVTable(topology);
    }

    openTileUploadModal(topology) {
        this.modal.show();
        this.modal.configureMapTileWindow(topology);
    }

    addMapTile(config, topology) {
        if (topology.tile) {
            topology.tile.config = config;
            topology.tile.display(true);
        } else {
            let tile = topology.createTile(config);
            tile.display(true);
            this.disableTopologyEditMode(topology);
            this.enableTopologyEditMode(topology);
        }
    }
}
