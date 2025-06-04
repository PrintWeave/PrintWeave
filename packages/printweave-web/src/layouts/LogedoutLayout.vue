<script setup lang="ts">
import Logo from "@/components/Logo.vue";
</script>

<template>
  <header class="bg-gray-50 shadow sticky top-0 z-50">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <router-link class="flex items-center gap-2" to="/">
        <Logo class="h-8 w-8 text-primary"/>
        <h1 class="text-xl font-semibold">Printweave</h1>
      </router-link>

      <div class="flex items-center gap-4">
<!--        <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">

        </div>-->
        <RouterLink
            to="/login"
            class="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Login
        </RouterLink>
      </div>
    </div>
  </header>

  <main class="flex flex-col items-center  container mx-auto px-4 pb-8 pt-18 min-h-screen bg-background  -mt-18">
    <!-- Make the content centered in the screen if it doesnt reach the end    -->
      <slot class="bg-red-500" />
  </main>
</template>

<style scoped>

</style>
