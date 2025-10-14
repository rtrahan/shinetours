'use client'

import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-3xl' }: ModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl ${maxWidth} w-full mx-4 max-h-[80vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="heading-font text-2xl text-stone-800">{title}</h3>
          <button 
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

