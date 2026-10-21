---
name: TakeFastNotes
description: A local-first capture instrument for short notes that never leave the machine.
colors:
  page-ground: "#eaecf1"
  panel: "#ffffff"
  sunken: "#f5f6f9"
  inset: "#f8f9fb"
  hover: "#f1f3f8"
  selected: "#e9ecfa"
  rule: "#e3e6ec"
  rule-strong: "#c9cedb"
  rule-faint: "#edeff3"
  ink: "#0f1218"
  ink-2: "#3b4350"
  ink-3: "#566070"
  ink-4: "#5c6474"
  accent: "#101319"
  accent-hover: "#2a303c"
  accent-soft: "#e4e7ee"
  accent-ink: "#ffffff"
  danger: "#b42318"
  danger-soft: "#fdeceb"
  kind-note: "#5a6474"
  kind-idea: "#6b28d9"
  kind-feature: "#0b6b63"
  kind-fix: "#b42318"
  kind-decision: "#8a4b0b"
  kind-question: "#0b6a9b"
  stage-pending-ink: "#55606f"
  stage-pending-bg: "#ffffff"
  stage-active-ink: "#ffffff"
  stage-active-bg: "#101319"
  stage-done-ink: "#10693a"
  stage-done-bg: "#e3f4ea"
  stage-dropped-ink: "#616978"
  stage-dropped-bg: "#f1f2f6"
typography:
  display:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 680
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.012em"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.012em"
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "0.055em"
  data:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
  lg: "8px"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  5: "1.25rem"
  6: "1.5rem"
  8: "2rem"
  10: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-quiet:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.25rem"
  input-capture:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.6rem 0.75rem"
    height: "2.9rem"
  chip-tag:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.xs}"
    padding: "1px 5px"
  chip-grammar:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-3}"
    rounded: "{rounded.xs}"
    padding: "1px 5px"
  chip-grammar-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  badge-status-pending:
    backgroundColor: "{colors.stage-pending-bg}"
    textColor: "{colors.stage-pending-ink}"
    rounded: "{rounded.sm}"
    padding: "3px 8px"
  badge-status-active:
    backgroundColor: "{colors.stage-active-bg}"
    textColor: "{colors.stage-active-ink}"
  badge-status-done:
    backgroundColor: "{colors.stage-done-bg}"
    textColor: "{colors.stage-done-ink}"
  badge-status-dropped:
    backgroundColor: "{colors.stage-dropped-bg}"
    textColor: "{colors.stage-dropped-ink}"
  panel-sheet:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.sm}"
---

# Design System: TakeFastNotes

## Overview

**Creative North Star: "The Annotated Record"**

TakeFastNotes is an instrument, and the interface is a working sheet rather
than a card pile. A sheet has one job: hold a short record and say what it
is. The screen is therefore built the way a printed register is built — a
fixed column for the classification, a wide column for the words, a right
column for the state and the clock, and hairline rules between the rows.
Nothing floats, nothing is rounded enough to be a card, and nothing is
decorated. Depth comes from a white panel on a cool grey ground, not from
shadows.

The second half of the world is the vocabulary. Two taxonomies run through
the product — kinds (what a note is) and statuses (where it stands) — and a
newcomer has to be able to read them without a manual. So the system refuses
the shortcut of abbreviating: a kind is always written out in full, and every
mark is accompanied by its meaning somewhere on the same screen. The first
run is a legend card; after that, the marks carry their own explanation in
the menu that opens them.

One thing in the system is alive: the grammar strip under the capture field.
The three pieces of capture syntax sit there permanently as a legend, and
each one fills with ink the instant the draft uses it. The field is not
asking the reader to learn a language before they can start; it is teaching
the language as they type.

**Key Characteristics:**

- An achromatic shell; colour appears only where it carries information.
- Words, not codes, everywhere a classification is shown.
- A legend printed on the sheet, not hidden behind a disclosure.
- Hairline rules, aligned columns, tabular numerals, small corners.
- Motion is state feedback only: 120–180ms, one easing curve, no choreography.

## Colors

The palette is achromatic on purpose: a cool grey ground, a paper-white
sheet, ink in four steps, and six kind hues that never appear except next
to the kind they name. Every ink value clears 4.5:1 against the surface it
is used on, in both themes.

### Primary

- **Ink** (`#0f1218`): the product's only "accent". It marks the active
  scope, the primary button, the focus ring, and a grammar token the draft
  is currently using. Because it is the only dark mass on the page, it is
  reserved for state.

