<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const { public: { siteUrl } } = useRuntimeConfig()

useSeoMeta({
  ogImage: `${siteUrl}/og-image.png`,
  ogImageWidth: 782,
  ogImageHeight: 782,
  twitterCard: 'summary',
  twitterImage: `${siteUrl}/og-image.png`,
})
</script>
