import L from 'leaflet';

export default class Anchor {

    constructor(latlng, pos, line, type, options) {
        this.lat = latlng[0];
        this.lng = latlng[1];
        this.position = pos;
        this.line = line;
        this.options = options;
        this.type = type;
        this.selected = false;
    }

    // Draws the anchor on the Leaflet map 
    // and stores the leaflet object as the 'marker' property
    draw(map) {
        this.marker = L.circleMarker([this.lat, this.lng], this.options).addTo(map);
    }

    // Listens for drag events, if the anchor is dragged to an new position,
    // It updates its line's path with the new coordinates
    setDragListener(editor) {
        let anchor = this;
        this.marker.on('mousedown', function () {
            editor.map.on('mousemove', (e) => {
                if (anchor.position !== anchor.line.get('path').length - 1) {
                    editor.map.dragging.disable();
                    anchor.lat = e.latlng.lat;
                    anchor.lng = e.latlng.lng;
                    anchor.refresh();
                    let path = anchor.line.get('path');
                    path[anchor.position] = anchor.latlng();
                    anchor.line.setPath(path, editor.map);
                    // Moving an anchor would also require refreshing the waypoints connected to it
                    // This method is defined in the line object
                    anchor.line.updateWaypoints(anchor.position, anchor.latlng());
                    editor.updateLineProperties(anchor.line)
                    
                }
            });
        });

        editor.map.on('mouseup', function (e) {
            editor.atlas.dispatch('update')
            editor.map.removeEventListener('mousemove');
            editor.map.dragging.enable();
        });
    }

    setSelectListener(editor) {
        let anchor = this;
        this.marker.on('dblclick', function () {
            if (!anchor.selected) {
                editor.selectAnchor(anchor)

            } else {
                editor.deselectAnchor(anchor);
            }
        })
    }

    deselect() {
        this.marker.setStyle({ fillColor: this.options.fillColor, color: this.options.color, fillOpacity: this.options.fillOpacity });
        this.selected = false;
    }

    select() {
        this.marker.setStyle({ fillColor: '#0000FF', color: '#0000FF', fillOpacity: 1 });
        this.selected = true;
    }
    // Refreshes the anchor's leaflet point 
    // (call this method whenever this.lat and this.lng is changed)
    refresh() {
        this.marker.setLatLng([this.lat, this.lng]);
    }

    // Returns the anchor's current position on the map
    latlng() {
        return [this.lat, this.lng];
    }

    changeCurveType(curve) {
        let ans = this.position;
        if (curve == this.type) return ans;

        let path = this.line.get('path');

        switch (this.type) {
            case 'Q': {
                switch (curve) {
                    case 'C': {
                        path[this.position - 2] = 'C';
                        let mid = this.getMiddlePoint(path[this.position - 3], path[this.position]);
                        path[this.position - 1] = mid;
                        path.splice(this.position - 1, 0, mid);
                        ans += 1;
                        break;
                    }
                    case 'L': {
                        path[this.position - 2] = 'L';
                        path.splice(this.position - 1, 1)
                        ans -= 1;
                        break;
                    }
                    case 'add': {
                        let mid = this.getMiddlePoint(path[this.position - 3], path[this.position]);
                        path.splice(this.position - 2, 0, 'L', mid);
                        this.position += 2;
                        path[this.position - 2] = 'L';
                        path.splice(this.position - 1, 1);
                        ans += 1;
                        break;
                    }
                    case 'del': {
                        if (this.position !== path.length - 1) {
                            path.splice(this.position - 2, 3);
                            ans -= 3;
                        }
                        break;
                    }
                }
                break;
            }
            case 'C': {
                switch (curve) {
                    case 'Q': {
                        path[this.position - 3] = 'Q';
                        let mid = this.getMiddlePoint(path[this.position - 4], path[this.position]);
                        path.splice(this.position - 1, 1);
                        path[this.position - 2] = mid;
                        ans -= 1;
                        break;
                    }
                    case 'L': {
                        path[this.position - 3] = 'L';
                        path.splice(this.position - 2, 2);
                        ans -= 2;
                        break;
                    }
                    case 'add': {
                        let mid = this.getMiddlePoint(path[this.position - 4], path[this.position]);
                        path.splice(this.position - 3, 0, 'L', mid);
                        this.position += 2;

                        path[this.position - 3] = 'L';
                        path.splice(this.position - 2, 2);
                        break;
                    }
                    case 'del': {
                        if (this.position !== path.length - 1) {
                            path.splice(this.position - 3, 4);
                            ans -= 4;
                        }
                        break;
                    }
                }
                break;
            }
            case 'L': {
                switch (curve) {
                    case 'Q': {
                        path[this.position - 1] = 'Q';
                        let mid = this.getMiddlePoint(path[this.position - 2], path[this.position]);
                        path.splice(this.position, 0, mid);
                        ans += 1;
                        break;
                    }
                    case 'C': {
                        path[this.position - 1] = 'C';
                        let mid = this.getMiddlePoint(path[this.position - 2], path[this.position]);
                        path.splice(this.position, 0, mid, mid);
                        ans += 2;
                        break;
                    }
                    case 'add': {
                        let mid = this.getMiddlePoint(path[this.position - 2], path[this.position]);
                        path.splice(this.position - 1, 0, 'L', mid);
                        ans += 2;
                        break;
                    }
                    case 'del': {
                        if (this.position !== path.length - 1) {
                            path.splice(this.position - 1, 2);
                            ans -= 2;
                        }
                        break;
                    }
                }
            }
        }
        this.line.setPath(path, this.line.map);
        return ans;
    }

    getMiddlePoint(c1, c2) {
        return [(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2];
    }


}