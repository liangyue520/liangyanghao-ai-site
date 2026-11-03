<script setup lang="ts">
import SiteLayout from './layouts/SiteLayout.vue';
</script>
<template>
  <SiteLayout>
    <RouterView v-slot="{ Component, route }">
      <Transition name="page-emerge" :css="!route.path.startsWith('/admin')" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </SiteLayout>
</template>
