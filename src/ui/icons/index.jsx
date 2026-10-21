/**
 * Authored icons.
 *
 * One grid (16 × 16), one stroke (1.5), round joins and caps. Nothing here
 * is a Unicode glyph or a third-party icon set: the whole set is drawn so
 * the interface keeps a single optical weight.
 */

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
}

export function IconDrive(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 10.5h11v2a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-2Z" />
      <path d="M3.9 10.5 5.6 3.6a1 1 0 0 1 .96-.7h2.88a1 1 0 0 1 .96.7l1.7 6.9" />
      <path d="M6.4 12.6h1" />
    </svg>
  )
}

export function IconChevronDown(props) {
  return (
    <svg {...base} {...props}>
      <path d="m4 6.5 4 4 4-4" />
    </svg>
  )
}

export function IconCheck(props) {
  return (
    <svg {...base} {...props}>
      <path d="m3.2 8.4 3.1 3.1 6.5-7" />
    </svg>
  )
}

export function IconClose(props) {
  return (
    <svg {...base} {...props}>
      <path d="m4.4 4.4 7.2 7.2M11.6 4.4l-7.2 7.2" />
    </svg>
  )
}

export function IconFolder(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.2 12.4V4.3a.9.9 0 0 1 .9-.9h3l1.5 1.9h5.3a.9.9 0 0 1 .9.9v6.2a.9.9 0 0 1-.9.9H3.1a.9.9 0 0 1-.9-.9Z" />
    </svg>
  )
}

export function IconKey(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="5.6" cy="10.4" r="2.4" />
      <path d="m7.4 8.6 5.4-5.4M10.6 5.4l1.6 1.6M12.2 3.8l1.4 1.4" />
    </svg>
  )
}

export function IconAlert(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 2.6 14.4 13H1.6L8 2.6Z" />
      <path d="M8 6.6v3.1" />
      <path d="M8 11.6h.01" />
    </svg>
  )
}

export function IconReload(props) {
  return (
    <svg {...base} {...props}>
      <path d="M13.3 8a5.3 5.3 0 1 1-1.6-3.8" />
      <path d="M13.4 2.6v3.2h-3.2" />
    </svg>
  )
}

export function IconInboxTray(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.2 9.6h3.1l.9 1.9h3.6l.9-1.9h3.1" />
      <path d="M3.6 3.2h8.8l1.4 6.4v3.1a.9.9 0 0 1-.9.9H3.1a.9.9 0 0 1-.9-.9V9.6l1.4-6.4Z" />
    </svg>
  )
}

export function IconList(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5.6 4h8.2M5.6 8h8.2M5.6 12h8.2" />
      <path d="M2.4 4h.01M2.4 8h.01M2.4 12h.01" />
    </svg>
  )
}

export function IconDownload(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 2.8v7.2" />
      <path d="m5.2 7.4 2.8 2.8 2.8-2.8" />
      <path d="M3.2 11.6v1.2a.9.9 0 0 0 .9.9h7.8a.9.9 0 0 0 .9-.9v-1.2" />
    </svg>
  )
}

export function IconInfo(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M8 7.2v4M8 4.8h.01" />
    </svg>
  )
}

export function IconMore(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="3.6" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="12.4" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconEdit(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9.4 3.4 12.6 6.6" />
      <path d="M11.1 2.1a1.6 1.6 0 0 1 2.3 0l.5.5a1.6 1.6 0 0 1 0 2.3L5.4 13.4l-3.2.8.8-3.2 8.1-8.9Z" />
    </svg>
  )
}

export function IconArchive(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.6 4.2h10.8v1.9H2.6z" />
      <path d="M3.4 6.1v6.2a.9.9 0 0 0 .9.9h7.4a.9.9 0 0 0 .9-.9V6.1" />
      <path d="M6.6 8.6h2.8" />
    </svg>
  )
}

export function IconUnarchive(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.6 4.2h10.8v1.9H2.6z" />
      <path d="M3.4 6.1v6.2a.9.9 0 0 0 .9.9h7.4a.9.9 0 0 0 .9-.9V6.1" />
      <path d="M8 11.4V8.2M6.2 9.8 8 8l1.8 1.8" />
    </svg>
  )
}

export function IconTrash(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.9 4.4h10.2" />
      <path d="M6.2 4.4V3.3a.8.8 0 0 1 .8-.8h2a.8.8 0 0 1 .8.8v1.1" />
      <path d="M4.2 4.4v7.5a.9.9 0 0 0 .9.9h5.8a.9.9 0 0 0 .9-.9V4.4" />
      <path d="M6.8 7v3.4M9.2 7v3.4" />
    </svg>
  )
}

/* ---------- stage marks (status) ---------- */

export function IconStageInbox(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="4.4" />
    </svg>
  )
}

export function IconStageBacklog(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.4 4.6h9.2M3.4 8h9.2M3.4 11.4h6" />
    </svg>
  )
}

export function IconStagePlanned(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 2.9 13.1 8 8 13.1 2.9 8 8 2.9Z" />
    </svg>
  )
}

export function IconStageDoing(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="4.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconStageDone(props) {
  return (
    <svg {...base} {...props}>
      <path d="m3.4 8.4 3 3 6.2-6.6" />
    </svg>
  )
}

export function IconStageDropped(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="8" r="4.4" />
      <path d="M2.4 8h11.2" />
    </svg>
  )
}
