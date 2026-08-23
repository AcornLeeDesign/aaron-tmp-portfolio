<template>
  <div class="site">
    <header class="header">
      <NuxtLink to="/" class="header__name">Aaron Lee Tmp Portfolio</NuxtLink>
    </header>

    <main class="main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.site {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px var(--page-padding) 0;
  white-space: nowrap;
}

.header__name {
  font-size: var(--text-sm);
  font-weight: 500;
}

.main {
  flex: 1;
}
</style>
