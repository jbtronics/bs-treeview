import BSTreeView from "./BSTreeView";
import BSTreeViewDisableOptions from "./BSTreeViewDisableOptions";
import {
    EVENT_NODE_CHECKED,
    EVENT_NODE_COLLAPSED,
    EVENT_NODE_DISABLED,
    EVENT_NODE_EXPANDED, EVENT_NODE_RENDERED,
    EVENT_NODE_SELECTED,
    EVENT_NODE_UNCHECKED,
    EVENT_NODE_UNSELECTED
} from "./BSTreeViewEventNames";
import BSTreeViewEventOptions from "./BSTreeViewEventOptions";
import BSTreeViewNodeState from "./BSTreeViewNodeState";
import BSTreeViewOptions from "./BSTreeViewOptions";
import BSTreeViewSelectOptions from "./BSTreeViewSelectOptions";
import Template from "./BSTreeViewTemplate";

export default class BSTreeViewNode {

    /** The text value displayed for a given tree node, typically to the right of the nodes icon. (Mandatory) */
    text: string;
    /** The icon displayed on a given node, typically to the left of the text. (Optional) */
    icon: string;
    /** The URL to an image displayed on a given node, overrides the icon. (Optional) */
    image: string;
    /** The icon displayed on a given node when selected, typically to the left of the text. (Optional) */
    selectedIcon: string;
    /** The foreground color used on a given node, overrides global color option. (Optional) */
    color: string;
    /** The background color used on a given node, overrides global color option. (Optional) */
    backColor: string;
    /** The color used on a given node's icon. (Optional) */
    iconColor: string;
    /** The color used under a given node's background icon. (Optional) */
    iconBackground: string;
    /** Whether a node is selectable in the tree. False indicates the node should act as an expansion heading and will not fire selection events. Default true */
    selectable: boolean = true;
    /** Whether a node is checkable in the tree, used in conjunction with showCheckbox. Default true */
    checkable: boolean = true;
    /** The current state of this node. See @BSTreeViewNodeState for more details */
    state: BSTreeViewNodeState;
    /** Used in conjunction with global showTags option to add additional information to the right of each node; using Bootstrap Badges, A tag can be an object with properties 'text' for tag value and 'class' for class names(s) of this tag **/
    tags: string[]|Record<string, string>[];
    /** List of per-node HTML data- attributes to append. */
    dataAttr: object;
    /** Custom HTML id attribute */
    id: string;
    /** List of custom CSS classes to append, separated by space. */
    class: string;
    /** Used to hide the checkbox of the given node when showCheckbox is set to true */
    hideCheckbox: boolean;
    nodes: BSTreeViewNode[];
    /** The tooltip value displayed for a given tree node on mouse hover. (Optional) */
    tooltip: string;
    href: string;

    /** Adds an expand icon to the node even if it has no children, it calls the lazyLoad() function (described below) upon the first expand. Default: false (Optional) */
    lazyLoad: boolean = false;
    /** Sets the class of node tags. Default null **/
    tagsClass: string = null;


    /**
     * The dom element representing this node
     * @private
     */
    _domElement: HTMLElement = null;
    /**
     * The elements used to build the node level indentation
     * @private
     */
    _domIndents: HTMLElement[] = [];
    /**
     * The expand icon displayed on a given node, typically to the left of the text. (Optional)
     * @private
     */
    _domIconExpand: HTMLElement = null;
    /**
     * The element representing the checkbox on this element
     * @private
     */
    _domCheckbox: HTMLElement = null;
    /**
     * The element representing the (user definable) icon on this element
     * @private
     */
    _domIcon: HTMLElement = null;
    /**
     * The element representing the image description of this element
     * @private
     */
    _domImage: HTMLElement = null;
    /**
     * The elements of badges on this treeview
     * @private
     */
    _domBadges: HTMLElement[] = [];


    searchResult: boolean;


