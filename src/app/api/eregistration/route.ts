import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error("Missing Supabase env vars");
    return createClient(url, key);
}

export async function GET() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("eregistration_accounts")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        return NextResponse.json({ records: data ?? [] });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { category, crewName, email, password } = await req.json();
        const { data, error } = await supabase
            .from("eregistration_accounts")
            .insert({ category, crew_name: crewName, email, password })
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json({ record: data });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { id, crewName, email, password } = await req.json();
        const { data, error } = await supabase
            .from("eregistration_accounts")
            .update({ crew_name: crewName, email, password })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return NextResponse.json({ record: data });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const { id } = await req.json();
        const { error } = await supabase.from("eregistration_accounts").delete().eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}