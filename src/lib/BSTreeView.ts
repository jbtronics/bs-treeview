import BSTreeSearchOptions from "./BSTreeSearchOptions";
import BSTreeViewDisableOptions from "./BSTreeViewDisableOptions";
import {
    EVENT_DESTROYED,
    EVENT_INITIALIZED,
    EVENT_LOADING,
    EVENT_LOADING_FAILED,
    EVENT_NODE_CHECKED,
    EVENT_NODE_COLLAPSED,
    EVENT_NODE_DISABLED,
    EVENT_NODE_ENABLED,
    EVENT_NODE_EXPANDED,
    EVENT_NODE_RENDERED,
    EVENT_NODE_SELECTED,
    EVENT_NODE_UNCHECKED,
    EVENT_NODE_UNSELECTED,
    EVENT_RENDERED,
    EVENT_SEARCH_CLEARED,
    EVENT_SEARCH_COMPLETED,
} from "./BSTreeViewEventNames";
import BSTreeViewExpandOptions from "./BSTreeViewExpandOptions";
import BSTreeViewMethodOptions from "./BSTreeViewMethodOptions";
import {default as BSTreeViewNode} from "./BSTreeViewNode";
import BSTreeViewOptions from "./BSTreeViewOptions";
import BSTreeViewSelectOptions from "./BSTreeViewSelectOptions";
import Template from "./BSTreeViewTemplate";
import BSTreeViewTheme from "./themes/BSTreeViewTheme";

/** @private @internal The class names which are added to the main wrapper */
const BASE_CLASS = 'treeview';

/**
 * This class allows to create and represent the TreeView element.
 */
export default class BSTreeView
{
    /**
     * @private
     * @internal
     */
    _css = '.treeview .list-group-item{cursor:pointer}.treeview span.indent{margin-left:10px;margin-right:10px}.treeview span.icon{width:12px;margin-right:5px}.treeview .node-disabled{color:silver;cursor:not-allowed}'


    /**
     * @private
     * @internal
     * @param {HTMLElement} The HTMLElement this tree applies to
     */
    _element: HTMLElement;

    /**
     * @private
     * @internal
     * The wrapper in which the tree resides (normally an <ul> element)
     */
    _wrapper: HTMLElement|null;

    /**
     * {string}
     * @private
     * @internal
     */
    _elementId: string;

    /**
     * @private
     * @internal
     */
    _styleId: string;

    /**
     * The hierachically tree of nodes
     * @private
     * @internal
     */
    _tree: BSTreeViewNode[];

    /**
     * A flat list representation of all nodes (unsorted)
     * @private
     * @internal
     */
    _nodes: Map<string, BSTreeViewNode>;

    /**
     * A flat list representation of all nodes, sorted by their nodeId, which gives you the render order
     * @private
     * @internal
     */
    _orderedNodes: Map<string, BSTreeViewNode>;

    /**
     * @private
     * @internal
     */
    _checkedNodes: BSTreeViewNode[];

    /**
     * Whether this treeview was already initialized
     * @private
     * @internal
     */
    _initialized: boolean;

    /**
     * The options used to initialize this treeView
     * @private
     * @internal
     */
    _options: BSTreeViewOptions;

    /**
     * Create a new treeView inside of the given element
     * @param element The elements in which the tree will be rendered
     * @param options The options for the tree, the data is passed here too
     * @param themes Optional themes to apply to the tree
     */
    constructor(element: HTMLElement, options: BSTreeViewOptions|Partial<BSTreeViewOptions>, themes?: BSTreeViewTheme[])
    {
        this._element = element;
        this._elementId = element.id ?? "bs-treeview-" + Math.floor(Math.random() * 1000000);
        this._styleId = this._elementId + '-style';

        //Apply the presets of the thmes if any are defined
        if(themes) {
            const tmp = new BSTreeViewOptions();
            for(const theme of themes) {
                Object.assign(tmp, theme.getOptions());
            }
            options = Object.assign(tmp, options);
        }


        this._init(options);
    }

    /**
     * Initialize the treeView using the given options
     * @private
     * @internal
     * @param options
     */
    _init (options: BSTreeViewOptions|Partial<BSTreeViewOptions>)
    {
        this._tree = [];
        this._initialized = false;

        //If options is a BSTreeViewOptions object, we can use it directly
        if(options instanceof BSTreeViewOptions) {
            this._options = options;
        } else {
            //Otherwise we have to apply our options object on it
            this._options = new BSTreeViewOptions(options);
        }

        // Cache empty icon DOM template
        Template.icon.empty.classList.add(...this._options.emptyIcon.split(" "));

        this._destroy();
        this._subscribeEvents();

        this._triggerEvent(EVENT_LOADING, null, new BSTreeViewMethodOptions({silent: true}));
        this._load(this._options)
            .then((data) => {
                if (!data) {
                    throw new Error("No data provided!");
                }

                //Parse the returned data
                this._tree = data.map((dataNode) => BSTreeViewNode.fromData(dataNode, this));

                //Update our internal representation of the tree
                this._updateFlatTreeMaps();

                //Render the tree
                this._render();

                //Trigger the initialized event
                this._triggerEvent(EVENT_INITIALIZED, Array.from(this._orderedNodes.values()), new BSTreeViewMethodOptions());

            })
            .catch((error) => {
                // load fail
                this._triggerEvent(EVENT_LOADING_FAILED, error, new BSTreeViewMethodOptions());
                throw error;
            })
        ;
    }