    /** The hierachy level this node is at. */
    level: number = 1;
    /** The index of this entry in the parent's children array. */
    index: number;
    nodeId: string;

    _parentNode: BSTreeViewNode|null = null;

    _options: BSTreeViewOptions;
    _treeView: BSTreeView;

    /**
     * Create a new TreeViewNode
     * @param treeView The treeview this node belongs to
     */
    constructor(treeView: BSTreeView) {
        this.state = new BSTreeViewNodeState();

        this._treeView = treeView;
        this._options = treeView._options;
    }

    get parentId(): string|null
    {
        return this._parentNode.nodeId ?? null;
    }

    /**
     * Create a new node object from partial data object, containing the properties which should be set on the node.
     * This function creates the children nodes objects from the data object recursively.
     * @param data An object with the properties which should be set on the node.
     * @param treeView The treeview this node belongs to
     */
    static fromData(data: Partial<BSTreeViewNode>, treeView: BSTreeView): BSTreeViewNode
    {
        const node = new BSTreeViewNode(treeView);

        //Apply our properties from data to our target node
        Object.assign(node, data);

        //Create children nodes from data
        if(data.nodes) {
            node.nodes = data.nodes.map(node => BSTreeViewNode.fromData(node, treeView));
        } else {
            node.nodes = [];
        }

        return node;
    }

    /**
     * Update the children nodes for hierachy, by setting the right values for parent, level and index.
     * All children nodes are registered then at the treeview. Beware that this node itself is not registered!
     * Also hierachically dependent node properties are set here. This function is called recursively.
     */
    _updateChildrenHierarchy(): void
    {
        //If this node has no children we are done
        if (!this.hasChildren()) return;

        const new_level = this.level + 1;
        // The virtual root node has level 0 and should not become parent of the real root nodes
        const parent = this.level > 0 ? this : null;

        this.nodes.forEach((node, index) => {
            // level : hierarchical tree level, starts at 1
            node.level = new_level;

            // index : relative to siblings
            node.index = index;

            // nodeId : unique, hierarchical identifier
            node.nodeId = (parent && parent.nodeId) ?
                parent.nodeId + '.' + node.index :
                (new_level - 1) + '.' + node.index;

            // We are the parent of our children nodea
            node._parentNode = parent;

            // convert the undefined string if hierarchical checks are enabled
            if (this._options.hierarchicalCheck && node.state.checked === null) {
                node.state.checked = null;
            }

            // If no expanded state was passed as data (meaning it is null), set its value depending on the levels properties
            if (node.state.expanded === null) {
                node.state.expanded = !node.state.disabled && (new_level < this._options.levels) && (node.hasChildren());
            }

            // set visible state; based parent state plus levels
            node.state.visible = !!((parent && parent.state && parent.state.expanded) || (new_level <= this._options.levels));

            // recurse child nodes and transverse the tree, depth-first
            if (node.hasChildren()) {
                node._updateChildrenHierarchy();
            }

            //Register our children nodes at the treeview
            this._treeView._registerNode(node);
        });
    }

