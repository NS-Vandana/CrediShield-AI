/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  transaction_id: string;
  user_id: string;
  timestamp: string;
  amount: number;
  category: string;
  transaction_status: 'Success' | 'Failed' | 'Pending';
  payment_method: string;
  merchant_id: string;
  pay_later_requested: boolean;
  device_type: string;
}

export interface UserRiskProfile {
  user_id: string;
  risk_profile: 'low' | 'medium' | 'high';
  age: number;
  monthly_income: number;
  city: string;
  account_age_days: number;
  credit_limit: number;
  app_sessions_per_week: number;
  kyc_verified: boolean;
  total_transactions: number;
  failed_payments_count: number;
  on_time_payment_pct: number;
  avg_spend_30d_inr: number;
  max_single_txn_inr: number;
  distinct_categories_used: number;
  pay_later_usage_count: number;
  risk_score: number;
  credit_decision: 'Approved' | 'Rejected' | 'Review';
  approved_credit_limit_inr: number;
  decision_reason: string;
}

export interface RealTimeAggregates {
  avg_spend_l30d: number;
  failed_count_l30d: number;
  velocity_l24h: number;
  top_category: string;
  current_risk_score: number;
}
