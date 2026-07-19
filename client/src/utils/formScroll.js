// Small helpers that guide the user to whatever needs their attention:
// smoothly scrolling (and focusing) the first invalid field, or centring a
// field/element in view. Used across every form on the site so behaviour stays
// consistent on mobile and desktop.

// Centre any element in the viewport. Because scrollIntoView walks up EVERY
// scrollable ancestor, this also works for fields inside a scrollable modal.
export function scrollElementIntoView(el, block = 'center') {
  if (!el || typeof el.scrollIntoView !== 'function') return
  try {
    el.scrollIntoView({ behavior: 'smooth', block })
  } catch {
    el.scrollIntoView()
  }
}

// Scroll to (and focus) a single field, matched by `name` or `data-field`.
// `container` optionally scopes the lookup (e.g. a modal) so we don't match a
// same-named field elsewhere on the page.
export function scrollToField(key, container) {
  if (!key) return
  // Wait a frame so error styles / freshly-shown fields are in the DOM first.
  requestAnimationFrame(() => {
    const root = container || document
    const el =
      root.querySelector(`[name="${key}"]`) ||
      root.querySelector(`[data-field="${key}"]`)
    if (!el) return
    scrollElementIntoView(el)
    if (typeof el.focus === 'function') {
      // preventScroll keeps the smooth scroll from being overridden by focus.
      try { el.focus({ preventScroll: true }) } catch { el.focus() }
    }
  })
}

// Scroll to the FIRST invalid field. `errors` is the validation object whose
// keys are field names. Pass `order` to guarantee we jump to the topmost field
// (object key order usually already matches, but this makes it explicit) and
// `container` to scope the lookup to a specific modal / section.
export function scrollToFirstError(errors, { order, container } = {}) {
  if (!errors) return
  const present = (order && order.length ? order : Object.keys(errors))
    .filter((k) => errors[k])
  scrollToField(present[0], container)
}