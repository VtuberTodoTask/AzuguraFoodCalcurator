// server/repositories/salesRepository.ts

import { query } from '~/server/utils/db';
import { mockDb } from '~/server/utils/mock-db';

interface SalesHistoryRow {
  id: number;
  amount: number;
  customer?: string | null;
  employee_id?: number | null;
}

type CreateSalesData = {
  amount: number;
  customer?: string | null;
  employee_id?: number | null;
}

const useMock = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

console.log(`Data source (sales): ${useMock ? 'In-Memory Mock DB' : 'PostgreSQL'}`);

export const salesRepository = {
  async getAll(employeeId?: number): Promise<SalesHistoryRow[]> {
    if (useMock) {
      return mockDb.salesHistory.getAll(employeeId);
    }
    let sql = 'SELECT * FROM sales_history';
    const params: any[] = [];
    if (employeeId) {
      sql += ' WHERE employee_id = $1';
      params.push(employeeId);
    }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await query(sql, params);
    return rows;
  },

  async create(data: CreateSalesData): Promise<SalesHistoryRow> {
    if (useMock) {
      return mockDb.salesHistory.create(data);
    }
    const sql = 'INSERT INTO sales_history (amount, customer, employee_id) VALUES ($1, $2, $3) RETURNING *';
    const { rows } = await query(sql, [data.amount, data.customer || null, data.employee_id || null]);
    return rows[0];
  },

  async update(id: number, data: Partial<CreateSalesData>): Promise<SalesHistoryRow | null> {
    if (useMock) {
      return mockDb.salesHistory.update(id, data);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.amount !== undefined) {
      updates.push(`amount = $${paramIndex++}`);
      values.push(data.amount);
    }
    if (data.customer !== undefined) {
      updates.push(`customer = $${paramIndex++}`);
      values.push(data.customer || null);
    }
    if (data.employee_id !== undefined) {
      updates.push(`employee_id = $${paramIndex++}`);
      values.push(data.employee_id);
    }

    if (updates.length === 0) {
      // Nothing to update, maybe return current state or throw error
      const { rows } = await query('SELECT * FROM sales_history WHERE id = $1', [id]);
      return rows[0] || null;
    }

    values.push(id);
    const sql = `UPDATE sales_history SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const { rows } = await query(sql, values);
    return rows[0] || null;
  },

  async deleteById(id: number): Promise<SalesHistoryRow | null> {
    if (useMock) {
      return mockDb.salesHistory.remove(id);
    }
    const sql = 'DELETE FROM sales_history WHERE id = $1 RETURNING *';
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  }
};
