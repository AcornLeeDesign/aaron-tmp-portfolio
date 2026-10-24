// Use a bounded lookahead for large, unchanged case-study images. Native image
// lazy loading can fetch several screens ahead on 4G and crowd out the hero.
export function useNearViewport() {
  const target = ref<HTMLElement>()
  const ready = ref(false)
  let observer: IntersectionObserver | undefined

  function observe() {
    observer?.disconnect()
    if (ready.value || !target.value) return
    observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      ready.value = true
      observer?.disconnect()
    }, { rootMargin: `${Math.round(window.innerHeight / 4)}px 0px` })
    observer.observe(target.value)
  }

  onMounted(() => {
    observe()
    window.addEventListener('resize', observe)
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    window.removeEventListener('resize', observe)
  })
  return { target, ready }
}
