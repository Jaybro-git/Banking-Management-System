import React from 'react';

interface TextInputProps {
  label: string;
  type?: 'text' | 'email' | 'tel' | 'password' | 'date';
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  required = false,
  placeholder,
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="block mb-1 text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
};