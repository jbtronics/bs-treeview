import BSTreeViewMethodOptions from './BSTreeViewMethodOptions';

/**
 * The options for TreeView search() function
 */
export default class BSTreeSearchOptions extends BSTreeViewMethodOptions {
    /** Should the search be case sensitive? */
    ignoreCase = true;
    /** Should the search only find exact matching nodes, or similar ones too? */
    exactMatch = false;
    /** Should the matching nodes be revealed (meaning that their parents will be expanded)? */
    revealResults = true;
}
