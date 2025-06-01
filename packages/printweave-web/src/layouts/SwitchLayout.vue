<script setup lang="ts" async>

import LogedoutLayout from "@/layouts/LogedoutLayout.vue";
import {isLoggedIn} from "@/helpers/auth.ts";
import LogedinLayout from "@/layouts/LogedinLayout.vue";
import {onMounted, ref} from "vue";

const loggedIn = ref(false);

onMounted(async () => {
  loggedIn.value = await isLoggedIn();
});

</script>

<template>
  <LogedoutLayout v-if="!loggedIn">
    <slot/>
  </LogedoutLayout>
  <LogedinLayout v-else>
    <slot/>
  </LogedinLayout>
</template>

<style scoped>

</style>
