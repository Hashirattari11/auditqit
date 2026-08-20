import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  
  try {
    const body = await request.json();
    const { email, password } = body;
    
    logs.push(`Step 1: Received email=${email}, password_length=${password?.length}`);
    
    // Step 2: Test supabase client initialization
    logs.push(`Step 2: supabase type = ${typeof supabase}`);
    logs.push(`Step 3: supabase.from type = ${typeof supabase.from}`);
    
    // Step 4: Query user
    const result = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    logs.push(`Step 4: Query done. error=${JSON.stringify(result.error)}, data_exists=${!!result.data}`);
    
    if (result.error) {
      logs.push(`Step 4a: Error details: ${JSON.stringify(result.error)}`);
      return NextResponse.json({ success: false, logs, error: 'Query failed' });
    }
    
    const user = result.data;
    logs.push(`Step 5: User found: id=${user?.id}, email=${user?.email}, has_password_hash=${!!user?.password_hash}`);
    
    if (!user || !user.password_hash) {
      logs.push(`Step 5a: No user or no password_hash`);
      return NextResponse.json({ success: false, logs, error: 'User not found' });
    }
    
    // Step 6: Test bcrypt
    logs.push(`Step 6: password_hash starts_with=${user.password_hash.substring(0, 7)}`);
    const isValid = await bcrypt.compare(password, user.password_hash);
    logs.push(`Step 7: bcrypt.compare result = ${isValid}`);
    
    if (!isValid) {
      return NextResponse.json({ success: false, logs, error: 'Invalid password' });
    }
    
    return NextResponse.json({
      success: true,
      logs,
      user: { id: user.id, name: user.name, email: user.email },
    });
    
  } catch (error: any) {
    logs.push(`EXCEPTION: ${error?.message}`);
    logs.push(`STACK: ${error?.stack?.substring(0, 200)}`);
    return NextResponse.json({ success: false, logs, error: error?.message });
  }
}
