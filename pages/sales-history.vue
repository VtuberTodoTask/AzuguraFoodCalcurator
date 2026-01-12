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
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

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

  // Determine the date range from all relevant sales data
  const relevantSales = isManager.value 
    ? salesData.filter((s: any) => employeesInStore.value.some((e: any) => e.id === s.employee_id))
    : salesData.filter((s: any) => s.employee_id === currentUser.value.id);

  if (relevantSales.length === 0) return null;
  
  const allDates = relevantSales.map((s: any) => new Date(s.created_at));
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  
  const labels: string[] = [];
  for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
    labels.push(d.toLocaleDateString());
  }

  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#7f8c8d'];

  if (isManager.value) {
    // Manager: Create a dataset for each employee in the store
    const storeEmployees = employeesInStore.value;
    const datasets = storeEmployees.map((employee: any, index: number) => {
      const employeeSales = salesData.filter((s: any) => s.employee_id === employee.id);
      const dailyTotals = employeeSales.reduce((acc: any, sale: any) => {
        const date = new Date(sale.created_at).toLocaleDateString();
        acc[date] = (acc[date] || 0) + sale.amount;
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
    const mySales = salesData.filter((s: any) => s.employee_id === currentUser.value.id);
    const dailyTotals = mySales.reduce((acc: any, sale: any) => {
      const date = new Date(sale.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + sale.amount;
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
</style>
