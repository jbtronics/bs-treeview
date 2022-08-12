import BSTreeViewOptions from '../BSTreeViewOptions';

import BSTreeViewTheme from './BSTreeViewTheme';

/**
 * Use this theme to use Font Awesome icons in the treeview.
 */
class FAIconThemeClass implements BSTreeViewTheme {
    getOptions(): Partial<BSTreeViewOptions> {
        return {
            expandIcon: 'fas fa-plus fa-fw fa-treeview',
            collapseIcon: 'fas fa-minus fa-fw fa-treeview',
            emptyIcon: 'fas fa-treeview fa-fw',
            loadingIcon: 'fas fa-sync fa-spin fa-treeview',
            checkedIcon: 'fas fa-check-square fa-fw fa-treeview',
            uncheckedIcon: 'far fa-square fa-fw fa-treeview',
            partiallyCheckedIcon: 'fas fa-minus-square fa-fw fa-treeview',
        };
    }
}

export default new FAIconThemeClass();
