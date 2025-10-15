'use client'

import { useState, useEffect } from 'react'
import Calendar from '@/components/Calendar'
import BookingForm from '@/components/BookingForm'

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableGuides, setAvailableGuides] = useState<any[]>([])
  const [bookingsData, setBookingsData] = useState<any[]>([])
  const [isLoadingGuides, setIsLoadingGuides] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    
    // On mobile, scroll to the booking form after selecting a date
    setTimeout(() => {
      const bookingForm = document.getElementById('booking-form')
      if (bookingForm && window.innerWidth < 768) { // 768px is the md breakpoint
        bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Fetch available guides
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const response = await fetch('/api/guides')
        if (response.ok) {
          const data = await response.json()
          setAvailableGuides(data)
        }
      } catch (error) {
        console.error('Error fetching guides:', error)
      } finally {
        setIsLoadingGuides(false)
      }
    }

    fetchGuides()
  }, [])

  // Fetch booking calendar data for the current month
  useEffect(() => {
    const fetchBookingsCalendar = async () => {
      try {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        
        const response = await fetch(`/api/bookings/calendar?year=${year}&month=${month}`)
        if (response.ok) {
          const data = await response.json()
          setBookingsData(data)
        }
      } catch (error) {
        console.error('Error fetching bookings calendar:', error)
      }
    }

    fetchBookingsCalendar()
  }, [])

  const handleBookingSuccess = () => {
    setShowSuccess(true)
    // Don't clear selectedDate yet - keep it selected so user can see updated count
    
    // Refresh bookings data immediately
    refreshBookingsData()
  }

  const refreshBookingsData = () => {
    const now = new Date()
    fetch(`/api/bookings/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .then(res => res.json())
      .then(data => setBookingsData(data))
      .catch(err => console.error('Error refreshing bookings:', err))
  }

  const handleCloseSuccessModal = () => {
    setShowSuccess(false)
    setSelectedDate(null) // Clear selection when closing modal
    refreshBookingsData() // Refresh one more time to be sure
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-stone-700" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <div>
              <h1 className="heading-font text-2xl font-light text-stone-800">Shine Tours</h1>
              <p className="text-xs text-stone-500 uppercase tracking-widest">Yale University Art Gallery</p>
            </div>
          </div>
          <a href="https://www.paypal.com/paypalme/sethmcneely" target="_blank" 
            className="px-4 py-2 text-stone-600 hover:text-stone-800 border border-stone-300 hover:border-stone-400 font-medium text-sm rounded transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            Donate
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-stone-50 min-h-[90vh] flex items-center py-8 md:py-12">
        <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8">
          
          {/* Success Modal */}
          {showSuccess && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in">
                {/* Header with checkmark */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
                    <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <h2 className="heading-font text-3xl font-light text-white mb-2">
                    Request Received!
                  </h2>
                  <p className="text-emerald-50 text-sm">
                    Thank you for your tour request
                  </p>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-700 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 mb-1">Email Confirmation</h3>
                        <p className="text-sm text-stone-600 leading-relaxed">
                          You'll receive an email confirmation shortly with your tour request details.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <span className="text-amber-700 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 mb-1">Yale Review Process</h3>
                        <p className="text-sm text-stone-600 leading-relaxed">
                          We will submit your group's tour request to Yale University Art Gallery for approval.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-700 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 mb-1">Time Confirmation</h3>
                        <p className="text-sm text-stone-600 leading-relaxed">
                          Once Yale assigns a time slot (between 11am-3pm), we'll send you a confirmation email with the exact time and meeting details.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Important Note */}
                  <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-amber-900 mb-1">Important</p>
                        <p className="text-sm text-amber-800">
                          Your tour is <strong>not confirmed</strong> until you receive our confirmation email with the approved time from Yale.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={handleCloseSuccessModal}
                    className="mt-6 w-full py-4 px-6 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-900 transition-colors shadow-md hover:shadow-lg"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hero Section with Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-12 md:mb-20 max-w-[1400px] mx-auto">
            {/* Left Side - Text */}
            <div className="text-center md:text-left">
              <h1 className="heading-font text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-stone-900 mb-6 md:mb-8 leading-tight">
                Enlightening<br/>Art Gallery<br/>Tours
              </h1>
              
              <button 
                onClick={() => {
                  document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-6 md:px-8 py-3 md:py-4 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl mb-8 md:mb-12 inline-block text-sm md:text-base"
              >
                Book A Tour!
              </button>

              <div className="mb-4 md:mb-6">
                <p className="heading-font text-xl sm:text-2xl md:text-3xl text-stone-700 italic mb-2">
                  "And those having insight will shine"
                </p>
                <p className="text-stone-500 text-sm md:text-base">
                  — Daniel 12:3
                </p>
              </div>

              <p className="text-stone-600 text-xs md:text-sm">
                New Haven, Conn.
              </p>
            </div>

            {/* Right Side - Images */}
            <div className="space-y-3 md:space-y-4">
              <div className="rounded-xl md:rounded-2xl overflow-hidden shadow-lg md:shadow-xl">
                <img 
                  src="/gallery-exterior.jpg.webp" 
                  alt="Yale University Art Gallery Exterior"
                  className="w-full h-48 md:h-64 object-cover"
                />
              </div>
              <div className="rounded-xl md:rounded-2xl overflow-hidden shadow-lg md:shadow-xl">
                <img 
                  src="/gallery-artwork.jpeg" 
                  alt="Yale Art Gallery Collection"
                  className="w-full h-48 md:h-64 object-cover object-right"
                />
              </div>
            </div>
          </div>

          {/* Booking Section */}
          <div id="booking-section" className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 max-w-[1600px] mx-auto">
            {/* Calendar - Takes 3 columns on desktop, full width on mobile */}
            <div className="md:col-span-3">
              <Calendar 
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                bookingsData={bookingsData}
              />
            </div>

            {/* Booking Form - Takes 2 columns on desktop, full width on mobile */}
            <div id="booking-form" className="md:col-span-2">
              {selectedDate ? (
                <BookingForm 
                  selectedDate={selectedDate}
                  availableGuides={availableGuides}
                  onSuccess={handleBookingSuccess}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-lg p-8 flex items-center justify-center h-full">
                  <p className="text-stone-500 text-center">
                    Please select a date from the calendar to request a tour.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Visitor Information Section */}
          <div className="mt-16 md:mt-24 max-w-[1400px] mx-auto">
            <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-stone-200">
                <h2 className="heading-font text-3xl md:text-4xl font-light text-stone-900 mb-2">
                  Visitor Information
                </h2>
                <p className="text-sm md:text-base text-stone-600">Everything you need to know for your tour</p>
              </div>

              <div className="p-6 md:p-8">
                {/* How Tour Requests Work */}
                <div className="mb-6 md:mb-8 bg-blue-50 border-l-4 border-blue-500 p-4 md:p-6 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                      <h3 className="font-bold text-blue-900 mb-2">How Tour Requests Work</h3>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        When you submit a tour request, you'll be grouped with other visitors requesting the same date (groups of 10-15 people). 
                        We then submit your tour request to Yale University Art Gallery for approval. Once Yale assigns a time slot, 
                        you'll receive a confirmation email with all the details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Location & Parking */}
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <h3 className="font-bold text-stone-900 uppercase text-xs tracking-wider">Location & Parking</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-stone-900">Yale University Art Gallery</p>
                        <p className="text-stone-600">1111 Chapel St, New Haven, CT</p>
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">Parking</p>
                        <p className="text-stone-600">150 York St, New Haven, CT</p>
                      </div>
                    </div>
                  </div>

                  {/* Museum & Attractions */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                      <h3 className="font-bold text-amber-900 uppercase text-xs tracking-wider">Museum & Attractions</h3>
                    </div>
                    <p className="text-sm text-amber-900 mb-3 leading-relaxed">
                      Explore world-class collections spanning centuries of artistic achievement. New Haven offers 
                      excellent dining and cultural attractions within walking distance.
                    </p>
                    <a 
                      href="https://artgallery.yale.edu" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-900"
                    >
                      Visit Gallery Website
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </a>
                  </div>

                  {/* Tour Details */}
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <h3 className="font-bold text-stone-900 uppercase text-xs tracking-wider">Tour Details</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-600">Duration:</span>
                        <span className="font-semibold text-stone-900">1.5 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">Group Size:</span>
                        <span className="font-semibold text-stone-900">Maximum 15 people</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">Availability:</span>
                        <span className="font-semibold text-stone-900">Fri-Sun only</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">Approval:</span>
                        <span className="font-semibold text-stone-900">By Yale</span>
                      </div>
                    </div>
                  </div>

                  {/* Visitor Guidelines */}
                  <div className="bg-stone-50 border border-stone-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <h3 className="font-bold text-stone-900 uppercase text-xs tracking-wider">Visitor Guidelines</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span className="text-stone-700">FREE admission</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span className="text-stone-700">Wheelchair accessible</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span className="text-stone-700">Casual dress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        <span className="text-stone-700">No large bags</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        <span className="text-stone-700">No food/drink</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        <span className="text-stone-700">Don't touch art</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links for Staff */}
          <div className="mt-16 text-center">
            <p className="text-xs text-stone-500 mb-4">Staff Access:</p>
            <a 
              href="/login" 
              className="inline-block px-8 py-3 bg-stone-800 text-white text-sm font-semibold rounded-lg hover:bg-stone-900 transition-colors shadow-md hover:shadow-lg"
            >
              Staff Login →
            </a>
            <p className="text-xs text-stone-400 mt-3">Admins and guides login here</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-12">
        <div className="max-w-[1800px] mx-auto px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-stone-500">© 2025 Yale University Art Gallery Tours. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