    /**
     * Creates the underlying HTMLElement for this node and updates its properties.
     */
    _renderNode(): HTMLElement
    {
        //Create the node element from template if it is not existing
        if (!this._domElement) {
            this._domElement = Template.node.cloneNode(true) as HTMLElement;
            this._domElement.classList.add('node-' + this._treeView._elementId);
        }
        else {
            this._domElement.innerHTML = "";
        }

        // Append .classes to the node
        if(this.class) {
            this._domElement.classList.add(...this.class.split(" "));
        }

        // Set the #id of the node if specified
        if (this.id) {
            this._domElement.id = this.id;
        }

        // Append custom data- attributes to the node
        if (this.dataAttr) {
            for (const key in this.dataAttr) {
                if (this.dataAttr[key]) {
                    this._domElement.dataset[key] = this.dataAttr[key];
                }
            }
        }

        // Set / update nodeid; it can change as a result of addNode etc.
        this._domElement.dataset.nodeId = this.nodeId;

        // Set the tooltip attribute if present
        if (this.tooltip) {
            this._domElement.title = this.tooltip;
        }

        // Add indent/spacer to mimic tree structure
        for (let i = 0; i < (this.level - 1); i++) {
            this._domIndents.push(Template.indent.cloneNode(true) as HTMLElement);
        }
        this._domElement.append(...this._domIndents);

        // Add expand / collapse icon element or an empty spacer icons
        if(this.hasChildren() || this.lazyLoad) {
            this._domIconExpand = Template.icon.expand.cloneNode(true) as HTMLElement;
            this._domElement.append(this._domIconExpand);
        } else { //Add an element for spacing
            this._domElement.append(Template.icon.empty.cloneNode(true) as HTMLElement);
        }

        // Add checkbox and node icons
        if (this._options.checkboxFirst) {
            this._addCheckbox();
            this._addIcon();
            this._addImage();
        } else {
            this._addIcon();
            this._addImage();
            this._addCheckbox();
        }

        // Add text
        if (this._options.wrapNodeText) {
            const wrapper = Template.text.cloneNode(true) as HTMLElement;
            this._domElement.append(wrapper);
            wrapper.append(this.text);
        } else {
            this._domElement.append(this.text);
        }

        // Add tags as badges
        if (this._options.showTags && this.tags) {
            this.tags.forEach(tag => {
                const template = Template.badge.cloneNode(true) as HTMLElement;

                //Decide which class to use
                if (typeof tag === 'object' && tag.class) { //If the tag has its own class definition use this
                    template.classList.add(...tag.class.split(" "));
                } else if(this.tagsClass) { //If this node has its own definition for the tagsClass use it
                    template.classList.add(...this.tagsClass.split(" "));
                } else { //Otherwise use the global one
                    template.classList.add(...this._options.tagsClass.split(" "));
                }

                //Decide which text the text to use
                if (typeof tag === 'object' && tag.text) {
                    template.innerText = tag.text;
                } else {
                    template.innerText = tag;
                }
                this._domBadges.push(template);
            });
            this._domElement.append(...this._domBadges);
        }

        // Normally the node will not be updated, if the value is already set to the same value.
        // Setting the options value to force, will force an update.

        // Set various node states
        this.setSelected(this.state.selected, {_force: true, silent: true});
        this.setChecked(this.state.checked, {_force: true, silent: true});
        this.setSearchResult(this.searchResult, {_force: true, silent: true});
        this.setExpanded(this.state.expanded, {_force: true, silent: true});
        this.setDisabled(this.state.disabled, {_force: true, silent: true});
        this.setVisible(this.state.visible, {_force: true, silent: true});

        // Trigger nodeRendered event
        this._triggerEvent(EVENT_NODE_RENDERED, new BSTreeViewEventOptions());


        return this._domElement;
    }

    /**
     * Recursivley removes this node and all its children from the Dom
     */
    _removeNodeEl (): void {
        this.nodes.forEach((node) => {
            node._removeNodeEl();
        });
        this._domElement.remove();
    };

    /**
     * Create the given event on the nodes element. The event bubbles the DOM upwards. Details about the node and the used treeView are passed via event.detail
     * @param eventType The name of the event to generate (see EVENT_* constants in BSTreeViewEventNames)
     * @param options
     */
    _triggerEvent (eventType: string, options: BSTreeViewEventOptions = null) {
        if (options && !options.silent) {
            const event = new CustomEvent(eventType, {
                detail: {
                    node: this,
                    eventOptions: options,
                    treeView: this._treeView
                },
                bubbles: true
            });
            this._domElement.dispatchEvent(event);
        }
    }

    toggleDisabled(options: BSTreeViewDisableOptions = new BSTreeViewDisableOptions()): this {
        this.setDisabled(!this.state.disabled, options);
        return this;
    }

    /**
     * Returns true, if this node has children.
     */
    hasChildren(): boolean {
        return this.nodes && this.nodes.length > 0;
    }

