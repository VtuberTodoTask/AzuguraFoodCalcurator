// server/api/sales/index.post.ts
import { salesRepository } from '~/server/repositories/salesRepository';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (typeof body.amount !== 'number' || isNaN(body.amount)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid amount' });
    }

    const payload = {
      amount: Math.floor(body.amount),
      customer: body.customer || null,
      employee_id: body.employee_id || null
    };

    const created = await salesRepository.create(payload);
    event.node.res.statusCode = 201;
    return created;
  } catch (err: any) {
    console.error('Error creating sales history:', err);
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to create sales history' });
  }
});
