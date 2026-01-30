import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabaseAdmin, supabase } from "@/lib/supabase";

// GET /api/pins - Fetch all pins
export async function GET() {
    const { data: pins, error } = await supabase
        .from("pins")
        .select("*");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(pins);
}

// POST /api/pins - Add a new pin
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lat, lng, location, regionName } = body;

    if (!lat || !lng) {
        return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    // Jitter logic: Add small random offset to avoid exact overlap
    // ~0.01 degrees is roughly 1km. We want small jitter, maybe ~100-500m
    const jitter = () => (Math.random() - 0.5) * 0.01;
    const finalLat = lat + jitter();
    const finalLng = lng + jitter();

    // Use supabaseAdmin (Service Role) to bypass RLS for insert if needed, 
    // or simple supabase client if RLS allows authenticated inserts. 
    // Since we want to enforce one pin per user server-side or ensure data integrity, admin is safer here 
    // to override any potential RLS restrictions on 'unique' constraints if we want to handle upsert manually.
    // actually, let's use upsert with the discord_id.

    // We need the discord ID. NextAuth session usually has it in `sub` or we need to expose it.
    // In our authOptions, we didn't explicitly expose 'id' or 'sub' in session.user, but `token.sub` is usually the ID.
    // Let's assume standard NextAuth behavior where email might be null for discord, but image/name are there.
    // We need to verify if we have the ID. 
    // For now, let's look at the session object structure in `authOptions` callback. 
    // I will assume we update authOptions to pass the ID.

    // Let's try to get the ID from the session. If not present, we might need to patch authOptions.
    // Default NextAuth session.user contains { name, email, image }.
    // We need the Discord ID for the `discord_id` column.

    // Checking `authOptions` again... I'll need to update it to include the ID.
    // For now, I'll return an error if I can't find it, but I'll update the auth route in the next step.

    // Placeholder pending auth update:
    let discordId = (session as any).user?.id || (session as any).sub;

    if (!discordId) {
        return NextResponse.json({ error: "Could not identify user ID" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin!
        .from("pins")
        .upsert({
            discord_id: discordId,
            username: session.user.name,
            avatar_url: session.user.image,
            lat: finalLat,
            lng: finalLng,
            location: location || regionName,
        }, { onConflict: 'discord_id' })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// DELETE /api/pins - Delete user's pin
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const discordId = (session as any).user?.id || (session as any).sub;

    if (!discordId) {
        return NextResponse.json({ error: "Could not identify user ID" }, { status: 400 });
    }

    const { error } = await supabaseAdmin!
        .from("pins")
        .delete()
        .eq("discord_id", discordId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
