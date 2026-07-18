// ============================================================
// SHB-AgentOS: Common Database Queries
// Reusable query functions for all modules
// ============================================================
// TODO: Expand in Milestone 2-4

import { getServerClient } from './supabase';
import type { Customer, LoanApplication, DashboardKPIs } from '@/lib/core/types';

/**
 * Get customer by ID
 */
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error) return null;
  return data as Customer;
}

/**
 * Get all customers (for dropdown selection)
 */
export async function getAllCustomers(): Promise<Customer[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('full_name');

  if (error) return [];
  return data as Customer[];
}

/**
 * Get customer's previous loan applications (memory/history)
 */
export async function getCustomerHistory(customerId: string): Promise<LoanApplication[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('loan_applications')
    .select('*')
    .eq('customer_id', customerId)
    .order('submitted_at', { ascending: false });

  if (error) return [];
  return data as LoanApplication[];
}

/**
 * Check if customer was previously rejected
 */
export async function wasCustomerPreviouslyRejected(customerId: string): Promise<boolean> {
  const history = await getCustomerHistory(customerId);
  return history.some(app => 
    app.final_status === 'auto_rejected' || 
    app.final_status === 'manager_rejected'
  );
}

/**
 * Check AML watchlist by customer name or ID number
 */
export async function checkAmlWatchlist(customerName: string, idNumber: string | null): Promise<{
  isOnWatchlist: boolean;
  matches: Array<{ entity_name: string; risk_level: string; reason: string | null }>;
}> {
  const supabase = getServerClient();
  
  // Check by name (case-insensitive partial match)
  let query = supabase
    .from('aml_watchlist')
    .select('entity_name, risk_level, reason');

  // Try matching by ID number first (more precise)
  if (idNumber) {
    const { data: idMatches } = await supabase
      .from('aml_watchlist')
      .select('entity_name, risk_level, reason')
      .eq('id_number', idNumber);

    if (idMatches && idMatches.length > 0) {
      return { isOnWatchlist: true, matches: idMatches };
    }
  }

  // Fallback: match by name
  const { data: nameMatches } = await supabase
    .from('aml_watchlist')
    .select('entity_name, risk_level, reason')
    .ilike('entity_name', `%${customerName}%`);

  return {
    isOnWatchlist: (nameMatches?.length ?? 0) > 0,
    matches: nameMatches ?? [],
  };
}
