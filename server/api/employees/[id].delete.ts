// server/api/employees/[id].delete.ts
import { employeeRepository } from '~/server/repositories/employeeRepository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });
  }

  try {
    const removedEmployee = await employeeRepository.remove(id);

    if (!removedEmployee) {
      throw createError({ statusCode: 404, statusMessage: 'Employee not found' });
    }

    return { success: true };
    
  } catch (err: any) {
    console.error(`Error deleting employee ${id}:`, err);
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to delete employee',
    });
  }
});