### Secondary

- **Kind hues** (`#0b6b63` feature, `#b42318` fix, `#8a4b0b` decision,
  `#6b28d9` idea, `#0b6a9b` question, `#5a6474` note): the classification
  of a note, painted on an 8px swatch that always sits next to the kind's
  written name.

### Tertiary

- **Stage greens and greys** (`#10693a` done, `#55606f` pending, `#6b7382`
  dropped): the lifecycle of a note, carried by the form of the status chip
  as much as by its colour.

### Neutral

- **Page ground** (`#eaecf1`): the desk the sheet lies on.
- **Panel** (`#ffffff`): the sheet itself — the record list, the legend
  card, the capture field.
- **Ink steps** (`#0f1218` → `#3b4350` → `#566070` → `#5c6474`): title,
  label, secondary text, timestamps and captions.
- **Rules** (`#e3e6ec`, `#c9cedb`): the hairlines that separate records and
  frame the controls.

### Named Rules

**The Achromatic Shell Rule.** The chrome carries no hue. If a colour is not
telling the reader what a note *is* or where it *stands*, it does not ship.
This is why there is no accent gradient, no brand-coloured header, and no
tinted panel.

**The Word Beside The Swatch Rule.** A colour never appears alone. Every
kind swatch is followed by the kind's full name; every stage colour is
followed by the stage's name and an authored mark. Colour may be lost, and
the meaning survives.

## Typography

