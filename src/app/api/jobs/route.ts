import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Job } from '@/types/job';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skills = searchParams.get('skills')?.split(',') || [];
    const experienceLevel = searchParams.get('experienceLevel');
    const employmentType = searchParams.get('employmentType');

    const supabase = createRouteHandlerClient({ cookies });
    
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' });

    // Apply filters if provided
    if (skills.length > 0) {
      query = query.contains('skills', skills);
    }
    if (experienceLevel) {
      query = query.eq('experience_level', experienceLevel);
    }
    if (employmentType) {
      query = query.eq('employment_type', employmentType);
    }

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: jobs, count, error } = await query
      .order('posted_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobs,
      totalCount: count,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Error in jobs route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 