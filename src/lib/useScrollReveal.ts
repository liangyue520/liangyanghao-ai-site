import { onBeforeUnmount, onMounted, type Ref } from 'vue';

/** Enhance static sections without making content depend on animation support. */
export function useScrollReveal(root: Ref<HTMLElement | undefined>) {
  let observer: IntersectionObserver | undefined;
  let preference: MediaQueryList | undefined;
  let elements: HTMLElement[] = [];
  const visibility = new Map<HTMLElement, boolean>();
  let disposed = false;
  let observationVersion = 0;

  function hasFocus(element: HTMLElement) {
    return element.contains(document.activeElement);
  }

  function showAll() {
    observationVersion += 1;
    observer?.disconnect();
    observer = undefined;
    visibility.clear();
    for (const element of elements) delete element.dataset.revealState;
  }

  function observeElements() {
    observer?.disconnect();
    visibility.clear();
    const version = ++observationVersion;
    try {
      observer = new IntersectionObserver(entries => {
        if (disposed || version !== observationVersion) return;
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          visibility.set(element, entry.isIntersecting);
          if (hasFocus(element)) {
            element.dataset.revealState = 'focused';
          } else if (!entry.isIntersecting) {
            element.dataset.revealState = 'pending';
          } else if (element.dataset.revealState === 'pending') {
            element.dataset.revealState = 'visible';
          }
        }
      }, { threshold: 0, rootMargin: '0px' });
      for (const element of elements) {
        element.dataset.revealState = hasFocus(element) ? 'focused' : 'pending';
        observer.observe(element);
      }
    } catch {
      showAll();
    }
  }

  function followPreference(event: MediaQueryListEvent) {
    if (event.matches) showAll();
    else if (!disposed) observeElements();
  }

  function revealFocused(event: FocusEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const element = target.closest<HTMLElement>('[data-reveal]');
    if (element && root.value?.contains(element) && !preference?.matches) {
      element.dataset.revealState = 'focused';
    }
  }

  function resetAfterFocus(event: FocusEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const element = target.closest<HTMLElement>('[data-reveal]');
    if (!element || !root.value?.contains(element)) return;
    queueMicrotask(() => {
      if (disposed || preference?.matches || !visibility.has(element) || hasFocus(element)) return;
      // A focused block stays visible after blur; only an offscreen block rearms.
      if (!visibility.get(element)) {
        const rect = element.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
          element.dataset.revealState = 'pending';
        }
      }
    });
  }

  onMounted(() => {
    const container = root.value;
    if (!container || !('IntersectionObserver' in window)) return;
    elements = Array.from(container.querySelectorAll<HTMLElement>('[data-reveal]'));
    try {
      preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      preference.addEventListener('change', followPreference);
      container.addEventListener('focusin', revealFocused);
      container.addEventListener('focusout', resetAfterFocus);
      if (!preference.matches) observeElements();
    } catch {
      showAll();
    }
  });

  onBeforeUnmount(() => {
    disposed = true;
    observer?.disconnect();
    visibility.clear();
    preference?.removeEventListener?.('change', followPreference);
    root.value?.removeEventListener('focusin', revealFocused);
    root.value?.removeEventListener('focusout', resetAfterFocus);
  });
}
