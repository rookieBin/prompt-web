<script setup lang="ts">
</script>

<template>
  <el-config-provider namespace="ep">
    <BaseHeader />
    <div class="main-container">
      <div w="full" py="4">
        <RouterView />
      </div>
    </div>
  </el-config-provider>
</template>

<style>
#app {
  text-align: center;
  color: var(--ep-text-color-primary);
}

.main-container {
  min-height: calc(100vh - var(--ep-menu-item-height));
  background: var(--ep-fill-color-extra-light);
}
</style>
