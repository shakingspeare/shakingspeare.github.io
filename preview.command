#!/bin/zsh
# Double-click to preview the site at http://localhost:4000 (close this window to stop).
cd "$(dirname "$0")"
export PATH="$HOME/.gem/ruby/2.6.0/bin:$PATH"
pkill -f "jekyll serve" 2>/dev/null
(sleep 3 && open "http://localhost:4000/") &
jekyll serve --port 4000 --livereload
