import css from '../css/EditorModal.css';
import modal_content from '../html/editor_modal.html';
import kv_template from '../html/metadata_kv.html';

export default class EditorModal {
    constructor(editor, container) {
        this.editor = editor

        this.modal = L.DomUtil.create("div", 'atlas-editor-modal');
        this.modal.innerHTML = modal_content
        let leafletContainer = container
        leafletContainer.appendChild(this.modal)
        this.modal.style.display = 'none'

        this.controls = {}
        this.listeners = {}

        this.registerElements()
        this.setFileUploadWindow()
    }

    registerElements() {
        let c = this.controls

        c.modalHeaderDescription = document.getElementById('editor-modal-head-desc')
        c.closeModal = document.getElementById('editor-modal-dismiss')

        // KV Window
        c.KVModalContainer = document.getElementById('editor-modal-kv-wrapper')
        c.addPropertyMetadata = document.getElementById('editor-modal-add-kv')
        c.savePropertyMetadata = document.getElementById('editor-modal-save-kv')
        c.KVTableBody = document.getElementById('em-kv-tbody')
        

        // Tile Upload Window
        c.tileUploadWindow = document.getElementById('editor-modal-tile-drop-area')
        c.tileFileInput = document.getElementById('atlas-modal-map-tile-input')
        c.tileFileLabel = document.getElementById('atlas-modal-map-tile-upload')
        c.tileSave = document.getElementById('atlas-modal-map-tile-save')

        this.modal.addEventListener('mouseover', () => {
            this.editor.map.scrollWheelZoom.disable()
            this.editor.map.dragging.disable();
        })
        this.modal.addEventListener('mouseout', () => {
            this.editor.map.scrollWheelZoom.enable()
            this.editor.map.dragging.enable();
        })
    }

    show() {
        this.modal.style.display = 'block'
    }

    hide() {
        this.modal.style.display = 'none'
    }

    configureCircuitKVTable(line) {
        let l = this.listeners
        let c = this.controls
        
        c.modalHeaderDescription.textContent = 'Manage Circuit Metadata'
        c.KVModalContainer.style.display = 'block'

        for (const row of Array.from(c.KVTableBody.getElementsByTagName('tr'))) {
            
            if (row) row.remove()
        }

        if (line.metadata) {
            for (const key in line.metadata) {
                let row = document.createElement("tr");
                row.innerHTML = kv_template    
                
                c.KVTableBody.appendChild(row)
                
                let value = ""

                if (typeof line.metadata[key] === 'string') value = line.metadata[key]
                else value = JSON.stringify(line.metadata[key],null, "  ")

                row.querySelector('[type=text]').value = key
                row.querySelector('textarea').value = value

                let deleteButtons = c.KVTableBody.getElementsByClassName('em-trashcan')
                for (const button of deleteButtons) {
                    button.onclick = function() {this.parentElement.parentElement.remove()}
                }
            }
        }

        l.addNewProperty = () => {
            let row = document.createElement("tr"); 
            row.innerHTML = kv_template
            c.KVTableBody.appendChild(row)
            let deleteButtons = c.KVTableBody.getElementsByClassName('em-trashcan')
            for (const button of deleteButtons) {
                button.onclick = function() {this.parentElement.parentElement.remove()}
            }

        }

        l.closeModalWindow = () => {
            c.addPropertyMetadata.removeEventListener('click', l.addNewProperty)
            c.savePropertyMetadata.removeEventListener('click', l.saveNewProperties)
            c.closeModal.removeEventListener('click', l.closeModalWindow)
            c.KVModalContainer.style.display = 'none'
            this.editor.closeKVModal()
            this.hide()
        }

        l.saveNewProperties = () => {
            line.metadata = {}
            for (const row of Array.from(c.KVTableBody.getElementsByTagName('tr'))) {
                let key = row.querySelector('[type=text]').value
                let value = row.querySelector('textarea').value
                if (this.isJsonString(value)) value = JSON.parse(value)
                if (key != "" && value != "") line.metadata[key] = value
            }
            c.savePropertyMetadata.textContent = "Saved!"
            this.editor.atlas.dispatch('update')
            this.editor.sidebar.setLPWJSON(line)
            setTimeout(() => c.savePropertyMetadata.textContent = 'Save Properties', 1000)
        }

        c.addPropertyMetadata.addEventListener('click', l.addNewProperty)
        c.savePropertyMetadata.addEventListener('click', l.saveNewProperties)
        c.closeModal.addEventListener('click', l.closeModalWindow)
    }

