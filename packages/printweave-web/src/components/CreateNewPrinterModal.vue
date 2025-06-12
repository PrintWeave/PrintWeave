<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { getBuilderOptions, addPrinter } from '@/helpers/api';
import {usePrinterStore} from "@/store";

const emit = defineEmits(['close', 'created']);
const show = defineModel<boolean>('show', { required: true });

const loading = ref(false);
const error = ref('');
const options = ref<any>({});
const printerTypes = ref<string[]>([]);
const selectedType = ref('');
const form = ref<any>({ name: '', type: '', options: {} });

const fetchOptions = async () => {
  loading.value = true;
  error.value = '';
  const res = await getBuilderOptions();
  if (res.data && res.data.options) {
    options.value = res.data.options;
    printerTypes.value = Object.keys(res.data.options);
    if (printerTypes.value.length > 0) {
      selectedType.value = printerTypes.value[0];
      form.value.type = selectedType.value;
    }
  } else {
    error.value = 'Failed to load printer types.';
  }
  loading.value = false;
};

watch(show, (val) => {
  if (val) fetchOptions();
});

watch(selectedType, (val) => {
  form.value.type = val;
  form.value.options = {};
});

const handleSubmit = async () => {
  loading.value = true;
  error.value = '';
  const payload = {
    name: form.value.name,
    type: form.value.type,
    [form.value.type]: form.value.options
  };
  const res = await addPrinter(payload);
  if (res.data && res.data.printer) {
    emit('created', res.data);
    closeModal();
  } else {
    error.value = 'Failed to create printer. Error message: ' + (res.error || 'Unknown error');
  }
  loading.value = false;
};

const closeModal = () => {
  usePrinterStore().closeCreatePrinterModal();
  error.value = '';
};
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
      <button class="absolute top-2 right-2 text-gray-500 hover:text-gray-700" @click="closeModal">&times;</button>
      <h2 class="text-2xl font-bold mb-4">Create New Printer</h2>
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="block mb-1 font-semibold">Name</label>
          <input v-model="form.name" class="w-full border rounded px-3 py-2" required />
        </div>
        <div class="mb-4">
          <label class="block mb-1 font-semibold">Printer Type</label>
          <select v-model="selectedType" class="w-full border rounded px-3 py-2" required>
            <option v-for="type in printerTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
        <div v-if="selectedType && options[selectedType]">
          <div v-for="(opt, key) in options[selectedType]" :key="key" class="mb-4">
            <label class="block mb-1 font-semibold">{{ key }} <span v-if="opt.required" class="text-red-500">*</span></label>
            <input v-model="form.options[key]" :type="opt.type === 'number' ? 'number' : 'text'" :required="opt.required" class="w-full border rounded px-3 py-2" :placeholder="opt.description" />
          </div>
        </div>
        <div v-if="error" class="text-red-600 mb-2">{{ error }}</div>
        <button type="submit" :disabled="loading" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          <span v-if="loading">Creating...</span>
          <span v-else>Create Printer</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
</style>

