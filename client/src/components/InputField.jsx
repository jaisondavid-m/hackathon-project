import React from 'react';

function InputField({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  required = false,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon size={18} className="transition-colors duration-200 group-focus-within:text-[#7D53F6]" />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full ${
            Icon ? 'pl-10' : 'pl-4'
          } pr-4 py-2.5 bg-white text-slate-900 border rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7D53F6]/20 focus:border-[#7D53F6] ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200/20'
              : 'border-slate-200 focus:ring-[#7D53F6]/20'
          }`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-500 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export default InputField;
