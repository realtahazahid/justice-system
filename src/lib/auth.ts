import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@sahilaw.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password');
        }

        const emailLower = credentials.email.toLowerCase();

        // Find the user in the database
        let user = await prisma.user.findUnique({
          where: { email: emailLower },
        });

        // Auto-seed admin user if user table is completely empty and they use the default admin email
        if (!user) {
          const userCount = await prisma.user.count();
          if (userCount === 0 && emailLower === 'admin@sahilaw.com') {
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            user = await prisma.user.create({
              data: {
                email: 'admin@sahilaw.com',
                name: 'Supreme Court Advocate',
                password: hashedPassword,
                role: 'ADMIN',
              },
            });
          } else {
            return null;
          }
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordCorrect) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
