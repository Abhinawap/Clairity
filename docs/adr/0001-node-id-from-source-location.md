# Node ids come from source location

A node's id is the first 12 hex characters of `sha1("<project-relative POSIX path>:<element name>:<line>:<column>")`, using Babel's 1-based line and 0-based column of the element's opening `<`. The parser, the transformer and the dev-only Babel plugin that writes `data-ir-id` onto the DOM all compute it independently from the same source, so a click on the page resolves to a node without any shared state.

## Considered Options

- **Tree path** (file + component + child-index path): survives edits elsewhere in the file, but changes whenever a sibling is inserted before the node, and needs the same tree walk reproduced inside the Babel plugin.
- **Source location (chosen)**: trivial to compute anywhere Babel has parsed the file.

## Consequences

Any edit that shifts lines above a node changes its id. `graph:patch` pairs each node's old id (`changedNodeIds[i]`) with its new data (`nodes[i]`), so the web app can replace the node and keep the current selection. When nodes are added or removed there is nothing to pair, so the extension sends `graph:full` instead and the selection survives only if its id still exists (agreed 2026-10-19; not yet tested in the extension). A class edit that stays on one line keeps the id of every node starting on another line; nodes later on the same line shift column and get new ids.