    configureTopologyKVTable(topology) {
        let l = this.listeners
        let c = this.controls
        
        c.modalHeaderDescription.textContent = 'Manage Topology Metadata'
        c.KVModalContainer.style.display = 'block'

        for (const row of Array.from(c.KVTableBody.getElementsByTagName('tr'))) {
            if (row) row.remove()
        }

        if (topology.image) {
            let row = document.createElement("tr");
            row.innerHTML = kv_template    
            
            c.KVTableBody.appendChild(row)

            row.querySelector('[type=text]').value = 'image'
            row.querySelector('textarea').value = topology.image

            let deleteButtons = c.KVTableBody.getElementsByClassName('em-trashcan')
            for (const button of deleteButtons) {
                button.onclick = function() {this.parentElement.parentElement.remove()}
            }
        }

        if (topology.metadata) {
            for (const key in topology.metadata) {
                if (key === 'logo') continue;
                let row = document.createElement("tr");
                row.innerHTML = kv_template    
                
                c.KVTableBody.appendChild(row)
                
                let value = ""
                
                if (typeof topology.metadata[key] === 'string') value = topology.metadata[key]
                else value = JSON.stringify(topology.metadata[key], null, "  ")

                row.querySelector('[type=text]').value = key
                row.querySelector('textarea').value = value

                let deleteButtons = c.KVTableBody.getElementsByClassName('em-trashcan')
                for (const button of deleteButtons) {
                    button.onclick = function() {this.parentElement.parentElement.remove()}
                }
            }
        }

        l.addNewProperty = () => {
            let row = document.createElement("tr"); 
            row.innerHTML = kv_template
            c.KVTableBody.appendChild(row)
            let deleteButtons = c.KVTableBody.getElementsByClassName('em-trashcan')
            for (const button of deleteButtons) {
                button.onclick = function() {this.parentElement.parentElement.remove()}
            }

        }

        l.closeModalWindow = () => {
            c.addPropertyMetadata.removeEventListener('click', l.addNewProperty)
            c.savePropertyMetadata.removeEventListener('click', l.saveNewProperties)
            c.closeModal.removeEventListener('click', l.closeModalWindow)
            this.editor.closeKVModal()
            c.KVModalContainer.style.display = 'none'
            this.hide()
        }

        l.saveNewProperties = () => {
            topology.metadata = {}
            for (const row of Array.from(c.KVTableBody.getElementsByTagName('tr'))) {
                let key = row.querySelector('[type=text]').value
                let value = row.querySelector('textarea').value
                if (this.isJsonString(value)) value = JSON.parse(value)
                if (key === "image" && value != "") {
                    this.changeTooltipImage(topology, value)    
                    continue;
                }
                if (key != "" && value != "") topology.metadata[key] = value
            }
            c.savePropertyMetadata.textContent = "Saved!"
            setTimeout(() => c.savePropertyMetadata.textContent = 'Save Properties', 1000)
        }

        c.addPropertyMetadata.addEventListener('click', l.addNewProperty)
        c.savePropertyMetadata.addEventListener('click', l.saveNewProperties)
        c.closeModal.addEventListener('click', l.closeModalWindow)
    }

    isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    changeTooltipImage(topology, img) {
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
    }
    
    setFileUploadWindow() {
        let c = this.controls;
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            c.tileUploadWindow.addEventListener(eventName, preventDefaults, false)   
        });
        
        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            c.tileUploadWindow.addEventListener(eventName, highlight, false)
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            c.tileUploadWindow.addEventListener(eventName, unhighlight, false)
        });

        function preventDefaults (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        function highlight(e) {
            c.tileUploadWindow.classList.add('highlight')
        }

        function unhighlight(e) {
            c.tileUploadWindow.classList.remove('highlight')
        }
    }

    configureMapTileWindow(topology) {
        let c = this.controls;
        let l = this.listeners;
        let image;

        c.tileUploadWindow.style.display = 'block'

        l.handleDrop = (e) => {
            var dt = e.dataTransfer
            var file = dt.files[0]

            l.handleFile(file)
        }

        l.handleFile = (file) => {
            let reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onloadend = () => {
                if (file.name.length > 20) {
                    let fn = truncStringPortion(file.name, 7, 7, 3)
                    document.querySelector('#editor-modal-tile-drop-area p').textContent = 'File Uploaded: ' + fn
                } else {
                    document.querySelector('#editor-modal-tile-drop-area p').textContent = 'File Uploaded: ' + file.name
                }
                c.tileSave.classList.add('file-added')
                image = reader.result
            }
        }

        l.inputHandleFile = function() {
            l.handleFile(this.files[0])
        }

        l.closeModalWindow = () => {
            c.tileSave.classList.remove('file-added')
            c.tileSave.textContent = 'Save File'
            document.querySelector('#editor-modal-tile-drop-area p').textContent = 'Choose an image file or drag it here.'
            
            c.tileUploadWindow.removeEventListener('drop', l.handleDrop)
            c.tileFileInput.removeEventListener('change', l.inputHandleFile)
            c.closeModal.removeEventListener('click', l.closeModalWindow)
            c.tileSave.removeEventListener('click', l.loadTile)
            c.tileUploadWindow.style.display = 'none'
            this.hide()
        }

        l.loadTile = () => {
            if (!image) return

            let img = new Image()

            img.onload = () => { 
                let h, w;
                let mapDimensions = this.editor.map._size
                let aspectRatio = img.width/img.height

                if (mapDimensions.x >= mapDimensions.y) {
                    h = mapDimensions.y
                    w = h * aspectRatio
                } else {
                    w = mapDimensions.x
                    h = w / aspectRatio
                }

                let centerPoint = this.editor.map.containerPointToLatLng([mapDimensions.x/2, mapDimensions.y/2])

                this.editor.addMapTile({
                    image: image,
                    center: [centerPoint.lat, centerPoint.lng],
                    width: w,
                    height: h,
                    zoom: this.editor.map.getZoom()
                }, topology)


                c.tileSave.textContent = 'Saved!'
                setTimeout(() => {
                    c.tileSave.classList.remove('file-added')
                    c.tileSave.textContent = 'Save File'
                    document.querySelector('#editor-modal-tile-drop-area p').textContent = 'Choose an image file or drag it here.'
                }, 1000)

            }
            img.src = image
            
        }

        function truncStringPortion(str, firstCharCount = str.length, endCharCount = 0, dotCount = 3) {
            var convertedStr="";
            convertedStr+=str.substring(0, firstCharCount);
            convertedStr += ".".repeat(dotCount);
            convertedStr+=str.substring(str.length-endCharCount, str.length);
            return convertedStr;
        }

        // Handle dropped files
        c.tileUploadWindow.addEventListener('drop', l.handleDrop)
        c.tileFileInput.addEventListener('change', l.inputHandleFile)
        c.closeModal.addEventListener('click', l.closeModalWindow)
        c.tileSave.addEventListener('click', l.loadTile)
    }
}

