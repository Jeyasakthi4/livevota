/**
 * LiveVota Smooth Scrolling Utilities
 * High-performance, hardware-accelerated smooth scrolling helpers for both
 * window vertical navigation and internal horizontal carousel containers.
 */

export interface SmoothScrollOptions {
  offset?: number;
  behavior?: ScrollBehavior;
  duration?: number;
}

/**
 * Smoothly scrolls the window to a target element or vertical coordinate.
 * Accounts for the sticky top navigation header (defaults to 72px offset).
 */
export function smoothScrollTo(
  target: string | HTMLElement | number,
  options: SmoothScrollOptions = {}
): void {
  if (typeof window === 'undefined') return;

  const { offset = 72, behavior = 'smooth' } = options;

  if (typeof target === 'number') {
    window.scrollTo({
      top: Math.max(0, target),
      behavior,
    });
    return;
  }

  let element: HTMLElement | null = null;
  if (typeof target === 'string') {
    const cleanId = target.startsWith('#') ? target.slice(1) : target;
    element = document.getElementById(cleanId);
    if (!element) {
      element = document.querySelector(target.startsWith('#') ? target : `#${target}`);
    }
  } else {
    element = target;
  }

  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: Math.max(0, offsetPosition),
    behavior,
  });
}

/**
 * Smoothly scrolls a horizontal container by a relative delta (in pixels).
 */
export function smoothScrollHorizontal(
  container: HTMLElement | null,
  delta: number,
  behavior: ScrollBehavior = 'smooth'
): void {
  if (!container) return;
  container.scrollBy({
    left: delta,
    behavior,
  });
}

/**
 * Smoothly centers a child element inside its scrollable parent container.
 */
export function smoothCenterChild(
  parent: HTMLElement | null,
  child: HTMLElement | null,
  behavior: ScrollBehavior = 'smooth'
): void {
  if (!parent || !child) return;

  const parentWidth = parent.clientWidth;
  const childWidth = child.offsetWidth;
  const childOffsetLeft = child.offsetLeft;

  const targetScrollLeft = childOffsetLeft - parentWidth / 2 + childWidth / 2;

  parent.scrollTo({
    left: Math.max(0, targetScrollLeft),
    behavior,
  });
}
