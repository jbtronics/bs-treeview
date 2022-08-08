function templateElement(tagType: string, classes: string): HTMLElement {
    const el = document.createElement(tagType);
    if(classes.length > 0) {
        el.classList.add(...classes.split(" "));
    }
    return el;
}

/**
 * This class gives template elements for the tree view.
 * @internal
 * @private
 */
class BSTreeViewTemplate {
    tree = templateElement('ul', "list-group");
    node = templateElement("li", "list-group-item");
    indent = templateElement("span", "indent");
    icon = {
        node : templateElement("span", "icon node-icon"),
        expand :  templateElement("span", "icon expand-icon"),
        check : templateElement("span", "icon check-icon"),
        empty :  templateElement("span", "icon")
    };
    image = templateElement("span", "image");
    badge = templateElement("span", "");
    text = templateElement("span", "text");
}

export default new BSTreeViewTemplate();
