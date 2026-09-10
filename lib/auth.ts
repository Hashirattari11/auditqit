import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: string;
      hasGithubConnected: boolean;
      githubUsername?: string | null;
    };
  }
  interface User {
    plan?: string;
    githubAccessToken?: string | null;
    githubUsername?: string | null;
  }
}

function getSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = getSupabase();
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email as string)
          .single();

        if (error || !user || !user.password_hash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
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
    async signIn({ user, account, profile }) {
      // When signing in via GitHub, save the access token to DB
      if (account?.provider === 'github' && account?.access_token) {
        try {
          const supabase = getSupabase();
          const email = user.email || (profile as any)?.email;
          if (email) {
            // Check if user exists
            const { data: existing } = await supabase
              .from('users')
              .select('id')
              .eq('email', email)
              .single();

            if (existing) {
              // Update existing user
              await supabase
                .from('users')
                .update({
                  github_access_token: account.access_token,
                  github_username: (profile as any)?.login ?? user.name ?? '',
                })
                .eq('email', email);
            } else {
              // Create new user from GitHub OAuth
              await supabase
                .from('users')
                .insert({
                  email,
                  name: (profile as any)?.login ?? user.name ?? '',
                  github_access_token: account.access_token,
                  github_username: (profile as any)?.login ?? '',
                  plan: email === 'hashirattari73@gmail.com' ? 'admin' : 'free',
                });
            }
          }
        } catch (err) {
          console.error('[AUTH] Failed to save GitHub token:', err);
        }
      }
      return true;
    },

    async jwt({ token, user, account, profile }) {
      // On initial sign-in, capture user data
      if (user) {
        token.id = user.id;
      }

      // When signing in via GitHub, save token to DB (belt and suspenders)
      if (account?.provider === 'github' && account?.access_token) {
        token.githubAccessToken = account.access_token;
        token.githubUsername = (profile as any)?.login ?? '';

        // Persist to DB right here (upsert — create if not exists)
        if (token.email) {
          try {
            const supabase = getSupabase();
            const { data: existing } = await supabase
              .from('users')
              .select('id')
              .eq('email', token.email as string)
              .single();

            if (existing) {
              await supabase
                .from('users')
                .update({
                  github_access_token: account.access_token,
                  github_username: (profile as any)?.login ?? '',
                })
                .eq('email', token.email as string);
            } else {
              await supabase
                .from('users')
                .insert({
                  email: token.email as string,
                  name: (token.name as string) ?? '',
                  github_access_token: account.access_token,
                  github_username: (profile as any)?.login ?? '',
                  plan: (token.email as string) === 'hashirattari73@gmail.com' ? 'admin' : 'free',
                });
            }
          } catch (err) {
            console.error('[JWT] Failed to save GitHub token to DB:', err);
          }
        }
      }

      // On subsequent requests, load GitHub status from DB if not in token
      if (!token.githubAccessToken && token.email) {
        try {
          const supabase = getSupabase();
          const { data: dbUser } = await supabase
            .from('users')
            .select('github_access_token, github_username, plan')
            .eq('email', token.email as string)
            .single();

          if (dbUser) {
            if (dbUser.github_access_token) {
              token.githubAccessToken = dbUser.github_access_token;
              token.githubUsername = dbUser.github_username;
            }
            token.plan = dbUser.plan ?? 'free';
          }
        } catch (err) {
          // Silent fail — session will show disconnected
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.plan = (token.plan as string) ?? 'free';
        session.user.hasGithubConnected = !!token.githubAccessToken;
        session.user.githubUsername = (token.githubUsername as string) ?? null;

        // Also fetch latest from DB to ensure freshness
        if (session.user.email) {
          try {
            const supabase = getSupabase();
            const { data: dbUser } = await supabase
              .from('users')
              .select('id, plan, github_access_token, github_username')
              .eq('email', session.user.email)
              .single();

            if (dbUser) {
              session.user.id = dbUser.id;
              session.user.plan = dbUser.plan ?? 'free';
              session.user.hasGithubConnected = !!dbUser.github_access_token;
              session.user.githubUsername = dbUser.github_username;
            }
          } catch {
            // Use JWT values as fallback
          }
        }
      }
      return session;
    },
  },
});