    /**
     * Toggle the expanded state of this node (if it was expanded, it will be collapsed, and vice versa)
     * @param options
     */
    toggleExpanded (options: BSTreeViewEventOptions = new BSTreeViewEventOptions()) {
        // Lazy-load the child nodes if possible
        if (typeof(this.lazyLoad) === 'function' && this.lazyLoad) {
            this._lazyLoad();
        } else {
            this.setExpanded(!this.state.expanded, options);
        }
    };

    _lazyLoad () {
        if(!this.lazyLoad) return;

        // Show a different icon while loading the child nodes
        if(this._domIconExpand) {
            this._domImage.classList.remove(...this._options.expandIcon.split(' '));
            this._domImage.classList.add(...this._options.loadingIcon.split(' '));
        }

        this._options.lazyLoad(this, (nodes) => {
            // Adding the node will expand its parent automatically
            this._treeView.addNode(nodes, this);
        });
        // Only the first expand should do a lazy-load
        this.lazyLoad = false;
    };

    setExpanded (state: boolean, options: BSTreeViewEventOptions|Record<string, unknown> = new BSTreeViewEventOptions()): void {
        //Parse the passed options to an options object
        options = new BSTreeViewEventOptions(options);

        // During rendered event, the options._force property is set
        if (!options._force && state === this.state.expanded) return;

        if (state && this.hasChildren()) {

            // Set node state
            this.state.expanded = true;

            // Set element
            if (this._domIconExpand) {
                this._domIconExpand.classList.remove(...this._options.expandIcon.split(" "))
                this._domIconExpand.classList.remove(...this._options.loadingIcon.split(" "))
                this._domIconExpand.classList.add(...this._options.collapseIcon.split(" "));
            }

            // Expand children
            this.nodes.forEach((node) => {
                node.setVisible(true, options);
            });

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_EXPANDED, options);
        }
        else if (!state) {

            // Set node state
            this.state.expanded = false;

            // Set element
            if (this._domIconExpand) {
                this._domIconExpand.classList.remove(...this._options.collapseIcon.split(" "));
                this._domIconExpand.classList.add(...this._options.expandIcon.split(" "));
            }

            // Collapse children
            this.nodes.forEach ((node) => {
                node.setVisible(false, options);
                node.setExpanded(false, options);
            });

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_COLLAPSED, options);
        }
    };

    setVisible (state: boolean, options: BSTreeViewEventOptions|Record<string, unknown> = new BSTreeViewEventOptions()): void {
        //Parse the passed options to an options object
        options = new BSTreeViewEventOptions(options);

        if (!options._force && state === this.state.visible) return;

        this.state.visible = state;

        if(this._domElement) {
            //Add hidden class to our element
            if(state) {
                this._domElement.classList.remove('node-hidden');
            } else {
                this._domElement.classList.add('node-hidden');
            }
        }
    };

    toggleSelected (options: BSTreeViewSelectOptions = new BSTreeViewSelectOptions()): this {
        this.setSelected(!this.state.selected, options);
        return this;
    };

    setSelected (state: boolean, options: BSTreeViewSelectOptions|Record<string, unknown> = new BSTreeViewSelectOptions()): this {
        //Parse the passed options to an options object
        options = new BSTreeViewSelectOptions(options);

        // We never pass options when rendering, so the only time
        // we need to validate state is from user interaction
        if (!options._force && (state === this.state.selected)) return this;

        if (state) {

            // If multiSelect false, unselect previously selected
            //TODO: Put this responsibility on the treeview using an Event
            if (!this._options.multiSelect) {
                const selectedNodes = this._treeView._findNodes('true', 'state.selected');
                selectedNodes.forEach((node) => {
                    options.unselecting = true;

                    node.setSelected(false, options);
                });
            }

            // Set node state
            this.state.selected = true;

            // Set element
            if (this._domElement) {
                this._domElement.classList.add('node-selected');

                if ((this.selectedIcon || this._options.selectedIcon) && this._domIcon) {
                    this._domIcon.classList.remove(...(this.icon || this._options.nodeIcon).split(" "));
                    this._domIcon.classList.add(...(this.selectedIcon || this._options.selectedIcon).split(" "));
                }
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_SELECTED, options);
        }
        else {

            // If preventUnselect true + only one remaining selection, disable unselect
            if (this._options.preventUnselect &&
                (options && !options.unselecting) &&
                (this._treeView._findNodes('true', 'state.selected').length === 1)) {
                // Fire the nodeSelected event if reselection is allowed
                if (this._options.allowReselect) {
                    this._triggerEvent(EVENT_NODE_SELECTED, options);
                }
                return this;
            }

            // Set node state
            this.state.selected = false;

            // Set element
            if (this._domElement) {
                this._domElement.classList.remove('node-selected');

                if ((this.selectedIcon || this._options.selectedIcon) && this._domIcon) {
                    this._domIcon.classList.remove(...(this.selectedIcon || this._options.selectedIcon).split(" "))
                    this._domIcon.classList.add(...(this.icon || this._options.nodeIcon).split(" "));
                }
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_UNSELECTED, options);
        }

        return this;
    };

    toggleChecked (options: BSTreeViewEventOptions = new BSTreeViewEventOptions()): this {
        if (this._options.hierarchicalCheck) {
            // Event propagation to the parent/child nodes
            const childOptions = new BSTreeViewEventOptions(options);
            childOptions.silent = options.silent || !this._options.propagateCheckEvent;

            let state: boolean|null;
            let currentNode: BSTreeViewNode = this;
            // Temporarily swap the tree state
            this.state.checked = !this.state.checked;

            currentNode = this._treeView._nodes.get(currentNode.parentId);
            // Iterate through each parent node
            while (currentNode) {

                // Calculate the state
                state = currentNode.nodes.reduce((acc, curr) => {
                    return (acc === curr.state.checked) ? acc : null;
                }, currentNode.nodes[0].state.checked);

                // Set the state
                currentNode.setChecked(state, childOptions);

                currentNode = this._treeView._nodes.get(currentNode.parentId);
            }

            if (this.hasChildren()) {
                // Copy the content of the array
                let child, children = this.nodes.slice();
                // Iterate through each child node
                while (children && children.length > 0) {
                    child = children.pop();

                    // Set the state
                    child.setChecked(this.state.checked, childOptions);

                    // Append children to the end of the list
                    if (child.nodes && child.nodes.length > 0) {
                        children = children.concat(child.nodes.slice());
                    }
                }
            }
            // Swap back the tree state
            this.state.checked = !this.state.checked;
        }

        this.setChecked(!this.state.checked, options);
        return this;
    };

    setChecked (state: boolean, options: BSTreeViewEventOptions|Record<string, unknown> = new BSTreeViewEventOptions()) {
        options = new BSTreeViewEventOptions(options);

        // We never pass options when rendering, so the only time
        // we need to validate state is from user interaction
        if (!options._force && state === this.state.checked) return;

        //TODO: Put this responsibility on the treeview using an Event
        // Highlight the node if its checkbox has unsaved changes
        if (this._options.highlightChanges) {
            const nodeNotInCheckList = this._treeView._checkedNodes.indexOf(this) == -1;
            if(nodeNotInCheckList == state) {
                this._domElement.classList.add('node-check-changed');
            } else {
                this._domElement.classList.remove('node-check-changed');
            }
        }

        if (state) {

            // Set node state
            this.state.checked = true;

            // Set element
            if (this._domElement) {
                this._domElement.classList.add('node-checked');
                this._domElement.classList.remove('node-checked-partial');
                if(this._domCheckbox) {
                    this._domCheckbox.classList.remove(...this._options.uncheckedIcon.split(" "))
                    this._domCheckbox.classList.remove(...this._options.partiallyCheckedIcon.split(" "))
                    this._domCheckbox.classList.add(...this._options.checkedIcon.split(" "));
                }
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_CHECKED, options);
        }
        else if (state === null && this._options.hierarchicalCheck) {

            // Set node state to partially checked
            this.state.checked = null;

            // Set element
            if (this._domElement) {
                this._domElement.classList.add('node-checked-partial');
                this._domElement.classList.remove('node-checked');
                if(this._domCheckbox) {
                    this._domCheckbox.classList.remove(...this._options.uncheckedIcon.split(" "));
                    this._domCheckbox.classList.remove(...this._options.checkedIcon.split(" "));
                    this._domCheckbox.classList.add(...this._options.partiallyCheckedIcon.split(" "));
                }
            }

            // Optionally trigger event, partially checked is technically unchecked
            this._triggerEvent(EVENT_NODE_UNCHECKED, options);
        } else {

            // Set node state to unchecked
            this.state.checked = false;

            // Set element
            if (this._domElement) {
                this._domElement.classList.remove('node-checked', 'node-checked-partial');
                if(this._domCheckbox) {
                    this._domCheckbox.classList.remove(...this._options.checkedIcon.split(" "));
                    this._domCheckbox.classList.remove(...this._options.partiallyCheckedIcon.split(" "));
                    this._domCheckbox.classList.add(...this._options.uncheckedIcon.split(" "));
                }
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_UNCHECKED, options);
        }
    };

    setDisabled (state: boolean, options: BSTreeViewDisableOptions|Record<string, unknown> = new BSTreeViewDisableOptions()) {

        options = new BSTreeViewDisableOptions(options);

        // We never pass options when rendering, so the only time
        // we need to validate state is from user interaction
        if (!options._force && state === this.state.disabled) return;

        if (state) {

            // Set node state to disabled
            this.state.disabled = true;

            // Disable all other states
            if (options && !options.keepState) {
                this.setSelected(false, options);
                this.setChecked(false, options);
                this.setExpanded(false, options);
            }

            // Set element
            if (this._domElement) {
                this._domElement.classList.add('node-disabled');
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_DISABLED, options);
        }
        else {

            // Set node state to enabled
            this.state.disabled = false;

            // Set element
            if (this._domElement) {
                this._domElement.classList.remove('node-disabled');
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_DISABLED, options);
        }
    };

    /**
     * This function creates the _domCheckbox element and add it to the dom if a checkbox should be shown
     */
    _addCheckbox (): void {
        if (this._options.showCheckbox && (this.hideCheckbox === undefined || this.hideCheckbox === false)) {
            this._domCheckbox = Template.icon.check.cloneNode(true) as HTMLElement

            this._domElement.append(this._domCheckbox);
        }
    }

    /**
     * This function creates the _domIcon element and add it to the dom if an icon should be shown
     */
    _addIcon (): void {
        if (this._options.showIcon && !(this._options.showImage && this.image)) {
            this._domIcon = Template.icon.node.cloneNode(true) as HTMLElement;
            this._domIcon.classList.add(...(this.icon || this._options.nodeIcon).split(" "));

            this._domElement.append(this._domIcon);
        }
    }

    _addImage (): void {
        if (this._options.showImage && this.image) {
            this._domImage = Template.image.cloneNode(true) as HTMLElement;
            this._domImage.classList.add('node-image');
            this._domImage.style.backgroundImage = "url('" + this.image + "')";


            this._domElement.append(this._domImage);
        }
    }

    setSearchResult (state: boolean, options: BSTreeViewEventOptions|Record<string, unknown> = new BSTreeViewEventOptions()) {
        options = new BSTreeViewEventOptions(options);

        if (!options._force && state === this.searchResult) return;

        if (state) {
            this.searchResult = true;

            if (this._domElement) {
                this._domElement.classList.add('node-result');
            }
        }
        else {

            this.searchResult = false;

            if (this._domElement) {
                this._domElement.classList.remove('node-result');
            }
        }
    };

}

