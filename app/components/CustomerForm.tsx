'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { TextInput } from '@/app/components/ui/TextInput';

export interface CustomerData {
  customer_id: string;
  first_name: string;
  last_name: string;
  nic_number: string;
  date_of_birth: string;
  gender: string;
  phone_number: string;
  email: string;
  address: string;
  status: string;
}

export interface CustomerFormData {
  customerId: string;
  firstName: string;
  lastName: string;
  nicNumber: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  customerType: 'existing' | 'new' | null;
  existingCustomer: CustomerData | null;
}

interface CustomerFormProps {
  index: number;
  customerForm: CustomerFormData;
  onChange: (index: number, updates: Partial<CustomerFormData>) => void;
  onCheckExisting: (index: number) => void;
  loading?: boolean;
  variant?: 'single' | 'joint';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CustomerForm({ 
  index, 
  customerForm, 
  onChange, 
  onCheckExisting, 
  loading = false,
  variant = 'single'
}: CustomerFormProps) {
  const [localLoading, setLocalLoading] = useState(false);
  const [age, setAge] = useState<string>(''); // local state for frontend-only age display

  // Function to calculate age based on DOB
  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Handle all input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // If date of birth changes, update both DOB and Age
    if (name === 'dateOfBirth') {
      const calculatedAge = calculateAge(value);
      setAge(calculatedAge > 0 ? calculatedAge.toString() : '');
      onChange(index, { dateOfBirth: value });
    } else {
      onChange(index, { [name]: value });
    }
  };

  const handleCheckExisting = async () => {
    setLocalLoading(true);
    await onCheckExisting(index);
    setLocalLoading(false);
  };

  const handleCustomerTypeChange = (type: 'existing' | 'new') => {
    onChange(index, { 
      customerType: type, 
      existingCustomer: null,
      ...(type === 'existing' ? {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        phone: '',
        address: ''
      } : {
        customerId: ''
      })
    });
    setAge(''); // reset age when switching type
  };

  const isChecking = loading || localLoading;

  return (
    <div className="border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {variant === 'joint' ? `Account Holder ${index + 1}` : ''}
      </h3>

      {/* Switch between Existing or New Customer */}
      <div className="flex gap-4 mb-6">
        <Button
          type="button"
          variant={customerForm.customerType === 'existing' ? 'primary' : 'secondary'}
          onClick={() => handleCustomerTypeChange('existing')}
        >
          Existing Customer
        </Button>
        <Button
          type="button"
          variant={customerForm.customerType === 'new' ? 'primary' : 'secondary'}
          onClick={() => handleCustomerTypeChange('new')}
        >
          New Customer
        </Button>
      </div>

      {/* Existing Customer Section */}
      {customerForm.customerType === 'existing' && (
        <div className="space-y-4">
          <TextInput
            label="NIC Number"
            name="nicNumber"
            value={customerForm.nicNumber}
            onChange={handleChange}
            required
          />
          <Button
            type="button"
            onClick={handleCheckExisting}
            variant="secondary"
            disabled={isChecking || !customerForm.nicNumber}
          >
            {isChecking ? 'Checking...' : 'Check Customer'}
          </Button>

          {customerForm.existingCustomer && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Customer Found</h4>
              <p className="text-sm text-gray-700"><strong>Name:</strong> {customerForm.existingCustomer.first_name} {customerForm.existingCustomer.last_name}</p>
              <p className="text-sm text-gray-700"><strong>Email:</strong> {customerForm.existingCustomer.email}</p>
              <p className="text-sm text-gray-700"><strong>Phone:</strong> {customerForm.existingCustomer.phone_number}</p>
              <p className="text-sm text-gray-700"><strong>Status:</strong> {customerForm.existingCustomer.status}</p>
            </div>
          )}
        </div>
      )}

      {/* New Customer Section */}
      {customerForm.customerType === 'new' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextInput 
            label="First Name" 
            name="firstName" 
            value={customerForm.firstName} 
            onChange={handleChange} 
            required 
          />
          <TextInput 
            label="Last Name" 
            name="lastName" 
            value={customerForm.lastName} 
            onChange={handleChange} 
            required 
          />
          <TextInput 
            label="NIC Number" 
            name="nicNumber" 
            value={customerForm.nicNumber} 
            onChange={handleChange} 
            required 
          />

          {/* Date of Birth + Age side by side */}
          <div className="grid grid-cols-2 gap-4">
            <TextInput 
              type="date" 
              label="Date of Birth" 
              name="dateOfBirth" 
              value={customerForm.dateOfBirth} 
              onChange={handleChange} 
              required 
            />
            <TextInput 
              label="Age" 
              name="age" 
              value={age} 
              onChange={() => {}} 
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700">Gender</label>
            <select
              name="gender"
              value={customerForm.gender}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
            >
              <option value="">Select Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>

          <TextInput 
            label="Phone Number" 
            name="phone" 
            value={customerForm.phone} 
            onChange={handleChange} 
            required 
          />
          <TextInput 
            label="Email" 
            name="email" 
            value={customerForm.email} 
            onChange={handleChange} 
            required 
          />
          <TextInput 
            label="Address" 
            name="address" 
            value={customerForm.address} 
            onChange={handleChange} 
            required 
          />
        </div>
      )}
    </div>
  );
}
