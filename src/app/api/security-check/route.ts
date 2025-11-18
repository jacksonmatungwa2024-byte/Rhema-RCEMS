import { NextResponse } from 'next/server'

export async function GET() {
  console.log("Ukaguzi wa usalama umefanyika saa", new Date().toISOString())
  // Hapa unaweza kuongeza mantiki ya kuzuia IP mbaya au ku-update firewall
  return NextResponse.json({ status: 'Ukaguzi wa usalama umekamilika' })
}
