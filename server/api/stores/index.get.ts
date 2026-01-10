// server/api/stores/index.get.ts
import { storeRepository } from '~/server/repositories/storeRepository';

export default defineEventHandler(async (event) => {
  try {
    const stores = await storeRepository.getAll();
    return stores;
  } catch (err: any) {
    console.error('Error fetching stores:', err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to fetch stores',
    });
  }
});
