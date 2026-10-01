<template>
  <div class="progressive-bottom-blur" aria-hidden="true">
    <span class="progressive-bottom-blur__layer progressive-bottom-blur__layer--1" />
    <span class="progressive-bottom-blur__layer progressive-bottom-blur__layer--2" />
    <span class="progressive-bottom-blur__layer progressive-bottom-blur__layer--3" />
    <span class="progressive-bottom-blur__layer progressive-bottom-blur__layer--4" />
    <span class="progressive-bottom-blur__layer progressive-bottom-blur__layer--5" />
  </div>
</template>

<style scoped>
.progressive-bottom-blur {
  position: fixed;
  z-index: 3;
  right: 0;
  bottom: 0;
  left: 0;
  height: var(--case-study-bottom-blur-height);
  overflow: hidden;
  pointer-events: none;
}

.progressive-bottom-blur__layer {
  position: absolute;
  inset: 0;
  -webkit-backdrop-filter: blur(var(--progressive-blur-strength));
  backdrop-filter: blur(var(--progressive-blur-strength));
  -webkit-mask-image: var(--progressive-blur-mask);
  mask-image: var(--progressive-blur-mask);
}

.progressive-bottom-blur__layer--1 {
  --progressive-blur-strength: var(--blur-progressive-1);
  --progressive-blur-mask: linear-gradient(
    to bottom,
    transparent 0%,
    black 20%,
    black 40%,
    transparent 60%
  );
}

.progressive-bottom-blur__layer--2 {
  --progressive-blur-strength: var(--blur-progressive-2);
  --progressive-blur-mask: linear-gradient(
    to bottom,
    transparent 20%,
    black 40%,
    black 60%,
    transparent 80%
  );
}

.progressive-bottom-blur__layer--3 {
  --progressive-blur-strength: var(--blur-progressive-3);
  --progressive-blur-mask: linear-gradient(
    to bottom,
    transparent 40%,
    black 60%,
    black 80%,
    transparent 100%
  );
}

.progressive-bottom-blur__layer--4 {
  --progressive-blur-strength: var(--blur-progressive-4);
  --progressive-blur-mask: linear-gradient(
    to bottom,
    transparent 60%,
    black 80%,
    black 100%
  );
}

.progressive-bottom-blur__layer--5 {
  --progressive-blur-strength: var(--blur-progressive-5);
  --progressive-blur-mask: linear-gradient(
    to bottom,
    transparent 80%,
    black 100%
  );
}
</style>
