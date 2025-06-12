<script setup lang="ts">

import LogedinLayout from "@/layouts/LogedinLayout.vue";
import {loggedInUser} from "@/helpers/auth.ts";
import {onMounted, ref} from "vue";
import {getPrinters, getPrinterStatuses} from "@/helpers/api.ts";
import type {IPrinter, PrinterStatus, PrinterStatusData} from "@printweave/api-types";
import PrinterCard from "@/components/PrinterCard.vue";
import CreateNewPrinterCard from "@/components/CreateNewPrinterCard.vue";
import CreateNewPrinterModal from "@/components/CreateNewPrinterModal.vue";
import {usePrinterStore} from "@/store";

const printers = ref<PrinterStatusData[]>([]);

onMounted(async () => {
  await usePrinterStore().initializeWebSocket()

  usePrinterStore().fetchPrinterStatuses()
});


</script>

<template>
  <LogedinLayout>
    <CreateNewPrinterModal v-model:show="usePrinterStore().createPrinterModalOpen" @created="usePrinterStore().fetchPrinterStatuses" />
    <div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      <router-link v-for="printer in usePrinterStore().printerStatuses" :key="printer.printerId"
                   :to="`dashboard/printer/${printer.printerId}`" class="no-underline hover:cursor-pointer hover:shadow-xl hover:scale-100 scale-95 transition-all">
        <PrinterCard
            :printer="<PrinterStatusData>printer"/>
      </router-link>
      <CreateNewPrinterCard @open-modal="usePrinterStore().openCreatePrinterModal"/>
    </div>
  </LogedinLayout>
</template>

<style scoped>

</style>
