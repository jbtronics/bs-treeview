/**
 * The options for all kinds of functions in the TreeView
 */
export default class BSTreeViewEventOptions {
    /** If true no events will be triggered by this action */
    silent: boolean = false;
    ignoreChildren: boolean = false;

    lazyLoad: boolean = false;

    /**
     * Force a change of the node state, even if the vaklue is not changed. Mostly useful for internal usage
     * @private
     * @internal
     */
    _force: boolean = false;

    constructor(options: BSTreeViewEventOptions|Record<string, unknown> = null) {
        Object.assign(this, options);
    }
}
