// components/TransactionReceiptPrint.tsx
import React from 'react';

interface TransactionReceiptPrintProps {
  data: any;
}

const TransactionReceiptPrint: React.FC<TransactionReceiptPrintProps> = ({ data }) => {
  const transaction = data.transaction;
  const type = transaction?.transaction_type || '';
  const isTransferIn = type === 'TRANSFER_IN';
  const isTransferOut = type === 'TRANSFER_OUT';
  const isTransfer = isTransferIn || isTransferOut;
  const isDepositLike = ['DEPOSIT', 'INITIAL', 'FD_INTEREST', 'SAVINGS_INTEREST', 'TRANSFER_IN'].includes(type);
  const isWithdrawalLike = ['WITHDRAWAL', 'TRANSFER_OUT'].includes(type);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 30);
    return date.toLocaleString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-LK', { 
      style: 'currency', 
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getTransactionTypeDisplay = (t: string) => {
    const typeMap: { [key: string]: string } = {
      'INITIAL': 'Initial Deposit',
      'DEPOSIT': 'Deposit',
      'WITHDRAWAL': 'Withdrawal',
      'FD_INTEREST': 'FD Interest',
      'SAVINGS_INTEREST': 'Savings Interest',
      'TRANSFER_IN': 'Transfer In',
      'TRANSFER_OUT': 'Transfer Out'
    };
    return typeMap[t] || t;
  };

  const getReceiptTitle = () => {
    if (isTransferIn) return 'Deposit Receipt';
    if (isTransferOut) return 'Transfer Receipt';
    if (isTransfer) return 'Transfer Receipt';
    return `${getTransactionTypeDisplay(type)} Receipt`;
  };

  const getTableType = () => {
    if (isTransferIn) return 'Transfer';
    if (isTransferOut) return 'Transfer';
    if (isTransfer) return 'Transfer';
    return getTransactionTypeDisplay(type);
  };

  const renderHolders = (holders: any[]) => (
    holders.map((holder: any, idx: number) => (
      <p key={idx}>{holder.first_name} {holder.last_name}</p>
    ))
  );

  const renderContent = () => {
    if (!transaction) return <p>No transaction data available</p>;

    return (
      <>
        <h1 className="text-2xl font-bold mb-4">{getReceiptTitle()}</h1>
        
        <div className="mb-6 space-y-1 text-sm">
          <p><strong>Reference Number:</strong> {transaction.reference_number || 'N/A'}</p>
          <p><strong>Date:</strong> {formatDate(transaction.time_date_stamp)}</p>
          {isTransfer ? (
            isTransferIn ? (
              <>
                <p><strong>Account Number:</strong> {data.toAccountInfo?.account?.account_id || data.accountInfo?.account?.account_id || 'N/A'}</p>
                <p><strong>Customer Name:</strong></p>
                {data.toAccountInfo?.holders ? renderHolders(data.toAccountInfo.holders) : data.accountInfo?.holders ? renderHolders(data.accountInfo.holders) : null}
                <p><strong>Account Type:</strong> {data.toAccountInfo?.account?.account_type_name || data.accountInfo?.account?.account_type_name || 'N/A'}</p>
                <br />
                <p><strong>From Account Number:</strong> {data.fromAccountInfo?.account?.account_id || 'N/A'}</p>
                <p><strong>From Customer Name:</strong></p>
                {data.fromAccountInfo?.holders ? renderHolders(data.fromAccountInfo.holders) : null}
                <br />
                <p><strong>Deposit Amount:</strong> {formatCurrency(transaction.amount)}</p>
                <p><strong>Remarks:</strong> {transaction.description || 'N/A'}</p>
              </>
            ) : (
              <>
                <p><strong>Account Number:</strong> {data.fromAccountInfo?.account?.account_id || data.accountInfo?.account?.account_id || 'N/A'}</p>
                <p><strong>Customer Name:</strong></p>
                {data.fromAccountInfo?.holders ? renderHolders(data.fromAccountInfo.holders) : data.accountInfo?.holders ? renderHolders(data.accountInfo.holders) : null}
                <p><strong>Account Type:</strong> {data.fromAccountInfo?.account?.account_type_name || data.accountInfo?.account?.account_type_name || 'N/A'}</p>
                <br />
                <p><strong>To Account Number:</strong> {data.toAccountInfo?.account?.account_id || 'N/A'}</p>
                <p><strong>To Customer Name:</strong></p>
                {data.toAccountInfo?.holders ? renderHolders(data.toAccountInfo.holders) : null}
                <br />
                <p><strong>Withdrawal Amount:</strong> {formatCurrency(transaction.amount)}</p>
                <p><strong>Remarks:</strong> {transaction.description || 'N/A'}</p>
              </>
            )
          ) : (
            <>
              <p><strong>Account Number:</strong> {data.accountInfo?.account?.account_id || 'N/A'}</p>
              <p><strong>Customer Name:</strong></p>
              {data.accountInfo?.holders ? renderHolders(data.accountInfo.holders) : null}
              <p><strong>Account Type:</strong> {data.accountInfo?.account?.account_type_name || 'N/A'}</p>
              <p><strong>{isDepositLike ? 'Deposit' : 'Withdrawal'} Amount:</strong> {formatCurrency(transaction.amount)}</p>
              <p><strong>Remarks:</strong> {transaction.description || 'N/A'}</p>
            </>
          )}
        </div>

        <table className="w-full border-collapse border border-gray-300 text-sm mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Type</th>
              <th className="border border-gray-300 p-2 text-left">Value</th>
              <th className="border border-gray-300 p-2 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">{getTableType()}</td>
              <td className="border border-gray-300 p-2">{formatCurrency(transaction.amount)}</td>
              <td className="border border-gray-300 p-2">{transaction.description || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </>
    );
  };

  return (
    <div className="p-8 bg-white font-sans text-gray-900">
      <div className="text-right mr-4 mt-4 text-2xl font-bold text-green-800 ml-4">
        B<span className="text-2xl font-normal">-TRUST</span>
      </div>
      {renderContent()}
      <p className="mt-6 text-xs text-gray-500">Printed on: {new Date().toLocaleString('en-LK')}</p>
    </div>
  );
};

export default TransactionReceiptPrint;