    /**
     * Asynchronously load the data for the tree, depending on the settings
     * @private
     * @internal
     * @param options
     */
    _load (options: BSTreeViewOptions): Promise<Partial<BSTreeViewNode>[]> {
        if (options.data) {
            return this._loadLocalData(options);
        } else if (options.ajaxURL) {
            return this._loadRemoteData(options);
        }
        throw new Error("No data source defined.");
    }

    /**
     * Asynchronously load the data from a network source using fetch
     * @private
     * @internal
     * @param options
     */
    _loadRemoteData (options: BSTreeViewOptions): Promise<Partial<BSTreeViewNode>[]> {
        return new Promise((resolve, reject) => {
            fetch(options.ajaxURL, options.ajaxConfig).then((response) => {
                resolve(response.json());
            })
                .catch((error) => reject(error));
        });
    }

    /**
     * Asynchronously load the data from the data property passed as options
     * @param options
     * @private
     * @internal
     */
    _loadLocalData (options: BSTreeViewOptions): Promise<Partial<BSTreeViewNode>[]> {
        return new Promise((resolve, reject) => {
            //if options.data is a string we need to JSON decode it first
            if (typeof options.data === 'string') {
                try {
                    resolve(JSON.parse(options.data));
                } catch (error) {
                    reject(error);
                }
            } else {
                resolve(options.data);
            }
        });
    };

    /**
     * Destroys and remove this treeView from the DOM
     */
    remove () {
        this._destroy();
        const styleElement = document.getElementById(this._styleId);
        styleElement.remove();
    };

    /**
     * Destroy this instance
     * @private
     * @internal
     */
    _destroy () {
        if (!this._initialized) return;
        this._initialized = false;

        this._triggerEvent(EVENT_DESTROYED, null, new BSTreeViewMethodOptions());

        // Switch off events
        this._unsubscribeEvents();

        // Tear down
        this._wrapper.remove();
        this._wrapper = null;
    };

    /**
     * Unsubscribe the events for this treeView.
     * This includes the onEvent listeners passed by options and the click handler
     * @private
     * @internal
     */
    _unsubscribeEvents () {
        if (typeof (this._options.onLoading) === 'function') {
            this._element.removeEventListener(EVENT_LOADING, this._options.onLoading);
        }

        if (typeof (this._options.onLoadingFailed) === 'function') {
            this._element.removeEventListener(EVENT_LOADING_FAILED, this._options.onLoadingFailed);
        }

        if (typeof (this._options.onInitialized) === 'function') {
            this._element.removeEventListener(EVENT_INITIALIZED, this._options.onInitialized);
        }

        if (typeof (this._options.onNodeRendered) === 'function') {
            this._element.removeEventListener(EVENT_NODE_RENDERED, this._options.onNodeRendered);
        }

        if (typeof (this._options.onRendered) === 'function') {
            this._element.removeEventListener(EVENT_RENDERED, this._options.onRendered);
        }

        if (typeof (this._options.onDestroyed) === 'function') {
            this._element.removeEventListener(EVENT_DESTROYED, this._options.onDestroyed);
        }

        this._element.removeEventListener('click', this._clickHandler.bind(this));

        if (typeof (this._options.onNodeChecked) === 'function') {
            this._element.removeEventListener(EVENT_NODE_CHECKED, this._options.onNodeChecked);
        }

        if (typeof (this._options.onNodeCollapsed) === 'function') {
            this._element.removeEventListener(EVENT_NODE_COLLAPSED, this._options.onNodeCollapsed);
        }

        if (typeof (this._options.onNodeDisabled) === 'function') {
            this._element.removeEventListener(EVENT_NODE_DISABLED, this._options.onNodeDisabled);
        }

        if (typeof (this._options.onNodeEnabled) === 'function') {
            this._element.removeEventListener(EVENT_NODE_ENABLED, this._options.onNodeEnabled);
        }

        if (typeof (this._options.onNodeExpanded) === 'function') {
            this._element.removeEventListener(EVENT_NODE_EXPANDED, this._options.onNodeExpanded);
        }

        if (typeof (this._options.onNodeSelected) === 'function') {
            this._element.removeEventListener(EVENT_NODE_SELECTED, this._options.onNodeSelected);
        }

        if (typeof (this._options.onNodeUnchecked) === 'function') {
            this._element.removeEventListener(EVENT_NODE_UNCHECKED, this._options.onNodeUnchecked);
        }

        if (typeof (this._options.onNodeUnselected) === 'function') {
            this._element.removeEventListener(EVENT_NODE_UNSELECTED, this._options.onNodeUnselected);
        }

        if (typeof (this._options.onSearchComplete) === 'function') {
            this._element.removeEventListener(EVENT_SEARCH_COMPLETED, this._options.onSearchComplete);
        }

        if (typeof (this._options.onSearchCleared) === 'function') {
            this._element.removeEventListener(EVENT_SEARCH_CLEARED, this._options.onSearchCleared);
        }
    };

