import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  console.log('[AUTH] getSupabase env:', { hasUrl: !!url, hasKey: !!key });
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required');
  return createClient(url, key);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] authorize called:', { email: credentials?.email });
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[AUTH] Missing credentials');
            return null;
          }

          const supabase = getSupabase();
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email as string)
            .single();

          console.log('[AUTH] Query result:', { found: !!user, error: error?.message });

          if (error || !user || !user.password_hash) return null;

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password_hash
          );
          console.log('[AUTH] Password valid:', isValid);

          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        } catch (err: any) {
          console.error('[AUTH] authorize exception:', err?.message);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
