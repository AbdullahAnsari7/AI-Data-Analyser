import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"
import { processData } from "@/lib/dataProcessor"

export async function POST(req: NextRequest) {
  try {
    const { query, headers, sampleRows } = await req.json()

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

    const prompt = `
You are a strict JSON generator for a data analyst dashboard.

Available columns:
${headers.join(", ")}

User question:
"${query}"

Your job:
1. Understand what analysis the user wants
2. Choose the best chart type
3. Return ONLY valid JSON

IMPORTANT RULES:
- Return ONLY JSON
- No markdown
- No backticks
- No explanation outside JSON
- Always include all fields

Use this exact format:
{
  "operation": "top | sum | average | group",
  "column": "column name",
  "metric": "column name",
  "limit": 5,
  "chartRecommendation": "bar | pie | line",
  "insight": "short summary sentence"
}
`

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })

    const text = response.text ?? ""
    const clean = text.replace(/```json|```/g, "").trim()

    let structuredQuery: any

    try {
      structuredQuery = JSON.parse(clean)
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid format. Try again." },
        { status: 500 }
      )
    }

    if (!structuredQuery.operation) {
      structuredQuery = {
        operation: "group",
        column: headers[0],
        metric: headers[1] || headers[0],
        limit: 5,
        chartRecommendation: "bar",
        insight: "Here is the processed summary of your data.",
      }
    }

    const processed = processData(sampleRows, structuredQuery)

    return NextResponse.json({
      insight:
        structuredQuery.insight ||
        `Performed ${structuredQuery.operation} on ${structuredQuery.column || structuredQuery.metric || "data"}`,
      chartData: Array.isArray(processed) ? processed : [],
      tableData: Array.isArray(processed)
        ? processed
        : [{ value: processed }],
      chartRecommendation: structuredQuery.chartRecommendation || "bar",
    })
  } catch (error: any) {
    console.error("Analyze API error:", error)

    return NextResponse.json(
      { error: error?.message || "Something went wrong" },
      { status: 500 }
    )
  }
}