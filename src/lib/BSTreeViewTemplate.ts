function templateElement(
    tagType: string,
    classes: string,
    role: string = null
): HTMLElement {
    const el = document.createElement(tagType);
    if (classes.length > 0) {
        el.classList.add(...classes.split(' '));
    }

    if (role) {
        el.setAttribute('role', role);
    }

    return el;
}

/**
 * This class gives template elements for the tree view.
 * @internal
 * @private
 */
class BSTreeViewTemplate {
    tree = templateElement('ul', 'list-group', 'tree');
    node = templateElement('li', 'list-group-item', 'treeitem');
    indent = templateElement('span', 'indent', 'none');
    icon = {
        node: templateElement('span', 'icon node-icon'),
        expand: templateElement('span', 'icon expand-icon', 'group'),
        check: templateElement('span', 'icon check-icon'),
        empty: templateElement('span', 'icon', 'none'),
    };
    image = templateElement('span', 'image');
    badge = templateElement('span', '');
    text = templateElement('span', 'text');
}

export default new BSTreeViewTemplate();
