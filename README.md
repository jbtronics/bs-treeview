# bs-treeview

A treeview element for browsers using Javascript.
It is based on the bootstrap-treeview libraries of [@jonmiles](https://github.com/jonmiles/bootstrap-treeview) and [@patternfly](https://github.com/patternfly/patternfly-bootstrap-treeview),
but is overhauled with typescript and does not use any jQuery.

## Features
* No dependencies (especially not on jQuery)
* Supports all features of the original libraries (with some minor changes, see below)
* Search function for nodes
* Allows selection of one (or if wanted mutiple) nodes, nodes can be checked or unchecked independently
* Methods to control the treeview and nodes states (expand, collapse, select, deselect, check, uncheck, check all, uncheck all)
* Style each node indepentedly (using different classes, colors, icons, etc.)
* Support for different themes, to fit the CSS framework and icon set you are using
* Improved accessibility by setting the correct `aria-*` tags according [specification](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)

## Dependencies
* A browser supporting ECMAScript 2017 (which should be any browser of the last years)
* [Bootstrap](https://getbootstrap.com/) 4 or 5, and [Font Awesome](https://fontawesome.com/): bs-treeview can be configured to use other frontend frameworks, but this is the default configuration
* A bundler like [webpack](https://webpack.js.org/) is highly recommended

## Usage
1. Import it to your project: `yarn add @jbtronics/bs-treeview`
2. Import the bs-treeview library and the style file (example code for webpack):
```javascript
import {BSTreeView, BS5Theme, FAIconTheme, EVENT_INITIALIZED} from "@jbtronics/bs-treeview";
import "@jbtronics/bs-treeview/src/bs-treeview.css";
```
3. You need some data source to populate the treeview: This could be an object structure, created in javascript, an static JSON string created by your website, 
an endpoint serving an JSON encodes tree structure and so on. See below for an description of the datastructure.
4. Create the treeview element in your DOM:
```html
    <div id="treeview"></div>
```

5. Initialize the treeview element:
```javascript
import {BSTreeView, BS5Theme, FAIconTheme, EVENT_INITIALIZED} from "@jbtronics/bs-treeview";
import "@jbtronics/bs-treeview/src/bs-treeview.css";

//Choose the element on which you want to create the treeview
const treeElement = document.getElementById("treeview");

//The data which will be shown in the treeview. For simplicity we use an object structure, but you can load it from anywhere you want
const data = [
    {
        text: "Parent 1",
        state: {
            expanded: true
        },
        nodes: [
            {
                text: "Child 1",
                nodes: [
                    {
                        text: "Grandchild 1",
                        state: {
                            disabled: true
                        }
                    },
                    {
                        text: "Grandchild 2"
                    }
                ]
            },
            {
                text: "Child 2",
                tags: ["available", "out of stock"]
            }
        ]
    },
    {
        text: "Parent 2"
    }
]
    


//Create the treeview
const tree = new BSTreeView(treeElement, 
    //The options to apply to our treeView
    {
        data: data,
        //You can either use the callback provided in the options element...
        onNodeSelected: (event) => {
            const node = event.detail.node;
            alert("You selected: " + node.text);
        }
        
    },
    //Themes to use for the BSTreeview. We use Bootstrap5 and FontAwesome5
    [BS5Theme, FAIconTheme]
);

//Or attach an event listener to the tree DOM element (The event is triggered on the node and bubbles upwards)
treeElement.addEventListener(EVENT_INITIALIZED, (event) => {
  console.log("The treeview has been initialized");
  treeView.expandAll()
});
```

## Options
You can pass various options to the treeview as the second argument of the constructor, to control the behaviour of the treeview.
See the [documentation](https://jbtronics.github.io/bs-treeview/classes/bstreeviewoptions.html) of `BSTreeViewOptions` to see which options are possible and what they do.

## Methods
The treeview nodes and the treeview itself can be controlled using various methods of the treeview.
See the [documentation](https://jbtronics.github.io/bs-treeview/classes/bstreeview.html) of `BSTreeView` and the [documentation](https://jbtronics.github.io/bs-treeview/classes/bstreeviewnode.html) of `BSTreeViewNode` for more information.

Most methods take an second argument with an options object. The options object can be used to pass additional parameters to the method, like preventing the triggering of events. See the respective Options class of the method for more informations.

## Themes
Themes are presets for the options object, which can be passed as the third argument of the constructor (as an array of themes).
Multiple themes are possible, where the last theme in the array overrides the previous themes. The properties in the options object overrides every theme property.

By default, the treeview uses settings which allows it to render on bootstrap 3-5 (with glyphicons). To use a better styling for modern bootstrap versions
or other icon packs, you can use the following themes:
* [BS5Theme](https://jbtronics.github.io/bs-treeview/classes/bs5theme.html): Use Bootstrap 5's CSS variables to style the treeview
* [FA5Theme](https://jbtronics.github.io/bs-treeview/classes/fa5theme.html): Use FontAwesome 5 icons for the treeview


## Data Structure
In order to define the hierarchical structure needed for the tree it's necessary to provide a nested array of JavaScript objects.

Example:

```javascript
var tree = [
  {
    text: "Parent 1",
    nodes: [
      {
        text: "Child 1",
        nodes: [
          {
            text: "Grandchild 1"
          },
          {
            text: "Grandchild 2"
          }
        ]
      },
      {
        text: "Child 2"
      }
    ]
  },
  {
    text: "Parent 2"
  },
  {
    text: "Parent 3"
  },
  {
    text: "Parent 4"
  },
  {
    text: "Parent 5"
  }
];
```

At the lowest level a tree node is a represented as a simple JavaScript object.  This one required property `text` will build you a tree.

```javascript
{
  text: "Node 1"
}
```

If you want to do more, here's the full node specification

```javascript
{
  text: "Node 1",
  icon: "glyphicon glyphicon-stop",
  image: "something.png",
  selectedIcon: "glyphicon glyphicon-stop",
  color: "#000000",
  backColor: "#FFFFFF",
  iconColor: "#FFFFFF",
  iconBackground: "#000000",
  selectable: true,
  checkable: true,
  state: {
    checked: true,
    disabled: true,
    expanded: true,
    selected: true
  },
  tags: [
    'available',
    {text:'not available', class:'disabled'}
  ],
  dataAttr: {
    target: '#tree'
  }
  id: 'something',
  class: 'special extraordinary',
  hideCheckbox: true,
  nodes: [
    {},
    ...
  ]
}
```

See [documentation](https://jbtronics.github.io/bs-treeview/classes/bstreeviewnode.html) of the respective properties in the `BSTreeViewNode` class for more information.
Furthermore you can pass any other property to the node, but it will be ignored by the treeview, but passed to the node element, and can for example be accessed inside event handlers.

## Migrate from bootstrap-treeview
### Breaking changes
* Other event names and event signatures are changed: We use javascript native events now, which has the signature: `(event: Event) => void` for the handlers. You can access the data part of the event using `event.detail.data`
* The default value for the `levels` option, of how many levels should be expanded automatically, is now `1` instead of `2` (meaning no levels are expanded automatically).
* addNode()/RemoveNode()/UpdateNode() does not dispatch the `initialized` anymore
* `initialized` event is now dispatched after all nodes were rendered (therefore afterwards the `render` event is dispatched)

# License
bs-treeview is licensed under Apache 2.0 license. This means you can use it for free and redistribute it, without much restrictions. See [LICENSE](LICENSE.md) for more information.

bs-treeview is based on the bootstrap-treeview library of [@jonmiles](https://github.com/jonmiles/bootstrap-treeview) and [@patternfly](https://github.com/patternfly/patternfly-bootstrap-treeview).