    /**
     * Subscribe the events for this treeView.
     * This includes the onEvent listeners passed by options and the click handler
     * @private
     * @internal
     */
    _subscribeEvents () {
        this._unsubscribeEvents();

        if (typeof (this._options.onLoading) === 'function') {
            this._element.addEventListener(EVENT_LOADING, this._options.onLoading);
        }

        if (typeof (this._options.onLoadingFailed) === 'function') {
            this._element.addEventListener(EVENT_LOADING_FAILED, this._options.onLoadingFailed);
        }

        if (typeof (this._options.onInitialized) === 'function') {
            this._element.addEventListener(EVENT_INITIALIZED, this._options.onInitialized);
        }

        if (typeof (this._options.onNodeRendered) === 'function') {
            this._element.addEventListener(EVENT_NODE_RENDERED, this._options.onNodeRendered);
        }

        if (typeof (this._options.onRendered) === 'function') {
            this._element.addEventListener(EVENT_RENDERED, this._options.onRendered);
        }

        if (typeof (this._options.onDestroyed) === 'function') {
            this._element.addEventListener(EVENT_DESTROYED, this._options.onDestroyed);
        }

        this._element.addEventListener('click', this._clickHandler.bind(this));

        if (typeof (this._options.onNodeChecked) === 'function') {
            this._element.addEventListener(EVENT_NODE_CHECKED, this._options.onNodeChecked);
        }

        if (typeof (this._options.onNodeCollapsed) === 'function') {
            this._element.addEventListener(EVENT_NODE_COLLAPSED, this._options.onNodeCollapsed);
        }

        if (typeof (this._options.onNodeDisabled) === 'function') {
            this._element.addEventListener(EVENT_NODE_DISABLED, this._options.onNodeDisabled);
        }

        if (typeof (this._options.onNodeEnabled) === 'function') {
            this._element.addEventListener(EVENT_NODE_ENABLED, this._options.onNodeEnabled);
        }

        if (typeof (this._options.onNodeExpanded) === 'function') {
            this._element.addEventListener(EVENT_NODE_EXPANDED, this._options.onNodeExpanded);
        }

        if (typeof (this._options.onNodeSelected) === 'function') {
            this._element.addEventListener(EVENT_NODE_SELECTED, this._options.onNodeSelected);
        }

        if (typeof (this._options.onNodeUnchecked) === 'function') {
            this._element.addEventListener(EVENT_NODE_UNCHECKED, this._options.onNodeUnchecked);
        }

        if (typeof (this._options.onNodeUnselected) === 'function') {
            this._element.addEventListener(EVENT_NODE_UNSELECTED, this._options.onNodeUnselected);
        }

        if (typeof (this._options.onSearchComplete) === 'function') {
            this._element.addEventListener(EVENT_SEARCH_COMPLETED, this._options.onSearchComplete);
        }

        if (typeof (this._options.onSearchCleared) === 'function') {
            this._element.addEventListener(EVENT_SEARCH_CLEARED, this._options.onSearchCleared);
        }
    };

    /**
     * Trigger the given event type on the global DOM element using the options
     * @private
     * @internal
     * @param eventType The event type to trigger
     * @param data The data which is passed as detail.data
     * @param options
     */
    _triggerEvent (eventType: string, data: BSTreeViewNode[]|BSTreeViewNode, options: BSTreeViewMethodOptions = null) {
        if (options && !options.silent) {
            const event = new CustomEvent(eventType, { bubbles: true, detail: {data: data, eventOptions: options, treeView: this} });

            this._element.dispatchEvent(event);
        }
    }

    /**
     * Call this function after changes to the tree have been made to regenerate the flat structures
     * @private
     * @internal
     */
    _updateFlatTreeMaps(): void
    {
        //We start with a empty map, as nodes are re-registered later
        this._nodes = new Map<string, BSTreeViewNode>();

        //Create an virtual root node, which is used to initialize the real root nodes, by calling _updateChildrenHierachy
        const virtual_root = new BSTreeViewNode(this);
        //Virtual root is the only node with no parent
        virtual_root._level = 0;
        virtual_root.nodes = this._tree;

        //Initialize all nodes of our tree and register them to the flat map
        virtual_root._updateChildrenHierarchy();

        /** Create the sorted version of the flat map */
        this._orderedNodes = this._sortNodes(this._nodes);
        // Update checkbox changes
        this._inheritCheckboxChanges();
    }


