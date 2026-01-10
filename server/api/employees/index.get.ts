// server/api/employees/index.get.ts
import { employeeRepository } from '~/server/repositories/employeeRepository';
import { getQuery } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const storeId = query.store_id ? Number(query.store_id) : undefined;
    const employees = await employeeRepository.getAll(storeId);
    return employees;
  } catch (err: any) {
    console.error('Error fetching employees:', err);
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to fetch employees',
    });
  }
});
