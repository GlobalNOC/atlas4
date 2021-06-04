import L from 'leaflet';

// Overlay Topology 
// The instances of this class will be used to draw additional topology
// on the map that aren't network topology. Some example of an 
// Overlay Topology would be displaying Earthquake data on the map

export default class OverlayTopology {
    constructor(config, options) {
        this.features = config
        this.options = options

        this.layer = []
        this.createLayers()
    }

    createLayers() {
        for (const feature of this.features) {
            switch (feature.type) {
                case 'earthquake': {
                    let layer = this.createEarthquakeLayer(feature)
                    if (layer) this.layer.push(layer)
                    break;
                }
                case 'quarry blast': {
                    let layer = this.createQuarryBlastLayer(feature)
                    if (layer) this.layer.push(layer)
                    break;
                }
                default: {
                    break;
                }   
            }
        }
    }

    createQuarryBlastLayer(data) {
        if(!this.options['quarry blast']) return
        let size = Math.ceil(data.mag)
        return L.circleMarker([data.lat, data.lng], {
            ...this.options['quarry blast'].style,
            radius: size * 2
        }).bindPopup(`${data.title}`)
    }
 
    createEarthquakeLayer(data) {
        if(!this.options['earthquake']) return
        let size = Math.ceil(data.mag)
        return L.circleMarker([data.lat, data.lng], {
            ...this.options['earthquake'].style,
            radius: size * 2
        }).bindPopup(`${data.title}`)
    }

    drawOverlayTopology(map) {
        for (const l of this.layer) {
            l.addTo(map)
        }
    }

    hideOverlayTopology(map) {
        for (const l of this.layer) {
            l.removeFrom(map)
        }
    }
}