---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: []
---

# TakeFastNotes — capture surface

## Scope and mode

The whole application shell: the capture bar, the scope switch, the record
sheet, and the states around them. Mode: **Operate** (the visitor is
completing a task — capturing and triaging a thought).

## Audience, job, action

A developer between tasks. The job is to lose nothing: type one line, press
Enter, the thought is on disk. The secondary job, later, is triage: say what
each note is and where it stands.

Primary action: capture. Secondary actions: change a note's kind, change its
status, drop a tag.

Content: the user's own notes. There is no marketing surface, no onboarding
flow, no settings.

Constraints that bind the design: strict CSP with no inline styles, zero
network requests at runtime, self-hosted fonts, React-only runtime, a frozen
domain layer.

## Direction

**"The annotated record"** — a working sheet where every note states plainly
what it is and where it stands, and the capture field speaks the grammar back
to the writer while they type.

The incumbent register hid the vocabulary behind a "Key" dropdown and printed
two-letter codes (FT, DC, QU) where the kind's name belonged. A code needs a
decoder; the opposite of what a first-run screen is for. The replacement
keeps the register's discipline (hairline rules, aligned columns, tabular
numerals, colour reserved for information) and replaces its content model:
words instead of codes, the legend printed where the notes are read, and a
grammar strip that lights up as the draft uses each token.

Memorable moment: typing `feature: add webhook retries #backend` fills the
`kind:` and `#tag` tokens in the strip under the field and prints
"WILL SAVE AS ▪ Feature #backend" before anything is saved.

## Unresolved decisions

- Copy language: the interface stays English (the incumbent language of the
  codebase and the language PRODUCT.md fixes), while the primary audience is
  Spanish-speaking. Needs the user's call.
- The two-letter kind codes were removed. If the codes were load-bearing for
  someone, they can return as a secondary column.
- The roadmap lives in the footer as a single line. It may belong closer to
  the capture bar instead.

## Direction contract

THESIS: A capture instrument is a working sheet, not a card pile. The sheet
prints what a note is and where it stands in plain words, and the capture
field reads the grammar back while you type. It refuses the category default
of rounded cards under one accent, and it refuses the incumbent habit of
hiding the vocabulary behind a disclosure and printing two-letter codes where
the kind's name belonged.

OWN-WORLD: An achromatic register — cool grey ground, paper-white panels,
hairline rules, 2–4px corners, tabular numerals, one grotesque with a mono
voice reserved for literal syntax and measurements. Colour is information
only: six kind hues on an 8px swatch, four stage forms on the status chip.
Signature move: the grammar strip, where `#tag`, `kind:` and `@container` fill
with ink the moment the draft uses them.

STORY: You are capturing between tasks. One line, Enter, it is on disk, and
the field says what it understood. Later you triage, and both marks say what
they mean in place, in the menu that opens them.

FIRST VIEWPORT: Identity row (wordmark, promise, local-only chip, count),
then the capture row full width (label, field, Capture, grammar strip), then
the scope switch with its counts and the record sheet. The empty state is
the legend card: grammar, kinds, stages, three examples.

FORM: code-led (Operate surface). Closest catalog world:
rw-centre-rail-reference-setting — states are printed marks, hairline rules,
no soft-shadowed cards. seed:4224d4599ba0e8ba. The roll was run for the
record; the direction was fixed by the brief (interview substitution), not by
the hand.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying
its provenance
