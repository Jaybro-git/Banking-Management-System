'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';
import DepositReceiptPrint from '@/app/components/DepositReceiptPrint';

interface HeaderProps {
  activeTab: string;
}

const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">New Deposits</h1>
        <p className="text-m text-gray-500">Process deposit transactions for customers</p>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/" passHref>
          <Button type="button" variant="danger" size="md" className="w-full mt-6">
            Cancel
          </Button>
        </Link>
      </div>
    </header>
  );
};

interface Holder {
  customerName: string;
  nic: string;
  phone: string;
  email: string;
}

interface AccountInfo {
  holders: Holder[];
  accountType: string;
  currentBalance: string;
  isValid: boolean;
}

interface Transaction {
  transactionId: string;
  referenceNumber: string;
  balanceBefore: number;
  balanceAfter: number;
  time_date_stamp: string;
  employee_id?: string; // Added to handle employee_id from backend
}

interface Account {
  account_id: string;
  account_type_name: string;
}

interface DepositHolder {
  first_name: string;
  last_name: string;
  nic_number: string;
  phone_number: string;
  email: string;
}

interface DepositAccountInfo {
  account: Account;
  holders: DepositHolder[];
}

interface DepositResult {
  transaction: Transaction;
  accountInfo: DepositAccountInfo;
  depositAmount: string;
  remarks: string;
}

export default function NewDepositsPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const [form, setForm] = useState({
    accountNumber: '',
    depositAmount: '',
    remarks: ''
  });

  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    holders: [],
    accountType: '',
    currentBalance: '',
    isValid: false
  });

  const [depositResult, setDepositResult] = useState<DepositResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateAccount = async () => {
    if (form.accountNumber.length < 10) {
      setError('Account number must be at least 10 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions/account/${form.accountNumber}/info`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.error) {
        setAccountInfo({
          holders: [],
          accountType: '',
          currentBalance: '',
          isValid: false
        });
        setError(data.error);
      } else {
        setAccountInfo({
          holders: data.holders,
          accountType: data.accountType,
          currentBalance: data.currentBalance,
          isValid: true
        });
      }
    } catch (err) {
      setError('Failed to fetch account info');
      setAccountInfo({
        holders: [],
        accountType: '',
        currentBalance: '',
        isValid: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Ensures JWT token is sent for employee_id extraction on backend
        body: JSON.stringify({
          accountId: form.accountNumber,
          amount: parseFloat(form.depositAmount),
          description: form.remarks || 'Deposit'
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setDepositResult(data);
        alert('Deposit processed successfully!');
      }
    } catch (err) {
      setError('Failed to process deposit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-8 py-6 max-w-7xl">
        <Header activeTab="deposits" />
        
        {/* Form Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Account & Deposit Information</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Account & Deposit Details */}
              <div className="space-y-6">
                
                {/* Account Number */}
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <TextInput
                      label="Account Number"
                      name="accountNumber"
                      value={form.accountNumber}
                      onChange={handleChange}
                      required
                      placeholder="Enter customer account number"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={validateAccount}
                    disabled={loading || form.accountNumber.length < 10}
                  >
                    {loading ? 'Checking...' : 'Check'}
                  </Button>
                </div>                

                {/* Deposit Amount */}
                <div>
                  <TextInput
                    label="Deposit Amount (LKR)"
                    name="depositAmount"
                    value={form.depositAmount}
                    onChange={handleChange}
                    required
                    placeholder="Enter deposit amount"
                  />
                </div>

                {/* Remarks */}
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Remarks</label>
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Additional notes or remarks about this transaction..."
                  />
                </div>
              </div>

              {/* Right Column - Payment & Transaction Details */}
              <div className="space-y-6">

                {/* Account Info Display */}
                {accountInfo.isValid && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h3 className="font-semibold text-gray-800 mb-3">Account Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Account Type:</strong> {accountInfo.accountType}</div>
                      <div><strong>Current Balance:</strong> LKR {accountInfo.currentBalance}</div>
                      <div><strong>Account Holders:</strong></div>
                      {accountInfo.holders.map((holder, index) => (
                        <div key={index} className="ml-4">
                          <div><strong>Name:</strong> {holder.customerName}</div>
                          <div><strong>NIC:</strong> {holder.nic}</div>
                          <div><strong>Phone:</strong> {holder.phone}</div>
                          <div><strong>Email:</strong> {holder.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transaction Summary */}
                {form.depositAmount && accountInfo.isValid && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Transaction Summary</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div><strong>Account:</strong> {form.accountNumber}</div>
                      <div><strong>Amount:</strong> LKR {form.depositAmount}</div>
                      <div><strong>Remarks:</strong> {form.remarks}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-8 pt-6 border-t border-gray-300">
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!depositResult || loading}
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
                <Button
                  type="submit"
                  disabled={!accountInfo.isValid || !form.depositAmount || loading}
                  className={`bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 ${(!accountInfo.isValid || !form.depositAmount || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Processing...' : 'Process Deposit'}
                </Button>
              </div>
            </div>
          </form>

          {depositResult && (
            <div className="receipt mt-8">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .receipt, .receipt * {
                    visibility: visible;
                  }
                  .receipt {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                  }
                }
              `}</style>
              <DepositReceiptPrint
                transaction={depositResult.transaction}
                accountInfo={depositResult.accountInfo}
                depositAmount={depositResult.depositAmount}
                remarks={depositResult.remarks}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}