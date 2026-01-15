// server/api/sales/[id].put.ts
import { salesRepository } from '~/server/repositories/salesRepository';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });
  }

  try {
    const body = await readBody(event);
    
    const payload: { amount?: number; customer?: string | null; employee_id?: number | null } = {};

    if (body.hasOwnProperty('amount') && typeof body.amount === 'number' && !isNaN(body.amount)) {
      payload.amount = Math.floor(body.amount);
    }
    if (body.hasOwnProperty('customer')) {
      payload.customer = body.customer || null;
    }
    if (body.hasOwnProperty('employee_id') && (typeof body.employee_id === 'number' || body.employee_id === null)) {
      payload.employee_id = body.employee_id;
    }

    if (Object.keys(payload).length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No valid fields to update.' });
    }

    const updated = await salesRepository.update(id, payload);
    if (!updated) {
      throw createError({ statusCode: 404, statusMessage: 'Sales record not found' });
    }
    
    return updated;
  } catch (err: any) {
    console.error(`Error updating sales record #${id}:`, err);
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to update sales record' });
  }
});
