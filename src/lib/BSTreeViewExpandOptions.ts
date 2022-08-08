import BSTreeViewMethodOptions from "./BSTreeViewMethodOptions";

/**
 * The options for TreeView collapse/expand functions
 */
export default class BSTreeViewExpandOptions extends BSTreeViewMethodOptions
{
    /**
     * The number of levels that should be expanded when expanding a node.
     */
    levels: number = 999;
}
