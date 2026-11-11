// `Browser.application` renders into `<body>` and expects that nothing else
// puts nodes there. Browsers and extensions do: Brave on iOS, for example,
// adds a `<div id="goog-gt-tt">` for its translation feature. The virtual DOM
// then patches the wrong nodes, throws `TypeError: undefined is not an object
// (evaluating 'r.childNodes')`, and the page stops updating. See
// https://github.com/NixOS/nixos-search/issues/1135.
//
// This loader rewrites the compiled Elm code, thus the application renders
// into `<div id="elm">` instead of `<body>`, and nodes that others add to
// `<body>` are not in its way.
//
// Elm creates the `<div>` if it is not in the page, for example after
// `elm-reloader` empties `<body>` to swap in new code.

const MOUNT_ID = "elm";

const replacements = [
    [
        "var bodyNode = _VirtualDom_doc.body;",
        `var bodyNode = _VirtualDom_doc.getElementById('${MOUNT_ID}') || _VirtualDom_doc.body.appendChild(_VirtualDom_doc.createElement('div'));`,
    ],
    [
        "_VirtualDom_node('body')(_List_Nil)",
        `_VirtualDom_node('div')(_List_Cons(A2(_VirtualDom_attribute, 'id', '${MOUNT_ID}'), _List_Nil))`,
    ],
];

module.exports = function elmMountLoader(source) {
    let result = source;
    for (const [from, to] of replacements) {
        const parts = result.split(from);
        // The code is in `_Browser_document`, and in `_Debugger_document` too
        // for a `--debug` build.
        if (parts.length < 2) {
            throw new Error(
                `elm-mount-loader: the compiled Elm code has no \`${from}\`. ` +
                    "Did `elm/browser` change?",
            );
        }
        result = parts.join(to);
    }
    return result;
};