    /**
     * Register the given node at this tree view. This is called in BSTreeViewNode::_updateChildHierachy
     * @param node
     * @private
     * @internal
     */
    _registerNode(node: BSTreeViewNode): void
    {
        this._nodes.set(node._nodeId, node);
    }

    /**
     * Sort a unsorted flat represenation of the tree by their nodeId.
     * This gives an flat list in the order which can be rendered
     * @private
     * @internal
     * @param nodes
     */
    _sortNodes (nodes: Map<string, BSTreeViewNode>): Map<string, BSTreeViewNode> {
        return new Map([...nodes].sort((pairA, pairB) => {
            //Index 0 of our pair variables contains the index of our map

            if (pairA[0] === pairB[0]) return 0;
            const a = pairA[0].split('.').map(function (level) { return parseInt(level); });
            const b = pairB[0].split('.').map(function (level) { return parseInt(level); });

            const c = Math.max(a.length, b.length);
            for (let i=0; i<c; i++) {
                if (a[i] === undefined) return -1;
                if (b[i] === undefined) return +1;
                if (a[i] - b[i] > 0) return +1;
                if (a[i] - b[i] < 0) return -1;
            }

            throw new Error("Unable to sort nodes");
        }));
    };

    /**
     * This function is called when a node is clicked. The respective action is triggered depending on the type of the event target
     * @private
     * @internal
     * @param event
     */
    _clickHandler (event: Event) {
        const target = event.target as HTMLElement;
        const node = this._domToNode(target);
        if (!node || node.state.disabled) return;

        const classList = target.classList;
        if (classList.contains('expand-icon')) {
            node.toggleExpanded();
        }
        else if (classList.contains('check-icon')) {
            if (node.checkable) {
                node.toggleChecked();
            }
        }
        else {
            if (node.selectable) {
                node.toggleSelected();
            } else {
                node.toggleExpanded();
            }
        }
    };

    /**
     * This function updates the list of checked nodes (see this._checkedNodes)
     * @private
     * @internal
     */
    _inheritCheckboxChanges (): void {
        if (this._options.showCheckbox && this._options.highlightChanges) {
            this._checkedNodes = [];
            this._orderedNodes.forEach((node) => {
                if(node.state.checked) {
                    this._checkedNodes.push(node);
                }
            });
        }
    };

    /**
     * Looks up the DOM for the closest parent list item to retrieve the
     * data attribute nodeid, which is used to lookup the node in the flattened structure.
     * @private
     * @internal
     * @param target The element that should be searched for
     */
    _domToNode (target: HTMLElement): BSTreeViewNode {
        const nodeElement = target.closest('li.list-group-item') as HTMLElement;
        const nodeId = nodeElement.dataset.nodeId;
        const node = this._nodes.get(nodeId);
        if (!node) {
            console.warn('Error: node does not exist');
        }
        return node;
    };


    /**
     * Render the treeview and trigger EVENT_TRIGGERED at the end
     * @private
     * @internal
     */
    _render(): void {
        if (!this._initialized) {

            // Setup first time only components
            this._wrapper = Template.tree.cloneNode(true) as HTMLElement;
            //Empty this element
            while(this._element.firstChild) {
                this._element.removeChild(this._element.firstChild);
            }


            this._element.classList.add(...BASE_CLASS.split(" "))
            this._element.appendChild(this._wrapper);

            this._injectStyle();

            this._initialized = true;
        }

        //let previousNode: BSTreeViewNode|null = null;
        this._orderedNodes.forEach((node) => {
            const nodeElement = node._renderNode();

            //Append our node to the wrapper to really show it in the DOM
            this._wrapper.appendChild(nodeElement);
        });

        this._triggerEvent(EVENT_RENDERED, Array.from(this._orderedNodes.values()), new BSTreeViewMethodOptions());
    };

    /**
     * Inject the inline style elements into the head
     * @private
     * @internal
     */
    _injectStyle (): void {
        if (this._options.injectStyle && !document.getElementById(this._styleId)) {
            const styleElement = document.createElement('style');
            styleElement.id = this._styleId;
            styleElement.type='text/css';
            styleElement.innerHTML = this._buildStyle();
            document.head.appendChild(styleElement);
        }
    };

