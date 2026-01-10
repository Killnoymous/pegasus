'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import apiClient from '@/lib/api'

interface PhoneNumber {
  id: number
  user_id: number
  number: string
  provider: string
  status: string
  created_at: string
  updated_at: string
}

export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    number: '',
    provider: 'Knowlarity',
    status: 'active',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPhoneNumbers()
  }, [])

  const fetchPhoneNumbers = async () => {
    try {
      const response = await apiClient.get('/phone-numbers')
      setPhoneNumbers(response.data)
    } catch (error) {
      console.error('Failed to fetch phone numbers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await apiClient.post('/phone-numbers', formData)
      setShowForm(false)
      setFormData({ number: '', provider: 'Knowlarity', status: 'active' })
      fetchPhoneNumbers()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create phone number')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this phone number?')) return

    try {
      await apiClient.delete(`/phone-numbers/${id}`)
      fetchPhoneNumbers()
    } catch (error) {
      console.error('Failed to delete phone number:', error)
      alert('Failed to delete phone number')
    }
  }

  const toggleStatus = async (phone: PhoneNumber) => {
    try {
      await apiClient.put(`/phone-numbers/${phone.id}`, {
        status: phone.status === 'active' ? 'inactive' : 'active',
      })
      fetchPhoneNumbers()
    } catch (error) {
      console.error('Failed to update phone number:', error)
    }
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Phone Numbers</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your phone numbers (Future: Knowlarity DID integration)
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : 'Add Phone Number'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add Phone Number</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., +1234567890"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Provider
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Add Phone Number
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : phoneNumbers.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500">No phone numbers yet. Add your first phone number above.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {phoneNumbers.map((phone) => (
                <li key={phone.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{phone.number}</p>
                      <p className="text-sm text-gray-500">
                        Provider: {phone.provider} | Created: {new Date(phone.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleStatus(phone)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          phone.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {phone.status}
                      </button>
                      <button
                        onClick={() => handleDelete(phone.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  )
}

