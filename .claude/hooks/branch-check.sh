#!/bin/sh
# Flag a branch with no commits of its own that has fallen behind origin/main (its PR merged).
cd "$CLAUDE_PROJECT_DIR" && git fetch -q origin 2>/dev/null
b=$(git branch --show-current)
[ "$b" != main ] && [ "$(git rev-list --count origin/main..HEAD)" = 0 ] && [ "$(git rev-list --count HEAD..origin/main)" != 0 ] &&
  echo "Branch $b has no commits of its own and is behind origin/main, so its PR has likely merged. Start new work with: git switch -c <type>/<slug> origin/main"
exit 0
