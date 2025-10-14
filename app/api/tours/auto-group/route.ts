import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { date } = body

    if (!date) {
      return NextResponse.json({ error: 'Date required' }, { status: 400 })
    }

    // Get all ungrouped booking requests for this date
    const { data: ungroupedRequests, error } = await supabase
      .from('booking_requests')
      .select('id, group_size, contact_name, preferred_guide_id')
      .eq('requested_date', date)
      .is('tour_group_id', null)
      .order('created_at')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!ungroupedRequests || ungroupedRequests.length === 0) {
      return NextResponse.json({ message: 'No ungrouped requests to process', groupsCreated: 0 })
    }

    console.log(`Auto-grouping ${ungroupedRequests.length} requests for ${date}`)

    // Intelligent grouping algorithm
    // Goal: Create groups of 10-15 people, preferring to fill groups completely
    const groups: any[] = []
    let currentGroup: any[] = []
    let currentGroupSize = 0

    for (const request of ungroupedRequests) {
      const requestSize = request.group_size

      // If adding this request would exceed 15, start a new group
      if (currentGroupSize + requestSize > 15) {
        // Save current group if it has at least 10 people
        if (currentGroupSize >= 10) {
          groups.push([...currentGroup])
          currentGroup = [request]
          currentGroupSize = requestSize
        } else {
          // Current group is too small, try to fit this request
          currentGroup.push(request)
          currentGroupSize += requestSize
        }
      } else {
        // Add to current group
        currentGroup.push(request)
        currentGroupSize += requestSize

        // If we've reached a good group size (12-15), save it
        if (currentGroupSize >= 12 && currentGroupSize <= 15) {
          groups.push([...currentGroup])
          currentGroup = []
          currentGroupSize = 0
        }
      }
    }

    // Handle remaining requests
    if (currentGroup.length > 0) {
      if (currentGroupSize >= 10) {
        // Good group size, save it
        groups.push(currentGroup)
      } else if (groups.length > 0) {
        // Try to add to last group if possible
        const lastGroup = groups[groups.length - 1]
        const lastGroupSize = lastGroup.reduce((sum: number, r: any) => sum + r.group_size, 0)
        
        if (lastGroupSize + currentGroupSize <= 15) {
          // Merge with last group
          groups[groups.length - 1] = [...lastGroup, ...currentGroup]
        } else {
          // Can't merge, keep as separate (even if < 10)
          groups.push(currentGroup)
        }
      } else {
        // First group, keep it even if < 10
        groups.push(currentGroup)
      }
    }

    console.log(`Created ${groups.length} groups:`)
    groups.forEach((g, i) => {
      const size = g.reduce((sum: number, r: any) => sum + r.group_size, 0)
      console.log(`  Group ${i + 1}: ${g.length} requests, ${size} people`)
    })

    // Create tour groups in database
    let createdCount = 0
    for (const group of groups) {
      const groupSize = group.reduce((sum: number, r: any) => sum + r.group_size, 0)
      
      // Create tour group
      const { data: tourGroup, error: groupError } = await supabase
        .from('tour_groups')
        .insert({
          requested_date: date,
          status: groupSize >= 10 ? 'Pending' : 'Pending'
        })
        .select()
        .single()

      if (groupError) {
        console.error('Error creating tour group:', groupError)
        continue
      }

      // Assign requests to this group
      const requestIds = group.map((r: any) => r.id)
      await supabase
        .from('booking_requests')
        .update({ tour_group_id: tourGroup.id })
        .in('id', requestIds)

      createdCount++
    }

    return NextResponse.json({
      success: true,
      groupsCreated: createdCount,
      requestsGrouped: ungroupedRequests.length
    })

  } catch (error) {
    console.error('Error auto-grouping:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

