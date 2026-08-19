<script setup lang="ts">
useHead({ title: 'Rabbithole — Aaron Lee' })
</script>

<template>
  <article class="blog">
    <div class="blog__video">
      <magic-player-provider
        id="blog-rabbithole-player"
        :options="{
          src: '/videos/rabbithole.mp4',
          autoplay: true,
          loop: true,
          muted: true,
        }"
      >
        <magic-player-video />
        <magic-player-video-controls />
      </magic-player-provider>
    </div>

  </article>
</template>

<style scoped>
.blog {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-inline: var(--page-padding);
  padding-bottom: 6rem;
  max-width: 840px;
  margin-inline: auto;
}

.blog__video {
  width: 100%;
  aspect-ratio: 2256 / 1464;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
}

.blog__video :deep(.magic-player-provider) {
  width: 100%;
  height: 100%;
}

.blog__video :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.blog__video :deep(.magic-player-video-controls) {
  opacity: 0;
  transition: opacity 250ms ease;
}

.blog__video:hover :deep(.magic-player-video-controls) {
  opacity: 1;
}

</style>
