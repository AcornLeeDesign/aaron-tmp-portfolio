<script setup lang="ts">
const sheet = ref<{ open: () => void } | null>(null)
defineExpose({ open: () => sheet.value?.open() })
</script>

<template>
  <OverlaySheet id="about-sheet" ref="sheet" label="About Aaron Lee" close-label="Close About">
    <div class="about-sheet__portrait">
      <img src="/images/about/aaron-portrait.png" alt="Aaron Lee smiling" width="177" height="162" />
    </div>
    <div class="about-sheet__sections">
      <section class="about-sheet__section">
        <h2>Many paths to a destination</h2>
        <p>There is always a more elegant solution. There is also timing, technology, business goals, and cost. The constant pursuit of a “better way” will lead us closer and closer to the asymptote. I push for the asymptote, for the idea that there are many methods to the madness. <span>There is room for design.</span></p>
      </section>
      <section class="about-sheet__section">
        <h2>Sustaining curiosity</h2>
        <p>Through being in creative communities and content I interact with, I believe too much emphasis is placed on sparking curiosity and too little is placed on <em>sustaining</em> it. Some children can discover a spatula and go on to discover all sorts of dishes naturally. Others find passion by connecting with people consistently. <span>There is room for design.</span></p>
      </section>
      <section class="about-sheet__section">
        <h2>Building up people to build cities</h2>
        <p>“People systems” are the structures that sustain how people interact and behave together. I design each iMessage text to build confidence. I listen with my eyes and how I sit. I enable people to collaborate when the default is asking for approval. I serve a 55 person design org to build people-first leaders and get creatives employed. Cities are built through intentional conversations and systems that enable them. <span>There is room for design.</span></p>
      </section>
    </div>
  </OverlaySheet>
</template>

<style scoped>
.about-sheet__portrait {
  /* Preserve the Figma portrait crop. */
  --about-portrait-width: 177px;
  --about-portrait-height: 162px;
  display: flex;
  justify-content: center;
}
.about-sheet__portrait img {
  width: var(--about-portrait-width);
  height: var(--about-portrait-height);
  border-radius: var(--radius-xs);
  object-fit: cover;
}
.about-sheet__sections { display: flex; flex-direction: column; gap: var(--space-7); }
.about-sheet__section { display: flex; flex-direction: column; gap: var(--space-m); }
.about-sheet__section h2 {
  font-size: var(--font-size-l);
  font-weight: var(--font-weight-heading);
  letter-spacing: 0;
  line-height: var(--line-height-heading);
}
.about-sheet__section p { margin: 0; }
.about-sheet__section span { color: var(--color-subdued); }

@media (max-width: 639px) {
  .about-sheet__section h2 { font-size: var(--font-size-m); }
}

</style>
