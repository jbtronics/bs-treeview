import BSTreeViewEventOptions from "./BSTreeViewEventOptions";

/**
 * The options for TreeView collapse/expand functions
 */
export default class BSTreeViewExpandOptions extends BSTreeViewEventOptions
{
    /**
     * The number of levels that should be expanded when expanding a node.
     */
    levels: number = 999;
}
