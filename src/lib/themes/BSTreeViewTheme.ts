import BSTreeViewOptions from '../BSTreeViewOptions';

export default interface BSTreeViewTheme {
    /**
     * Return an object with the partial parameters that should override the default ones defined in BSTreeViewOptions.
     */
    getOptions(): Partial<BSTreeViewOptions>;
}
