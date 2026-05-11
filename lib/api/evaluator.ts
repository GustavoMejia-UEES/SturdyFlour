export async function evaluateOpenQuestion(
  questionText: string,
  studentAnswer: string,
  topic: string,
  expectedConcepts: string[],
  difficulty: string
) {
  console.log("🚀 Mock Evaluator: Simulating thinking time...");
  
  // artificial delay for UX realism
  await new Promise((r) => setTimeout(r, 1200));

  // Placeholder result allowing the interface to operate perfectly until you integrate N8N
  return {
    score: 90,
    analysis: `El flujo está perfectamente conectado y listo para N8N. Este es un análisis simulado de la respuesta sobre el tema [${topic}]. Excelente participación.`,
    found_concepts: expectedConcepts.slice(0, 1)
  };
}