    /**
     * Construct the tree style CSS based on user options
     * @private
     * @internal
     */
    _buildStyle () {
        let style = '.node-' + this._elementId + '{';

        // Basic bootstrap style overrides
        if (this._options.color) {
            style += 'color:' + this._options.color + ';';
        }

        if (this._options.backColor) {
            style += 'background-color:' + this._options.backColor + ';';
        }

        if (!this._options.showBorder) {
            style += 'border:none;';
        }
        else if (this._options.borderColor) {
            style += 'border:1px solid ' + this._options.borderColor + ';';
        }
        style += '}';

        if (this._options.onhoverColor) {
            style += '.node-' + this._elementId + ':not(.node-disabled):hover{' +
                'background-color:' + this._options.onhoverColor + ';' +
                '}';
        }

        // Style search results
        if (this._options.highlightSearchResults && (this._options.searchResultColor || this._options.searchResultBackColor)) {

            let innerStyle = ''
            if (this._options.searchResultColor) {
                innerStyle += 'color:' + this._options.searchResultColor + ';';
            }
            if (this._options.searchResultBackColor) {
                innerStyle += 'background-color:' + this._options.searchResultBackColor + ';';
            }

            style += '.node-' + this._elementId + '.node-result{' + innerStyle + '}';
            style += '.node-' + this._elementId + '.node-result:hover{' + innerStyle + '}';
        }

        // Style selected nodes
        if (this._options.highlightSelected && (this._options.selectedColor || this._options.selectedBackColor)) {

            let innerStyle = ''
            if (this._options.selectedColor) {
                innerStyle += 'color:' + this._options.selectedColor + ';';
            }
            if (this._options.selectedBackColor) {
                innerStyle += 'background-color:' + this._options.selectedBackColor + ';';
            }

            style += '.node-' + this._elementId + '.node-selected{' + innerStyle + '}';
            style += '.node-' + this._elementId + '.node-selected:hover{' + innerStyle + '}';
        }

        // Style changed nodes
        if (this._options.highlightChanges) {
            const innerStyle = 'color: ' + this._options.changedNodeColor + ';';
            style += '.node-' + this._elementId + '.node-check-changed{' + innerStyle + '}';
        }

        // Node level style overrides
        this._orderedNodes.forEach((node) => {
            if (node.color || node.backColor) {
                let innerStyle = '';
                if (node.color) {
                    innerStyle += 'color:' + node.color + ';';
                }
                if (node.backColor) {
                    innerStyle += 'background-color:' + node.backColor + ';';
                }
                style += '.node-' + this._elementId + '[data-nodeId="' + node._nodeId + '"]{' + innerStyle + '}';
            }

            if (node.iconColor) {
                const innerStyle = 'color:' + node.iconColor + ';';
                style += '.node-' + this._elementId + '[data-nodeId="' + node._nodeId + '"] .node-icon{' + innerStyle + '}';
            }
        });

        return this._css + style;
    };

    /**
     Returns an array of matching node objects.
     @param {String} pattern - A pattern to match against a given field
     @return {String} field - Field to query pattern against
     */
    findNodes (pattern: string, field: string): BSTreeViewNode[] {
        return this._findNodes(pattern, field);
    };


    /**
     Returns an ordered aarray of node objects.
     @return {Array} nodes - An array of all nodes
     */
    getNodes (): Map<string, BSTreeViewNode> {
        return this._orderedNodes;
    };

    /**
     Returns parent nodes for given nodes, if valid otherwise returns undefined.
     @param {Array} nodes - An array of nodes
     @returns {Array} nodes - An array of parent nodes
     */
    getParents (nodes: BSTreeViewNode[]|BSTreeViewNode): BSTreeViewNode[] {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        const parentNodes = [];
        nodes.forEach((node) => {
            parentNodes.push(node._parentNode);
        });
        return parentNodes;
    };

    /**
     Returns an array of sibling nodes for given nodes, if valid otherwise returns undefined.
     @param {Array} nodes - An array of nodes
     @returns {Array} nodes - An array of sibling nodes
     */
    getSiblings (nodes: BSTreeViewNode[]|BSTreeViewNode): BSTreeViewNode[] {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        let siblingNodes = [];
        nodes.forEach((node) => {
            const parent = this.getParents([node]);
            const nodes = parent[0] ? parent[0].nodes : this._tree;
            siblingNodes = nodes.filter(function (obj) {
                return obj._nodeId !== node._nodeId;
            });
        });

        // flatten possible nested array before returning
        return siblingNodes.map((obj) => {
            return obj;
        });
    };

    /**
     Returns an array of selected nodes.
     @returns {Array} nodes - Selected nodes
     */
    getSelected (): BSTreeViewNode[] {
        return this._findNodes('true', 'state.selected');
    };

    /**
     Returns an array of unselected nodes.
     @returns {Array} nodes - Unselected nodes
     */
    getUnselected (): BSTreeViewNode[] {
        return this._findNodes('false', 'state.selected');
    };

    /**
     Returns an array of expanded nodes.
     @returns {Array} nodes - Expanded nodes
     */
    getExpanded (): BSTreeViewNode[] {
        return this._findNodes('true', 'state.expanded');
    };

    /**
     Returns an array of collapsed nodes.
     @returns {Array} nodes - Collapsed nodes
     */
    getCollapsed (): BSTreeViewNode[] {
        return this._findNodes('false', 'state.expanded');
    };

