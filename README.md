# JsonTable
create table with filter options easily.

# CDN
https://cdn.jsdelivr.net/gh/jamieoneill/JsonTable/JsonTable.js

Or minified 

https://cdn.jsdelivr.net/gh/jamieoneill/JsonTable/JsonTable.min.js


# Usage
apply `.JsonTable` to a div.

```html
<div id="JsonTableHolder"></div>
```

```javascript
$('#JsonTableHolder').JsonTable({
    dataURL: "https://randomuser.me/api/",
    responseField : "results",
    colsToHide: ["picture"],
});
```

*Requires JQuery.

# Example
1. https://jsfiddle.net/5n4r9cx8/ - API data
1. https://jsfiddle.net/4z1kuygo/ - Passed in data

# Options

`dataURL` - URL of json data.

`responseField` - If the json is nested in the response specify the field (eg using git api the response field is `"content"`).

`token` - Authorization header for online data, exclude if not needed.

`colsToHide` - array of columns to hide from the table (eg `["name", "age"]`).

`data` - a json object or array of objects if data is stored locally (eg `{something: "hello", somethingElse : "world"}`).


# Included dependencies
* [bootstrap 4](https://getbootstrap.com/)
* [fontawesome 5](https://fontawesome.com/)
* [dataTables](https://datatables.net/)
* [popper](https://popper.js.org/)
* [bootstrap-multiselect](https://github.com/davidstutz/bootstrap-multiselect)
* [jszip](https://stuk.github.io/jszip/)
