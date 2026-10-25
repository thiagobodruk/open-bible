#!/usr/bin/env bash
# Deletes every remote branch on GitHub except main. Shows the list and asks for confirmation.
# Usage: npm run clean:branches   (or: bash scripts/clean-branches.sh)
set -euo pipefail

REMOTE="${1:-origin}"
KEEP="main"

if [ -t 1 ]; then B=$'\e[1m'; G=$'\e[32m'; R=$'\e[31m'; D=$'\e[2m'; X=$'\e[0m'; else B=; G=; R=; D=; X=; fi

git fetch --prune "$REMOTE" >/dev/null 2>&1
# Compatible with macOS bash 3.2 (no mapfile).
branches=()
while IFS= read -r line; do
  [ -n "$line" ] && branches+=("$line")
done < <(git branch -r | sed "s|^ *$REMOTE/||" | grep -v -E "^(HEAD.*|$KEEP)$" || true)

if [ "${#branches[@]}" -eq 0 ]; then
  echo "${G}Nothing to delete.${X} Only $KEEP exists on $REMOTE."
  exit 0
fi

echo "${B}Branches that will be deleted on $REMOTE (${#branches[@]}):${X}"
printf '  %s\n' "${branches[@]}"
echo
echo "${D}$KEEP is left alone. This action cannot be undone by the script.${X}"
echo

read -r -p "${G}▶${X}  Press Enter to delete, or Ctrl+C to cancel " _

git push "$REMOTE" --delete "${branches[@]}"
git remote prune "$REMOTE" >/dev/null 2>&1 || true
echo
echo "${G}✔ Done.${X} ${#branches[@]} branches deleted."
