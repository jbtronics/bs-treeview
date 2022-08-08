import BSTreeViewNode from "./BSTreeViewNode";

/**
 * The global options to configure the treeView
 */
export default class BSTreeViewOptions {
    injectStyle: boolean = true;

    /** Sets the number of hierarchical levels deep the tree will be expanded to by default. */
    levels: number = 1;

    /** The data to be displayed on the treeView. Can be either passed as array of nodes / partial node data or a JSON string of the same. Takes presence of ajaxURL */
    data: BSTreeViewNode[]|string = null;
    /** The URL to fetch the data from. fetch() is used to get the data from this url */
    ajaxURL: string = null;
    /** The options to be passed to the fetch() function, when data is fetched from ajaxURL */
    ajaxConfig: RequestInit = {
        method: "GET",
    };

    /** Sets the class name of the icon to be used on an expandable tree node. */
    expandIcon: string = 'glyphicon glyphicon-plus';
    /** Sets the class name of the icon to be used on a collapsible tree node. */
    collapseIcon: string = 'glyphicon glyphicon-minus';
    /** Sets the icon to be used on an a lazyLoad node before its content gets loaded. */
    loadingIcon: string = 'glyphicon glyphicon-hourglass';
    /** Sets the class name of icon to be used on a tree node with no child nodes. */
    emptyIcon: string = 'glyphicon';
    /** Sets the default icon to be used on all nodes, except when overridden on a per node basis in data. */
    nodeIcon: string = '';
    /** Sets the default icon to be used on all selected nodes, except when overridden on a per node basis in data. */
    selectedIcon: string = '';
    /** Sets the class name of the icon to be as a checked checkbox, used in conjunction with showCheckbox. */
    checkedIcon: string = 'glyphicon glyphicon-check';
    /** Sets the class name of icon to be as a partially checked checkbox, used in conjunction with showCheckbox and hierarchicalCheck. */
    partiallyCheckedIcon: string = 'glyphicon glyphicon-expand';
    /** Sets the icon to be as an unchecked checkbox, used in conjunction with showCheckbox. */
    uncheckedIcon: string = 'glyphicon glyphicon-unchecked';
    /** Sets the class of tags to be used on a node. Defaults to 'badge' */
    tagsClass: string = 'badge';

    /** Sets the default foreground color used by all nodes, except when overridden on a per node basis in data. Can be any valid color value */
    color: string = undefined;
    /** Sets the default background color used by all nodes, except when overridden on a per node basis in data. Can be any valid color value */
    backColor: string = undefined;
    /** Sets the border color for the component; set showBorder to false if you don't want a visible border. Can be any valid color value */
    borderColor: string|boolean = undefined;
    /** Sets the text color for a node with a changed checkbox. */
    changedNodeColor: string = '#39A5DC';
    /** Sets the default background color activated when the users cursor hovers over a node. */
    onhoverColor: string = '#F5F5F5';
    /** Sets the foreground color of a selected node. Defaults to black */
    selectedColor: string = '#FFFFFF';
    /** Sets the background color of the selected node. */
    selectedBackColor: string = '#428bca';

    /** Sets the foreground color of a node found during a search result */
    searchResultColor: string = '#D9534F';
    /** Sets the background color of a node found during a search result */
    searchResultBackColor: string = undefined;

    /** Whether or not to highlight the selected node. Default true */
    highlightSelected: boolean = true;
    /** Whether or not to highlight search results. Default false */
    highlightSearchResults: boolean = true;
    /** Whether or not to display a border around nodes. */
    showBorder: boolean = true;
    /** Whether or not to display a nodes icon. Default: true */
    showIcon: boolean = true;
    /** Whether or not to display a nodes image instead of the icon. */
    showImage: boolean = false;
    /** Whether or not to display checkboxes on nodes. */
    showCheckbox: boolean = false;
    /** Swaps the node icon with the checkbox, used in conjunction with showCheckbox. Default false */
    checkboxFirst: boolean = false;
    /** Highlights the nodes with changed checkbox state, used in conjunction with showCheckbox. Default: false */
    highlightChanges: boolean = false;
    /** Whether or not to display tags to the right of each node. The values of which must be provided in the data structure on a per node basis. Default false */
    showTags: boolean = false;
    /** Whether or not multiple nodes can be selected at the same time. Default false */
    multiSelect: boolean = false;
    /** Whether or not a node can be unselected without another node first being selected. Default: false */
    preventUnselect: boolean = false;
    /** Whether or not a node can be reselected when its already selected, used in conjunction with preventUnselect. Default: false */
    allowReselect: boolean = false;
    /** Whether or not to enable hierarchical checking/unchecking of checkboxes. Default false */
    hierarchicalCheck: boolean = false;
    /** Whether or not to propagate nodeChecked and nodeUnchecked events to the parent/child nodes, used in conjunction with hierarchicalCheck. Default false. */
    propagateCheckEvent: boolean = false;
    /** Whether or not to surround the text of the node with a <span class='text'> tag. */
    wrapNodeText: boolean = false;

    // Event handlers
    onLoading: (event: Event) => void = undefined;
    onLoadingFailed: (event: Event) => void = undefined;
    onInitialized: (event: Event) => void = undefined;
    onNodeRendered: (event: Event) => void = undefined;
    onRendered: (event: Event) => void = undefined;
    onDestroyed: (event: Event) => void = undefined;

    onNodeChecked: (event: Event) => void = undefined;
    onNodeCollapsed: (event: Event) => void = undefined;
    onNodeDisabled: (event: Event) => void = undefined;
    onNodeEnabled: (event: Event) => void = undefined;
    onNodeExpanded: (event: Event) => void = undefined;
    onNodeSelected: (event: Event) => void = undefined;
    onNodeUnchecked: (event: Event) => void = undefined;
    onNodeUnselected: (event: Event) => void = undefined;

    onSearchComplete: (event: Event) => void = undefined;
    onSearchCleared: (event: Event) => void = undefined;

    /** This function is called when a lazyly-loadable node is being expanded for the first time.
     *  The node is available as the first argument, while the second argument is a function responsible for passing the loaded data to the renderer.
     *  The data needs to be in the same JSON format as specified above. */
    lazyLoad: (node: BSTreeViewNode, renderer: (nodes: BSTreeViewNode[]) => void) => void = undefined;

    constructor(options: BSTreeViewOptions|object = null) {
        if(options) {
            Object.assign(this, options);
        }
    }
}
