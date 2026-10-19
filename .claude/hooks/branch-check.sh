#!/bin/sh
# Flag a branch with no commits of its own that has fallen behind origin/main (its PR merged).
# ponytail: a squash or rebase merge leaves the branch's own commits, so this stays silent; ask gh pr list --head <branch> --state merged if those merges start.
cd "$CLAUDE_PROJECT_DIR" && git fetch -q origin 2>/dev/null
branch=$(git branch --show-current)
[ -n "$branch" ] && [ "$branch" != main ] || exit 0
[ "$(git rev-list --count origin/main..HEAD)" = 0 ] && [ "$(git rev-list --count HEAD..origin/main)" != 0 ] &&
  echo "Branch $branch has no commits of its own and is behind origin/main, so its PR has likely merged. Start new work with: git switch -c <type>/<slug> origin/main"
exit 0
