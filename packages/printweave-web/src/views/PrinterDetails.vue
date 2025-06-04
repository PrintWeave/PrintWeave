<template>
  <LogedinLayout>
    <!-- Main Content -->
    <main class="container mx-auto px-4 lg:px-0 flex-1">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4 mt-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Printer Details</h2>
          <p class="text-gray-600" v-if="printer">Name: {{ printer.name }}</p>
        </div>

        <div class="flex gap-3">
          <button v-if="!isPaused"
                  class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                  @click="togglePause"
          >
            <Pause class="h-4 w-4"/>
            Pause Print
          </button>
          <button v-else
                  class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                  @click="togglePause">
            <Play class="h-4 w-4"/>
            Resume Print
          </button>

          <button
              class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
              @click="cancelPrint"
          >
            <AlertOctagon class="h-4 w-4"/>
            Cancel Print
          </button>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Left Column -->
        <div class="md:col-span-2 space-y-6">
          <!-- Live Camera -->
          <div class="bg-white rounded-xl shadow-md border border-gray-200 p-5">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera class="h-5 w-5 text-blue-600"/>
              Live Camera Feed
            </h3>
            <div class="relative w-full" style="padding-top: 56.25%;">
              <div class="absolute inset-0 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                <img
                    @load="cameraConnected = true"
                    :src="cameraFeedUrl"
                    alt="Camera Feed"
                    class="w-full h-full object-contain rounded"
                    :class="{'hidden': !cameraConnected}"
                />
                <div v-if="!cameraConnected" class="text-center p-6">
                  <CameraOff class="h-12 w-12 text-gray-400 mx-auto mb-3"/>
                  <p class="text-gray-400">Camera not connected</p>
                  <button
                      @click="connectCamera"
                      class="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Connect Camera
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Print Progress -->
          <div class="bg-white rounded-xl shadow-md border border-gray-200 p-5">
            <div class="flex">
              <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                <Timer class="h-5 w-5 text-blue-600"/>
                Print Progress
              </h3>
              <h2 class="ml-auto text-lg font-semibold text-gray-900">
                {{ printProgress.fileName }}
              </h2>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-4">
              <div class="bg-gradient-to-r from-blue-500 to-blue-700 h-4 rounded-full"
                   :style="{ width: printProgress.percentage + '%' }"></div>
            </div>
            <p class="text-sm mt-3">{{ printProgress.percentage }}% - Layer {{ printProgress.currentLayer }} of
              {{ printProgress.totalLayers }} - ETA: {{ formattedRemainingTime }} - Finished at
              {{ finishedAtTimeFormatted }}</p>
            <div class="mt-4 flex space-x-3">
              <button v-if="!isPaused"
                      class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                      @click="togglePause">
                <Pause class="h-4 w-4"/>
                Pause
              </button>
              <button v-else
                      class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                      @click="togglePause">
                <Play class="h-4 w-4"/>
                Resume
              </button>
              <button
                  class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                  @click="cancelPrint">
                <AlertOctagon class="h-4 w-4"/>
                Cancel
              </button>
            </div>
          </div>

          <!-- Temperature Status -->
          <div class="bg-white rounded-xl shadow-md border border-gray-200 p-5">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <Thermometer class="h-5 w-5 text-blue-600"/>
              Temperature
            </h3>
            <div class="grid grid-cols-1 gap-6">
              <div v-for="hotend in temperatures.hotends || []" :key="hotend.current"
                   class="grid lg:grid-cols-2 grid-cols-1  lg:gap-6  gap-3 p-2 border-gray-200 border-2 rounded-lg">
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">Hotend {{ hotend.index + 1 }}</span>
                    <span class="text-sm font-medium text-gray-900">{{ hotend.current }}°C / {{
                        hotend.target
                      }}°C</span>
                  </div>
                  <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
                        :style="{ width: (hotend.current / hotend.target) * 100 + '%' }"
                    ></div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button class="p-1 rounded-md hover:bg-gray-100" @click="adjustTemperature('hotend', -5)">
                    <Minus class="h-4 w-4 text-gray-600"/>
                  </button>
                  <input
                      type="number"
                      v-model.number="hotend.target"
                      class="border rounded-md p-2 w-full text-center"
                      placeholder="215"
                  />
                  <button class="p-1 rounded-md hover:bg-gray-100" @click="adjustTemperature('hotend', 5)">
                    <Plus class="h-4 w-4 text-gray-600"/>
                  </button>
                </div>
              </div>
              <div class="grid lg:grid-cols-2 grid-cols-1  lg:gap-6 gap-3 p-2 border-gray-200 border-2 rounded-lg">
                <div>
                  <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">Bed</span>
                    <span class="text-sm font-medium text-gray-900">{{
                        temperatures.bed.current
                      }}°C / {{ temperatures.bed.target }}°C</span>
                  </div>
                  <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                        :style="{ width: ( temperatures.bed.current /  temperatures.bed.target) * 100 + '%' }"
                    ></div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button class="p-1 rounded-md hover:bg-gray-100" @click="adjustTemperature('bed', -5)">
                    <Minus class="h-4 w-4 text-gray-600"/>
                  </button>
                  <input
                      type="number"
                      v-model.number=" temperatures.bed.target"
                      class="border rounded-md p-2 w-full text-center"
                      placeholder="215"
                  />
                  <button class="p-1 rounded-md hover:bg-gray-100" @click="adjustTemperature('bed', 5)">
                    <Plus class="h-4 w-4 text-gray-600"/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="space-y-6">
          <!-- Motion Control -->
          <div class="bg-white rounded-xl shadow-md border border-gray-200 p-5"
               :class="{ 'opacity-60 pointer-events-none': isPrinting }">
            <div class="flex items-center gap-2 mb-4">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <Move class="h-5 w-5 text-blue-600"/>
                Motion Control
              </h3>
              <span v-if="isPrinting" class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md ml-auto">
                Disabled during printing
              </span>
            </div>

            <!-- XY Movement Controls -->
            <div class="flex justify-center items-center gap-12 mb-4">
              <div class="grid grid-cols-5 gap-2 h-fit my-auto w-fit">
                <div></div>
                <button class="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                        @click="moveAxis('y', movementDistance)">
                  <ArrowUp class="h-6 w-6 text-gray-700"/>
                </button>
                <div></div>
                <div></div> <!-- Empty cell for alignment -->
                <button class="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                        @click="moveAxis('z', movementDistance)">
                  <ArrowUp class="h-6 w-6 text-gray-700"/>
                </button>
                <!--                <div></div>-->
                <button class="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                        @click="moveAxis('x', -movementDistance)">
                  <ArrowLeft class="h-6 w-6 text-gray-700"/>
                </button>
                <button class="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                        @click="homeAxes(['x', 'y', 'z'])">
                  <Home class="h-6 w-6 text-gray-700"/>
                </button>
                <button class="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                        @click="moveAxis('x', movementDistance)">
                  <ArrowRight class="h-6 w-6 text-gray-700"/>
                </button>
                <div></div>

                <span class="p-3 bg-blue-100 rounded-lg flex items-center justify-center font-medium">
                  Z
                </span>
                <!--                <div></div>-->
                <!--                <button class="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                                        @click="homeAxes(['x', 'y'])">
                                  <PowerOff class="h-6 w-6 text-gray-700"/>
                                </button>-->
                <div></div>
                <button class="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                        @click="moveAxis('y', -movementDistance)">
                  <ArrowDown class="h-6 w-6 text-gray-700"/>
                </button>
                <div></div>
                <div></div>
                <button class="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                        @click="moveAxis('z', -movementDistance)">
                  <ArrowDown class="h-6 w-6 text-gray-700"/>
                </button>
              </div>
            </div>

            <!-- Movement Distance -->
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Movement Distance</label>
              <div class="flex gap-2">
                <button
                    v-for="distance in [0.1, 1, 10, 50, 100]"
                    :key="distance"
                    @click="movementDistance = distance"
                    :class="[
                    'flex-1 py-1 rounded-md text-sm font-medium transition-all',
                    movementDistance === distance
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  {{ distance }} mm
                </button>
              </div>
            </div>

            <!-- Extrusion Controls -->
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Extrusion Control</label>
              <div class="flex flex-col gap-3">
                <div class="grid grid-cols-3 gap-3">
                  <button
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                      @click="extrudeFilament"
                  >
                    <ArrowDownCircle class="h-4 w-4"/>
                    Extrude
                  </button>
                  <input
                      type="number"
                      v-model.number="extrusionAmount"
                      class="border rounded-md p-2 text-center"
                      placeholder="5"
                      min="0.1"
                      step="0.1"
                  />
                  <button
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                      @click="retractFilament"
                  >
                    <ArrowUpCircle class="h-4 w-4"/>
                    Retract
                  </button>
                </div>
                <div class="flex gap-2">
                  <button
                      v-for="amount in [0.1, 1, 5, 10, 25]"
                      :key="amount"
                      @click="extrusionAmount = amount"
                      :class="[
                        'flex-1 py-1 rounded-md text-sm font-medium transition-all',
                        extrusionAmount === amount
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      ]"
                  >
                    {{ amount }} mm
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Fan Control -->
          <div class="bg-white rounded-xl shadow-md border border-gray-200 p-5">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <Fan class="h-5 w-5 text-blue-600"/>
              Fan Control
            </h3>
            <div class="space-y-4">
              <div v-for="fan in fans" :key="fan.fan" class="space-y-2">
                <div class="flex justify-between mb-1">
                  <span class="text-sm font-medium text-gray-700">{{ fan.name }}</span>
                  <span class="text-sm font-medium text-gray-900">{{ fan.speed }}%</span>
                </div>
                <input
                    type="range"
                    class="w-full"
                    min="0"
                    max="100"
                    :value="fan.speed"
                    step="5"
                    @input="setFanSpeed(fan.fan, $event.target.value)"
                />
                <div class="flex justify-between mt-2">
                  <button class="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded-md text-gray-700"
                          @click="setFanSpeed(fan.fan, 0)">
                    Off
                  </button>
                  <button class="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded-md text-gray-700"
                          @click="setFanSpeed(fan.fan, 100)">
                    Max
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Misc Controls -->
          <div class="bg-white rounded-xl shadow-md border border-gray-200 p-5">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings class="h-5 w-5 text-blue-600"/>
              Other Controls
            </h3>
            <div class="grid grid-cols-1 gap-3">
              <button
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  @click="extrudeFilament"
              >
                <ArrowDownCircle class="h-4 w-4"/>
                Extrude
              </button>
              <button
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                  @click="retractFilament"
              >
                <ArrowUpCircle class="h-4 w-4"/>
                Retract
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </LogedinLayout>
</template>

