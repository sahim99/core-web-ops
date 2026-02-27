import { useState } from 'react'
import { CheckCircleIcon, XCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { approveSubmission, rejectSubmission } from '../../api/forms.api'
import toast from 'react-hot-toast'

export default function MessageBubble({ message, onActionComplete }) {
  const isOutbound = message.direction === 'outbound' || message.sender_type === 'business'
  const isSubmission = message.message_type === 'form_submission'
  const [processing, setProcessing] = useState(false)
  
  // Local state to hide buttons after action if we don't refresh immediately
  const [decision, setDecision] = useState(null) 

  const handleAction = async (status) => {
    if (!message.metadata_?.submission_id || !message.metadata_?.form_id) {
        toast.error('Missing submission data')
        return
    }
    setProcessing(true)
    try {
      if (status === 'approved') {
        await approveSubmission(message.metadata_.form_id, message.metadata_.submission_id)
      } else {
        await rejectSubmission(message.metadata_.form_id, message.metadata_.submission_id)
      }
      setDecision(status)
      toast.success(`Submission ${status}`)
      if (onActionComplete) onActionComplete()
    } catch (err) {
      console.error(err)
      toast.error('Action failed')
    } finally {
      setProcessing(false)
    }
  }

  if (isSubmission) {
      return (
        <div className="flex justify-start w-full mb-4">
            <div className="max-w-[95%] md:max-w-[80%] bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-2xl rounded-bl-sm overflow-hidden shadow-lg animate-fade-in">
                {/* Header */}
                <div className="bg-indigo-600/10 border-b border-indigo-500/20 p-3 flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <DocumentTextIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Form Submission</p>
                        <p className="text-sm text-[var(--text-primary)] font-bold">{message.metadata_?.form_title || 'Untitled Form'}</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 bg-[var(--bg-tertiary)]">
                    {message.metadata_?.answers?.map((ans, i) => (
                        <div key={i} className="text-sm border-b border-[var(--border-subtle)] pb-2 last:border-0 md:border-0">
                            <span className="text-[var(--text-secondary)] block text-[10px] uppercase font-bold tracking-wider mb-0.5">{ans.field_label}</span>
                            <span className="text-[var(--text-primary)] break-words">{ans.value}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                {!decision && !message.metadata_?.action_taken && (
                    <div className="p-3 bg-[var(--bg-secondary)]/50 border-t border-[var(--border-subtle)] flex gap-3">
                        <button 
                            onClick={() => handleAction('approved')}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-colors disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <CheckCircleIcon className="w-4 h-4" />
                            Approve
                        </button>
                        <button 
                            onClick={() => handleAction('rejected')}
                            disabled={processing}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 text-xs font-bold transition-colors disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <XCircleIcon className="w-4 h-4" />
                            Reject
                        </button>
                    </div>
                )}
                {(decision || message.metadata_?.action_taken) && (
                    <div className={`p-2 text-center text-xs font-bold uppercase tracking-wider border-t border-[var(--border-subtle)] ${decision === 'approved' ? 'text-emerald-500 bg-emerald-500/5' : decision === 'rejected' ? 'text-red-500 bg-red-500/5' : 'text-[var(--text-secondary)]'}`}>
                        {decision === 'approved' ? 'Approved' : decision === 'rejected' ? 'Rejected' : 'Action Taken'}
                    </div>
                )}
                
                <div className="px-4 pb-2 pt-1 text-[10px] text-[var(--text-secondary)] text-right bg-[var(--bg-tertiary)]">
                    {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
        </div>
      )
  }

  // Standard Text Message
  return (
    <div className={`flex w-full mb-4 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
       <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm animate-fade-in ${
         isOutbound 
           ? 'bg-indigo-600 text-[var(--text-primary)] rounded-br-sm' 
           : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-bl-sm'
       }`}>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content || message.body}</div>
          <div className={`text-[10px] mt-2 text-right ${isOutbound ? 'text-indigo-200' : 'text-[var(--text-secondary)]'}`}>
             {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
       </div>
    </div>
  )
}
