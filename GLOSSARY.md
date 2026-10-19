# Clairity

A visual editor that works directly on a developer's React/Next.js source files: every visual change becomes a small diff in their own code.

## Language

**Scene graph**:
The tree of nodes describing one page's UI, parsed from its source files.
_Avoid_: IR, layer tree (that is the UI view of the scene graph), DOM

**Node**:
One element, component usage or text run in the scene graph, tied to exactly one place in source.
_Avoid_: layer, element (when meaning the scene graph entry)

**Text run**:
A Node holding one stretch of literal text written between tags in source; a heading split by a `<br>` holds two.
_Avoid_: text node (that is the DOM's), text content, locked text

**Passthrough class**:
A styling token kept verbatim on a node because the tool does not model it, such as a breakpoint variant or an arbitrary value.
_Avoid_: unknown class, unsupported class

**Read-only node**:
A node the tool shows but will not edit, always with a stated reason.
_Avoid_: locked node, non-editable node

**Styling convention**:
How a component expresses its style: Tailwind classes, inline styles, or CSS-in-JS.
_Avoid_: styling mode

**Edit**:
A change to one node's style or text made directly in the inspector or on the canvas, with no AI involved.
_Avoid_: change (that is an AI suggestion), visual change

**Proposal**:
The set of Changes the model suggests in answer to one request.
_Avoid_: suggestion, AI result

**Change**:
One item in a Proposal, which the developer accepts or rejects on its own.
_Avoid_: edit, diff
