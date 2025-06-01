<template>
  <LogedoutLayout class="justify-center flex flex-col h-full">
    <div class="w-full max-w-md my-auto">
      <!-- Login Card -->
      <div class="bg-white rounded-xl shadow-xl border border-gray-200 p-8">
        <div class="text-center mb-6">
          <div class="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <User class="h-8 w-8 text-blue-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p class="text-gray-600">Sign in to access your 3D printer dashboard</p>
        </div>

        <!-- Login Tabs -->
        <div class="mb-6">
          <div class="flex border-b border-gray-200">
            <button
              @click="activeTab = 'username'"
              :class="['flex-1 py-3 font-medium text-sm text-center',
                activeTab === 'username' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700']"
            >
              Username
            </button>
            <button
              @click="activeTab = 'email'"
              :class="['flex-1 py-3 font-medium text-sm text-center',
                activeTab === 'email' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700']"
            >
              Email
            </button>
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Username Field - shown when username tab is active -->
          <div v-if="activeTab === 'username'">
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div class="relative">
              <User class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                  id="username"
                  v-model="form.username"
                  type="text"
                  required
                  class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your username"
              />
            </div>
          </div>

          <!-- Email Field - shown when email tab is active -->
          <div v-if="activeTab === 'email'">
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  required
                  class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email address"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
              />
              <button
                  type="button"
                  @click="togglePassword"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Eye v-if="!showPassword" class="h-5 w-5" />
                <EyeOff v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input
                  v-model="form.rememberMe"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <button
                type="button"
                @click="forgotPassword"
                class="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot password?
            </button>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="text-red-500 text-sm text-center py-2">
            {{ errorMessage }}
          </div>

          <!-- Login Button -->
          <button
              type="submit"
              :disabled="isLoading"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Loader2 v-if="isLoading" class="h-5 w-5 animate-spin" />
            <span>{{ isLoading ? 'Signing In...' : 'Sign In' }}</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <p class="text-center text-sm text-gray-600">
            Don't have an account?
            <button
                @click="goToSignup"
                class="text-blue-600 hover:text-blue-700 font-medium ml-1"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  </LogedoutLayout>
</template>

<script setup>
import {ref, reactive, onMounted} from 'vue'
import {
  Printer,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2
} from 'lucide-vue-next'
import LogedoutLayout from "@/layouts/LogedoutLayout.vue";
import { login } from "@/helpers/api.js";

// check if the user is logged in
import { isLoggedIn } from "@/helpers/auth.js";



// Tab state
const activeTab = ref('username')

// Form state
const form = reactive({
  username: '',
  email: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Methods
const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    // Create credentials based on active tab
    const credentials = {
      password: form.password,
      rememberMe: form.rememberMe
    }

    // Add either username or email based on active tab
    if (activeTab.value === 'username') {
      credentials.username = form.username
    } else {
      credentials.email = form.email
    }

    const response = await login(credentials)

    if (response.status >= 400) {
      throw new Error(response.data?.message || 'Login failed')
    }

    if (response.data?.token) {
      // Store the token for authenticated requests
      localStorage.setItem('auth_token', response.data.token)

      // Redirect to dashboard
      // TODO: Replace with actual router navigation
      window.location.href = '/dashboard'
    } else {
      throw new Error('No token received')
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.message || 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const forgotPassword = () => {
  alert('Forgot password functionality would be implemented here')
}

const goToSignup = () => {
  alert('Redirect to signup page')
}

const goBack = () => {
  // This would typically use Vue Router
  alert('Navigate back to homepage')
}

onMounted(async () => {
  // Check if user is already logged in
  const loggedIn = await isLoggedIn()
  if (loggedIn) {
    // Redirect to dashboard if already logged in
    window.location.href = '/dashboard'
  }
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Focus styles */
input:focus {
  outline: none;
}

/* Checkbox custom styling */
input[type="checkbox"]:checked {
  background-color: rgb(37 99 235);
  border-color: rgb(37 99 235);
}

/* Button disabled state */
button:disabled {
  cursor: not-allowed;
}

/* Smooth transitions */
* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
