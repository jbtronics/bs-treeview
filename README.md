# bs-treeview

A treeview element for browsers using Javascript.
It is based on the bootstrap-treeview libraries of [@jonmiles](https://github.com/jonmiles/bootstrap-treeview) and [@patternfly](https://github.com/patternfly/patternfly-bootstrap-treeview),
but is overhauled with typescript and does not use any jQuery.

## Dependencies
* A browser supporting ECMAScript 2017 (which should be any browser of the last years)
* [Bootstrap](https://getbootstrap.com/) 4 or 5, and [Font Awesome](https://fontawesome.com/): bs-treeview can be configured to use other frontend frameworks, but this is the default configuration

## Usage
TODO

## Migrate from bootstrap-treeview
### Breaking changes
* Other event names and event signatures are changed: We use javascript native events now, which has the signature: `(event: Event) => void` for the handlers. You can access the data part of the event using `event.detail.data`
* The default value for the `levels` option, of how many levels should be expanded automatically, is now `1` instead of `2` (meaning no levels are expanded automatically).
* addNode()/RemoveNode()/UpdateNode() does not dispatch the `initialized` anymore
* `initialized` event is now dispatched after all nodes were rendered (therefore afterwards the `render` event is dispatched)

# License
bs-treeview is licensed under Apache 2.0 license. This means you can use it for free and redistribute it, without much restrictions. See [LICENSE](LICENSE.md) for more information.

bs-treeview is based on the bootstrap-treeview library of [@jonmiles](https://github.com/jonmiles/bootstrap-treeview) and [@patternfly](https://github.com/patternfly/patternfly-bootstrap-treeview).
