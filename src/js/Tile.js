import L from 'leaflet';

export default class Tile {

    constructor(config, topology) {
        this.config = config
        this.topology = topology
        this.layer = undefined
        this.map = topology.map
        this.mapListener = undefined
        this.util = new TileUtil()
    }

    display(openEditor) {
        if (this.config.image) {
            if (this.config.zoom) this.map.setZoom(this.config.zoom)
            this.topology.atlas.showLoader()
            setTimeout(() => {
                this.map.panTo(this.config.center);
                this.topology.atlas.removeTiles()
                if (this.layer) this.layer.removeFrom(this.map)
                let center = this.map.latLngToContainerPoint(this.config.center)
                let nw = [center.x - (this.config.width / 2), center.y - (this.config.height / 2)]
                let se = [center.x + (this.config.width / 2), center.y + (this.config.height / 2)]
                this.imageBounds = [
                    [this.map.containerPointToLatLng(nw).lat, this.map.containerPointToLatLng(nw).lng], 
                    [this.map.containerPointToLatLng(se).lat, this.map.containerPointToLatLng(se).lng],
                ];
                
                this.layer = L.imageOverlay(this.config.image, this.imageBounds, {interactive: true}).addTo(this.map)
                this.layer._image.classList.add('atlas-no-select')
                if (openEditor) this.openEditor()
                this.topology.atlas.hideLoader()
            }, 500)
            
        }
    }

    getConfig() {
        return {
            image: this.config.image,
            zoom: this.config.zoom,
            center: this.config.center,
            height: this.config.height,
            width: this.config.width
        }
    }

    updateStats() {
        let height = this.layer._image.style.height
        let width = this.layer._image.style.width
        this.config.center = this.layer.getBounds().getCenter()
        this.config.width = Number(width.substring(0, width.length-2)),
        this.config.height = Number(height.substring(0, height.length-2)),
        this.config.zoom = this.map.getZoom()
    }

    setDimensions(w = this.config.width, h = this.config.height) {
        let containerPoint = this.map.latLngToContainerPoint({lat: this.imageBounds[0][0], lng: this.imageBounds[0][1]})
        containerPoint.x = containerPoint.x + w
        containerPoint.y = containerPoint.y + h 
        let latLngPoint = this.map.containerPointToLatLng(containerPoint)

        this.imageBounds = [[this.imageBounds[0][0], this.imageBounds[0][1]], [latLngPoint.lat, latLngPoint.lng]];
        this.layer.setBounds(this.imageBounds)
        this.updateStats()
    }

    openEditor() {

        this.layer.on('mousedown', () => {
            this.map.on('mousemove', (e) => {
                this.map.dragging.disable();
                let mcoord = this.util.moved([e.latlng.lat, e.latlng.lng])
                if (mcoord == undefined) return

                let containerPoint = this.map.latLngToContainerPoint({lat: this.imageBounds[0][0] + mcoord[0], lng: this.imageBounds[0][1] + mcoord[1]})
                containerPoint.x = containerPoint.x + this.config.width
                containerPoint.y = containerPoint.y + this.config.height 
                let latLngPoint = this.map.containerPointToLatLng(containerPoint)

                this.imageBounds = [[this.imageBounds[0][0] + mcoord[0], this.imageBounds[0][1] + mcoord[1]], [latLngPoint.lat, latLngPoint.lng]];
                this.layer.setBounds(this.imageBounds)
                this.updateStats()
            })
        })

        this.map.on('mouseup', (e) => {
            this.map.removeEventListener('mousemove');
            this.map.dragging.enable();
            this.util.lastCoord = undefined
        });

        this.map.on('zoom', () => {
            this.updateStats()
        })
    }

    closeEditor() {
        this.map.off('zoom')
        this.resizeBtn.removeFrom(this.map)
        if (this.layer._tooltip) this.layer._tooltip.removeFrom(this.map)
        this.layer.off('mousedown')
    }
    
}

class TileUtil {
    constructor() {
        this.lastCoord = undefined
    }

    moved(coords) {
        if (!this.lastCoord) {
            this.lastCoord = coords
            return
        } else {
            let val = [coords[0] - this.lastCoord[0], coords[1] - this.lastCoord[1]]
            this.lastCoord = coords
            return val
        }
    }
}