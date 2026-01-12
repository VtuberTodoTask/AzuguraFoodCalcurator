<template>
  <div class="page">
    <h1>レストラン管理へようこそ</h1>
    <p>選択中の店舗: {{ storeName }}</p>
    <p>選択中の店員: {{ employeeName }}</p>

    <section class="howto">
      <h2>簡単な使い方</h2>
      <ul>
        <li>ヘッダーで店舗と従業員を選択します。</li>
        <li>「必要アイテム計算機」で選択したレシピから原材料の必要数を算出します。</li>
        <li>「請求計算」で注文数を入力すると合計金額を計算します（レシピ単価はレシピ管理で設定）。</li>
        <li>管理ページ（原材料/レシピ/店舗/従業員）は店長として選択されている場合のみ表示されます。</li>
      </ul>
    </section>

    <nav>
      <NuxtLink to="/calculator">必要アイテム計算機</NuxtLink>
      |
      <NuxtLink to="/billing">請求計算</NuxtLink>
      |
      <NuxtLink to="/sales-history">売上履歴</NuxtLink>
      |
      <template v-if="isManagerSelected">
        <NuxtLink to="/recipes">レシピ管理</NuxtLink>
        |
        <NuxtLink to="/materials">原材料管理</NuxtLink>
        |
        <NuxtLink to="/stores">店舗管理</NuxtLink>
        |
        <NuxtLink to="/employees">従業員管理</NuxtLink>
      </template>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const selectedStore = useState('selectedStore', () => null)
const selectedEmployeeId = useState('selectedEmployeeId', () => null)
const stores = useState('stores', () => [])

const storeName = computed(() => {
  const storeId = selectedStore.value
  if (!storeId) return '未選択'
  
  const store = stores.value.find(s => s.id === storeId)
  return store ? store.name : `店舗 #${storeId}`
})

const employeeName = computed(() => {
  const employeeId = selectedEmployeeId.value
  if (!employeeId) return '未選択'
  
  const employee = allEmployees.value.find(e => e.id === employeeId)
  return employee ? employee.name : `店員 #${employeeId}`
})

const allEmployees = ref([])

const isManagerSelected = computed(() => {
  const id = selectedEmployeeId.value
  if (!id) return false
  const emp = allEmployees.value.find(e => e.id === id)
  return !!emp && emp.is_manager === true
})

async function fetchEmployees() {
  try {
    allEmployees.value = await $fetch('/api/employees')
  } catch (err) {
    console.error('Failed to fetch employees for index page:', err)
  }
}

onMounted(() => {
  fetchEmployees()
})
</script>

<style scoped>
.page {
  padding: 1rem;
}
.howto {
  background: #f8f9fb;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin: 0.75rem 0;
}
nav {
  margin-top: 0.75rem;
}
nav a {
  margin: 0 0.5rem;
  color: var(--nuxt-link-color, #007bff);
}
</style>
