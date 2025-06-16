import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseClient';
import type { UserProfile } from '@/types';
import { PostgrestError } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

async function getSession(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Get the JWT from the Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  // Set the access token
  supabase.auth.setSession({
    access_token: authHeader.replace('Bearer ', ''),
    refresh_token: '',
  });

  const { data: { user } } = await supabase.auth.getUser();
  return user ? { user } : null;
}

export async function PUT(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();
    const updates = await request.json();

    // Get current profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single() as { data: UserProfile | null; error: PostgrestError | null };

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const profileData = {
      id: session.user.id,
      email: session.user.email,
      ...currentProfile,
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (!currentProfile) {
      // Create new profile
      const { error } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (error) throw error;
    } else {
      // Update existing profile
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', session.user.id);

      if (error) throw error;
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: profileData
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();
    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.match(/^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and DOCX files are allowed' },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('resumes')
      .upload(`${session.user.id}/${Date.now()}-${file.name}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('resumes')
      .getPublicUrl(uploadData.path);

    // Update profile with new resume URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        resume_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: 'Resume uploaded successfully',
      url: publicUrl
    });

  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 }
    );
  }
} 