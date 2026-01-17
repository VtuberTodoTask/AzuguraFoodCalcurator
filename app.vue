<template>
  <div>
    <header class="app-header">
      <div class="header-content">
        <div class="left">
          <div class="app-title"><NuxtLink to="/">アズグラ飲食計算機</NuxtLink></div>
          <nav class="desktop-nav">
            <NuxtLink to="/calculator" class="nav-link">アイテム計算</NuxtLink>
            <NuxtLink to="/billing" class="nav-link">請求計算</NuxtLink>
            <NuxtLink to="/sales-history" class="nav-link">売上履歴</NuxtLink>
            <NuxtLink to="/games" class="nav-link">暇つぶし</NuxtLink>
            <template v-if="isManagerSelected">
              <NuxtLink to="/materials" class="nav-link">原材料</NuxtLink>
              <NuxtLink to="/recipes" class="nav-link">レシピ</NuxtLink>
              <NuxtLink to="/stores" class="nav-link">店舗</NuxtLink>
              <NuxtLink to="/employees" class="nav-link">店員</NuxtLink>
            </template>
          </nav>
        </div>
        <div class="right">
          <div class="selectors desktop-selectors">
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
                <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                  {{ employee.name }}
                </option>
              </select>
            </div>
          </div>
          <button class="mobile-menu-toggle" @click="isMenuOpen = !isMenuOpen">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </button>
        </div>
      </div>
      
      <div class="mobile-menu" :class="{ 'is-open': isMenuOpen }">
        <nav class="mobile-nav">
          <NuxtLink to="/calculator" class="nav-link" @click="isMenuOpen = false">アイテム計算</NuxtLink>
          <NuxtLink to="/billing" class="nav-link" @click="isMenuOpen = false">請求計算</NuxtLink>
          <NuxtLink to="/sales-history" class="nav-link" @click="isMenuOpen = false">売上履歴</NuxtLink>
          <NuxtLink to="/games" class="nav-link" @click="isMenuOpen = false">暇つぶし</NuxtLink>
          <template v-if="isManagerSelected">
            <NuxtLink to="/materials" class="nav-link" @click="isMenuOpen = false">原材料</NuxtLink>
            <NuxtLink to="/recipes" class="nav-link" @click="isMenuOpen = false">レシピ</NuxtLink>
            <NuxtLink to="/stores" class="nav-link" @click="isMenuOpen = false">店舗</NuxtLink>
            <NuxtLink to="/employees" class="nav-link" @click="isMenuOpen = false">店員</NuxtLink>
          </template>
        </nav>
        <div class="selectors mobile-selectors">
          <div class="selector">
            <label for="mobile-store-select">店舗:</label>
            <select id="mobile-store-select" v-model="selectedStore" @change="onStoreChange">
              <option :value="null">全店舗</option>
              <option v-for="store in stores" :key="store.id" :value="store.id">
                {{ store.name }}
              </option>
            </select>
          </div>
          <div class="selector">
            <label for="mobile-employee-select">店員:</label>
            <select id="mobile-employee-select" v-model="selectedEmployeeId" @change="onEmployeeChange">
              <option v-for="employee in employees" :key="employee.id" :value="employee.id">
                {{ employee.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </header>
    <main class="app-main">
      <div v-if="!selectedEmployeeId" class="selection-prompt">
        <h2>ようこそ！</h2>
        <p>利用を開始するには、まずヘッダーから担当する店員を選択してください。</p>
      </div>
      <NuxtPage v-else />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';

useHead({
  title: 'アズグラ飲食計算機'
});

const isMenuOpen = ref(false);

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
const stores = useState<Store[]>('stores', () => []);

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
  isMenuOpen.value = false;
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
  isMenuOpen.value = false;
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
  
  // If no employee is selected after loading, try to select the first one.
  if (!selectedEmployeeId.value && employees.value.length > 0) {
    selectedEmployeeId.value = employees.value[0].id;
  }
});
</script>

<style>
/* Global styles */
.app-header {
  background-color: var(--secondary-color);
  padding: 0 var(--spacing-lg);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.left { display:flex; align-items:center; gap: var(--spacing-xl); }
.app-title a { color: white; text-decoration: none; font-size: 1.25rem; font-weight: 700 }

.desktop-nav {
  display: flex;
  gap: var(--spacing-lg);
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 0;
  font-weight: 500;
  position: relative;
  opacity: 0.8;
  transition: opacity 0.3s;
}
.nav-link:hover { opacity: 1; }
.nav-link.router-link-active { opacity: 1; font-weight: 700; }

.right { display: flex; align-items: center; gap: var(--spacing-lg); }

.selectors {
  display: flex;
  gap: var(--spacing-lg);
}
.selector select {
  margin-left: var(--spacing-sm);
  padding: 0.25rem;
  border-radius: 4px;
  border: 1px solid var(--gray-500);
}
.selector label {
  font-size: 0.9rem;
}

.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}
.mobile-menu-toggle .bar {
  display: block;
  width: 25px;
  height: 3px;
  margin: 5px 0;
  background-color: white;
  transition: 0.4s;
}

.mobile-menu {
  display: none;
}

.app-main {
  padding: var(--spacing-lg);
}

.selection-prompt {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-lg);
  background-color: var(--card-bg-color);
  border-radius: var(--border-radius);
  margin: var(--spacing-xl) auto;
  max-width: 600px;
  border: 1px solid var(--gray-200);
}
.selection-prompt h2 { margin-bottom: var(--spacing-md); }
.selection-prompt p { font-size: 1.1rem; }


/* Responsive Styles */
@media (max-width: 1024px) {
  .desktop-nav, .desktop-selectors {
    display: none;
  }
  .mobile-menu-toggle {
    display: block;
  }
  .mobile-menu {
    display: block;
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    background-color: var(--secondary-color);
    padding: var(--spacing-lg);
    border-top: 1px solid var(--gray-600);
    transform: translateY(-120%);
    transition: transform 0.3s ease-in-out;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  .mobile-menu.is-open {
    transform: translateY(0);
  }
  .mobile-nav {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    border-bottom: 1px solid var(--gray-600);
    padding-bottom: var(--spacing-lg);
  }
  .mobile-selectors {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }
  .mobile-selectors .selector {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  .mobile-selectors .selector select {
    width: 60%;
  }
}
</style>