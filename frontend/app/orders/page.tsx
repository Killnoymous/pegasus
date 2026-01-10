'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import apiClient from '@/lib/api'

interface Order {
  id: number
  user_id: number
  call_id: string | null
  customer_name: string
  phone: string
  order_details: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    call_id: '',
    customer_name: '',
    phone: '',
    order_details: '',
    address: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/orders?limit=100')
      setOrders(response.data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const payload = {
        ...formData,
        call_id: formData.call_id || null,
        order_details: formData.order_details || null,
        address: formData.address || null,
      }
      await apiClient.post('/orders', payload)
      setShowForm(false)
      setFormData({
        call_id: '',
        customer_name: '',
        phone: '',
        order_details: '',
        address: '',
      })
      fetchOrders()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create order')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return

    try {
      await apiClient.delete(`/orders/${id}`)
      fetchOrders()
    } catch (error) {
      console.error('Failed to delete order:', error)
      alert('Failed to delete order')
    }
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage captured orders and customer data
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : 'Add Order'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add Order</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Call ID (Optional)
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.call_id}
                  onChange={(e) => setFormData({ ...formData, call_id: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Order Details
                </label>
                <textarea
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.order_details}
                  onChange={(e) => setFormData({ ...formData, order_details: e.target.value })}
                  placeholder="Order details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Delivery address..."
                />
              </div>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Add Order
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500">No orders yet. Add your first order above.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {orders.map((order) => (
                <li key={order.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {order.customer_name}
                        </h3>
                        {order.call_id && (
                          <span className="text-xs text-gray-500">
                            Call ID: {order.call_id}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">Phone: {order.phone}</p>
                      {order.order_details && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                          <p className="text-xs text-gray-500 mb-1">Order Details:</p>
                          <p className="text-sm text-gray-700">{order.order_details}</p>
                        </div>
                      )}
                      {order.address && (
                        <p className="mt-2 text-sm text-gray-600">Address: {order.address}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        Created: {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
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

