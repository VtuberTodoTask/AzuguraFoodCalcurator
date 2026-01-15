<template>
  <div class="container">
    <h1>店員管理</h1>

    <!-- Form Card -->
    <div class="form-card">
      <h2>{{ isEditing ? '店員の編集' : '新しい店員の作成' }}</h2>
      <form @submit.prevent="saveEmployee">
        <div class="form-group">
          <label for="name">店員名</label>
          <input type="text" id="name" v-model="editableEmployee.name" required :disabled="isSubmitting" />
        </div>
        <div class="form-group">
          <label for="store">店舗</label>
          <select id="store" v-model="editableEmployee.store_id" required :disabled="isSubmitting">
            <option disabled :value="null">店舗を選択してください</option>
            <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="editableEmployee.is_manager" :disabled="isSubmitting" />
            店長として設定する
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" :disabled="isSubmitting">{{ isEditing ? '更新' : '作成' }}</button>
          <button v-if="isEditing" type="button" @click="cancelEdit" :disabled="isSubmitting">キャンセル</button>
        </div>
        <p v-if="isSubmitting" class="submitting-text">処理中...</p>
      </form>
    </div>

    <!-- List Card -->
    <div class="list-card">
      <h2>店員一覧</h2>
      <div v-if="employeesPending" class="loading">データを読み込んでいます...</div>
      <div v-else-if="employeesError" class="error">エラー: {{ employeesError.message }}</div>
      <div class="table-wrapper" v-else>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>名前</th>
              <th>店舗</th>
              <th>役職</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!employees || employees.length === 0"><td colspan="5">店員はまだいません。</td></tr>
            <tr v-for="employee in employees" :key="employee.id">
              <td>{{ employee.id }}</td>
              <td>{{ employee.name }}</td>
              <td>{{ getStoreName(employee.store_id) }}</td>
              <td>
                <span :class="['role-badge', employee.is_manager ? 'manager' : 'staff']">
                  {{ employee.is_manager ? '店長' : '店員' }}
                </span>
              </td>
              <td class="actions">
                <button class="edit-btn" @click="editEmployee(employee)" :disabled="isSubmitting">編集</button>
                <button class="delete" @click="deleteEmployee(employee.id)" :disabled="isSubmitting">削除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// --- Types ---
interface Employee {
  id: number;
  name: string;
  store_id: number;
  is_manager: boolean;
}
interface Store {
  id: number;
  name: string;
}

// --- Data Fetching ---
const { data: stores } = useFetch<Store[]>('/api/stores', { lazy: true, default: () => [] });
const { data: employees, pending: employeesPending, error: employeesError, refresh: refreshEmployees } = useFetch<Employee[]>('/api/employees', { lazy: true, default: () => [] });

// --- Form State ---
const isSubmitting = ref(false);
const getInitialEditableEmployee = (): Omit<Employee, 'id'> & { id: null | number } => ({ 
  id: null, 
  name: '', 
  store_id: null, 
  is_manager: false 
});
const editableEmployee = ref(getInitialEditableEmployee());
const isEditing = computed(() => editableEmployee.value.id !== null);

// --- Methods ---
const getStoreName = (storeId: number | null): string => {
  if (storeId === null) return '未割り当て';
  const store = stores.value?.find(s => s.id === storeId);
  return store ? store.name : '不明な店舗';
};

const cancelEdit = () => {
  editableEmployee.value = getInitialEditableEmployee();
};

const saveEmployee = async () => {
  if (!editableEmployee.value.name || editableEmployee.value.store_id === null) {
    alert('店員名と店舗を選択してください。');
    return;
  }
  isSubmitting.value = true;
  const method = isEditing.value ? 'PUT' : 'POST';
  const url = isEditing.value ? `/api/employees/${editableEmployee.value.id}` : '/api/employees';

  try {
    await $fetch(url, {
      method,
      body: {
        name: editableEmployee.value.name,
        store_id: editableEmployee.value.store_id,
        is_manager: editableEmployee.value.is_manager,
      },
    });
    cancelEdit();
    await refreshEmployees();
  } catch (err) {
    console.error('Error saving employee:', err);
    alert('店員の保存に失敗しました。');
  } finally {
    isSubmitting.value = false;
  }
};

const editEmployee = (employee: Employee) => {
  editableEmployee.value = { ...employee };
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const deleteEmployee = async (id: number) => {
  if (confirm(`ID:${id}の店員を本当に削除しますか？`)) {
    isSubmitting.value = true;
    try {
      await $fetch(`/api/employees/${id}`, { method: 'DELETE' });
      await refreshEmployees();
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('店員の削除に失敗しました。');
    } finally {
      isSubmitting.value = false;
    }
  }
};
</script>

<style scoped>
.checkbox-label { display: flex; align-items: center; gap: 8px; font-weight: normal; }
.checkbox-label input { width: auto; }
.role-badge { padding: 4px 8px; border-radius: 12px; color: white; font-size: 0.8em; font-weight: bold; }
.role-badge.manager { background-color: #8e44ad; }
.role-badge.staff { background-color: #2980b9; }
</style>
