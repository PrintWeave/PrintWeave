<script setup lang="ts">
import type {PrinterStatusData} from "@printweave/api-types";
import {ref} from "vue";

const props = defineProps<{
  printer: PrinterStatusData
}>();

let isDropdownOpen = ref(false);

const printerCard = ref<HTMLElement | null>(null);

document.addEventListener('click', (e: MouseEvent) => {
  if (isDropdownOpen.value && !(e.target as HTMLElement).closest('.dropdown')) {
    isDropdownOpen.value = false;
  }
});

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

</script>

<template>
  <div :key="printer.printerId" class="bg-white rounded-lg overflow-hidden shadow" id="printer-card" ref="printerCard">
    <div class="h-44 w-full  relative">
      <img v-if="printer.status && printer.status.image" :src="printer.status.image"
           class="w-full h-full object-cover h-44"/>
      <div v-else class="w-full h-full h-44 bg-gray-800 text-gray-200 flex flex-col items-center justify-center gap-2">
        <span class="text-white text-2xl font-bold">{{
            printer.printer.name.split(' ').map(word => word.charAt(0)).join('')
          }}</span>
        <span class="text-gray-200 font-bold text-xl">No Image Available</span>
      </div>
      <!--      &lt;!&ndash; More options top right (3 dots) &ndash;&gt;
            <button
                class="absolute top-2 right-2 rounded-full p-1 shadow focus:outline-none text-white hover:bg-gray-700 transition-colors"
                @click.stop="toggleDropdown">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                   xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="1" fill="currentColor"/>
                <circle cx="19" cy="12" r="1" fill="currentColor"/>
                <circle cx="5" cy="12" r="1" fill="currentColor"/>
              </svg>
            </button>-->
      <div v-if="isDropdownOpen" class="absolute right-2 top-10 bg-white shadow-lg rounded-md w-48 z-10">
        <ul class="py-1">
          <li class="px-4 py-2 hover:bg-gray-100 cursor-pointer">Edit</li>
          <li class="px-4 py-2 text-red-500 hover:bg-gray-100 cursor-pointer">Delete</li>
        </ul>
      </div>
    </div>
    <div class="p-3">
      <div class="flex">
        <h2 class="text-lg font-semibold">{{ printer.printer.name }}</h2>
        <div class="ml-auto flex items-center border-2 rounded-full px-2 h-fit my-auto"
             :class="{ 'bg-green-200 text-green-900 border-green-500': printer.statusType === 'online', 'bg-red-200 text-red-900 border-red-500': printer.statusType === 'offline' }">
          <span class="text-sm">{{ printer.statusType }}</span>
        </div>
      </div>
    </div>
    <!-- Progress bar      -->
    <div class="w-full bg-gray-200 h-8 relative">
      <div class="w-full flex items-center justify-between px-3 h-8 z-1" v-if="printer.status?.progress.percentage">
        <span class="text-sm text-gray-600">Progress</span>
        <span class="text-sm text-gray-600">{{
            printer.status?.progress.percentage ? `${printer.status.progress.percentage}%` : '0%'
          }}</span>
      </div>
      <div class="bg-green-600 h-8 top-0 z-0 left-0 absolute"
           :style="{ width: printer.status?.progress.percentage ? `${printer.status.progress.percentage}%` : '0%' }"></div>
      <div v-if="printer.status?.progress.percentage"
           class="w-full flex items-center justify-between px-3 h-8 absolute top-0 left-0 "
           :style="'clip-path: polygon(0% 0%, ' + printer.status?.progress.percentage + '% 0%, ' + printer.status?.progress.percentage + '% 100%, 0% 100%)'">
        <span class="text-sm text-white">Progress</span>
        <span class="text-sm text-white">{{
            printer.status?.progress.percentage ? `${printer.status.progress.percentage}%` : '0%'
          }}</span>
      </div>
      <!-- Show offline      -->
      <div v-if="printer.statusType === 'offline'" class="absolute top-0 left-0 w-full h-full bg-red-600 bg-opacity-50 flex items-center justify-center">
        <span class="text-white text-lg font-bold">Offline</span>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
