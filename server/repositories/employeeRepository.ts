// server/repositories/employeeRepository.ts

import { query } from '~/server/utils/db';
import { mockDb } from '~/server/utils/mock-db';

interface Employee {
  id: number;
  name: string;
  store_id: number;
  is_manager: boolean;
}

type EmployeeData = {
  name: string;
  store_id: number;
  is_manager: boolean;
}

// Use mock DB if in development and DATABASE_URL is not set.
const useMock = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

console.log(`Data source (employees): ${useMock ? 'In-Memory Mock DB' : 'PostgreSQL'}`);

export const employeeRepository = {
  async getAll(storeId?: number): Promise<Employee[]> {
    if (useMock) {
      return mockDb.employees.getAll(storeId);
    }
    let sql = 'SELECT * FROM employees';
    const params = [];
    if (storeId) {
      sql += ' WHERE store_id = $1';
      params.push(storeId);
    }
    sql += ' ORDER BY id ASC';
    const { rows } = await query(sql, params);
    return rows;
  },

  async create(data: EmployeeData): Promise<Employee> {
    if (useMock) {
      return mockDb.employees.create(data);
    }
    const sql = 'INSERT INTO employees (name, store_id, is_manager) VALUES ($1, $2, $3) RETURNING *';
    const { rows } = await query(sql, [data.name, data.store_id, data.is_manager]);
    return rows[0];
  },
  
  async update(id: number, data: EmployeeData): Promise<Employee | null> {
    if (useMock) {
      return mockDb.employees.update(id, data);
    }
    const sql = 'UPDATE employees SET name = $1, store_id = $2, is_manager = $3 WHERE id = $4 RETURNING *';
    const { rows } = await query(sql, [data.name, data.store_id, data.is_manager, id]);
    return rows[0] || null;
  },

  async remove(id: number): Promise<Employee | null> {
    if (useMock) {
      return mockDb.employees.remove(id);
    }
    const sql = 'DELETE FROM employees WHERE id = $1 RETURNING *';
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  }
};