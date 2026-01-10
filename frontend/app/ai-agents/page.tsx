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
    <div className="mt-4 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 animate-fadeIn">
      <p className="text-sm font-semibold text-indigo-900 mb-3">Link Phone Numbers to this Agent:</p>
      <form onSubmit={handleSubmit}>
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
          {phoneNumbers.map((phone) => (
            <label key={phone.id} className="flex items-center p-2 rounded-md hover:bg-white/50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                value={phone.id}
                checked={selectedPhones.includes(phone.id)}
                onChange={(e) => handleCheckboxChange(phone.id, e.target.checked)}
                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-all"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">{phone.number}</span>
            </label>
          ))}
          {phoneNumbers.length === 0 && (
            <p className="text-sm text-gray-500 italic">No phone numbers available to link.</p>
          )}
        </div>
        <div className="mt-5 flex space-x-3">
          <button
            type="submit"
            disabled={phoneNumbers.length === 0}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Link Selected
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm transition-all"
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
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Agents</h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage your AI voice assistants and their behaviors.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowForm(!showForm)}
              className={`inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-all duration-200 
                ${showForm
                  ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              {showForm ? 'Cancel Creation' : 'Create New Agent'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden mb-10 transform transition-all animate-slideDown">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">New Agent Configuration</h2>
            </div>

            <div className="p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md text-sm">
                  <p className="font-semibold">Error</p>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-shadow shadow-sm hover:shadow-md"
                      placeholder="e.g. Sales Representative, Support Bot"
                      value={formData.agent_name}
                      onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      System Prompt
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Define how your AI agent should behave, its personality, and instructions.</p>
                    <textarea
                      required
                      rows={8}
                      className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-shadow shadow-sm hover:shadow-md font-mono text-sm leading-relaxed"
                      value={formData.system_prompt}
                      onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                      placeholder="You are a helpful customer support assistant for Pegasus Corp. You help users with..."
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Language Code
                    </label>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-lg border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-shadow shadow-sm"
                      placeholder="en-US"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-sm font-bold text-gray-900 mb-1">
                      Voice ID (Coming Soon)
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-lg border-gray-200 bg-gray-100 px-4 py-3 text-gray-500 cursor-not-allowed focus:border-gray-200 focus:ring-0 sm:text-sm"
                      placeholder="Default Voice"
                      value={formData.voice_name}
                      disabled
                      onChange={(e) => setFormData({ ...formData, voice_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center pt-4">
                  <div className="flex items-center h-5">
                    <input
                      id="is_active"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="is_active" className="font-bold text-gray-900 select-none cursor-pointer">
                      Activate Agent Immediately
                    </label>
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Create Agent
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading your agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors group cursor-pointer" onClick={() => setShowForm(true)}>
            <div className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-500 transition-colors">
              <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No agents defined</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new AI personality.</p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Agent
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
            <ul className="divide-y divide-gray-100">
              {agents.map((agent) => (
                <li key={agent.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                  <div className="px-6 py-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900 truncate flex items-center">
                            {agent.agent_name}
                          </h3>
                          <button
                            onClick={() => toggleActive(agent)}
                            className={`ml-4 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors ${agent.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                          >
                            <span className={`w-2 h-2 rounded-full mr-1.5 self-center ${agent.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                            {agent.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>

                        <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                          <span className="flex items-center">
                            <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            {agent.language}
                          </span>
                          <span className="flex items-center">
                            <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            {agent.voice_name || 'Default Voice'}
                          </span>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 relative group">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">System Prompt</p>
                          <p className="text-sm text-gray-700 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                            {agent.system_prompt}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center space-x-4">
                          <button
                            onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                            className={`inline-flex items-center text-sm font-medium transition-colors ${selectedAgent === agent.id ? 'text-indigo-700' : 'text-indigo-600 hover:text-indigo-800'}`}
                          >
                            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            {selectedAgent === agent.id ? 'Close Phone Link' : 'Link Phone Numbers'}
                          </button>

                          <span className="text-gray-300">|</span>

                          <button
                            onClick={() => handleDelete(agent.id)}
                            className="inline-flex items-center text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                          >
                            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Agent
                          </button>
                        </div>

                        {selectedAgent === agent.id && (
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <PhoneLinkForm
                              agentId={agent.id}
                              phoneNumbers={phoneNumbers}
                              onLink={handleLinkPhones}
                              onCancel={() => setSelectedAgent(null)}
                            />
                          </div>
                        )}
                      </div>
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

