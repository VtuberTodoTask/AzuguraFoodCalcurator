<template>
  <div class="page">
    <h1>売上履歴</h1>

    <div v-if="!currentUser" class="notice">ヘッダーで従業員を選択してください。</div>

    <div v-else>
      <div class="controls">
        <div v-if="isManager">
          <p>店長として、所属する店舗の全従業員の履歴を表示します。</p>
        </div>
        <div v-else>
          <p>あなたの履歴のみ表示されます: <strong>{{ currentUser.name }}</strong></p>
        </div>
        <button @click="refreshSales" class="refresh">更新</button>
      </div>

      <div class="table-wrap" v-if="displayedSales.length">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>金額</th>
              <th>販売相手</th>
              <th>店員</th>
              <th>日時</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in displayedSales" :key="row.id">
              <td>{{ row.id }}</td>
              <td>¥{{ formatAmount(row.amount) }}</td>
              <td>{{ row.customer || '-' }}</td>
              <td>{{ employeeName(row.employee_id) }}</td>
              <td>{{ formatDate(row.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty">表示する売上履歴がありません。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const selectedEmployeeId = useState('selectedEmployeeId', () => null)

const { data: employees, refresh: refreshEmployees } = useFetch('/api/employees')
const { data: sales, refresh: refreshSalesFetch } = useFetch('/api/sales', { lazy: true })

const currentUser = computed(() => {
  if (!selectedEmployeeId.value || !employees.value) return null
  return employees.value.find((e: any) => e.id === selectedEmployeeId.value) || null
})

const isManager = computed(() => !!currentUser.value && currentUser.value.is_manager === true)


const employeesInStore = computed(() => {
  if (!employees.value || !currentUser.value) return []
  return employees.value.filter((e: any) => e.store_id === currentUser.value.store_id)
})

onMounted(async () => {
  await refreshEmployees()
  await refreshSales()
})

watch(() => selectedEmployeeId.value, () => {
  // when header selection changes, refresh data
  refreshEmployees()
  refreshSales()
})

async function refreshSales() {
  await refreshSalesFetch()
}

const displayedSales = computed(() => {
  const rows = sales.value || []
  if (!currentUser.value) return []
  if (isManager.value) {
    // show all employees in manager's store
    const ids = employeesInStore.value.map((e: any) => e.id)
    return rows.filter((r: any) => ids.includes(r.employee_id))
  }
  // regular employee: show only their own
  return rows.filter((r: any) => r.employee_id === currentUser.value.id)
})

const employeeName = (id: number | null) => {
  if (!id) return '-'
  return employees.value?.find((e: any) => e.id === id)?.name || `店員 #${id}`
}

const formatAmount = (n: number) => Number(n).toLocaleString()

const formatDate = (d: string | null | undefined) => {
  if (!d) return '-' 
  try { return new Date(d).toLocaleString() } catch { return String(d) }
}
</script>

<style scoped>
.page { padding: 1rem }
.controls { display:flex; gap:1rem; align-items:center; margin-bottom:0.75rem }
.refresh { margin-left:auto }
.table-wrap table { width:100%; border-collapse:collapse }
th, td { border:1px solid #e6e6e6; padding:8px; text-align:left }
.empty, .notice { color:#666; padding:1rem }
</style>
