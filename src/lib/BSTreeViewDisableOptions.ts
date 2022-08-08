import BSTreeViewEventOptions from "./BSTreeViewEventOptions";

/**
 * The options for TreeView disable/enable functions
 */
export default class BSTreeViewDisableOptions extends BSTreeViewEventOptions
{
    /** Keep the expanded/checked/selected state on disable? */
    keepState: boolean;
}
