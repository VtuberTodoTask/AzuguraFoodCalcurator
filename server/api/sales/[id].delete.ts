// server/api/sales/[id].delete.ts
import { salesRepository } from '~/server/repositories/salesRepository';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });
  }

  try {
    const deleted = await salesRepository.deleteById(id);
    if (!deleted) {
      throw createError({ statusCode: 404, statusMessage: 'Sales record not found' });
    }
    
    // No content
    event.node.res.statusCode = 204;
    return;
  } catch (err: any) {
    console.error(`Error deleting sales record #${id}:`, err);
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to delete sales record' });
  }
});
