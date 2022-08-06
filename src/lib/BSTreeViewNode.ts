import BSTreeView from "./BSTreeView";
import BSTreeViewDisableOptions from "./BSTreeViewDisableOptions";
import {
    EVENT_NODE_CHECKED,
    EVENT_NODE_COLLAPSED,
    EVENT_NODE_DISABLED,
    EVENT_NODE_EXPANDED,
    EVENT_NODE_SELECTED,
    EVENT_NODE_UNCHECKED,
    EVENT_NODE_UNSELECTED
} from "./BSTreeViewEventNames";
import BSTreeViewEventOptions from "./BSTreeViewEventOptions";
import BSTreeViewNodeState from "./BSTreeViewNodeState";
import BSTreeViewOptions from "./BSTreeViewOptions";
import BSTreeViewSelectOptions from "./BSTreeViewSelectOptions";

export default class BSTreeViewNode {
    text: string;
    icon: string;
    image: string;
    selectedIcon: string;
    color: string;
    backColor: string;
    iconColor: string;
    iconBackground: string;
    selectable: boolean;
    checkable: boolean;
    state: BSTreeViewNodeState;
    tags: string[];
    dataAttr: object;
    id: string;
    class: string;
    hideCheckbox: boolean;
    nodes: BSTreeViewNode[];
    tooltip: string;
    href: string;

    lazyLoad: boolean;
    tagsClass: string;


    el: HTMLElement;

    searchResult: boolean;


    level: number;
    index: number;
    nodeId: string;
    parentId: string

    _options: BSTreeViewOptions;
    _treeView: BSTreeView;

    /**
     * The treeview this node belongs to
     * @param treeView
     */
    constructor(treeView: BSTreeView) {
        this._treeView = treeView;
        this._options = treeView._options;
    }

