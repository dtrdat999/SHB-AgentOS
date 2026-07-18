// ============================================================
// SHB-AgentOS: Customer Tools
// ============================================================

import { getCustomerById, getCustomerHistory } from '../db/queries';

export async function queryCustomerProfile(customerId: string) {
  const customer = await getCustomerById(customerId);
  if (!customer) {
    throw new Error(`Customer with ID ${customerId} not found.`);
  }
  return customer;
}

export async function checkCustomerHistory(customerId: string) {
  const history = await getCustomerHistory(customerId);
  return {
    totalApplications: history.length,
    history,
  };
}
