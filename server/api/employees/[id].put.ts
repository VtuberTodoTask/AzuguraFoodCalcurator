// server/api/employees/[id].put.ts
import { employeeRepository } from '~/server/repositories/employeeRepository';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' });
  }

  try {
    const body = await readBody(event);
    if (!body.name || !body.store_id) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid input' });
    }

    const updatedEmployee = await employeeRepository.update(id, body);

    if (!updatedEmployee) {
      throw createError({ statusCode: 404, statusMessage: 'Employee not found' });
    }

    return updatedEmployee;
    
  } catch (err: any) {
    console.error(`Error updating employee ${id}:`, err);
    if (err.statusCode) throw err;
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to update employee',
    });
  }
});
