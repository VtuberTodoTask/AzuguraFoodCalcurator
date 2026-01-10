<template>
  <div class="container">
    <h1>店舗管理</h1>

    <!-- Form Card -->
    <div class="form-card">
      <h2>{{ isEditing ? '店舗の編集' : '新しい店舗の作成' }}</h2>
      <form @submit.prevent="saveStore">
        <div class="form-group">
          <label for="name">店舗名</label>
          <input type="text" id="name" v-model="editableStore.name" required :disabled="isSubmitting" />
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
      <h2>店舗一覧</h2>
      <div v-if="pending" class="loading">データを読み込んでいます...</div>
      <div v-else-if="error" class="error">エラー: {{ error.message }}</div>
      <table v-else>
        <thead>
          <tr>
            <th>ID</th>
            <th>名前</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!stores || stores.length === 0"><td colspan="3">店舗はまだありません。</td></tr>
          <tr v-for="store in stores" :key="store.id">
            <td>{{ store.id }}</td>
            <td>{{ store.name }}</td>
            <td class="actions">
              <button @click="editStore(store)" :disabled="isSubmitting">編集</button>
              <button class="delete" @click="deleteStore(store.id)" :disabled="isSubmitting">削除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// --- Types ---
interface Store {
  id: number;
  name: string;
}

// --- Data Fetching ---
const { data: stores, pending, error, refresh } = useFetch<Store[]>('/api/stores', { lazy: true });

// --- Form State ---
const isSubmitting = ref(false);
const getInitialEditableStore = (): Omit<Store, 'id'> & { id: null | number } => ({ id: null, name: '' });
const editableStore = ref(getInitialEditableStore());
const isEditing = computed(() => editableStore.value.id !== null);

// --- Methods ---
const cancelEdit = () => {
  editableStore.value = getInitialEditableStore();
};

const saveStore = async () => {
  if (!editableStore.value.name) {
    alert('店舗名を入力してください。');
    return;
  }
  isSubmitting.value = true;
  const method = isEditing.value ? 'PUT' : 'POST';
  const url = isEditing.value ? `/api/stores/${editableStore.value.id}` : '/api/stores';

  try {
    await $fetch(url, {
      method,
      body: { name: editableStore.value.name },
    });
    cancelEdit();
    await refresh();
  } catch (err) {
    console.error('Error saving store:', err);
    alert('店舗の保存に失敗しました。');
  } finally {
    isSubmitting.value = false;
  }
};

const editStore = (store: Store) => {
  editableStore.value = { ...store };
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const deleteStore = async (id: number) => {
  if (confirm(`ID:${id}の店舗を本当に削除しますか？`)) {
    isSubmitting.value = true;
    try {
      await $fetch(`/api/stores/${id}`, { method: 'DELETE' });
      await refresh();
    } catch (err) {
      console.error('Error deleting store:', err);
      alert('店舗の削除に失敗しました。');
    } finally {
      isSubmitting.value = false;
    }
  }
};
</script>

<style scoped>
/* Component-specific styles can be added here in the future */
</style>
