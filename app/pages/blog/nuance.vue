<script setup lang="ts">
useHead({ title: 'Nuance — Aaron Lee' })
</script>

<template>
  <article class="blog">
    <div class="blog__video">
      <magic-player-provider
        id="blog-nuance-player"
        :options="{
          src: '/videos/nuance_pure.mp4',
          autoplay: true,
          loop: true,
          muted: true,
        }"
      >
        <magic-player-video />
        <magic-player-video-controls />
      </magic-player-provider>
    </div>

    <div class="blog__video blog__video--landscape">
      <magic-player-provider
        id="blog-nuance-mock-call"
        :options="{ src: '/videos/mock_call.mp4', autoplay: true, loop: true, muted: true }"
      >
        <magic-player-video />
        <magic-player-video-controls />
      </magic-player-provider>
    </div>

    <div class="blog__video blog__video--portrait">
      <magic-player-provider
        id="blog-nuance-recent-call"
        :options="{ src: '/videos/recent_call.mp4', autoplay: true, loop: true, muted: true }"
      >
        <magic-player-video />
        <magic-player-video-controls />
      </magic-player-provider>
    </div>

    <div class="blog__video blog__video--portrait">
      <magic-player-provider
        id="blog-nuance-mood-set"
        :options="{ src: '/videos/mood_set.mp4', autoplay: true, loop: true, muted: true }"
      >
        <magic-player-video />
        <magic-player-video-controls />
      </magic-player-provider>
    </div>

    <div class="blog__video blog__video--portrait">
      <magic-player-provider
        id="blog-nuance-home-screen"
        :options="{ src: '/videos/home_screen.mp4', autoplay: true, loop: true, muted: true }"
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
  aspect-ratio: 1 / 1;
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

.blog__video--landscape {
  aspect-ratio: 1920 / 1080;
}

.blog__video--portrait {
  aspect-ratio: 1818 / 1582;
}

</style>
