export default class BSTreeViewEventOptions {
    silent: boolean = false;
    ignoreChildren: boolean = false;

    lazyLoad: boolean = false;

    /**
     * Force a change of the node state, even if the vaklue is not changed. Mostly useful for internal usage
     * @private
     */
    _force: boolean = false;

    constructor(options: BSTreeViewEventOptions|Record<string, unknown> = null) {
        Object.assign(this, options);
    }
}
