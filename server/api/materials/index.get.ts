// server/api/materials/index.get.ts
import { materialRepository } from '~/server/repositories/materialRepository';

export default defineEventHandler(async (event) => {
  try {
    const materials = await materialRepository.getAll();
    return materials;
  } catch (err: any) {
    console.error('Error fetching materials:', err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to fetch materials',
    });
  }
});
