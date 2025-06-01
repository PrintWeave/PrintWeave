<script setup lang="ts">
import Logo from "@/components/Logo.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
import {loggedInUser, logout} from "@/helpers/auth";
import type {IUser} from "@printweave/api-types";

// Reference to dropdown menu state
const isDropdownOpen = ref(false);

const router = useRouter();

// User information - you may want to get this from your auth system
const user: IUser | null = loggedInUser

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const handleLogout = async () => {
  await logout();
  router.push("/login");
};

// Close dropdown when clicking outside
const closeDropdown = (e: MouseEvent) => {
  if (isDropdownOpen.value) {
    isDropdownOpen.value = false;
  }
};
</script>

<template>
  <header class="bg-gray-50 shadow">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <router-link class="flex items-center gap-2" to="/">
        <Logo class="h-8 w-8 text-primary"/>
        <h1 class="text-xl font-semibold">Printweave</h1>
      </router-link>

      <div class="flex items-center gap-4">
        <!-- Dashboard button -->
        <RouterLink
            to="/dashboard"
            class="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Dashboard
        </RouterLink>

        <!-- User Avatar with dropdown -->
        <div class="relative">
          <button
            @click="toggleDropdown"
            class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium overflow-hidden focus:outline-none"
            :aria-expanded="isDropdownOpen"
            aria-haspopup="true"
          >
            <img v-if="user?.avatar" :src="user?.avatar" alt="User avatar" class="h-full w-full object-cover" />
            <span v-else class="text-gray-600">{{ user?.username.charAt(0) }}</span>
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="isDropdownOpen"
            @click.outside="closeDropdown"
            class="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-10 divide-y divide-gray-100"
          >
            <div class="px-4 py-3">
              <p class="text-sm font-medium">{{ user?.username }}</p>
              <!-- You can add user email or other info here -->
            </div>
            <div class="py-1">
              <span to="/profile" class="block px-4 py-2 text-sm text-gray-400 " disabled>
<!--                hover:bg-gray-100-->
                Profile
              </span>
              <span to="/settings" class="block px-4 py-2 text-sm text-gray-400" disabled>
                Settings
              </span>
            </div>
            <div class="py-1">
              <button
                @click="handleLogout"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <main class="flex flex-col items-center container mx-auto px-4 pb-8 pt-18 min-h-screen bg-background -mt-18">
    <slot />
  </main>
</template>

<style scoped>
/* Add any additional styles you need */
</style>
