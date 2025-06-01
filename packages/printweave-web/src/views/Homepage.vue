<template>
  <SwitchLayout class="min-h-screen bg-background  justify-center flex flex-col">
    <div class="max-w-4xl mx-auto space-y-8 my-auto">
      <!-- Welcome Section -->
      <div class="text-center space-y-4">
        <h2 class="text-3xl font-bold tracking-tight">Welcome to Your 3D Printing Hub</h2>
        <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
          Monitor your 3D printers, manage print jobs, and track your printing progress all in one place. Get
          real-time updates and control your entire 3D printing workflow.
        </p>
      </div>

      <!-- Feature Cards -->
      <div class="grid md:grid-cols-3 gap-6">
        <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div class="flex flex-col space-y-1.5 p-6 text-center">
            <Activity class="h-8 w-8 mx-auto text-primary mb-2"/>
            <h3 class="text-lg font-semibold leading-none tracking-tight">Real-time Monitoring</h3>
          </div>
          <div class="p-6 pt-0">
            <p class="text-sm text-muted-foreground text-center">
              Track your printer status, temperature, and print progress in real-time with live updates.
            </p>
          </div>
        </div>

        <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div class="flex flex-col space-y-1.5 p-6 text-center">
            <FileText class="h-8 w-8 mx-auto text-primary mb-2"/>
            <h3 class="text-lg font-semibold leading-none tracking-tight">Job Management</h3>
          </div>
          <div class="p-6 pt-0">
            <p class="text-sm text-muted-foreground text-center">
              Upload, queue, and manage your 3D print files. Schedule prints and organize your workflow.
            </p>
          </div>
        </div>

        <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div class="flex flex-col space-y-1.5 p-6 text-center">
            <Settings class="h-8 w-8 mx-auto text-primary mb-2"/>
            <h3 class="text-lg font-semibold leading-none tracking-tight">Remote Control</h3>
          </div>
          <div class="p-6 pt-0">
            <p class="text-sm text-muted-foreground text-center">
              Control your printers remotely, adjust settings, and manage multiple devices from anywhere.
            </p>
          </div>
        </div>
      </div>

      <!-- Getting Started -->
      <div class="rounded-lg border bg-muted/50 text-card-foreground shadow-sm">
        <div class="flex flex-col space-y-1.5 p-6">
          <h3 class="text-2xl font-semibold leading-none tracking-tight">Getting Started</h3>
          <p class="text-sm text-muted-foreground">Ready to start managing your 3D printers? Here's what you can do:</p>
        </div>
        <div class="p-6 pt-0 space-y-2">
          <ul class="space-y-2 text-sm">
            <li class="flex items-center gap-2">
              <div class="h-1.5 w-1.5 bg-primary rounded-full"></div>
              Connect your 3D printers to the dashboard
            </li>
            <li class="flex items-center gap-2">
              <div class="h-1.5 w-1.5 bg-primary rounded-full"></div>
              Upload your first 3D model files
            </li>
            <li class="flex items-center gap-2">
              <div class="h-1.5 w-1.5 bg-primary rounded-full"></div>
              Monitor print progress and receive notifications
            </li>
            <li class="flex items-center gap-2">
              <div class="h-1.5 w-1.5 bg-primary rounded-full"></div>
              Manage print queues and schedules
            </li>
          </ul>
        </div>
      </div>
    </div>
  </SwitchLayout>
</template>

<style scoped>
/* Custom styles if needed */
.bg-background {
  background-color: hsl(0 0% 100%);
}

.text-primary {
  color: hsl(222.2 84% 4.9%);
}

.bg-primary {
  background-color: hsl(222.2 84% 4.9%);
}

.text-primary-foreground {
  color: hsl(210 40% 98%);
}

.hover\:bg-primary\/90:hover {
  background-color: hsl(222.2 84% 4.9% / 0.9);
}

.text-muted-foreground {
  color: hsl(215.4 16.3% 46.9%);
}

.bg-card {
  background-color: hsl(0 0% 100%);
}

.text-card-foreground {
  color: hsl(222.2 84% 4.9%);
}

.bg-muted\/50 {
  background-color: hsl(210 40% 96% / 0.5);
}

.border {
  border: 1px solid hsl(214.3 31.8% 91.4%);
}

.shadow-sm {
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}
</style>
<script setup>
import LogedoutLayout from "@/layouts/LogedoutLayout.vue";
import SwitchLayout from "@/layouts/SwitchLayout.vue";
</script>
