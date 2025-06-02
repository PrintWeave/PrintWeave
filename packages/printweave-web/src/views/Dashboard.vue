<script setup lang="ts">

import LogedinLayout from "@/layouts/LogedinLayout.vue";
import {loggedInUser} from "@/helpers/auth.ts";
import {onMounted, ref} from "vue";
import {getPrinters, getPrinterStatuses} from "@/helpers/api.ts";
import type {IPrinter, PrinterStatus, PrinterStatusData} from "@printweave/api-types";

const printers = ref<PrinterStatusData[]>([]);

onMounted(async () => {
  await getPrinterStatuses().then(
      (response) => {
        printers.value = response?.data?.printerStatuses ? response.data.printerStatuses : [];
        // loggedInUser.value = response?.data?.user || null;
      }
  ).catch((error) => {
    console.error("Error fetching printers:", error);
  });
});

const toggleDropdown = (event: MouseEvent) => {
  event.stopPropagation();
  // Logic to toggle dropdown visibility
};

</script>

<template>
  <LogedinLayout>
    <div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      <div v-for="printer in printers" :key="printer.printerId" class="bg-white rounded-lg overflow-hidden shadow">
        <div class="h-44 w-full bg-gray-800 relative">
          <div>
            <div class="w-full h-full object-cover bg-reen-500 h-44"/>
            <!-- More options top right (3 dots) -->
            <button class="absolute top-2 right-2 rounded-full p-1 shadow focus:outline-none text-white hover:bg-gray-700 transition-colors"
                    @click.stop="toggleDropdown">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="1" fill="currentColor"/>
                <circle cx="19" cy="12" r="1" fill="currentColor"/>
                <circle cx="5" cy="12" r="1" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="p-4">
          <div class="flex">
            <h2 class="text-lg font-semibold mb-2">{{ printer.printer.name }}</h2>
            <div class="ml-auto flex items-center border-2 rounded-full px-2 h-fit my-auto"
                 :class="{ 'bg-green-200 text-green-900 border-green-500': printer.statusType === 'online', 'bg-red-200 text-red-900 border-red-500': printer.statusType === 'offline' }">
              <span class="text-sm">{{ printer.statusType }}</span>
            </div>
          </div>
          <p class="text-sm text-gray-600">Status: {{ printer.statusType }}</p>
        </div>
      </div>
    </div>
  </LogedinLayout>
</template>

<style scoped>

</style>
