import NextAuth, { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"

export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            authorization: { params: { scope: 'identify' } }, // We only need identity for now
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (session?.user) {
                // Add custom session data here if needed (e.g. admin role)
                (session.user as any).id = token.sub; // Expose Discord ID
            }
            return session
        },
    },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
