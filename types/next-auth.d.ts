import 'next-auth';

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

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    plan?: string;
    githubAccessToken?: string;
    githubUsername?: string;
  }
}