<script setup>
import {ref, reactive, onMounted, onUnmounted, computed, watch} from 'vue'
import {
  Printer, Thermometer, Timer, Fan, Camera, Move, Home,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, PowerOff, Grid,
  ArrowDownCircle, ArrowUpCircle, Pause, Play, AlertOctagon,
  RefreshCw, Maximize2, Download, CameraOff, Mail, Plus, Minus,
  Loader2, Settings
} from 'lucide-vue-next'
import LogedinLayout from "@/layouts/LogedinLayout.vue";
import {usePrinterStore} from "@/store/index.js";
import {
  API_URL,
  pausePrint,
  resumePrint,
  stopPrint,
  getPrinter,
  getPrinterStatuses,
  setHotendTemperature,
  setBedTemperature,
  moveAxis as moveAxisApi,
  homeAxes as homeAxesApi,
  extrudeFilament as extrudeFilamentApi, setFanSpeedApi
} from "@/helpers/api.js";

const props = defineProps({
  printerId: {
    type: String,
    required: true
  }
});

// Store
const printerStore = usePrinterStore();
const printerIdNum = computed(() => parseInt(props.printerId));

// Get printer and status data from store
const printer = ref(printerStore.getPrinterById(printerIdNum.value));


const printerStatus = ref(printerStore.getPrinterStatusById(printerIdNum.value));

