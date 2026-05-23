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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`w-full ${maxWidth} max-h-[86vh] overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl shadow-black/40`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">Shine Tours</p>
            <h3 className="heading-font text-3xl font-light tracking-[-0.04em] text-stone-900">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full border border-stone-200 p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="max-h-[calc(86vh-88px)] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

