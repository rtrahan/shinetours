'use client'

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
  const firstParticipant = participants[0]
  const allParticipantNames = participants.map(p => p.contact_name).join(', ')
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Tour Request to Yale Art Gallery">
      <div className="space-y-6">
        {/* Tour Summary Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-2">Tour Date</label>
            <p className="text-lg font-semibold text-stone-900">{tourDate}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-2">Total Attendees</label>
            <p className="text-lg font-semibold text-stone-900">{totalPeople} people</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-2">Number of Booking Requests</label>
            <p className="text-lg font-semibold text-stone-900">{participants.length}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-2">Assigned Guide</label>
            <p className="text-lg font-semibold text-stone-900">{guideName}</p>
          </div>
        </div>

        {/* Participant Details */}
        <div>
          <h4 className="font-bold text-stone-900 uppercase text-sm mb-3">Participant Details</h4>
          <div className="space-y-2">
            {participants.map((p, idx) => (
              <div key={idx} className="bg-stone-50 p-3 rounded flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-semibold text-stone-900">{p.contact_name}</p>
                  <p className="text-stone-600 text-xs">{p.contact_email}</p>
                  <p className="text-stone-600 text-xs">{p.contact_phone}</p>
                </div>
                <span className="bg-stone-800 text-white px-3 py-1 rounded text-sm font-bold">
                  {p.group_size} people
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Copy & Paste Section */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h5 className="font-bold text-amber-900 text-sm uppercase">Copy & Paste for Yale's Form:</h5>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white border-2 border-amber-200 rounded p-3">
              <p className="font-bold text-stone-800 mb-1 text-sm">Tour Type:</p>
              <p className="text-stone-900">✓ Self-Guided Tour</p>
            </div>

            <div className="bg-white border-2 border-amber-200 rounded p-3">
              <p className="font-bold text-stone-800 mb-1 text-sm">Describe Your Group:</p>
              <p className="text-stone-900">Other</p>
            </div>

            <div className="bg-white border-2 border-amber-200 rounded p-3">
              <p className="font-bold text-stone-800 mb-1 text-sm">Number of Attendees:</p>
              <p className="text-stone-900 text-xl font-bold">{totalPeople}</p>
            </div>

            <div className="bg-white border-2 border-amber-200 rounded p-3">
              <p className="font-bold text-stone-800 mb-2 text-sm">Group Contact Information:</p>
              <div className="space-y-1 text-sm text-stone-900">
                <p><strong>Contact Name:</strong> {guideName}</p>
                <p><strong>Group Name:</strong> {allParticipantNames}</p>
                <p><strong>Email:</strong> {guideEmail}</p>
                <p><strong>Phone:</strong> {guidePhone}</p>
              </div>
            </div>

            <div className="bg-white border-2 border-amber-200 rounded p-3">
              <p className="font-bold text-stone-800 mb-2 text-sm">Date & Time Preferences:</p>
              <div className="space-y-1 text-sm text-stone-900">
                <p><strong>Date (all 3 choices):</strong> {tourDate}</p>
                <p><strong>Time, First Choice:</strong> 2:30 pm</p>
                <p><strong>Time, Second Choice:</strong> 12:30 pm</p>
                <p><strong>Time, Third Choice:</strong> 3:30 pm</p>
              </div>
            </div>

            <div className="bg-white border-2 border-amber-200 rounded p-3">
              <p className="font-bold text-stone-800 mb-2 text-sm">Additional Information:</p>
              <div className="space-y-1 text-sm text-stone-900">
                <p><strong>FIRST VISIT TO GALLERY?</strong></p>
                <p>No</p>
                <p className="mt-2"><strong>GOALS FOR GROUP VISIT:</strong></p>
                <p className="italic">"To show the modern relevance of the gallery's collection"</p>
                <p className="mt-2"><strong>ADDITIONAL INFO ABOUT GROUP:</strong></p>
                <p>N/A</p>
                <p className="mt-2"><strong>SPECIAL NEEDS?</strong></p>
                <p>No</p>
              </div>
            </div>
          </div>
        </div>

        {/* Yale Form Link Section */}
        <div className="bg-stone-100 rounded-lg p-6 border border-stone-300">
          <h5 className="font-bold text-stone-900 mb-3 text-base">Yale Art Gallery Group Visit Registration:</h5>
          <a 
            href="https://artgallery.yale.edu/visit/groups-class-visits/adult-and-community-group-visits" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-sm transition-colors shadow-md"
          >
            Open Yale Registration Form
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
          <p className="text-sm text-stone-600 mt-3">
            <strong>Note:</strong> Groups must register at least three weeks in advance. We typically request self-guided tours with 3 time preferences on the same date (2:30 pm, 12:30 pm, 3:30 pm).
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6">
          <button 
            onClick={onClose}
            className="px-8 py-3 border-2 border-stone-300 text-stone-700 font-bold hover:bg-stone-100 transition-all text-sm rounded uppercase tracking-wide"
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit}
            className="px-8 py-3 bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all text-sm rounded shadow-md flex items-center gap-2 uppercase tracking-wide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
            </svg>
            Mark as Submitted to Yale
          </button>
        </div>
      </div>
    </Modal>
  )
}

