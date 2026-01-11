'use client'

import React, { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import apiClient from '@/lib/api'

// --- Interfaces ---

interface PhoneLinkFormProps {
  agentId: number
  phoneNumbers: PhoneNumber[]
  onLink: (agentId: number, phoneIds: number[]) => void
  onCancel: () => void
}

interface AIAgent {
  id: number
  user_id: number
  agent_name: string
  system_prompt: string
  language: string
  voice_name: string | null
  is_active: boolean
  configuration: any // For the new JSON config
  created_at: string
  updated_at: string
}

interface PhoneNumber {
  id: number
  number: string
}

// --- Sub-Components ---

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

// --- Main Page Component ---

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)

  // Advanced Config State
  const [activeTab, setActiveTab] = useState('details')
  const [formData, setFormData] = useState({
    id: null as number | null,
    agent_name: '',
    system_prompt: '',
    language: 'en',
    voice_name: 'en-US-AriaNeural',
    is_active: true,
    configuration: {
      flow_steps: [] as { id: string, name: string, content: string }[],
      background_audio: { enabled: false, type: 'office' },
      call_transfer: { enabled: false, number: '' },
      behavior: { filler_phrases: false, personality: 'professional' }
    }
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

  const handleOpenCreate = () => {
    setFormData({
      id: null,
      agent_name: '',
      system_prompt: '',
      language: 'en',
      voice_name: 'en-US-AriaNeural',
      is_active: true,
      configuration: {
        flow_steps: [
          { id: '1', name: 'Greeting', content: 'Hello! How can I help you today?' }
        ],
        background_audio: { enabled: false, type: 'office' },
        call_transfer: { enabled: false, number: '' },
        behavior: { filler_phrases: false, personality: 'professional' },
        knowledge: { documents: [], website: '' },
        integrations: [],
        post_call: { delivery: 'email', summary: false, transcript: false, sentiment: false, extraction: false, extracted_data: [] }
      }
    })
    setShowConfigModal(true)
  }

  const handleEditAgent = (agent: AIAgent) => {
    setFormData({
      id: agent.id,
      agent_name: agent.agent_name,
      system_prompt: agent.system_prompt,
      language: agent.language,
      voice_name: agent.voice_name || 'en-US-AriaNeural',
      is_active: agent.is_active,
      configuration: agent.configuration || {
        flow_steps: [],
        background_audio: { enabled: false, type: 'office' },
        call_transfer: { enabled: false, number: '' },
        behavior: { filler_phrases: false, personality: 'professional' },
        knowledge: { documents: [], website: '' },
        integrations: [],
        post_call: { delivery: 'email', summary: false, transcript: false, sentiment: false, extraction: false, extracted_data: [] }
      }
    })
    setShowConfigModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const payload = {
        agent_name: formData.agent_name,
        system_prompt: formData.system_prompt,
        language: formData.language,
        voice_name: formData.voice_name,
        is_active: true, // Always active on create/update for simplicity or add toggle
        configuration: formData.configuration
      }

      if (formData.id) {
        await apiClient.put(`/ai-agents/${formData.id}`, payload)
      } else {
        await apiClient.post('/ai-agents', payload)
      }

      setShowConfigModal(false)
      fetchAgents()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save AI agent')
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

  // --- Test Logic ---
  const [testInput, setTestInput] = useState('')
  const [testAudioSrc, setTestAudioSrc] = useState<string | null>(null)
  const [isTestLoading, setIsTestLoading] = useState(false)

  const handleTestAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testInput.trim()) return

    setIsTestLoading(true)
    setTestAudioSrc(null)

    try {
      const response = await apiClient.post('/test-ai/speak', {
        user_input: testInput,
        system_prompt: formData.system_prompt
      }, {
        responseType: 'blob'
      })

      const audioUrl = URL.createObjectURL(response.data)
      setTestAudioSrc(audioUrl)
    } catch (error) {
      console.error('Failed to test agent:', error)
      alert('Failed to generate audio response.')
    } finally {
      setIsTestLoading(false)
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
              onClick={handleOpenCreate}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              Create New Agent
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 font-medium">Loading your agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-400 transition-colors group cursor-pointer" onClick={handleOpenCreate}>
            <div className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-500 transition-colors">
              {/* Hero Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No agents defined</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new AI personality.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="px-5 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{agent.agent_name}</h3>
                  <button
                    onClick={() => toggleActive(agent)}
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors ${agent.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
                <div className="px-5 py-5">
                  <p className="text-sm text-gray-500 line-clamp-3 mb-4">{agent.system_prompt}</p>
                  <div className="flex justify-between items-center mt-4">
                    <button onClick={() => handleEditAgent(agent)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Configure</button>
                    <button onClick={() => handleDelete(agent.id)} className="text-red-600 hover:text-red-900 text-sm font-medium">Delete</button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                      className="w-full justify-center inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {selectedAgent === agent.id ? 'Close Phones' : 'Link Phones'}
                    </button>
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
              </div>
            ))}
          </div>
        )}

        {/* --- Configuration Modal --- */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-80 transition-opacity" onClick={() => setShowConfigModal(false)}></div>
              <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-2xl transform transition ease-in-out duration-500 sm:duration-700 translate-x-0">
                  <div className="h-full flex flex-col bg-[#111111] shadow-2xl overflow-y-scroll text-gray-100 font-sans">
                    <div className="py-6 px-4 bg-[#0a0a0a] border-b border-gray-800 sm:px-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white" id="slide-over-title">
                          {formData.id ? 'Edit Assistant' : 'New Assistant'}
                        </h2>
                        <div className="ml-3 h-7 flex items-center">
                          <button type="button" className="bg-transparent rounded-md text-gray-400 hover:text-white focus:outline-none" onClick={() => setShowConfigModal(false)}>
                            <span className="sr-only">Close panel</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-6 flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                        {['details', 'config', 'flow', 'knowledge', 'integrations', 'post_call', 'behavior', 'test'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium capitalize transition-all border ${activeTab === tab
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-gray-800'
                              }`}
                          >
                            {tab.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative flex-1 py-6 px-4 sm:px-6">
                      {/* --- Tab Content --- */}

                      {/* 1. Details Tab */}
                      {activeTab === 'details' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div>
                            <label className="block text-sm font-medium text-gray-400">Agent Name</label>
                            <input
                              type="text"
                              value={formData.agent_name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, agent_name: e.target.value })}
                              className="mt-2 block w-full bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-colors placeholder-gray-600"
                              placeholder="My Assistant"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400">System Prompt</label>
                            <textarea
                              rows={10}
                              value={formData.system_prompt}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, system_prompt: e.target.value })}
                              className="mt-2 block w-full bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm font-mono transition-colors placeholder-gray-600"
                              placeholder="You are a helpful assistant..."
                            />
                            <p className="mt-2 text-xs text-gray-500">The core personality and instructions for your agent.</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400">Language</label>
                            <select
                              value={formData.language}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, language: e.target.value })}
                              className="mt-2 block w-full bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-colors"
                            >
                              <option value="en">English (US)</option>
                              <option value="hi">Hindi</option>
                              <option value="es">Spanish</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* 2. Config Tab (Audio & Call Settings) */}
                      {activeTab === 'config' && (
                        <div className="space-y-8 animate-fadeIn">
                          {/* Background Audio */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-medium text-gray-900">Background Audio</h3>
                              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                  type="checkbox"
                                  name="bg-audio"
                                  id="bg-audio"
                                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                  checked={formData.configuration.background_audio.enabled}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                      ...formData.configuration,
                                      background_audio: { ...formData.configuration.background_audio, enabled: e.target.checked }
                                    }
                                  })}
                                />
                                name="bg-audio"
                                id="bg-audio"
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                checked={formData.configuration.background_audio.enabled}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  configuration: {
                                    ...formData.configuration,
                                    background_audio: { ...formData.configuration.background_audio, enabled: e.target.checked }
                                  }
                                })}
                                />
                                <label htmlFor="bg-audio" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.configuration.background_audio.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}></label>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Play ambient sounds during calls to make it feel more natural.</p>
                            {formData.configuration.background_audio.enabled && (
                              <select
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.configuration.background_audio.type}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  configuration: {
                                    ...formData.configuration,
                                    background_audio: { ...formData.configuration.background_audio, type: e.target.value }
                                  }
                                })}
                              >
                                <option value="office">Office Ambiance</option>
                                <option value="cafe">Cafe Noise</option>
                                <option value="call_center">Call Center</option>
                              </select>
                            )}
                          </div>

                          {/* Call Transfer */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-medium text-gray-900">Call Transfer</h3>
                              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                  type="checkbox"
                                  id="call-transfer"
                                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                  checked={formData.configuration.call_transfer.enabled}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    configuration: {
                                      ...formData.configuration,
                                      call_transfer: { ...formData.configuration.call_transfer, enabled: e.target.checked }
                                    }
                                  })}
                                />
                                <label htmlFor="call-transfer" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.configuration.call_transfer.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}></label>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-4">Allow the agent to transfer calls to a human.</p>
                            {formData.configuration.call_transfer.enabled && (
                              <input
                                type="tel"
                                placeholder="+1234567890"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.configuration.call_transfer.number}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  configuration: {
                                    ...formData.configuration,
                                    call_transfer: { ...formData.configuration.call_transfer, number: e.target.value }
                                  }
                                })}
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* 3. Flow Tab (Conversational Steps) */}
                      {activeTab === 'flow' && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-medium text-gray-900">Assistant's Instructions</h3>
                            <button
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                configuration: {
                                  ...formData.configuration,
                                  flow_steps: [...formData.configuration.flow_steps, {
                                    id: Date.now().toString(),
                                    name: 'New Step',
                                    content: ''
                                  }]
                                }
                              })}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                            >
                              + Add Section
                            </button>
                          </div>

                          <div className="space-y-3">
                            {formData.configuration.flow_steps.map((step, index) => (
                              <div key={step.id} className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                                <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b border-gray-200">
                                  <input
                                    type="text"
                                    value={step.name}
                                    onChange={(e) => {
                                      const newSteps = [...formData.configuration.flow_steps];
                                      newSteps[index].name = e.target.value;
                                      setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
                                    }}
                                    className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 p-0"
                                  />
                                  <button
                                    onClick={() => {
                                      const newSteps = formData.configuration.flow_steps.filter((_, i) => i !== index);
                                      setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
                                    }}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                                <div className="p-3">
                                  <textarea
                                    rows={3}
                                    placeholder="Enter instructions for this step..."
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={step.content}
                                    onChange={(e) => {
                                      const newSteps = [...formData.configuration.flow_steps];
                                      newSteps[index].content = e.target.value;
                                      setFormData({ ...formData, configuration: { ...formData.configuration, flow_steps: newSteps } });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                            {formData.configuration.flow_steps.length === 0 && (
                              <p className="text-center text-gray-500 text-sm py-4">No steps added yet. Start by adding a Greeting.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 4. Knowledge Base Tab */}
                      {activeTab === 'knowledge' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Upload PDFs */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors bg-gray-50 cursor-pointer">
                              <div className="mx-auto h-12 w-12 text-gray-400">
                                <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                              </div>
                              <h3 className="mt-2 text-sm font-medium text-gray-900">Upload PDFs</h3>
                              <p className="mt-1 text-xs text-gray-500">Drag and drop or click to select.</p>
                              <p className="mt-2 text-xs text-indigo-500">Supported: PDF (max 10MB)</p>
                            </div>

                            {/* Website URL */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                              <h3 className="text-sm font-medium text-gray-900 mb-2">Website Knowledge Base</h3>
                              <p className="text-xs text-gray-500 mb-4">Add website content to your assistant's knowledge base.</p>
                              <div className="space-y-3">
                                <input
                                  type="url"
                                  placeholder="https://example.com"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                                <button type="button" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                                  Add to Knowledge Base
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3 flex-1 md:flex md:justify-between">
                                <p className="text-sm text-indigo-700">You have 5.0 MB of knowledge base storage remaining.</p>
                                <p className="mt-3 text-sm md:mt-0 md:ml-6"><a href="#" className="whitespace-nowrap font-medium text-indigo-700 hover:text-indigo-600">Upgrade account <span aria-hidden="true">&rarr;</span></a></p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5. Integrations Tab */}
                      {activeTab === 'integrations' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                          {[
                            { name: 'Cal.com', desc: 'Sync your calendar for scheduling.', icon: 'C' },
                            { name: 'Calendly', desc: 'Check availability and schedule.', icon: 'Ca' },
                            { name: 'Salesforce', desc: 'Manage leads and update records.', icon: 'S' },
                            { name: 'Google Calendar', desc: 'Availability and appointments.', icon: 'GC' },
                            { name: 'Google Sheets', desc: 'Read and write spreadsheet data.', icon: 'G' },
                            { name: 'Custom API', desc: 'Connect to your own backend.', icon: '</>' },
                          ].map((integration) => (
                            <div key={integration.name} className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-indigo-500/50 transition-all group">
                              <div className="flex items-center justify-between mb-4">
                                <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-300 group-hover:text-white transition-colors">
                                  {integration.icon}
                                </div>
                                <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity">Available</span>
                              </div>
                              <h3 className="text-lg font-bold text-gray-200 mb-1">{integration.name}</h3>
                              <p className="text-sm text-gray-500 mb-4 h-10">{integration.desc}</p>
                              <button type="button" className="w-full border border-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-center">
                                Connect <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 6. Post-Call Tab */}
                      {activeTab === 'post_call' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-5">
                            <h3 className="text-base font-medium text-gray-200 mb-4">Delivery Method</h3>
                            <select className="block w-full bg-[#111] border-gray-700 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-200">
                              <option>Email Summary</option>
                              <option>Webhook</option>
                              <option>None</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { id: 'summary', label: 'Call Summary', desc: 'A brief overview of the conversation.' },
                              { id: 'transcript', label: 'Full Conversation', desc: 'Complete transcript with timestamps.' },
                              { id: 'sentiment', label: 'Sentiment Analysis', desc: 'Analysis of customer mood and emotion.' },
                              { id: 'extraction', label: 'Extracted Information', desc: 'Key data points extracted from the call.' },
                            ].map((item) => (
                              <div key={item.id} className="relative flex p-4 border border-gray-700 bg-[#1a1a1a] rounded-lg hover:bg-gray-800 cursor-pointer transition-colors group">
                                <div className="flex items-center h-5">
                                  <input
                                    id={item.id}
                                    type="checkbox"
                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-600 rounded bg-gray-700"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor={item.id} className="font-medium text-gray-200 group-hover:text-white">{item.label}</label>
                                  <p className="text-gray-500 group-hover:text-gray-400">{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-gray-800 pt-6">
                            <h3 className="text-base font-medium text-gray-200 mb-2">Extracted Variables</h3>
                            <p className="text-sm text-gray-500 mb-4">Specify what data variables you want to extract (e.g., customer_name, appointment_time).</p>

                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input type="text" placeholder="Variable Name (e.g. name)" className="flex-1 bg-[#1a1a1a] border-gray-700 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-200 placeholder-gray-600" />
                                <input type="text" placeholder="Description" className="flex-[2] bg-[#1a1a1a] border-gray-700 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-200 placeholder-gray-600" />
                                <button type="button" className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 border border-indigo-500/30">
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </button>
                              </div>
                              <div className="flex gap-2 bg-[#1a1a1a] p-2 rounded-lg border border-gray-700 items-center">
                                <span className="flex-1 text-sm font-mono text-gray-300 ml-2">customer_name</span>
                                <span className="flex-[2] text-sm text-gray-500">Capture the customer name</span>
                                <button type="button" className="p-1 text-gray-500 hover:text-red-400">
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. Behavior Tab */}
                      {activeTab === 'behavior' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div>
                            <h3 className="text-sm font-medium text-gray-200 mb-2">Personality</h3>
                            <select
                              className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base bg-[#1a1a1a] border-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg text-gray-200"
                              value={formData.configuration.behavior.personality}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({
                                ...formData,
                                configuration: {
                                  ...formData.configuration,
                                  behavior: { ...formData.configuration.behavior, personality: e.target.value }
                                }
                              })}
                            >
                              <option value="professional">Professional & Formal</option>
                              <option value="friendly">Friendly & Helpful</option>
                              <option value="curious">Curious & Inquisitive</option>
                              <option value="humorous">Witty & Humorous</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between py-4 border-t border-gray-800">
                            <div>
                              <h3 className="text-sm font-medium text-gray-200">Filler Phrases</h3>
                              <p className="text-xs text-gray-500">Use 'umm', 'uh-huh' to sound more natural.</p>
                            </div>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                              <input
                                type="checkbox"
                                id="filler-phrases"
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                checked={formData.configuration.behavior.filler_phrases}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  configuration: {
                                    ...formData.configuration,
                                    behavior: { ...formData.configuration.behavior, filler_phrases: e.target.checked }
                                  }
                                })}
                              />
                              <label htmlFor="filler-phrases" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${formData.configuration.behavior.filler_phrases ? 'bg-green-500' : 'bg-gray-600'}`}></label>
                            </div>
                          </div>
                        </div>
                      )}


                      {/* 5. Testing Tab */}
                      {activeTab === 'test' && (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="bg-indigo-500/10 p-4 rounded-lg border border-indigo-500/20">
                            <p className="text-sm text-indigo-300">Test your agent's current configuration. The system prompt and flow settings will be used to generate the response.</p>
                          </div>

                          <form onSubmit={handleTestAgent}>
                            <textarea
                              className="w-full p-4 bg-[#1a1a1a] border border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-600 resize-none"
                              rows={4}
                              placeholder="Type a message to your agent..."
                              value={testInput}
                              onChange={(e) => setTestInput(e.target.value)}
                            ></textarea>

                            {testAudioSrc && (
                              <div className="mt-4 p-4 bg-[#0a200a] rounded-lg border border-green-900/50 flex flex-col items-center animate-fadeIn">
                                <p className="text-green-400 font-medium mb-2 text-sm">Response Generated!</p>
                                <audio controls autoPlay src={testAudioSrc} className="w-full h-10 opacity-90" />
                              </div>
                            )}

                            <div className="mt-4 flex justify-end">
                              <button
                                type="submit"
                                disabled={isTestLoading || !testInput.trim()}
                                className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-lg shadow-indigo-500/20 text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                {isTestLoading ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                  </>
                                ) : 'Speak to Agent'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-800 py-4 px-4 sm:px-6 bg-[#0a0a0a]">
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          className="bg-transparent py-2.5 px-6 border border-gray-700 rounded-full text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                          onClick={() => setShowConfigModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          onClick={handleSubmit}
                          className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-lg shadow-indigo-500/20 text-sm font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:scale-105"
                        >
                          Save Assistant
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