// watch for changes in printer status from pinia store
watch(printerStore.printerStatuses, () => {
  console.log('Printer statuses updated:', printerStore.printerStatuses);
  printer.value = printerStore.getPrinterById(printerIdNum.value);
  printerStatus.value = printerStore.getPrinterStatusById(printerIdNum.value);
}, {immediate: true});


// State
const movementDistance = ref(10)
const cameraConnected = ref(false)
const cameraFeedUrl = ref(API_URL + '/api/printer/' + props.printerId + '/mjpeg')

// Computed values from printer status
const isPrinting = computed(() => {
  const status = printerStatus.value?.status?.status;
  return status === 'RUNNING' || status === 'PREPARE';
});

const isPaused = computed(() => printerStatus.value?.status?.status === 'PAUSE');
watch(() => printerStatus, (newStatus) => {
  console.log('Printer status changed:', newStatus);
  isPaused.value = newStatus?.status?.status === 'PAUSE';
}, {immediate: true});

// Temperature state - use actual data when available
const temperatures = reactive({
  hotends: computed(() => (
      printerStatus.value?.status?.nozzles?.map(nozzle => ({
        current: Math.round(nozzle.nozzleTemp || 0),
        target: Math.round(nozzle.nozzleTargetTemp || 0),
        index: nozzle.id,
      })) || []
  )),
  bed: computed(() => ({
    current: Math.round(printerStatus.value?.status?.bedTemp || 0),
    target: Math.round(printerStatus.value?.status?.bedTargetTemp || 0)
  }))
});

