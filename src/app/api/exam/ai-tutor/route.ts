import { NextRequest, NextResponse } from 'next/server';
import { isGeminiConfigured, getGeminiClient } from '@/lib/geminiClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      statement,
      options, // [option1, option2, option3, option4]
      selectedOption,
      correctAnswer,
      explanation,
      subjectCode,
      chapter,
      userDoubt,
      mode = 'custom',
    } = body;

    if (!statement || !options || !correctAnswer) {
      return NextResponse.json(
        { error: 'Missing required question parameters for AI clarification.' },
        { status: 400 }
      );
    }

    const optionLetters = ['(1)', '(2)', '(3)', '(4)'];
    const correctOptText = options[correctAnswer - 1] || '';
    const selectedOptText = selectedOption ? options[selectedOption - 1] : 'Unattempted';

    // 1. If Gemini API is configured, request live AI tutor response
    if (isGeminiConfigured()) {
      try {
        const ai = getGeminiClient();
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

        let promptFocus = '';
        if (mode === 'why_selected_wrong' && selectedOption) {
          promptFocus = `The student chose Option ${selectedOption} (${selectedOptText}), but the correct answer is Option ${correctAnswer} (${correctOptText}). Specifically explain the cognitive fallacy or trap in Option ${selectedOption} that misleads NEET students.`;
        } else if (mode === 'trap_analysis') {
          promptFocus = `Analyze the question from an NTA examiner's lens: highlight the distractors and common pitfalls in the incorrect options.`;
        } else if (mode === 'memory_hook') {
          promptFocus = `Provide a memorable 2-3 line NCERT mnemonic, formula shortcut, or high-yield rule of thumb for this topic.`;
        } else if (userDoubt) {
          promptFocus = `The student has this specific doubt: "${userDoubt}". Answer their doubt directly with crystal-clear pedagogical clarity.`;
        } else {
          promptFocus = `Provide a step-by-step conceptual derivation/explanation of why Option ${correctAnswer} is correct, formatted with LaTeX math and NCERT references.`;
        }

        const systemPrompt = `You are Vailism AI Tutor, an elite NEET (UG) Master Faculty specializing in Physics, Chemistry, Botany, and Zoology.
A student is reviewing a question from their NEET CBT examination.

Question Details:
- Subject: ${subjectCode || 'General Science'}
- Chapter: ${chapter || 'NCERT Chapter'}
- Question Statement: ${statement}
- Option (1): ${options[0]}
- Option (2): ${options[1]}
- Option (3): ${options[2]}
- Option (4): ${options[3]}
- Student's Choice: Option ${selectedOption ? `${selectedOption} (${selectedOptText})` : 'Unattempted'}
- Official Answer: Option ${correctAnswer} (${correctOptText})
- Official Brief Explanation: ${explanation}

Task:
${promptFocus}

Format Requirements:
1. Use KaTeX/LaTeX math formatting ($...$ for inline, $$...$$ for display) for equations, symbols, units, and reactions.
2. Structure your response into clean sections with bold headers (e.g. **Core Concept**, **Step-by-Step Derivation / Logic**, **NCERT Takeaway / Memory Hook**).
3. Be concise, highly encouraging, and strictly compliant with NCERT Class 11 & 12 curriculum. Keep it under 250 words.`;

        const response = await ai.models.generateContent({
          model: modelName,
          contents: systemPrompt,
        });

        const clarificationText = response.text || '';
        if (clarificationText.trim().length > 0) {
          return NextResponse.json({
            success: true,
            clarification: clarificationText.trim(),
            provider: 'gemini',
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to local expert heuristics:', geminiError);
        // Continue to robust fallback
      }
    }

    // 2. High-Quality Offline / Fallback Tutor Response
    let fallbackClarification = '';
    const isSelectionWrong = selectedOption && selectedOption !== correctAnswer;

    fallbackClarification = `### 💡 Vailism AI Tutor Concept Breakdown\n\n`;
    fallbackClarification += `**Subject & Domain**: ${subjectCode} • *${chapter}*\n\n`;

    fallbackClarification += `**1. Why Option (${correctAnswer}) is Correct**:\n`;
    fallbackClarification += `${explanation}\n\n`;

    if (isSelectionWrong) {
      fallbackClarification += `**2. Distractor & Trap Analysis (Why Option ${selectedOption} was chosen)**:\n`;
      fallbackClarification += `Option (${selectedOption}) is a classic NTA distractor. Candidates frequently confuse reciprocal variables, inverse relationships, or overlook qualifying terms like *always*, *only*, or sign conventions (+/-). In *${chapter}*, always verify dimensional consistency and state parameters before choosing.\n\n`;
    }

    fallbackClarification += `**3. High-Yield NCERT Exam Rule**:\n`;
    fallbackClarification += `In **${chapter}**, NCERT directly emphasizes this concept in bold summary points. Re-verify the fundamental definition and ensure you memorize the key governing formula to prevent negative marking (-1).`;

    return NextResponse.json({
      success: true,
      clarification: fallbackClarification,
      provider: 'vailism-expert-heuristic',
    });
  } catch (error: any) {
    console.error('AI Tutor API error:', error);
    return NextResponse.json(
      { error: error.message || 'Unable to generate AI tutor clarification.' },
      { status: 500 }
    );
  }
}

