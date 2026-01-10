<template>
  <div>
    <header class="app-header">
      <div class="left">
        <div class="app-title"><NuxtLink to="/">アズグラ飲食計算機</NuxtLink></div>
        <nav>
          <NuxtLink to="/calculator" class="nav-link">必要アイテム計算機</NuxtLink>
          <NuxtLink to="/billing" class="nav-link">請求計算</NuxtLink>
          <NuxtLink to="/sales-history" class="nav-link">売上履歴</NuxtLink>
          <template v-if="isManagerSelected">
            <NuxtLink to="/materials" class="nav-link">原材料管理</NuxtLink>
            <NuxtLink to="/recipes" class="nav-link">レシピ管理</NuxtLink>
            <NuxtLink to="/stores" class="nav-link">店舗管理</NuxtLink>
            <NuxtLink to="/employees" class="nav-link">店員管理</NuxtLink>
          </template>
        </nav>
      </div>
      <div class="selectors">
        <div class="selector">
          <label for="store-select">店舗:</label>
          <select id="store-select" v-model="selectedStore" @change="onStoreChange">
            <option :value="null">全店舗</option>
            <option v-for="store in stores" :key="store.id" :value="store.id">
              {{ store.name }}
            </option>
          </select>
        </div>
        <div class="selector">
          <label for="employee-select">店員:</label>
          <select id="employee-select" v-model="selectedEmployeeId" @change="onEmployeeChange">
            <option :value="null">全員</option>
            <option v-for="employee in employees" :key="employee.id" :value="employee.id">
              {{ employee.name }}
            </option>
          </select>
        </div>
      </div>
    </header>
    <main class="app-main">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';

const STORAGE_KEY_STORE = 'selectedStore';
const STORAGE_KEY_EMPLOYEE = 'selectedEmployee';

// Global state
const selectedStore = useState<number | null>('selectedStore', () => null);
const selectedEmployeeId = useState<number | null>('selectedEmployeeId', () => null);

// Data
interface Store {
  id: number;
  name: string;
}
const stores = ref<Store[]>([]);

interface Employee {
  id: number;
  name: string;
  store_id: number;
  is_manager: boolean;
}
const employees = ref<Employee[]>([]);
const allEmployees = ref<Employee[]>([]);

// Whether currently-selected employee is a manager
const isManagerSelected = computed(() => {
  const id = selectedEmployeeId.value;
  if (!id) return false;
  const emp = allEmployees.value.find(e => e.id === id);
  return !!emp && emp.is_manager === true;
});

// Fetching
async function fetchStores() {
  try {
    stores.value = await $fetch('/api/stores');
  } catch (error) {
    console.error('Failed to fetch stores:', error);
  }
}

async function fetchEmployees() {
  try {
    allEmployees.value = await $fetch('/api/employees');
    filterEmployees();
  } catch (error) {
    console.error('Failed to fetch employees:', error);
  }
}

// Logic
function filterEmployees() {
  if (selectedStore.value) {
    employees.value = allEmployees.value.filter(e => e.store_id === selectedStore.value);
  } else {
    employees.value = allEmployees.value;
  }
  if (selectedEmployeeId.value && !employees.value.some(e => e.id === selectedEmployeeId.value)) {
    selectedEmployeeId.value = null;
  }
}

function onStoreChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  selectedStore.value = target.value ? Number(target.value) : null;
}

function onEmployeeChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const employeeId = target.value ? Number(target.value) : null;
  selectedEmployeeId.value = employeeId;

  if (employeeId) {
    const employee = allEmployees.value.find(e => e.id === employeeId);
    if (employee && selectedStore.value !== employee.store_id) {
      selectedStore.value = employee.store_id;
    }
  }
}

// Persist selection
watch(selectedStore, (newVal) => {
  if (process.client) {
    localStorage.setItem(STORAGE_KEY_STORE, JSON.stringify(newVal));
  }
  filterEmployees();
});

watch(selectedEmployeeId, (newVal) => {
  if (process.client) {
    localStorage.setItem(STORAGE_KEY_EMPLOYEE, JSON.stringify(newVal));
  }
});


onMounted(async () => {
  // Load from localStorage
  if (process.client) {
    const savedStore = localStorage.getItem(STORAGE_KEY_STORE);
    const savedEmployee = localStorage.getItem(STORAGE_KEY_EMPLOYEE);
    if (savedStore) {
      selectedStore.value = JSON.parse(savedStore);
    }
    if (savedEmployee) {
      selectedEmployeeId.value = JSON.parse(savedEmployee);
    }
  }
  
  await fetchStores();
  await fetchEmployees();
});
</script>

<style>
/* Global styles */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2c3e50;
  padding: 0 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-header nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 1rem 0;
  font-weight: 500;
  position: relative;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.nav-link:hover {
  opacity: 1;
}

.nav-link.router-link-active {
  opacity: 1;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #3498db;
}

.selectors {
  display: flex;
  gap: 1.5rem;
  color: white;
}
.selector select {
  margin-left: 0.5rem;
  padding: 0.25rem;
}

.left { display:flex; align-items:center; gap:1.25rem }
.app-title a { color: white; text-decoration: none; font-size: 1.25rem; font-weight: 700 }

.app-main {
  padding: 1rem;
}
</style>