**Display Font:** Archivo Variable (fallback `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Archivo Variable (same stack)
**Label/Mono Font:** JetBrains Mono Variable (fallback `ui-monospace, SFMono-Regular, monospace`)

**Character:** Archivo is a slightly condensed grotesque with a 100–900
variable axis: it holds a legible skeleton at 11px, where a wider face turns
mushy, and its narrow counters keep a three-column register tight. JetBrains
Mono is used only for things that are literally code or measurement —
`#tag`, `kind:`, `@container`, timestamps, counts — never as a costume for
"technical". Both faces are self-hosted from `@fontsource-variable` and
bundled as two woff2 files; the app makes no network request to load type.

### Hierarchy

- **Display** (680, 1.25rem, -0.02em): the product name, once, top left.
- **Headline** (650, 1.0625rem): the state title of an empty screen.
- **Title** (600, 0.9375rem, -0.012em): a note's title. The heaviest thing
  in the record list.
- **Body** (400, 0.875rem): previews, explanations, and the one-line
  statement under the product name.
- **Label** (650, 0.6875rem, 0.055em, uppercase): field labels, section
  heads, and the "will save as" lead.
- **Data** (mono, 0.6875rem, tabular): timestamps, counts, and syntax
  tokens. Always `font-variant-numeric: tabular-nums` so columns of numbers
  line up.

### Named Rules

**The One Scale Rule.** The type scale is fixed in `rem` — never fluid, never
`clamp()`. This is a product screen read at a stable DPI; a heading that
shrinks in a column is a bug, not a feature.

**The Mono-Is-Literal Rule.** Monospace means "this is a literal token or a
measurement". If a word is prose, it is set in Archivo.

## Layout

The sheet is 1120px wide at its maximum, centred, with 1.5rem of gutter. The
header is two rows: an identity row (name, promise, trust chip, count) and a
capture row that spans the full width, because the capture field is the
product's primary action and must never be squeezed into a column.

The record list is a three-column grid: `92px` for the kind, `1fr` for the
words, `128px` for the state and the clock. The columns are what makes the
list scannable; rows are separated by a 1px rule, never by a card.

Below 860px the grid collapses to two columns — kind and state on the first
line, the words below — and below 560px the capture field takes the full
width with the Capture button under it. The vertical rhythm is the `--space`
scale; a group of related elements is tight, and the space above a heading
is always larger than the space below it.

## Elevation & Depth

There is one shadow in the system, and it belongs to the popover menu
(`0 1px 2px rgb(16 19 25 / 8%), 0 12px 28px rgb(16 19 25 / 12%)`), because
a menu has to leave the page to be read. Everything else is flat: the depth
of the sheet comes from a white panel on a cool grey ground, and from
hairline rules. Cards are never lifted, because a lifted card is a card, and
this is a sheet.

### Shadow Vocabulary

- **Menu** (`box-shadow: 0 1px 2px rgb(16 19 25 / 8%), 0 12px 28px rgb(16 19 25 / 12%)`): the only elevation in the system, on the kind and status popovers.

### Named Rules

**The Flat-By-Default Rule.** A surface is flat at rest. Shadow appears only
when something genuinely floats above the page.

## Shapes

Corners are small and consistent: 2px on chips and swatches, 3px on panels
and status badges, 4px on fields and buttons, 8px reserved for larger
surfaces. Nothing is pill-shaped and nothing is a rounded card. The one
deliberate exception is the kind swatch — an 8px square with 2px corners,
because a square reads as a printed classification mark, where a circle
would read as a bullet.

## Components

### Buttons

- **Shape:** 4px radius, 2.25rem tall, 1rem of horizontal padding.
- **Primary:** ink background, paper-white text. Used exactly once, on
  Capture. When the field is empty the button is *not* a grey slab: it
  becomes a sunken surface with muted text, so a disabled control never
  out-shouts the field it belongs to.
- **Quiet:** paper-white background, 1px `--rule-strong` border, ink-2 text.
  Used for Recargar, Vocabulario, and every row-level control.
- **Hover / Focus:** 120ms on background, border and colour. Focus is a 2px
  ink outline with a 2px offset, never a browser default.

### Chips

- **Tags** (`#backend`): mono, 0.6875rem, sunken background, 1px rule,
  2px radius. A tag carries a remove button that only appears on hover or
  focus, so the resting row stays quiet.
- **Grammar tokens** (`#tag`, `kind:`, `@container`): mono, 2px radius, hairline
  border, muted text. When the draft uses the token, the chip fills with ink
  and its label darkens. This is the system's one live element.
- **Container** (`@takefastnotes`): mono with a dashed border and a folder
  mark — a reference to a place, not a removable tag.

### Cards / Containers

- **Corner Style:** 3px radius.
- **Background:** paper-white panel on the cool grey ground.
- **Shadow Strategy:** none.
- **Border:** 1px hairline `--rule`; `--rule-strong` for interactive
  surfaces.
- **Internal Padding:** 1.5rem for the legend card, 0.75rem × 1rem for a
  record row.

### Inputs / Fields

- **Style:** 1px `--rule-strong` stroke, paper-white fill, 4px radius,
  0.9375rem type.
- **Focus:** the stroke turns to ink and a 3px ink-soft ring appears outside
  it. The ring is the affordance; the border colour only supports it.
- **Error / Disabled:** disabled capture fields sit on the sunken surface
  with muted text; errors are ink-on-danger-soft and name the problem.

### Navigation

- **Style:** the scope switch is a segmented control — Bandeja and Todas, each
  with its count in tabular figures — and the selected scope is a solid ink
  block. The Vocabulario control is a quiet button on the right that opens
  the legend inline, above the list, where the notes it describes are.
- **Mobile treatment:** the switch and the Vocabulary control share a row
  and wrap as a unit; the record sheet drops its third column.

### The Record Row

- **Grid:** 92px kind / 1fr words / 128px state and clock.
- **Kind:** an 8px swatch in the kind's hue followed by the kind's full
  name. Both are inside a button that opens the kind menu, where every
  option carries its meaning.
- **Words:** the title at 0.9375rem/600, the preview at 0.8125rem in ink-3
  clamped to two lines, then the tag and container chips.
- **State:** a chip whose form carries the stage — outlined for pending,
  solid ink for *Doing*, green for *Done*, dashed and muted for *Dropped* —
  with the clock in mono underneath, right-aligned.

## Do's and Don'ts

### Do:

- **Do** write every kind and status out in full, next to its colour.
- **Do** put the legend on the same screen as the marks it explains.
- **Do** keep the three grammar tokens visible under the capture field and
  light them up as the draft uses them.
- **Do** use hairline rules and aligned columns to separate records.
- **Do** set timestamps, counts and syntax tokens in JetBrains Mono with
  tabular figures.

### Don't:

- **Don't** abbreviate a kind into a two-letter code; a code needs a
  decoder, and the reader is new to the vocabulary.
- **Don't** put colour in the chrome, on a panel, or on a background.
- **Don't** lift a record into a card: no shadow, no radius-heavy surface,
  no card grid.
- **Don't** add a permanent banner to explain the syntax; teach it where it
  is used.
- **Don't** introduce a second type voice, a second font file, or a network
  request to render the interface.
