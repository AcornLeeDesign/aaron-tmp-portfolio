<script setup lang="ts">
const pacificTime = ref('--:--:-- PST')
let clockTimer: ReturnType<typeof setInterval> | undefined

function updatePacificTime() {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date())

  pacificTime.value = `${time} PST`
}

onMounted(() => {
  updatePacificTime()
  clockTimer = window.setInterval(updatePacificTime, 1000)
})

onBeforeUnmount(() => {
  if (clockTimer !== undefined) {
    window.clearInterval(clockTimer)
  }
})
</script>

<template>
  <div class="site">
    <header class="header">
      <div class="header__identity text-primary">
        <span>Aaron Lee</span>
        <span class="header__subdued">Product designer, digital artist</span>
      </div>

      <nav class="header__nav" aria-label="Primary navigation">
        <NuxtLink to="/" class="header__mark-link" aria-label="Aaron Lee home">
          <img src="/icons/header-mark.svg" alt="" />
        </NuxtLink>
        <HeaderNavButton to="/#work">Work</HeaderNavButton>
        <HeaderNavButton to="/#about">About</HeaderNavButton>
      </nav>

      <div class="header__location text-primary">
        <time class="header__time" aria-label="Current Pacific time">
          {{ pacificTime }}
        </time>
        <span class="header__subdued">Los Angeles, San Francisco</span>
      </div>

      <address class="header__contacts text-primary" aria-label="Contact Aaron Lee">
        <a href="mailto:alee9193@usc.edu">alee9193@usc.edu</a>
        <a href="https://x.com/acorn_lee_" target="_blank" rel="noopener noreferrer">X</a>
        <a href="https://www.linkedin.com/in/aaaronlee/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </address>
    </header>

    <main class="main">
      <slot />
    </main>

    <SoundGradientStrip />
  </div>
</template>

<style scoped>
.site {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}

.header {
  position: fixed;
  z-index: 2147483647;
  top: var(--space-m);
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 var(--layout-content-edge);
  background-color: transparent;
  pointer-events: none;
}

.header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-s);
  pointer-events: auto;
}

.header__identity,
.header__location {
  position: fixed;
  top: var(--space-m);
  display: flex;
  flex-direction: column;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
  white-space: nowrap;
}

.header__identity {
  left: var(--layout-content-edge);
  align-items: flex-start;
  text-align: left;
}

.header__location {
  right: var(--layout-content-edge);
  align-items: flex-end;
  text-align: right;
}

.header__time {
  font-variant-numeric: tabular-nums;
}

.header__subdued {
  color: var(--color-subdued);
  transition: color var(--transition-theme);
}

.header__mark-link {
  display: flex;
  height: var(--control-height);
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-l);
  border-radius: var(--radius-pill);
  background-color: var(--color-nav-surface);
  transition:
    background-color var(--transition-fast),
    transform 100ms ease-out;
}

.header__mark-link img {
  transition: filter var(--transition-theme);
}

.header__mark-link:hover {
  background-color: var(--color-nav-surface-hover);
}

.header__mark-link:active {
  transform: scale(0.97);
}

.header__contacts {
  position: fixed;
  right: var(--layout-content-edge);
  bottom: var(--space-m);
  display: flex;
  align-items: center;
  gap: var(--space-m);
  font-size: var(--font-size-s);
  font-style: normal;
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
  color: var(--color-sound-overlay-text);
  pointer-events: auto;
  white-space: nowrap;
}

.header__contacts a {
  transition: opacity var(--transition-fast);
}

.header__contacts a:hover {
  opacity: 0.5;
}

.main {
  position: relative;
  z-index: 0;
  isolation: isolate;
  flex: 1;
}

@media (max-width: 767px) {
  .header {
    top: calc(var(--space-xxxl) + var(--space-xl));
  }

  .header__identity,
  .header__location {
    font-size: var(--font-size-xs);
  }
}

@media (max-width: 359px) {
  .header__identity,
  .header__location {
    font-size: var(--font-size-xxs);
  }
}
</style>
