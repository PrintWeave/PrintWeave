<script setup lang="ts">

import LogedinLayout from "@/layouts/LogedinLayout.vue";
import {loggedInUser} from "@/helpers/auth.ts";
import {onMounted, ref} from "vue";
import {getPrinters} from "@/helpers/api.ts";
import type {IPrinter} from "@printweave/api-types";

const printers = ref<IPrinter[]>([]);

onMounted(async () => {
  await getPrinters().then(
      (response) => {
        printers.value = response?.data?.printers? response.data.printers : [];
        loggedInUser.value = response?.data?.user || null;
      }
  ).catch((error) => {
    console.error("Error fetching printers:", error);
  });
});

</script>

<template>
  <LogedinLayout>
    {{printers}}
  </LogedinLayout>
</template>

<style scoped>

</style>
