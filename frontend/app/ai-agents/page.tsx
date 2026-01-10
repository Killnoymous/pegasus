'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import apiClient from '@/lib/api'

interface PhoneLinkFormProps {
  agentId: number
  phoneNumbers: PhoneNumber[]
  onLink: (agentId: number, phoneIds: number[]) => void
  onCancel: () => void
}

function PhoneLinkForm({ agentId, phoneNumbers, onLink, onCancel }: PhoneLinkFormProps) {
  const [selectedPhones, setSelectedPhones] = useState<number[]>([])

  const handleCheckboxChange = (phoneId: number, checked: boolean) => {
    if (checked) {
      setSelectedPhones([...selectedPhones, phoneId])
    } else {
      setSelectedPhones(selectedPhones.filter((id) => id !== phoneId))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLink(agentId, selectedPhones)
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-md">
      <p className="text-sm font-medium mb-2">Select phone numbers to link:</p>
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          {phoneNumbers.map((phone) => (
            <label key={phone.id} className="flex items-center">
              <input
                type="checkbox"
                value={phone.id}
                checked={selectedPhones.includes(phone.id)}
                onChange={(e) => handleCheckboxChange(phone.id, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{phone.number}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex space-x-3">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
          >
            Link Selected
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

interface AIAgent {
  id: number
  user_id: number
  agent_name: string
  system_prompt: string
  language: string
  voice_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PhoneNumber {
  id: number
  number: string
}

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    agent_name: '',
    system_prompt: '',
    language: 'en',
    voice_name: '',
    is_active: true,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAgents()
    fetchPhoneNumbers()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await apiClient.get('/ai-agents')
      setAgents(response.data)
    } catch (error) {
      console.error('Failed to fetch AI agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPhoneNumbers = async () => {
    try {
      const response = await apiClient.get('/phone-numbers')
      setPhoneNumbers(response.data)
    } catch (error) {
      console.error('Failed to fetch phone numbers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const payload = {
        ...formData,
        voice_name: formData.voice_name || null,
      }
      await apiClient.post('/ai-agents', payload)
      setShowForm(false)
      setFormData({
        agent_name: '',
        system_prompt: '',
        language: 'en',
        voice_name: '',
        is_active: true,
      })
      fetchAgents()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create AI agent')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this AI agent?')) return

    try {
      await apiClient.delete(`/ai-agents/${id}`)
      fetchAgents()
    } catch (error) {
      console.error('Failed to delete AI agent:', error)
      alert('Failed to delete AI agent')
    }
  }

  const toggleActive = async (agent: AIAgent) => {
    try {
      await apiClient.put(`/ai-agents/${agent.id}`, {
        is_active: !agent.is_active,
      })
      fetchAgents()
    } catch (error) {
      console.error('Failed to update AI agent:', error)
    }
  }

  const handleLinkPhones = async (agentId: number, phoneIds: number[]) => {
    try {
      await apiClient.post(`/ai-agents/${agentId}/link-phones`, {
        phone_number_ids: phoneIds,
      })
      alert('Phone numbers linked successfully')
      setSelectedAgent(null)
    } catch (error) {
      console.error('Failed to link phone numbers:', error)
      alert('Failed to link phone numbers')
    }
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
            <p className="mt-2 text-sm text-gray-600">
              Configure your AI agents for voice calls (Future: AI voice integration)
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : 'Create AI Agent'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create AI Agent</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Agent Name
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.agent_name}
                  onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  System Prompt
                </label>
                <textarea
                  required
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="Enter the system prompt for your AI agent..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="en, hi, es, etc."
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Voice Name (Future)
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Future: Voice selection"
                    value={formData.voice_name}
                    onChange={(e) => setFormData({ ...formData, voice_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Create AI Agent
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : agents.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500">No AI agents yet. Create your first AI agent above.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {agents.map((agent) => (
                <li key={agent.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{agent.agent_name}</h3>
                        <button
                          onClick={() => toggleActive(agent)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            agent.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {agent.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Language: {agent.language} | Voice: {agent.voice_name || 'Not set'}
                      </p>
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-500 mb-1">System Prompt:</p>
                        <p className="text-sm text-gray-700">{agent.system_prompt}</p>
                      </div>
                      <div className="mt-3 flex space-x-3">
                        <button
                          onClick={() => setSelectedAgent(agent.id)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          Link Phone Numbers
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                      {selectedAgent === agent.id && (
                        <PhoneLinkForm
                          agentId={agent.id}
                          phoneNumbers={phoneNumbers}
                          onLink={handleLinkPhones}
                          onCancel={() => setSelectedAgent(null)}
                        />
                      )}
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

