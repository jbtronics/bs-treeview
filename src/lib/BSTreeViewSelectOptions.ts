import BSTreeViewMethodOptions from './BSTreeViewMethodOptions';

/**
 * The options for TreeView selection state functions
 */
export default class BSTreeViewSelectOptions extends BSTreeViewMethodOptions {
    /** For internal use
     * @private
     * @internal
     * @deprecated Use ignorePreventUnselect instead
     */
    _unselecting: boolean;

    /**
     * When this is set to true, the node will be unselected even if the
     * preventUnselected option is used on the treeview.
     */
    ignorePreventUnselect: boolean;
}