    /**
     Returns an array of checked nodes.
     @returns {Array} nodes - Checked nodes
     */
    getChecked (): BSTreeViewNode[] {
        return this._findNodes('true', 'state.checked');
    };

    /**
     Returns an array of unchecked nodes.
     @returns {Array} nodes - Unchecked nodes
     */
    getUnchecked (): BSTreeViewNode[] {
        return this._findNodes('false', 'state.checked');
    };

    /**
     Returns an array of disabled nodes.
     @returns {Array} nodes - Disabled nodes
     */
    getDisabled (): BSTreeViewNode[] {
        return this._findNodes('true', 'state.disabled');
    };

    /**
     Returns an array of enabled nodes.
     @returns {Array} nodes - Enabled nodes
     */
    getEnabled (): BSTreeViewNode[] {
        return this._findNodes('false', 'state.disabled');
    };


    /**
     Add nodes to the tree, at the specified position of parent
     @param {Array} nodes  - An array of nodes to add
     @param {optional Object} parentNode  - The node to which nodes will be added as children. Set null if it should be added to the root.
     @param {optional number} index  - Zero based insert index, where the node will be inserted. If not specified, the node will be added to the end of the list.
     @param {optional Object} options
     */
    addNode (nodes: BSTreeViewNode[]|BSTreeViewNode, parentNode: BSTreeViewNode|null = null, index: number = null, options: Partial<BSTreeViewMethodOptions> = new BSTreeViewMethodOptions()) {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        if (parentNode instanceof Array) {
            parentNode = parentNode[0];
        }

        // identify target nodes; either the tree's root or a parent's child nodes
        let targetNodes;
        if (parentNode && parentNode.hasChildren()) {
            targetNodes = parentNode.nodes;
        } else if (parentNode) {
            targetNodes = parentNode.nodes = [];
        } else {
            targetNodes = this._tree;
        }

        // inserting nodes at specified positions
        nodes.forEach((node, i) => {
            const insertIndex = (typeof(index) === 'number') ? (index + i) : (targetNodes.length + 1);
            targetNodes.splice(insertIndex, 0, node);
        });

        // Update the flat representation of the tree
        this._updateFlatTreeMaps();

        // The parent node of the added nodes gets expanded if it is not already expanded
        if (parentNode && !parentNode.state.expanded) {
            parentNode.setExpanded(true, options);
        }

        this._render();
    }

    /**
     Add nodes to the tree after given node.
     @param {Array} nodes  - An array of nodes to add
     @param {Object} node  - The node to which nodes will be added after
     @param {optional Object} options
     */
    addNodeAfter (nodes: BSTreeViewNode[]|BSTreeViewNode, node: BSTreeViewNode, options: Partial<BSTreeViewMethodOptions> = new BSTreeViewMethodOptions()) {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        if (node instanceof Array) {
            node = node[0];
        }

        this.addNode(nodes, this.getParents(node)[0], (node._index + 1), options);
    }

    /**
     Add nodes to the tree before given node.
     @param {Array} nodes  - An array of nodes to add
     @param {Object} node  - The node to which nodes will be added before
     @param {optional Object} options
     */
    addNodeBefore (nodes: BSTreeViewNode[]|BSTreeViewNode, node: BSTreeViewNode, options: Partial<BSTreeViewMethodOptions> = new BSTreeViewMethodOptions()) {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        if (node instanceof Array) {
            node = node[0];
        }

        this.addNode(nodes, this.getParents(node)[0], node._index, options);
    }

    /**
     Removes given nodes from the tree.
     @param {Array} nodes  - An array of nodes to remove
     @param {optional Object} options
     */
    removeNode (nodes: BSTreeViewNode[]|BSTreeViewNode, _options: Partial<BSTreeViewMethodOptions> = new BSTreeViewMethodOptions()) {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        let targetNodes: BSTreeViewNode[];
        let parentNode: BSTreeViewNode;
        nodes.forEach((node) => {

            // remove nodes from tree
            parentNode = this._nodes.get(node.parentId);
            if (parentNode) {
                targetNodes = parentNode.nodes;
            } else {
                targetNodes = this._tree;
            }
            targetNodes.splice(node._index, 1);

            // remove node from DOM
            node._removeNodeEl();
        });

        // Update the flat representation of the tree and rerender it
        this._updateFlatTreeMaps();
        this._render();
    };

    /**
     Updates / replaces a given tree node
     @param {Object} node  - A single node to be replaced
     @param {Object} newNode  - THe replacement node
     @param {optional Object} _options
     */
    updateNode (node: BSTreeViewNode, newNode: BSTreeViewNode, _options: Partial<BSTreeViewMethodOptions> = new BSTreeViewMethodOptions()) {
        if (node instanceof Array) {
            node = node[0];
        }

        // insert new node
        let targetNodes;
        const parentNode = this._nodes.get(node.parentId);
        if (parentNode) {
            targetNodes = parentNode.nodes;
        } else {
            targetNodes = this._tree;
        }
        targetNodes.splice(node._index, 1, newNode);

        // remove old node from DOM
        node._removeNodeEl();

        // Update the flat representation of the tree and rerender it
        this._updateFlatTreeMaps();
        this._render();
    };


