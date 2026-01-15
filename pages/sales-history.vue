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

      <div class="summary-card" v-if="salesSummary">
        <h2>売上合計</h2>
        <div v-if="isManager && Array.isArray(salesSummary)">
          <ul class="summary-list">
            <li v-for="summary in salesSummary" :key="summary.name">
              <span>{{ summary.name }}:</span>
              <strong>¥{{ formatAmount(summary.total) }}</strong>
            </li>
          </ul>
        </div>
        <div v-else-if="!isManager && salesSummary.total !== undefined">
          <p>あなたの合計売上: <strong>¥{{ formatAmount(salesSummary.total) }}</strong></p>
        </div>
      </div>

      <div class="chart-card" v-if="chartData">
        <h2>日別売上グラフ</h2>
        <div class="chart-container">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <div class="table-wrap" v-if="displayedSales.length">
        <table>
          <thead>
            <tr>
              <th @click="setSort('id')" class="sortable">
                ID <span v-if="sortKey === 'id'">{{ sortAsc ? '▲' : '▼' }}</span>
              </th>
              <th @click="setSort('amount')" class="sortable">
                金額 <span v-if="sortKey === 'amount'">{{ sortAsc ? '▲' : '▼' }}</span>
              </th>
              <th>販売相手</th>
              <th @click="setSort('employee')" class="sortable">
                店員 <span v-if="sortKey === 'employee'">{{ sortAsc ? '▲' : '▼' }}</span>
              </th>
              <th>日時</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in sortedSales" :key="row.id">
              <td>{{ row.id }}</td>
              <td>¥{{ formatAmount(row.amount) }}</td>
              <td>{{ row.customer || '-' }}</td>
              <td>{{ employeeName(row.employee_id) }}</td>
              <td>{{ formatDate(row.created_at) }}</td>
              <td>
                <div class="actions">
                  <button @click="editSale(row)" class="edit">修正</button>
                  <button @click="deleteSale(row.id)" class="delete">削除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty">表示する売上履歴がありません。</div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingSale" class="modal-overlay">
      <div class="modal-content">
        <h2>売上履歴の修正</h2>
        <form @submit.prevent="updateSale">
          <div class="form-group">
            <label for="edit-amount">金額</label>
            <input type="number" id="edit-amount" v-model.number="editForm.amount" required>
          </div>
          <div class="form-group">
            <label for="edit-customer">販売相手 (任意)</label>
            <input type="text" id="edit-customer" v-model="editForm.customer">
          </div>
          <div v-if="isManager" class="form-group">
            <label for="edit-employee">担当店員</label>
            <select id="edit-employee" v-model="editForm.employee_id">
              <option v-for="emp in employeesInStore" :key="emp.id" :value="emp.id">
                {{ emp.name }}
              </option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="submit" class="primary">更新</button>
            <button type="button" @click="cancelEdit">キャンセル</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

const selectedEmployeeId = useState('selectedEmployeeId', () => null)

const { data: employees, refresh: refreshEmployees } = useFetch('/api/employees')
const { data: sales, refresh: refreshSalesFetch } = useFetch('/api/sales', { lazy: true })

// --- Editing State ---
const editingSale = ref<any>(null);
const editForm = ref({
  amount: 0,
  customer: '',
  employee_id: null as number | null,
});

function editSale(sale: any) {
  editingSale.value = sale;
  editForm.value.amount = sale.amount;
  editForm.value.customer = sale.customer || '';
  editForm.value.employee_id = sale.employee_id;
}

function cancelEdit() {
  editingSale.value = null;
}

async function updateSale() {
  if (!editingSale.value) return;

  try {
    const payload: any = {
      amount: editForm.value.amount,
      customer: editForm.value.customer || null
    };

    if (isManager.value) {
      payload.employee_id = editForm.value.employee_id;
    }

    await $fetch(`/api/sales/${editingSale.value.id}`, {
      method: 'PUT',
      body: payload
    });
    await refreshSales();
    cancelEdit();
  } catch (err) {
    console.error('Failed to update sale:', err);
    alert('売上履歴の更新に失敗しました。');
  }
}

async function deleteSale(id: number) {
  if (!confirm(`ID: ${id} の売上履歴を削除します。よろしいですか？`)) {
    return;
  }
  try {
    await $fetch(`/api/sales/${id}`, { method: 'DELETE' });
    await refreshSales();
  } catch (err) {
    console.error('Failed to delete sale:', err);
    alert('売上履歴の削除に失敗しました。');
  }
}
// --- End Editing State ---


// --- Sorting State ---
const sortKey = ref('id');
const sortAsc = ref(true);

function setSort(key: string) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = true;
  }
}

const sortedSales = computed(() => {
  const sales = [...displayedSales.value];
  const key = sortKey.value;
  const asc = sortAsc.value;

  sales.sort((a: any, b: any) => {
    let valA, valB;

    if (key === 'employee') {
      valA = employeeName(a.employee_id) || '';
      valB = employeeName(b.employee_id) || '';
    } else {
      valA = a[key];
      valB = b[key];
    }

    if (valA < valB) return asc ? -1 : 1;
    if (valA > valB) return asc ? 1 : -1;
    return 0;
  });

  return sales;
});
// --- End Sorting State ---


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

