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

const siteTitle = 'Aaron Lee'
const siteDescription = 'Aaron Lee is a product designer and digital artist based in Los Angeles and San Francisco. He\'s constantly learning about systems design and organizational psychology. God designed him with fingers and so his fingers will be designing too.'

useSeoMeta({
  title: siteTitle,
  applicationName: siteTitle,
  ogSiteName: siteTitle,
  ogTitle: siteTitle,
  twitterTitle: siteTitle,
  description: siteDescription,
  ogDescription: siteDescription,
  twitterDescription: siteDescription,
  ogImage: `${siteUrl}/og-image.png`,
  ogImageWidth: 782,
  ogImageHeight: 782,
  twitterCard: 'summary',
  twitterImage: `${siteUrl}/og-image.png`,
})
</script>