    /**
     Selects given tree nodes
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    selectNode (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewSelectOptions> = new BSTreeViewSelectOptions()) {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            node.setSelected(true, options);
        });
    };

    /**
     Unselects given tree nodes
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    unselectNode (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewSelectOptions> = new BSTreeViewSelectOptions()) {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }


        nodes.forEach((node) => {
            node.setSelected(false, options);
        });
    };

    /**
     Toggles a node selected state; selecting if unselected, unselecting if selected.
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    toggleNodeSelected (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewSelectOptions> = new BSTreeViewSelectOptions()) {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            node.toggleSelected(options);
        }, this);
    };


    /**
     Collapse all tree nodes
     @param {optional Object} options
     */
    collapseAll (options: Partial<BSTreeViewExpandOptions> = new BSTreeViewExpandOptions()) {
        options.levels = options.levels || 999;
        this.collapseNode(this._tree, options);
    };

    /**
     Collapse a given tree node
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    collapseNode (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewExpandOptions> = new BSTreeViewExpandOptions()): void {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            node.setExpanded(false, options);
        });
    };

    /**
     Expand all tree nodes
     @param {optional Object} options
     */
    expandAll (options: Partial<BSTreeViewExpandOptions> = new BSTreeViewExpandOptions()): void {
        options.levels = options.levels || 999;
        this.expandNode(this._tree, options);
    };

