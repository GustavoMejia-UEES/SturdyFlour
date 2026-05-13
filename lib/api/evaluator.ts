export async function evaluateOpenQuestion(
  questionText: string,
  studentAnswer: string,
  aiContext: {
    topic: string;
    expected_concepts: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    ideal_answer?: string;
    evaluation_style?: string;
    passing_criteria?: string;
  }
) {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
  
  if (!webhookUrl) {
    throw new Error("NEXT_PUBLIC_N8N_WEBHOOK_URL no está definida en el archivo .env");
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question_text: questionText,
        student_answer: studentAnswer,
        context: aiContext
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch evaluation from AI Engine: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    // Ensure strict structural normalization to match UnifiedSimulator types
    return {
      score: Number(data.score) ?? 0,
      analysis: String(data.analysis || data.feedback || "El motor de IA evaluó tu respuesta con éxito, pero omitió el análisis textual."),
      found_concepts: Array.isArray(data.found_concepts) ? data.found_concepts : [],
      missing_concepts: Array.isArray(data.missing_concepts) ? data.missing_concepts : []
    };
  } catch (error) {
    console.error("🔴 AI evaluation workflow failure:", error);
    throw new Error("El motor evaluador inteligente no está respondiendo temporalmente.");
  }
}
