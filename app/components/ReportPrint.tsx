import React from 'react';

interface TransactionRow {
  time_date_stamp: string | null;
  reference_number: string;
  account_id: string;
  customer_names: string | null;
  transaction_type?: string;
  amount: number | string | null;
  description: string | null;
  branch_name: string;
  account_type_name?: string;
}

interface FDRow {
  fd_id: string;
  account_id: string;
  customer_names: string | null;
  amount: number | string | null;
  interest_rate: number | string;
  start_date: string | null;
  next_interest_payout_date: string | null;
  branch_name: string;
}

interface SummaryRow {
  account_type_name: string;
  total_interest: number | string | null;
  payment_count: number;
}

interface ReportPrintProps {
  reportType: string;
  fromDate: string;
  toDate: string;
  branchName: string;
  data: TransactionRow[] | FDRow[] | SummaryRow[];
  totals: any; // You can define a more specific type for totals if needed
  additionalData?: TransactionRow[];
}

const ReportPrint: React.FC<ReportPrintProps> = ({ reportType, fromDate, toDate, branchName, data, totals, additionalData }) => {
  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const sriLankaTime = new Date(d.getTime() + (5 * 60 + 30) * 60 * 1000);
    return sriLankaTime.toLocaleString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: string | number | null): string => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(amount || 0));
  };

  const printDate = new Date().toLocaleString('en-LK');

  let title = '';
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let totalsSection: React.ReactNode = null;
  let additionalSection: React.ReactNode = null;

  if (reportType === 'transaction-summary') {
    title = 'Transaction Summary Report';
    tableHeaders = ['Date', 'Reference Number', 'Account ID', 'Customer Names', 'Type', 'Amount', 'Description', 'Branch'];
    tableRows = (data as TransactionRow[]).map(row => [
      formatDate(row.time_date_stamp),
      row.reference_number,
      row.account_id,
      row.customer_names || 'N/A',
      row.transaction_type || '',
      formatCurrency(row.amount),
      row.description || 'N/A',
      row.branch_name
    ]);
    totalsSection = (
      <div className="mt-4">
        <h3 className="font-bold">Totals:</h3>
        <p>Total Deposits: {formatCurrency(totals.total_deposits)}</p>
        <p>Total Withdrawals: {formatCurrency(totals.total_withdrawals)}</p>
        <p>Total Transfer Ins: {formatCurrency(totals.total_transfer_ins)}</p>
        <p>Total Transfer Outs: {formatCurrency(totals.total_transfer_outs)}</p>
        <p>Total FD Interests: {formatCurrency(totals.total_fd_interests)}</p>
        <p>Total Savings Interests: {formatCurrency(totals.total_savings_interests)}</p>
      </div>
    );
  } else if (reportType === 'active-fixed-deposits') {
    title = 'Active Fixed Deposits Report';
    tableHeaders = ['FD ID', 'Account ID', 'Customer Names', 'Amount', 'Interest Rate', 'Start Date', 'Next Payout Date', 'Branch'];
    tableRows = (data as FDRow[]).map(row => [
      row.fd_id,
      row.account_id,
      row.customer_names || 'N/A',
      formatCurrency(row.amount),
      `${row.interest_rate}%`,
      formatDate(row.start_date),
      formatDate(row.next_interest_payout_date),
      row.branch_name
    ]);
    totalsSection = (
      <div className="mt-4">
        <h3 className="font-bold">Totals:</h3>
        <p>Total Active FDs: {totals.count}</p>
        <p>Total Amount: {formatCurrency(totals.total_amount)}</p>
      </div>
    );
  } else if (reportType === 'savings-interest-payment' || reportType === 'fd-interest-payment') {
    title = reportType === 'savings-interest-payment' ? 'Savings Interest Payment Report' : 'FD Interest Payment Report';
    tableHeaders = ['Date', 'Reference Number', 'Account ID', 'Customer Names', 'Amount', 'Description', 'Branch'];
    tableRows = (data as TransactionRow[]).map(row => [
      formatDate(row.time_date_stamp),
      row.reference_number,
      row.account_id,
      row.customer_names || 'N/A',
      formatCurrency(row.amount),
      row.description || 'N/A',
      row.branch_name
    ]);
    totalsSection = (
      <div className="mt-4">
        <p>Total Interest Paid: {formatCurrency(totals.total_interest)}</p>
      </div>
    );
  } else if (reportType === 'interest-distribution-summary') {
    title = 'Interest Distribution Summary';
    tableHeaders = ['Account Type', 'Total Interest', 'Payment Count'];
    tableRows = (data as SummaryRow[]).map(row => [
      row.account_type_name,
      formatCurrency(row.total_interest),
      row.payment_count.toString()
    ]);
    totalsSection = (
      <div className="mt-4">
        <p>Grand Total: {formatCurrency(totals.grand_total)}</p>
      </div>
    );
    if (additionalData && additionalData.length > 0) {
      const groupedByAccountType: { [key: string]: TransactionRow[] } = additionalData.reduce((acc: { [key: string]: TransactionRow[] }, row: TransactionRow) => {
        const accountType = row.account_type_name || 'Unknown';
        if (!acc[accountType]) {
          acc[accountType] = [];
        }
        acc[accountType].push(row);
        return acc;
      }, {});

      additionalSection = (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Detailed Savings Interest Transactions</h3>
          {Object.entries(groupedByAccountType).map(([accountType, transactions]: [string, TransactionRow[]]) => (
            <div key={accountType} className="mb-6">
              <h4 className="font-medium text-gray-800 mb-2">{accountType}</h4>
              <p className="mb-2">Total Rows: {transactions.length}</p>
              <table className="w-full border-collapse border border-gray-300 text-sm mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Date</th>
                    <th className="border border-gray-300 p-2 text-left">Reference Number</th>
                    <th className="border border-gray-300 p-2 text-left">Account ID</th>
                    <th className="border border-gray-300 p-2 text-left">Customer Names</th>
                    <th className="border border-gray-300 p-2 text-left">Amount</th>
                    <th className="border border-gray-300 p-2 text-left">Description</th>
                    <th className="border border-gray-300 p-2 text-left">Branch</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((row: TransactionRow, rowIdx: number) => (
                    <tr key={rowIdx}>
                      <td className="border border-gray-300 p-2">{formatDate(row.time_date_stamp)}</td>
                      <td className="border border-gray-300 p-2">{row.reference_number}</td>
                      <td className="border border-gray-300 p-2">{row.account_id}</td>
                      <td className="border border-gray-300 p-2">{row.customer_names || 'N/A'}</td>
                      <td className="border border-gray-300 p-2">{formatCurrency(row.amount)}</td>
                      <td className="border border-gray-300 p-2">{row.description || 'N/A'}</td>
                      <td className="border border-gray-300 p-2">{row.branch_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div className="p-8 bg-white font-sans text-gray-900">
      <div className="text-right mr-4 mt-4 text-2xl font-bold text-green-800 ml-4">
        B<span className="text-2xl font-normal">-TRUST</span>
      </div>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="mb-6 space-y-1 text-sm">
        {fromDate && toDate ? <p><strong>Date Range:</strong> {fromDate} to {toDate}</p> : null}
        <p><strong>Branch:</strong> {branchName}</p>
      </div>
      <p className="mb-2">Total Rows: {tableRows.length}</p>
      <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
        <thead>
          <tr className="bg-gray-100">
            {tableHeaders.map((header, idx) => (
              <th key={idx} className="border border-gray-300 p-2 text-left">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="border border-gray-300 p-2">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {totalsSection}
      {additionalSection}
      <p className="mt-6 text-xs text-gray-500">Printed on: {printDate}</p>
    </div>
  );
};

export default ReportPrint;