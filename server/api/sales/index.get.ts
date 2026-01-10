// server/api/sales/index.get.ts
import { salesRepository } from '~/server/repositories/salesRepository';
import { getQuery } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const employeeId = query.employee_id ? Number(query.employee_id) : undefined;
    const rows = await salesRepository.getAll(employeeId);
    return rows;
  } catch (err: any) {
    console.error('Error fetching sales history:', err);
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to fetch sales history' });
  }
});
