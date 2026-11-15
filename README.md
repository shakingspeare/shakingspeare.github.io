# Shakingspeare

https://shakingspeare.github.io

## How to post a new story

1. Make a folder for the pictures: `images/<story-id>/` and put the pictures and the notebook photos there.
2. Copy `templates/new-story.md` into `_posts/` and rename it `YYYY-MM-DD-story-id.md`
   (for example `_posts/2026-11-15-the-red-door.md`).
3. Fill in the title, kind, `counter`, cover, and notebook photos at the top.
4. Write the story below the `---` line. Leave an empty line between paragraphs.
   A picture is one line: `![caption](/images/story-id/1.jpg)`.
5. Commit and push. The site updates in about a minute.

The home page list, the story page, and the feed are made automatically.

## Korean version

Add `title_ko:` at the top, then put a line with only `<!--ko-->` after the English story and write the Korean below it
(repeat the picture lines there too). The story page then shows an English / 한국어 switch and a note that the
Korean was translated by Claude.

## Poems

Use `kind: Poem`. Line breaks inside a stanza are kept, and an empty line starts a new stanza.

## Views and likes

`counter.js` stores the numbers on our own counter at `counter.shakingspeare.workers.dev`
(a Cloudflare Worker with a D1 database; the code is in `worker/counter-worker.js`).
Each story uses its `counter` id, so **never change `counter` after a story is posted**, or its numbers start over at zero.
