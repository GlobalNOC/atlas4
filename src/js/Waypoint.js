import L from "leaflet";

export default class WayPoint {
    constructor(latlng, pos, line, type, opts) {
        this.lat = latlng[0];
        this.lng = latlng[1];
        this.position = pos;
        this.line = line;
        this.type = type;
        this.options = opts;
    }

    setOptions(opts) {
        this.options = opts;
    }

    draw(map) {
        switch (this.type) {
            case "Q": {
                this.wpLineA = L.polyline([this.latlng(), this.anchorA], {
                    color: "blue",
                    weight: 1,
                    opacity: 0.5,
                }).addTo(map);
                this.wpLineB = L.polyline([this.latlng(), this.anchorB], {
                    color: "blue",
                    weight: 1,
                    opacity: 0.5,
                }).addTo(map);
                break;
            }
            case "C": {
                this.wpLineA = L.polyline([this.latlng(), this.anchorA], {
                    color: "blue",
                    weight: 1,
                    opacity: 0.5,
                }).addTo(map);
                break;
            }
        }
        this.marker = L.circleMarker([this.lat, this.lng], this.options).addTo(
            map
        );
    }

    setTargetAnchors(a, b, aPos, bPos) {
        switch (this.type) {
            case "Q": {
                this.anchorA = a;
                this.anchorB = b;
                this.anchorAPos = aPos;
                this.anchorBPos = bPos;
                break;
            }
            case "C": {
                this.anchorA = a;
                this.anchorAPos = aPos;
                break;
            }
        }
    }

    latlng() {
        return [this.lat, this.lng];
    }

    setDragListener(editor) {
        let waypoint = this;

        this.marker.on("mousedown", function () {
            editor.map.on("mousemove", (e) => {
                editor.map.dragging.disable();
                waypoint.lat = e.latlng.lat;
                waypoint.lng = e.latlng.lng;
                waypoint.refreshMarker();

                let path = waypoint.line.get("path");
                path[waypoint.position] = waypoint.latlng();
                waypoint.line.setPath(path, editor.map);
                waypoint.updateLines();
                editor.updateLineProperties(waypoint.line);
            });
        });

        editor.map.on("mouseup", function (e) {
            editor.atlas.dispatch("update");
            editor.map.removeEventListener("mousemove");
            editor.map.dragging.enable();
        });
    }

    setCoords(latlng) {
        this.lat = latlng[0];
        this.lng = latlng[1];
        this.refreshMarker();
    }

    refreshMarker() {
        this.marker.setLatLng([this.lat, this.lng]);
    }

    updateLines() {
        switch (this.type) {
            case "Q": {
                this.wpLineA.setLatLngs([this.latlng(), this.anchorA]);
                this.wpLineB.setLatLngs([this.latlng(), this.anchorB]);
                break;
            }
            case "C": {
                this.wpLineA.setLatLngs([this.latlng(), this.anchorA]);
                break;
            }
        }
    }
}
