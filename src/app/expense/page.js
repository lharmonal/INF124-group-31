'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';

const fetcher = (url) =>
  fetch(url, { credentials: 'include' })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    })
    .then(data => data.expenses);

export default function ExpensePage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    category: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);

  // 1. SWR load & revalidate every 30s
  const { data: expenses = [], error, mutate } = useSWR(
    '/api/expense',
    fetcher,
    { refreshInterval: 30000 }
  );

  if (error) return <div className="text-red-600">Error loading expenses.</div>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });

      if (!res.ok) throw new Error('Post failed');

      const saved = await res.json();
      // 2. append to SWR cache (no refetch needed)
      mutate(prev => [...prev, saved], false);

      setFormData({ date: '', description: '', category: '', amount: '' });
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = expenses.reduce((sum, x) => sum + x.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center text-gray-900 mb-8"
        >
          Expenses
        </motion.h1>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowForm(prev => !prev)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500 transition"
          >
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
        </div>

        {showForm && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
            className="mb-6 p-6 bg-white rounded-lg shadow space-y-4"
          >
            {['date','description','category','amount'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === 'amount' ? 'number' : field === 'date' ? 'date' : 'text'}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                  step={field === 'amount' ? '0.01' : undefined}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-500 transition"
            >
              {loading ? 'Submitting...' : 'Submit Expense'}
            </button>
          </motion.form>
        )}

        <table className="w-full table-auto border-collapse bg-white rounded shadow overflow-hidden">
          <thead className="bg-gray-100">
            <tr className="text-left text-gray-700">
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Description</th>
              <th className="border px-4 py-2">Category</th>
              <th className="border px-4 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense._id} className="text-gray-800">
                <td className="border px-4 py-2">{expense.date}</td>
                <td className="border px-4 py-2">{expense.description}</td>
                <td className="border px-4 py-2">{expense.category}</td>
                <td className="border px-4 py-2">${expense.amount.toFixed(2)}</td>
              </tr>
            ))}
            {expenses.length > 0 && (
              <tr className="font-semibold text-gray-900">
                <td className="border px-4 py-2" colSpan="3">Total</td>
                <td className="border px-4 py-2">${totalAmount.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
