'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import apiClient from '@/lib/api'

interface DashboardStats {
  total_phone_numbers: number
  active_phone_numbers: number
  total_ai_agents: number
  active_ai_agents: number
  total_calls: number
  total_orders: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/dashboard/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (!stats) {
    return (
      <Layout>
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center text-red-600">Failed to load dashboard stats</div>
        </div>
      </Layout>
    )
  }

  const statCards = [
    {
      title: 'Connected Phone Numbers',
      value: stats.active_phone_numbers,
      subtitle: `${stats.total_phone_numbers} total`,
      color: 'bg-blue-500',
    },
    {
      title: 'Active AI Agents',
      value: stats.active_ai_agents,
      subtitle: `${stats.total_ai_agents} total`,
      color: 'bg-green-500',
    },
    {
      title: 'Total Calls',
      value: stats.total_calls,
      subtitle: 'All time',
      color: 'bg-purple-500',
    },
    {
      title: 'Total Orders Captured',
      value: stats.total_orders,
      subtitle: 'All time',
      color: 'bg-orange-500',
    },
  ]

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of your AI calling platform
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${card.color} rounded-md p-3`}>
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {card.value}
                        </div>
                      </dd>
                      <dd className="text-xs text-gray-500">{card.subtitle}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

