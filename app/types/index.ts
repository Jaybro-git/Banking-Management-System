import React from 'react';

export interface Transaction {
  date: string;
  account: string;
  type: string;
  amount: number;
  ref: string;
  customer: string;
}

export interface ActionItem {
  icon: React.ReactElement;
  title: string;
  description: string;
  href: string;
  scroll?: boolean;
}

export type TabType = "overview" | "transactions" | "customers";

export type FilterType = "All" | "Deposit" | "Withdrawal";

export type SearchField = "customer" | "account" | "ref" | "date";

export type CustomerFilterType =
  | "All"
  | "Savings Accounts"
  | "Joint Accounts"
  | "Fixed Deposits"
  | "Children's Accounts"
  | "Teen Accounts"
  | "Processed by Me";

export type CustomerSearchField = "account" | "customer";

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
  fill: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}