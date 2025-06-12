<script setup lang="ts">
const emit = defineEmits(['open-modal']);
</script>

<template>
  <div class="flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:shadow-lg transition p-8 h-full min-h-[200px]" @click="emit('open-modal')">
    <span class="text-4xl text-blue-600 mb-2">+</span>
    <span class="font-semibold text-gray-700">Add New Printer</span>
  </div>
</template>

<style scoped>
</style>

