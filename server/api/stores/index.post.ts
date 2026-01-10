// server/api/stores/index.post.ts
import { storeRepository } from '~/server/repositories/storeRepository';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid input' });
    }
    const newStore = await storeRepository.create(body);
    return newStore;
  } catch (err: any) {
    console.error('Error creating store:', err);
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to create store',
    });
  }
});
