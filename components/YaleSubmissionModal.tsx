'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Modal from './Modal'

interface YaleSubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  tourDate: string
  totalPeople: number
  participants: any[]
  guideName: string
  guideEmail: string
  guidePhone: string
}

export default function YaleSubmissionModal({
  isOpen,
  onClose,
  onSubmit,
  tourDate,
  totalPeople,
  participants,
  guideName,
  guideEmail,
  guidePhone
}: YaleSubmissionModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const allParticipantNames = participants.map(p => p.contact_name).join(', ')

  let formattedDate = tourDate
  try {
    formattedDate = format(new Date(tourDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')
  } catch { /* keep raw date if formatting fails */ }

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 1500)
  }

  const CopyButton = ({ text, fieldId }: { text: string; fieldId: string }) => (
    <button
      onClick={() => copyToClipboard(text, fieldId)}
      className="shrink-0 p-1.5 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
      title="Copy to clipboard"
    >
      {copiedField === fieldId ? (
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      )}
    </button>
  )

  const contactBlock = `Contact Name: ${guideName}\nGroup Name: ${allParticipantNames}\nEmail: ${guideEmail}\nPhone: ${guidePhone}`
  const dateTimeBlock = `Date (all 3 choices): ${tourDate}\nTime, First Choice: 2:30 pm\nTime, Second Choice: 12:30 pm\nTime, Third Choice: 3:30 pm`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit to Yale Art Gallery" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Tour Overview */}
        <div className="bg-stone-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider mb-1">Date</div>
            <div className="text-sm font-bold text-stone-900">{formattedDate}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider mb-1">Attendees</div>
            <div className="text-sm font-bold text-stone-900">{totalPeople}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider mb-1">Requests</div>
            <div className="text-sm font-bold text-stone-900">{participants.length}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider mb-1">Guide</div>
            <div className="text-sm font-bold text-stone-900">{guideName || 'Unassigned'}</div>
          </div>
        </div>

        {/* Participants */}
        <div>
          <div className="text-[10px] uppercase font-bold text-stone-500 tracking-wider mb-2">Participants</div>
          <div className="space-y-1.5">
            {participants.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between bg-white border border-stone-200 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-stone-900 truncate">{p.contact_name}</div>
                  <div className="text-xs text-stone-500 truncate">{p.contact_email} &middot; {p.contact_phone}</div>
                </div>
                <div className="ml-3 shrink-0 bg-stone-800 text-white text-[11px] font-bold px-2.5 py-1 rounded">
                  {p.group_size}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Yale Form Fields */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div className="text-xs uppercase font-bold text-stone-700 tracking-wider">Yale Form Fields</div>
          </div>

          <div className="border border-stone-200 rounded-lg divide-y divide-stone-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-stone-50">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Tour Type</div>
                <div className="text-sm text-stone-900 font-medium">Self-Guided Tour</div>
              </div>
              <CopyButton text="Self-Guided Tour" fieldId="tourType" />
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-stone-50">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Describe Your Group</div>
                <div className="text-sm text-stone-900 font-medium">Other</div>
              </div>
              <CopyButton text="Other" fieldId="groupType" />
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-stone-50">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Number of Attendees</div>
                <div className="text-sm text-stone-900 font-bold">{totalPeople}</div>
              </div>
              <CopyButton text={String(totalPeople)} fieldId="attendees" />
            </div>

            <div className="flex items-start justify-between px-4 py-2.5 bg-white hover:bg-stone-50">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">Contact Information</div>
                <div className="text-sm text-stone-900 space-y-0.5">
                  <div><span className="text-stone-500 text-xs">Name:</span> {guideName}</div>
                  <div><span className="text-stone-500 text-xs">Group:</span> {allParticipantNames}</div>
                  <div><span className="text-stone-500 text-xs">Email:</span> {guideEmail}</div>
                  <div><span className="text-stone-500 text-xs">Phone:</span> {guidePhone}</div>
                </div>
              </div>
              <CopyButton text={contactBlock} fieldId="contact" />
            </div>

            <div className="flex items-start justify-between px-4 py-2.5 bg-white hover:bg-stone-50">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">Date & Time Preferences</div>
                <div className="text-sm text-stone-900 space-y-0.5">
                  <div><span className="text-stone-500 text-xs">Date (all 3):</span> {tourDate}</div>
                  <div><span className="text-stone-500 text-xs">1st choice:</span> 2:30 pm</div>
                  <div><span className="text-stone-500 text-xs">2nd choice:</span> 12:30 pm</div>
                  <div><span className="text-stone-500 text-xs">3rd choice:</span> 3:30 pm</div>
                </div>
              </div>
              <CopyButton text={dateTimeBlock} fieldId="dateTime" />
            </div>

            <div className="flex items-start justify-between px-4 py-2.5 bg-white hover:bg-stone-50">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-1">Additional Info</div>
                <div className="text-sm text-stone-900 space-y-0.5">
                  <div><span className="text-stone-500 text-xs">First visit?</span> No</div>
                  <div><span className="text-stone-500 text-xs">Goals:</span> <span className="italic">To show the modern relevance of the gallery&apos;s collection</span></div>
                  <div><span className="text-stone-500 text-xs">Group info:</span> N/A</div>
                  <div><span className="text-stone-500 text-xs">Special needs?</span> No</div>
                </div>
              </div>
              <CopyButton text="First visit: No\nGoals: To show the modern relevance of the gallery's collection\nAdditional info: N/A\nSpecial needs: No" fieldId="additional" />
            </div>
          </div>
        </div>

        {/* Yale Link */}
        <a 
          href="https://artgallery.yale.edu/visit/groups-class-visits/adult-and-community-group-visits" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm group"
        >
          <div>
            <div className="text-sm font-bold">Open Yale Registration Form</div>
            <div className="text-xs text-blue-200">artgallery.yale.edu &middot; Register at least 3 weeks in advance</div>
          </div>
          <svg className="w-5 h-5 shrink-0 ml-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-stone-100">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-stone-600 font-semibold hover:text-stone-800 hover:bg-stone-100 transition-all text-sm rounded-lg"
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit}
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all text-sm rounded-lg shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
            </svg>
            Mark as Submitted
          </button>
        </div>
      </div>
    </Modal>
  )
}