    /**
     * Create a new node object from partial data object, containing the properties which should be set on the node.
     * This function creates the children nodes objects from the data object recursively.
     * @param data
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
            data.nodes = [];
        }

        return node;
    }

    _triggerEvent (eventType: string, options: BSTreeViewEventOptions = null) {
        if (options && !options.silent) {
            const event = new CustomEvent(eventType, { detail: {data: this, eventOptions: options, treeView: this}, bubbles: true});

            this.el.dispatchEvent(event);
        }
    }

    toggleDisabled(options: BSTreeViewDisableOptions = new BSTreeViewDisableOptions()): this {
        this.setDisabled(!this.state.disabled, options);
        return this;
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
        const span = this.el.querySelector('span.expand-icon');
        span.classList.remove(...this._options.expandIcon.split(' '));
        span.classList.add(...this._options.loadingIcon.split(' '));

        this._options.lazyLoad(this, (nodes) => {
            // Adding the node will expand its parent automatically
            this._treeView.addNode(nodes, this);
        });
        // Only the first expand should do a lazy-load
        this.lazyLoad = false;
    };

    setExpanded (state: boolean, options: BSTreeViewEventOptions = new BSTreeViewEventOptions()): void {

        // We never pass options when rendering, so the only time
        // we need to validate state is from user interaction
        if (options && state === this.state.expanded) return;

        if (state && this.nodes) {

            // Set node state
            this.state.expanded = true;

            // Set element
            if (this.el) {
                const span = this.el.querySelector('span.expand-icon');
                span.classList.remove(...this._options.expandIcon.split(" "))
                span.classList.remove(...this._options.loadingIcon.split(" "))
                span.classList.add(...this._options.collapseIcon.split(" "));
            }

            // Expand children
            if (this.nodes && options) {
                this.nodes.forEach((node) => {
                    node.setVisible(true, options);
                });
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_EXPANDED, options);
        }
        else if (!state) {

            // Set node state
            this.state.expanded = false;

            // Set element
            if (this.el) {
                const span = this.el.querySelector('span.expand-icon');
                span.classList.remove(...this._options.collapseIcon.split(" "));
                span.classList.add(...this._options.expandIcon.split(" "));
            }

            // Collapse children
            if (this.nodes && options) {
                this.nodes.forEach ((node) => {
                    node.setVisible(false, options);
                    node.setExpanded(false, options);
                });
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_COLLAPSED, options);
        }
    };

    setVisible (state: boolean, options: BSTreeViewEventOptions = new BSTreeViewEventOptions()): void {

        if (options && state === this.state.visible) return;

        this.state.visible = state;

        if(this.el) {
            //Add hidden class to our element
            if(state) {
                this.el.classList.remove('node-hidden');
            } else {
                this.el.classList.add('node-hidden');
            }
        }
    };

    toggleSelected (options: BSTreeViewSelectOptions = new BSTreeViewSelectOptions()): this {
        this.setSelected(!this.state.selected, options);
        return this;
    };

    setSelected (state: boolean, options = new BSTreeViewSelectOptions()): this {

        // We never pass options when rendering, so the only time
        // we need to validate state is from user interaction
        if (options && (state === this.state.selected)) return this;

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
            if (this.el) {
                this.el.classList.add('node-selected');

                if (this.selectedIcon || this._options.selectedIcon) {
                    const span = this.el.querySelector('span.node-icon');
                    span.classList.remove(...(this.icon || this._options.nodeIcon).split(" "));
                    span.classList.add(...(this.selectedIcon || this._options.selectedIcon).split(" "));
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
            if (this.el) {
                this.el.classList.remove('node-selected');

                if (this.selectedIcon || this._options.selectedIcon) {
                    const span = this.el.querySelector('span.node-icon');
                    span.classList.remove(...(this.selectedIcon || this._options.selectedIcon).split(" "))
                    span.classList.add(...(this.icon || this._options.nodeIcon).split(" "));
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

            if (this.nodes && this.nodes.length > 0) {
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

    setChecked (state: boolean, options: BSTreeViewEventOptions = new BSTreeViewEventOptions()) {
        // We never pass options when rendering, so the only time
        // we need to validate state is from user interaction
        if (options && state === this.state.checked) return;

        //TODO: Put this responsibility on the treeview using an Event
        // Highlight the node if its checkbox has unsaved changes
        if (this._options.highlightChanges) {
            const nodeNotInCheckList = this._treeView._checkedNodes.indexOf(this) == -1;
            if(nodeNotInCheckList == state) {
                this.el.classList.add('node-check-changed');
            } else {
                this.el.classList.remove('node-check-changed');
            }
        }

        if (state) {

            // Set node state
            this.state.checked = true;

            // Set element
            if (this.el) {
                this.el.classList.add('node-checked');
                this.el.classList.remove('node-checked-partial');
                const span = this.el.querySelector('span.check-icon');
                span.classList.remove(...this._options.uncheckedIcon.split(" "))
                span.classList.remove(...this._options.partiallyCheckedIcon.split(" "))
                span.classList.add(...this._options.checkedIcon.split(" "));
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_CHECKED, options);
        }
        else if (state === null && this._options.hierarchicalCheck) {

            // Set node state to partially checked
            this.state.checked = null;

            // Set element
            if (this.el) {
                this.el.classList.add('node-checked-partial');
                this.el.classList.remove('node-checked');
                const span = this.el.querySelector('span.check-icon');
                span.classList.remove(...this._options.uncheckedIcon.split(" "));
                span.classList.remove(...this._options.checkedIcon.split(" "));
                span.classList.add(...this._options.partiallyCheckedIcon.split(" "));
            }

            // Optionally trigger event, partially checked is technically unchecked
            this._triggerEvent(EVENT_NODE_UNCHECKED, options);
        } else {

            // Set node state to unchecked
            this.state.checked = false;

            // Set element
            if (this.el) {
                this.el.classList.remove('node-checked node-checked-partial');
                const span = this.el.querySelector('span.check-icon');
                span.classList.remove(...this._options.checkedIcon.split(" "));
                span.classList.remove(...this._options.partiallyCheckedIcon.split(" "));
                span.classList.add(...this._options.uncheckedIcon.split(" "));
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_UNCHECKED, options);
        }
    };

    setDisabled (state: boolean, options: BSTreeViewDisableOptions = new BSTreeViewDisableOptions()) {

        // We never pass options when rendering, so the only time
        // we need to validate state is from user interaction
        if (options && state === this.state.disabled) return;

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
            if (this.el) {
                this.el.classList.add('node-disabled');
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_DISABLED, options);
        }
        else {

            // Set node state to enabled
            this.state.disabled = false;

            // Set element
            if (this.el) {
                this.el.classList.remove('node-disabled');
            }

            // Optionally trigger event
            this._triggerEvent(EVENT_NODE_DISABLED, options);
        }
    };

    // Add checkable icon
    _addCheckbox (): void {
        if (this._options.showCheckbox && (this.hideCheckbox === undefined || this.hideCheckbox === false)) {
            this.el
                .append(this._treeView._template.icon.check.cloneNode(true) as HTMLElement);
        }
    }

// Add node icon
    _addIcon (): void {
        if (this._options.showIcon && !(this._options.showImage && this.image)) {
            const template = this._treeView._template.icon.node.cloneNode(true) as HTMLElement;
            template.classList.add(...(this.icon || this._options.nodeIcon).split(" "))

            this.el.append(template);
        }
    }

    _addImage (): void {
        if (this._options.showImage && this.image) {
            const template = this._treeView._template.image.cloneNode(true) as HTMLElement;
            template.classList.add('node-image');
            template.style.backgroundImage = "url('" + this.image + "')";


            this.el.append(template);
        }
    }

    // Expand node, rendering it's immediate children
    _expandNode (): void {
        if (!this.nodes) return;

        this.nodes.slice(0).reverse().forEach((childNode) => {
            childNode.level = this.level + 1;
            this._treeView._renderNode(childNode, this);
        });
    };


    _setSearchResult (state: boolean, options: BSTreeViewEventOptions = new BSTreeViewEventOptions()) {
        if (options && state === this.searchResult) return;

        if (state) {
            this.searchResult = true;

            if (this.el) {
                this.el.classList.add('node-result');
            }
        }
        else {

            this.searchResult = false;

            if (this.el) {
                this.el.classList.remove('node-result');
            }
        }
    };

}

