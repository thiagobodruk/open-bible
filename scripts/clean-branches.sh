#!/usr/bin/env bash
# Apaga no GitHub todas as branches remotas, menos a main. Mostra a lista e pede confirmação.
# Uso: npm run clean:branches   (ou: bash scripts/clean-branches.sh)
set -euo pipefail

REMOTE="${1:-origin}"
KEEP="main"

if [ -t 1 ]; then B=$'\e[1m'; G=$'\e[32m'; R=$'\e[31m'; D=$'\e[2m'; X=$'\e[0m'; else B=; G=; R=; D=; X=; fi

git fetch --prune "$REMOTE" >/dev/null 2>&1
# Compatível com o bash 3.2 do macOS (sem mapfile).
branches=()
while IFS= read -r line; do
  [ -n "$line" ] && branches+=("$line")
done < <(git branch -r | sed "s|^ *$REMOTE/||" | grep -v -E "^(HEAD.*|$KEEP)$" || true)

if [ "${#branches[@]}" -eq 0 ]; then
  echo "${G}Nada para apagar.${X} Só existe a $KEEP em $REMOTE."
  exit 0
fi

echo "${B}Branches que serão apagadas em $REMOTE (${#branches[@]}):${X}"
printf '  %s\n' "${branches[@]}"
echo
echo "${D}A $KEEP não é tocada. Esta ação não pode ser desfeita pelo script.${X}"
echo

read -r -p "${G}▶${X}  Enter para apagar, ou Ctrl+C para cancelar " _

git push "$REMOTE" --delete "${branches[@]}"
git remote prune "$REMOTE" >/dev/null 2>&1 || true
echo
echo "${G}✔ Pronto.${X} ${#branches[@]} branches apagadas."
