import css from '../css/L.Control.Toolbar.css';

L.Control.Toolbar = L.Control.extend({
    options: {
        position: "topleft",
        addNodeID: 'dropdown-add-node',
        addNodeText: 'Add Node',
        addLineID: 'dropdown-add-line',
        addLineText: 'Add Line',
        editNodeID: 'dropdown-edit-node',
        editNodeText: 'Edit Nodes',
        editLineID: 'dropdown-edit-line',
        editLineText: 'Edit Lines',
        getJSONID: 'dropdown-get-json',
        getJSONText: 'Get Map JSON',
        setTopologyID: 'dropdown-set-topology',
        setTopologyText: 'Set Topology',
        editTopologyID: 'dropdown-edit-topology',
        editTopologyText: 'Edit Topology'
    },


    onAdd: function (map) {
        let containerName = "atlas-editor-toolbar"
        this.tbContainer = L.DomUtil.create("div", containerName);
        let options = this.options;

        this._atlas = options.atlas;
        this._editor = this._atlas.editor;

        this.createAddNodeBtn();
        this.createAddLineBtn();
        this.createEditNodeBtn();
        this.createEditLineBtn();
        this.createGetJSONBtn();
        this.createSetTopologyBtn();
        this.createEditTopologyBtn();
        return this.tbContainer;
    },

    createAddNodeBtn: function () {
        let btnParams = {
            dropdownID: this.options.addNodeID,
            btnText: '',
            toolName: this.options.addNodeText,
            dropdownList: Object.keys(this._atlas.topologies)
        }
        let that = this;
        let topologyBeingEdited;

        this.addNodeButton = this.createDropdownButton(btnParams);
        let links = this.getLinkTags(this.addNodeButton);
        for (const link of links) {
            link.addEventListener('click', function () {
                topologyBeingEdited = link.textContent;
                that._editor.enableNodeAddMode(that._atlas.topologies[topologyBeingEdited]);
                that.enableMode(that.options.addNodeID);
            })
        }

        let btn = this.addNodeButton.getElementsByTagName('button')[0];
        btn.addEventListener('click', function () {
            if (btn.getAttribute('activated') === 'true') {
                that._editor.disableNodeAddMode(that._atlas.topologies[topologyBeingEdited]);
                btn.setAttribute('activated', 'false')
            }
        })
    },

    createAddLineBtn: function () {
        let btnParams = {
            dropdownID: this.options.addLineID,
            btnText: '',
            toolName: this.options.addLineText,
            dropdownList: Object.keys(this._atlas.topologies)
        }
        let that = this;
        let topologyBeingEdited;

        this.addLineButton = this.createDropdownButton(btnParams);
        let links = this.getLinkTags(this.addLineButton);
        for (const link of links) {
            link.addEventListener('click', function () {
                topologyBeingEdited = link.textContent;
                that._editor.enableLineAddMode(that._atlas.topologies[topologyBeingEdited]);
                that.enableMode(that.options.addLineID);
            })
        }

        let btn = this.addLineButton.getElementsByTagName('button')[0];
        btn.addEventListener('click', function () {
            if (btn.getAttribute('activated') === 'true') {
                that._editor.disableLineAddMode(that._atlas.topologies[topologyBeingEdited]);
                btn.setAttribute('activated', 'false')
            }
        })
    },

    createEditNodeBtn: function () {
        let btnParams = {
            dropdownID: this.options.editNodeID,
            btnText: '',
            toolName: this.options.editNodeText,
            dropdownList: Object.keys(this._atlas.topologies)
        }

        let that = this;
        let topologyBeingEdited;

        this.editNodeButton = this.createDropdownButton(btnParams);
        let links = this.getLinkTags(this.editNodeButton);
        for (const link of links) {
            link.addEventListener('click', function () {
                topologyBeingEdited = link.textContent;
                that._editor.enableNodeEditMode(that._atlas.topologies[topologyBeingEdited]);
                that.enableMode(that.options.editNodeID);
            })
        }

        let btn = this.editNodeButton.getElementsByTagName('button')[0];
        btn.addEventListener('click', function () {
            if (btn.getAttribute('activated') === 'true') {
                that._editor.disableNodeEditMode(that._atlas.topologies[topologyBeingEdited]);
                btn.setAttribute('activated', 'false')
            }
        })
    },

    createEditLineBtn: function () {
        let btnParams = {
            dropdownID: this.options.editLineID,
            btnText: '',
            toolName: this.options.editLineText,
            dropdownList: Object.keys(this._atlas.topologies)
        }

        let that = this;
        let topologyBeingEdited;

        this.editLineButton = this.createDropdownButton(btnParams);
        let links = this.getLinkTags(this.editLineButton);
        for (const link of links) {
            link.addEventListener('click', function () {
                topologyBeingEdited = link.textContent;
                that._editor.enableLineEditMode(that._atlas.topologies[topologyBeingEdited]);
                that.enableMode(that.options.editLineID);
            })
        }

        let btn = this.editLineButton.getElementsByTagName('button')[0];
        btn.addEventListener('click', function () {
            if (btn.getAttribute('activated') === 'true') {
                that._editor.disableLineEditMode(that._atlas.topologies[topologyBeingEdited]);
                btn.setAttribute('activated', 'false')
            }
        })
    },

    createGetJSONBtn: function () {
        let btnParams = {
            dropdownID: this.options.getJSONID,
            btnText: '',
            toolName: this.options.getJSONText,
            dropdownList: Object.keys(this._atlas.topologies)
        }

        let that = this;
        let topologyBeingEdited;

        this.getJSONButton = this.createDropdownButton(btnParams);
        let links = this.getLinkTags(this.getJSONButton);
        for (const link of links) {
            link.addEventListener('click', function () {
                topologyBeingEdited = link.textContent;
                that._editor.enableGetJSONMode(that._atlas.topologies[topologyBeingEdited]);
                that.enableMode(that.options.getJSONID);
            })
        }

        let btn = this.getJSONButton.getElementsByTagName('button')[0];
        btn.addEventListener('click', function () {
            if (btn.getAttribute('activated') === 'true') {
                that._editor.disableGetJSONMode(that._atlas.topologies[topologyBeingEdited]);
                btn.setAttribute('activated', 'false')
            }
        })
    },

    createSetTopologyBtn: function () {
        let btnParams = {
            dropdownID: this.options.setTopologyID,
            btnText: '',
            toolName: this.options.setTopologyText,
            dropdownList: ["ADD"]
        }

        let that = this;
        let topologyBeingEdited;

        this.setTopologyButton = this.createDropdownButton(btnParams);
        let links = this.getLinkTags(this.setTopologyButton);
        for (const link of links) {
            link.addEventListener('click', function () {
                topologyBeingEdited = '-';
                that._editor.enableSetTopologyMode(link.textContent);
                that.enableMode(that.options.setTopologyID);
            })
        }

        let btn = this.setTopologyButton.getElementsByTagName('button')[0];
        btn.addEventListener('click', function () {
            if (btn.getAttribute('activated') === 'true') {
                that._editor.disableSetTopologyMode();
                btn.setAttribute('activated', 'false')
            }
        })
    },

    createEditTopologyBtn: function() {
        let btnParams = {
            dropdownID: this.options.editTopologyID,
            btnText: '',
            toolName: this.options.editTopologyText,
            dropdownList: Object.keys(this._atlas.topologies)
        }
        let that = this;
        let topologyBeingEdited;

        this.editTopologyButton = this.createDropdownButton(btnParams);
        let links = this.getLinkTags(this.editTopologyButton);
        for (const link of links) {
            link.addEventListener('click', function () {
                topologyBeingEdited = link.textContent;
                that._editor.enableTopologyEditMode(that._atlas.topologies[topologyBeingEdited]);
                that.enableMode(that.options.editTopologyID);
            })
        }

        let btn = this.editTopologyButton.getElementsByTagName('button')[0];
        btn.addEventListener('click', function () {
            if (btn.getAttribute('activated') === 'true') {
                that._editor.disableTopologyEditMode(that._atlas.topologies[topologyBeingEdited]);
                btn.setAttribute('activated', 'false')
            }
        })
    },

    createDropdownButton: function (params) {
        // Making parent container (tb-dropdown)
        let container = L.DomUtil.create("div", 'tb-dropdown', this.tbContainer);
        container.id = params.dropdownID

        // Making Hover-able button (child of tb-dropdown)
        // Opens tb-dropdown-content
        let btn = L.DomUtil.create("button", 'tb-btn', container);
        btn.textContent = params.btnText;
        btn.setAttribute('activated', "false")
        // Drop Down content div (child of tb-dropdown)
        // Contains two children: 
        //      1. toolname: Describes what the tool does
        //      2. a tags  : Displays the links that make the dropdown link
        let dropdownContent = L.DomUtil.create("div", 'tb-dropdown-content', container);
        let toolname = L.DomUtil.create("p", 'tb-tool-name', dropdownContent);
        toolname.textContent = params.toolName;
        for (let i = 0; i < params.dropdownList.length; i++) {
            let a = L.DomUtil.create("a", undefined, dropdownContent);
            a.textContent = params.dropdownList[i];
        }

        return container;
    },

    getLinkTags: function (dropdownBtn) {
        return dropdownBtn.getElementsByClassName('tb-dropdown-content')[0].getElementsByTagName('a');
    },

    enableMode: function (id) {
        // Removing enabled Buttons
        let enabledButtons = this.tbContainer.querySelectorAll('[activated="true"]');
        for (const btn of enabledButtons) {
            btn.setAttribute('activated', 'false');
        }

        let targetContainer = document.querySelector(`.atlas-editor-toolbar #${id}`);
        targetContainer.getElementsByTagName('button')[0].setAttribute('activated', 'true');
    },

    updateNewTopology: function (topology) {
        // console.log(this.addNodeButton);
        // console.log(this.addLineButton);
        // console.log(this.editNodeButton);
        // console.log(this.editLineButton);
        // console.log(this.getJSONButton);
    }
});
