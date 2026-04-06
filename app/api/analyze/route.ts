import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { processData } from "@/lib/dataProcessor"

export async function POST(req: NextRequest) {
  try {
    const { query, headers, sampleRows } = await req.json()

    // 🔒 Validation
    if (!query || !headers || !sampleRows) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY missing" },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    // 🧠 STRONG PROMPT (NO JSON BREAKING)
    const prompt = `
You are a strict JSON generator.

Convert the user query into structured JSON.

Columns:
${headers.join(", ")}

User question:
"${query}"

IMPORTANT RULES:
- Return ONLY valid JSON
- No explanation
- No extra text
- No markdown
- No backticks
- Always include all fields

FORMAT:
{
  "operation": "top | sum | average | group",
  "column": "column name",
  "metric": "column name",
  "limit": 5
}
`

    // 🚀 Gemini call
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })

    const text = response.text ?? ""
    const clean = text.replace(/```json|```/g, "").trim()

    // 🛡️ SAFE PARSE
    let structuredQuery

    try {
      structuredQuery = JSON.parse(clean)
    } catch (err) {
      console.error("JSON parse failed:", clean)

      return NextResponse.json(
        { error: "AI returned invalid format. Try again." },
        { status: 500 }
      )
    }

    // 🔁 FALLBACK (VERY IMPORTANT)
    if (!structuredQuery.operation) {
      structuredQuery = {
        operation: "group",
        column: headers[0],
        metric: headers[1] || headers[0],
        limit: 5,
      }
    }

    // ⚙️ REAL DATA PROCESSING
    const processed = processData(sampleRows, structuredQuery)

    return NextResponse.json({
      insight: `Performed ${structuredQuery.operation} on ${
        structuredQuery.column || structuredQuery.metric || "data"
      }`,
      chartData: Array.isArray(processed) ? processed : [],
      tableData: Array.isArray(processed)
        ? processed
        : [{ value: processed }],
      chartRecommendation: "bar",
    })
  } catch (error: any) {
    console.error("Analyze API error:", error)

    return NextResponse.json(
      { error: error?.message || "Something went wrong" },
      { status: 500 }
    )
  }
}