const salesSummary = computed(() => {
  if (!currentUser.value || !sales.value) return null;

  if (isManager.value) {
    // For managers: sum of sales per employee
    const summary = new Map<number, { name: string; total: number }>();
    const storeEmployees = employeesInStore.value;
    
    storeEmployees.forEach((e: any) => {
      summary.set(e.id, { name: e.name, total: 0 });
    });

    sales.value.forEach((sale: any) => {
      if (summary.has(sale.employee_id)) {
        const current = summary.get(sale.employee_id)!;
        current.total += sale.amount;
      }
    });

    return Array.from(summary.values()).sort((a, b) => b.total - a.total);

  } else {
    // For regular employees: their own total sales
    const mySales = sales.value.filter((r: any) => r.employee_id === currentUser.value.id);
    const total = mySales.reduce((sum, sale) => sum + sale.amount, 0);
    return { total };
  }
});

const chartData = computed(() => {
  const salesData = sales.value;
  if (!salesData || salesData.length === 0 || !currentUser.value) {
    return null;
  }

  // A business day is from 20:00 to 03:00 the next day.
  const getBusinessDay = (dateString: string | Date): Date | null => {
    const saleDate = new Date(dateString);
    const hours = saleDate.getHours();

    // Ignore sales between 3:00 AM and 7:59 PM
    if (hours >= 3 && hours < 20) {
      return null;
    }

    // Create a new date for the business day label
    let businessDay = new Date(saleDate);

    // If the sale happened between 00:00 and 02:59, it belongs to the previous calendar day's business period.
    if (hours < 3) {
      businessDay.setDate(businessDay.getDate() - 1);
    }
    
    // Normalize to midnight for consistent grouping
    businessDay.setHours(0, 0, 0, 0);

    return businessDay;
  }

  // Determine the relevant sales data based on user role
  const relevantSales = isManager.value 
    ? salesData.filter((s: any) => employeesInStore.value.some((e: any) => e.id === s.employee_id))
    : salesData.filter((s: any) => s.employee_id === currentUser.value.id);

  // Assign a business day to each sale and filter out irrelevant ones
  const salesWithBusinessDay = relevantSales
    .map((sale: any) => ({ ...sale, businessDay: getBusinessDay(sale.created_at) }))
    .filter((sale: any) => sale.businessDay !== null);

  if (salesWithBusinessDay.length === 0) return null;
  
  // Determine date range for labels from the business days
  const allBusinessDayTimestamps = salesWithBusinessDay.map((s: any) => s.businessDay.getTime());
  const minDate = new Date(Math.min(...allBusinessDayTimestamps));
  const maxDate = new Date(Math.max(...allBusinessDayTimestamps));
  
  const labels: string[] = [];
  for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
    labels.push(d.toLocaleDateString());
  }

  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#7f8c8d'];

  if (isManager.value) {
    // Manager: Create a dataset for each employee in the store
    const storeEmployees = employeesInStore.value;
    const datasets = storeEmployees.map((employee: any, index: number) => {
      const employeeSales = salesWithBusinessDay.filter((s: any) => s.employee_id === employee.id);
      
      const dailyTotals = employeeSales.reduce((acc: any, sale: any) => {
        const dateKey = sale.businessDay.toLocaleDateString();
        acc[dateKey] = (acc[dateKey] || 0) + sale.amount;
        return acc;
      }, {});

      return {
        label: employee.name,
        backgroundColor: colors[index % colors.length] + '33', // with alpha
        borderColor: colors[index % colors.length],
        tension: 0.2,
        fill: true,
        data: labels.map(date => dailyTotals[date] || 0),
      };
    }).filter((d: any) => d.data.some((v: number) => v > 0)); // Only show employees with sales

    return { labels, datasets };

  } else {
    // Regular employee: Single dataset for themselves
    const mySales = salesWithBusinessDay; // Already filtered for business day and employee
    const dailyTotals = mySales.reduce((acc: any, sale: any) => {
      const dateKey = sale.businessDay.toLocaleDateString();
      acc[dateKey] = (acc[dateKey] || 0) + sale.amount;
      return acc;
    }, {});

    const dataset = {
      label: 'あなたの売上',
      backgroundColor: 'rgba(52, 152, 219, 0.2)',
      borderColor: '#3498db',
      tension: 0.2,
      fill: true,
      data: labels.map(date => dailyTotals[date] || 0),
    };
    
    return { labels, datasets: [dataset] };
  }
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
    }
  }
});

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

.summary-card {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.summary-card h2 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1.2rem;
}
.summary-card p {
  margin: 0;
  font-size: 1.1rem;
}
.summary-list {
  padding-left: 0;
  margin: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
}
.summary-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.chart-card {
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #e9ecef;
}
.chart-card h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}
.chart-container {
  position: relative;
  height: 300px;
}

.actions {
  display: flex;
  gap: 0.5rem;
}
.actions button {
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.875rem;
}
.actions .edit {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}
.actions .delete {
  background-color: #e74c3c;
  color: white;
  border-color: #e74c3c;
}


/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  min-width: 320px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}
.form-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

th.sortable {
  cursor: pointer;
  user-select: none;
}
th.sortable:hover {
  background-color: #f8f9fa;
}
</style>