    /**
     Expand given tree nodes
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    expandNode (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewExpandOptions> = new BSTreeViewExpandOptions()) {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            // Do not re-expand already expanded nodes
            if (node.state.expanded) return;

            if (typeof(this._options.lazyLoad) === 'function' && node.lazyLoad) {
                node._lazyLoad();
            }

            node.setExpanded( true, options);
            if (node.nodes) {
                this._expandLevels(node.nodes, options.levels-1, options);
            }
        });
    };

    /**
     * Expands the given nodes by the given number of levels
     * @private
     * @internal
     * @param
     * @param nodes
     * @param level
     * @param options
     */
    _expandLevels (nodes: BSTreeViewNode[]|BSTreeViewNode, level: number, options: Partial<BSTreeViewExpandOptions> = new BSTreeViewExpandOptions()): void {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            node.setExpanded((level > 0), options);
            if (node.nodes) {
                this._expandLevels(node.nodes, level-1, options);
            }
        });
    };

    /**
     Reveals given tree nodes, expanding the tree from node to root.
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    revealNode (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewExpandOptions> = new BSTreeViewExpandOptions()): void {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            let parentNode = node;
            while (parentNode._parentNode) {
                parentNode = parentNode._parentNode;
                parentNode.setExpanded(true, options);
            }
        });
    };

    /**
     Toggles a node's expanded state; collapsing if expanded, expanding if collapsed.
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    toggleNodeExpanded (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewExpandOptions> = new BSTreeViewExpandOptions()): void {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            node.toggleExpanded(options);
        });

    };


    /**
     Check all tree nodes
     @param {optional Object} options
     */
    checkAll (options: Partial<BSTreeViewMethodOptions> = new BSTreeViewMethodOptions()): void {
        this._orderedNodes.forEach((node) => {
            if(!node.state.checked) {
                node.setChecked(true, options);
            }
        });
    };

    /**
     Checks given tree nodes
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    checkNode (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewMethodOptions> = new BSTreeViewMethodOptions()): void {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            node.setChecked(true, options);
        });
    };

    /**
     Uncheck all tree nodes
     @param {optional Object} options
     */
    uncheckAll (options: Partial<BSTreeViewMethodOptions> = new BSTreeViewMethodOptions()): void {
        this._orderedNodes.forEach((node) => {
            if(node.state.checked || node.state.checked === undefined) {
                node.setChecked( false, options);
            }
        });
    };

    /**
     Uncheck given tree nodes
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    uncheckNode (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewMethodOptions> = new BSTreeViewMethodOptions()): void {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            node.setChecked( false, options);
        });
    };

    /**
     Toggles a node's checked state; checking if unchecked, unchecking if checked.
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    toggleNodeChecked (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewMethodOptions> = new BSTreeViewMethodOptions()): void {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            node.toggleChecked(options);
        });
    };

    /**
     Saves the current state of checkboxes as default, cleaning up any highlighted changes
     */
    unmarkCheckboxChanges (): void {
        this._inheritCheckboxChanges();

        this._nodes.forEach((node) => {
            node._domElement.classList.remove('node-check-changed');
        });
    };

    /**
     Disable all tree nodes
     @param {optional Object} options
     */
    disableAll (options: Partial<BSTreeViewDisableOptions> = new BSTreeViewDisableOptions()): void {
        const nodes = this._findNodes('false', 'state.disabled');
        nodes.forEach((node) => {
            node.setDisabled(true, options);
        });
    };

    /**
     Disable given tree nodes
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    disableNode (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewDisableOptions> = new BSTreeViewDisableOptions()): void {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            node.setDisabled(true, options);
        });
    };

    /**
     Enable all tree nodes
     @param {optional Object} options
     */
    enableAll (options: Partial<BSTreeViewDisableOptions> = new BSTreeViewDisableOptions()): void {
        const nodes = this._findNodes('true', 'state.disabled');

        nodes.forEach((node) => {
            node.setDisabled(false, options);
        });
    };

    /**
     Enable given tree nodes
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    enableNode (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewDisableOptions> = new BSTreeViewDisableOptions()) {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            node.setDisabled(false, options);
        })
    };

    /**
     Toggles a node's disabled state; disabling is enabled, enabling if disabled.
     @param {Array} nodes - An array of nodes
     @param {optional Object} options
     */
    toggleNodeDisabled (nodes: BSTreeViewNode[]|BSTreeViewNode, options: Partial<BSTreeViewDisableOptions> = new BSTreeViewDisableOptions()): void {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }

        nodes.forEach((node) => {
            node.toggleDisabled(options);
        })
    };


    /**
     Searches the tree for nodes (text) that match given criteria
     @param {String} pattern - A given string to match against
     @param {optional Object} options - Search criteria options
     @return {Array} nodes - Matching nodes
     */
    search (pattern: string, options: Partial<BSTreeSearchOptions> = new BSTreeSearchOptions()): BSTreeViewNode[] {
        const previous = this.getSearchResults();
        let results = [];

        if (pattern && pattern.length > 0) {

            if (options.exactMatch) {
                pattern = '^' + pattern + '$';
            }

            let modifier = 'g';
            if (options.ignoreCase) {
                modifier += 'i';
            }

            results = this._findNodes(pattern, 'text', modifier);
        }

        // Clear previous results no longer matched
        this._diffArray<BSTreeViewNode>(results, previous).forEach((node) => {
            node._setSearchResult(false, options);
        });

        // Set new results
        this._diffArray<BSTreeViewNode>(previous, results).forEach((node) => {
            node._setSearchResult( true, options);
        });

        // Reveal hidden nodes
        if (results && options.revealResults) {
            this.revealNode(results);
        }

        this._triggerEvent(EVENT_SEARCH_COMPLETED, results, new BSTreeViewMethodOptions(options));

        return results;
    };

    /**
     * Clears previous search results
     */
    clearSearch (options: Partial<BSTreeSearchOptions> = new BSTreeSearchOptions()): void {
        const results = this.getSearchResults();
        results.forEach((node) => {
            node._setSearchResult(false, options);
        });

        this._triggerEvent(EVENT_SEARCH_CLEARED, results, new BSTreeSearchOptions(options));
    };

    /**
     * Returns all nodes that were found by the last search
     */
    getSearchResults (): BSTreeViewNode[] {
        return this._findNodes('true', 'searchResult');
    };

    /**
     * @internal
     * @private
     * @param a
     * @param b
     */
    _diffArray<T> (a: Array<T>, b: Array<T>) {
        const diff: Array<T> = [];

        b.forEach((n) => {
            if (a.indexOf(n) === -1) {
                diff.push(n);
            }
        });
        return diff;
    };

    /**
     Find nodes that match a given criteria
     @internal
     @private
     @param {String} pattern - A given string to match against
     @param {optional String} attribute - Attribute to compare pattern against
     @param {optional String} modifier - Valid RegEx modifiers
     @return {Array} nodes - Nodes that match your criteria
     */
    _findNodes (pattern: string, attribute = 'text', modifier= 'g'): BSTreeViewNode[] {

        const tmp = [];

        this._orderedNodes.forEach((node) => {
            const val = this._getNodeValue(node, attribute);
            if (typeof val === 'string') {
                if(val.match(new RegExp(pattern, modifier))) {
                    tmp.push(node);
                }
            }
        });

        return tmp;
    };

    /**
     Recursive find for retrieving nested attributes values
     All values are return as strings, unless invalid
     @private
     @internal
     @param {Object} obj - Typically a node, could be any object
     @param {String} attr - Identifies an object property using dot notation
     @return {String} value - Matching attributes string representation
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    _getNodeValue (obj: object, attr: string): string {
        const index = attr.indexOf('.');
        if (index > 0) {
            const _obj = obj[attr.substring(0, index)];
            const _attr = attr.substring(index + 1, attr.length);
            return this._getNodeValue(_obj, _attr);
        }
        else {
            // eslint-disable-next-line no-prototype-builtins
            if (obj.hasOwnProperty(attr) && obj[attr] !== undefined) {
                return obj[attr].toString();
            }
            else {
                return undefined;
            }
        }
    };

}
