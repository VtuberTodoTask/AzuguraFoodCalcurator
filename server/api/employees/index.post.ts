// server/api/employees/index.post.ts
import { employeeRepository } from '~/server/repositories/employeeRepository';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.name || !body.store_id) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid input' });
    }
    const newEmployee = await employeeRepository.create(body);
    return newEmployee;
  } catch (err: any) {
    console.error('Error creating employee:', err);
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to create employee',
    });
  }
});