// Fan speeds - use actual data when available
const fans = computed(() => {
  const fanData = (printerStatus.value?.status?.fanSpeeds || [])
  return fanData.map((fan) => ({
    name: fan.name || fan.fan,
    fan: fan.fan,
    speed: Math.round(fan.speed || 0)
  }));
});

// Print progress
const printProgress = computed(() => {
  if (!printerStatus.value?.status?.progress) {
    return {
      percentage: 0,
      timeLeft: 0,
      currentLayer: 0,
      totalLayers: 0,
      fileName: 'No file'
    };
  }

  const progress = printerStatus.value.status.progress;
  return {
    percentage: Math.round(progress.percentage || 0),
    timeLeft: progress.timeLeft || 0,
    currentLayer: progress.layer || 0,
    totalLayers: progress.totalLayers || 0,
    fileName: printerStatus.value.status.gcode_file || 'Unknown file'
  };
});

// Format remaining time
const formattedRemainingTime = computed(() => {
  const timeInMinutes = printProgress.value.timeLeft;
  if (!timeInMinutes) return '0m';

  const hours = Math.floor(timeInMinutes / 60);
  const minutes = timeInMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
});

const finishedAtTimeFormatted = ref('');

watch(printProgress.value.timeLeft, (newTime) => {
  if (newTime > 0) {
    const finishTime = new Date(Date.now() + newTime * 60 * 1000);
    finishedAtTimeFormatted.value = finishTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    finishedAtTimeFormatted.value = 'N/A';
  }
}, {immediate: true});

// Position
const position = reactive({
  x: 0,
  y: 0,
  z: 0
});

// Methods
const connectCamera = () => {
  cameraConnected.value = true;
}

const adjustTemperature = (component, amount) => {
  console.log(`Adjusting ${component} temperature by ${amount}`);

  const newTarget = Math.round(temperatures[component].target + amount);

  if (component === 'hotend') {
    setHotendTemperature(printerIdNum.value.toString(), newTarget);
  } else if (component === 'bed') {
    setBedTemperature(printerIdNum.value.toString(), newTarget);
  }
}

const setTemperature = (component, temp) => {
  console.log(`Setting ${component} temperature to ${temp}`);

  const roundedTemp = Math.round(temp);

  if (component === 'hotend') {
    setHotendTemperature(printerIdNum.value.toString(), roundedTemp);
  } else if (component === 'bed') {
    setBedTemperature(printerIdNum.value.toString(), roundedTemp);
  }
}

const setFanSpeed = (fan, speed) => {
  console.log(`Setting ${fan} fan speed to ${speed}%`);

  const fanType = fan === 'partCooling' ? 'part' : fan;
  const roundedSpeed = Math.round(Number(speed));
  setFanSpeedApi(printerIdNum.value.toString(), fanType, roundedSpeed);
}

const moveAxis = (axis, distance) => {
  // Calculate actual distance based on movement distance setting
  // Round to 1 decimal place for precision
  const actualDistance = Math.round(distance * movementDistance.value * 10) / 10;
  console.log(`Moving ${axis} axis by ${actualDistance}mm`);

  moveAxisApi(printerIdNum.value.toString(), axis, actualDistance);
}

const homeAxes = (axes) => {
  console.log(`Homing axes: ${axes.join(', ')}`);
  homeAxesApi(printerIdNum.value.toString(), axes);
}

const togglePause = () => {
  if (isPaused.value) {
    console.log('Resuming print');
    resumePrint(printerIdNum.value.toString());
  } else {
    console.log('Pausing print');
    pausePrint(printerIdNum.value.toString());
  }
}

const cancelPrint = () => {
  console.log('Canceling print');
  stopPrint(printerIdNum.value.toString());
}

const extrudeFilament = () => {
  console.log('Extruding filament');
  extrudeFilamentApi(printerIdNum.value.toString(), extrusionAmount.value);
}

const retractFilament = () => {
  console.log('Retracting filament');
  extrudeFilamentApi(printerIdNum.value.toString(), -extrusionAmount.value);
}

const extrusionAmount = ref(5);

onMounted(async () => {
  // Initialize store connection (for backward compatibility)
  await printerStore.initializeWebSocket();

  await getPrinterStatuses();

  const finishTime = new Date(Date.now() + printProgress.value.timeLeft * 60 * 1000);
  finishedAtTimeFormatted.value = finishTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
});
</script>

<style scoped>
/* Custom range input styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(37 99 235);
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(37 99 235);
  cursor: pointer;
  border: none;
}

/* Transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.duration-300 {
  transition-duration: 300ms;
}

.duration-500 {
  transition-duration: 500ms;
}
</style>

