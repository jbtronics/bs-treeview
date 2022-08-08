import BSTreeViewOptions from "../BSTreeViewOptions";

export default interface BSTreeViewTheme {
    getOptions(): Partial<BSTreeViewOptions>;
}
