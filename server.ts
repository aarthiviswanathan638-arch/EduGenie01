import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize shared server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface StudentProfile {
  name?: string;
  grade: string; // e.g. 'Elementary', 'Middle School', 'High School', 'Undergraduate', 'Postgraduate/Professional'
  subject: string; // e.g. 'Mathematics', 'Physics', 'Computer Science', etc.
  difficulty: string; // 'Beginner', 'Intermediate', 'Advanced', 'Olympiad/Competitive'
  objective: string; // 'Concept Mastery', 'Exam Prep', 'Homework Guidance', 'Skill Practice', 'Quick Summary'
  availableTime?: string; // '15 mins', '30 mins', '1 hour', 'Deep Session'
}

export type LearningMode =
  | 'explain'
  | 'simplify'
  | 'deep_dive'
  | 'quiz'
  | 'flashcards'
  | 'revision'
  | 'exam'
  | 'step_by_step'
  | 'teach_back'
  | 'summarize'
  | 'study_plan'
  | 'homework';

// Constructs the Master System Prompt tailored to student profile and active mode
function buildSystemInstruction(profile?: Partial<StudentProfile>, mode?: LearningMode): string {
  const profileDetails = profile
    ? `
STUDENT PROFILE IN CONTEXT:
- Student Name / Nickname: ${profile.name || 'Learner'}
- Grade / Academic Level: ${profile.grade || 'High School'}
- Current Subject: ${profile.subject || 'General STEM & Humanities'}
- Preferred Difficulty: ${profile.difficulty || 'Intermediate'}
- Learning Objective: ${profile.objective || 'Concept Mastery'}
- Available Time: ${profile.availableTime || 'Flexible'}
`
    : '';

  const modeInstruction = getModeSpecificInstruction(mode);

  return `You are EduGenie, an intelligent, friendly, and personalized learning assistant powered by Google Gemini.
Your primary purpose is to help students understand concepts, learn effectively, practice skills, complete academic tasks responsibly, and develop independent thinking.

1. CORE IDENTITY
- Your name is EduGenie.
- Act as a knowledgeable tutor, study companion, explainer, quiz master, and academic assistant.
- Adapt your explanations to the student's age, educational level, subject, and existing knowledge.
- Be encouraging, patient, respectful, and non-judgmental.
- Prioritize understanding over simply providing answers.
- Never intentionally mislead the student. If information is uncertain or potentially outdated, clearly say so.

2. TEACHING PHILOSOPHY
- Understand what the student is asking.
- Determine their likely knowledge level.
- Explain the concept in simple language first.
- Break difficult topics into smaller steps.
- Use examples, analogies, diagrams in text, and practical applications when useful.
- Check understanding when appropriate.
- Give progressively harder practice questions.
- Encourage the student to reason independently.
- Summarize key points at the end.
- Do not unnecessarily overwhelm beginners with advanced terminology.

3. PERSONALIZATION & TONE
${profileDetails}
- Adapt your tone and depth strictly according to the student profile above.
- If the student's level is unknown and significantly affects the answer, ask a brief clarifying question or provide an intuitive accessible explanation first.
- Student Motivation: Encourage progress without fake hollow flattery. Use constructive phrases like "Good start. Let's inspect step 2", "You're applying the right idea; now let's verify the calculation", "Try this next step yourself before I show the solution". Never humiliate or discourage.

4. ACADEMIC INTEGRITY & HOMEWORK
- Help students learn rather than encouraging blind copying.
- For homework questions: explain the method, work through reasoning, and guide them. If the task assesses their own work, prompt them to try a step before revealing full answers.
- If reviewing student's work: identify what is correct, what needs improvement, why the mistake occurred, and how to correct it.

5. RESPONSE STRUCTURE (When appropriate)
- Answer: Direct concise answer.
- Explanation: The reasoning broken down clearly.
- Example / Analogy: Concrete illustration or real-world application.
- Quick Check: A targeted question or problem for the student to test their grasp.
- Key Takeaways: 2-3 essential bullet points to remember.
(Do not force this full structure on simple quick interactions).

CURRENT ACTIVE LEARNING MODE:
${modeInstruction}

Final Principle: Your goal is not merely to give answers. Your goal is to help the student understand, practice, remember, and solve problems independently.
Optimize for: Clarity + Accuracy + Personalization + Active Learning + Student Independence.
`;
}

function getModeSpecificInstruction(mode?: LearningMode): string {
  switch (mode) {
    case 'simplify':
      return `MODE: SIMPLIFY MODE.
Explain the concept in very simple, accessible language without losing the core meaning (ELI10 style). Use vivid real-world analogies, minimal jargon, and intuitive pictures in text.`;

    case 'deep_dive':
      return `MODE: DEEP DIVE MODE.
Provide a detailed, rigorous, technical explanation. Include theoretical foundations, mathematical formulas, edge cases, historical context, underlying mechanisms, and nuance suitable for advanced study.`;

    case 'quiz':
      return `MODE: QUIZ MODE.
Ask one question at a time (or manage test questions interactively). Do not immediately reveal the answer! Evaluate student answers warmly, explain mistakes constructively, and adjust difficulty dynamically.`;

    case 'flashcards':
      return `MODE: FLASHCARD GENERATION MODE.
Structure concise, high-yield question-and-answer flashcards with key terms, memory hooks/mnemonics, and practical examples for spaced repetition.`;

    case 'revision':
      return `MODE: REVISION MODE.
Extract the most high-yield concepts, essential formulas, crucial definitions, common exam traps, and summary tables for rapid pre-exam review.`;

    case 'exam':
      return `MODE: EXAM MODE.
Generate realistic exam-style questions (MCQs, short answer, and long analytical questions) complete with mark weightings, grading rubrics, and detailed step-by-step marking schemes.`;

    case 'step_by_step':
      return `MODE: STEP-BY-STEP MODE.
Guide the student through the problem ONE STEP AT A TIME. Present Step 1, explain why it is done, then stop and ask the student to attempt Step 2 (or solve the next micro-step) before moving forward.`;

    case 'teach_back':
      return `MODE: TEACH-BACK MODE (Feynman Technique).
Invite the student to explain the topic back to you in their own words. When they respond, evaluate their explanation: praise what they got right, gently highlight gaps or misconceptions, and prompt them to fill in the missing piece.`;

    case 'summarize':
      return `MODE: SUMMARIZE MODE.
Convert long notes or text into clean, structured revision notes using clear headings, bullet points, core definitions, and formulas without fabricating missing information.`;

    case 'study_plan':
      return `MODE: STUDY PLAN MODE.
Design realistic, time-budgeted study schedules integrating active recall, spaced repetition, practice questions, and scheduled rest breaks based on available time and exam dates.`;

    case 'homework':
      return `MODE: HOMEWORK ASSISTANCE MODE.
Act as an ethical homework mentor. Explain the method, ask guiding questions to unlock the student's reasoning, review submitted answers for errors, explain the 'why' behind errors, and help them arrive at the solution themselves.`;

    case 'explain':
    default:
      return `MODE: EXPLAIN MODE.
Provide a balanced, structured explanation starting from fundamentals and building up to intermediate/advanced applications. Use clear headings, examples, and a quick check question.`;
  }
}

// 1. Interactive Streaming Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, studentProfile, currentMode, stream = true } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const systemInstruction = buildSystemInstruction(studentProfile, currentMode);

    // Format contents for Gemini SDK
    // System instruction is passed in config
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({ text: response.text });
    }
  } catch (error: any) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: error?.message || 'Failed to generate response' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error?.message || 'Streaming failed' })}\n\n`);
      res.end();
    }
  }
});

// 2. Structured Quiz Generator Endpoint
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { topic, subject, grade, difficulty, count = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const prompt = `Create an interactive quiz on the topic: "${topic}" for a ${grade || 'High School'} student in ${subject || 'General STEM/Humanities'}.
Target difficulty: ${difficulty || 'Intermediate'}.
Number of questions: ${count}.
Include a diverse mix of Multiple Choice (MCQ), True/False, and Short Answer questions.
Ensure all explanations are educational, encouraging, and explain why the correct answer is right and why distractors are wrong.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are EduGenie's Quiz Master module. Follow EduGenie teaching principles: constructive, accurate, educational, clear.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            overview: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, description: "'mcq', 'true_false', or 'short_answer'" },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Required for mcq and true_false',
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  difficulty: { type: Type.STRING, description: "'easy', 'medium', or 'hard'" },
                  conceptTested: { type: Type.STRING },
                },
                required: ['id', 'type', 'question', 'correctAnswer', 'explanation', 'hint', 'conceptTested'],
              },
            },
          },
          required: ['topic', 'overview', 'questions'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate quiz' });
  }
});

// 3. Quiz / Homework Answer Evaluation Endpoint
app.post('/api/quiz/evaluate', async (req, res) => {
  try {
    const { question, studentAnswer, correctAnswer, conceptTested, grade } = req.body;

    const prompt = `Evaluate the student's answer to this question:
Question: ${question}
Expected / Target Answer: ${correctAnswer}
Concept Tested: ${conceptTested || 'General'}
Student's Submitted Answer: "${studentAnswer}"
Student Grade: ${grade || 'High School'}

EduGenie Evaluation Rules:
1. Never shame the student for mistakes.
2. If correct: acknowledge what was great, provide a brief reinforcing insight.
3. If partially correct or incorrect: state "You're close..." or "Good effort. Let's look at...", clearly point out what part is right, where the misconception occurred, why, and how to fix it.
4. Give a score from 0 to 100.
5. Provide a quick follow-up challenge or tip to solidify understanding.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvementAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            whyMistakeOccurred: { type: Type.STRING },
            correctiveTip: { type: Type.STRING },
            reinforcingFact: { type: Type.STRING },
          },
          required: ['isCorrect', 'score', 'feedback', 'correctiveTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Evaluation error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to evaluate answer' });
  }
});

// 4. Flashcard Generator Endpoint
app.post('/api/flashcards/generate', async (req, res) => {
  try {
    const { topic, subject, grade, cardCount = 8 } = req.body;

    const prompt = `Generate a high-yield study deck of ${cardCount} flashcards for topic: "${topic}" in ${subject || 'General'} at ${grade || 'High School'} level.
Focus on active recall: clear, punchy questions or prompts on the front, and concise, clear explanations with key terms and memory aids/mnemonics on the back.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING },
            topic: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  front: { type: Type.STRING, description: 'Question or concept prompt' },
                  back: { type: Type.STRING, description: 'Direct answer and explanation' },
                  keyTerm: { type: Type.STRING },
                  mnemonic: { type: Type.STRING, description: 'Memory trick or analogy' },
                  example: { type: Type.STRING },
                  difficulty: { type: Type.STRING, description: "'fundamental', 'core', or 'advanced'" },
                },
                required: ['id', 'front', 'back', 'keyTerm'],
              },
            },
          },
          required: ['deckTitle', 'topic', 'cards'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Flashcard error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate flashcards' });
  }
});

// 5. Study Plan Generator Endpoint
app.post('/api/study-plan/generate', async (req, res) => {
  try {
    const { topic, subject, examDate, availableHoursPerDay, currentProficiency, targetGoal } = req.body;

    const prompt = `Create a realistic, pedagogically sound study plan for:
Subject: ${subject || 'General'}
Topic/Syllabus: ${topic}
Target Goal / Exam: ${targetGoal || 'Comprehensive Mastery'}
Target Exam Date or Timeline: ${examDate || 'Next 2 Weeks'}
Available Study Time: ${availableHoursPerDay || '1-2 hours daily'}
Current Student Proficiency: ${currentProficiency || 'Beginner/Intermediate'}

Incorporate EduGenie's principles:
- Realistic sessions with built-in breaks (e.g. Pomodoro 25/5 or 45/10)
- Spaced repetition and active recall
- Self-testing / mock quiz milestones
- Teach-back sessions
- Revision buffer days before the exam date.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            overview: { type: Type.STRING },
            estimatedTotalHours: { type: Type.NUMBER },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phaseNumber: { type: Type.NUMBER },
                  phaseName: { type: Type.STRING },
                  durationDays: { type: Type.NUMBER },
                  objective: { type: Type.STRING },
                  dailySessions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        day: { type: Type.STRING },
                        focusTopic: { type: Type.STRING },
                        method: { type: Type.STRING, description: "'active_recall', 'concept_breakdown', 'practice_drill', 'mock_test', 'spaced_revision'" },
                        durationMinutes: { type: Type.NUMBER },
                        breakMinutes: { type: Type.NUMBER },
                        actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                        quickCheckpointQuestion: { type: Type.STRING },
                      },
                      required: ['day', 'focusTopic', 'method', 'durationMinutes', 'actionItems'],
                    },
                  },
                },
                required: ['phaseNumber', 'phaseName', 'durationDays', 'dailySessions'],
              },
            },
            examReadinessChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
            proStudyTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['planTitle', 'overview', 'phases', 'examReadinessChecklist'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Study plan error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate study plan' });
  }
});

// 6. Teach-Back Evaluator Endpoint (Feynman Technique)
app.post('/api/teach-back/evaluate', async (req, res) => {
  try {
    const { concept, studentExplanation, targetLevel } = req.body;

    const prompt = `Concept being explained: "${concept}"
Target Academic Level: ${targetLevel || 'High School'}
Student's Own Explanation:
"${studentExplanation}"

Evaluate the student's teach-back attempt following EduGenie's pedagogy:
1. Praise specific things they explained accurately and clearly.
2. Identify any misconceptions, inaccuracies, or critical gaps.
3. Suggest a clear analogy or refinement to make their explanation airtight.
4. Give an encouraging mastery rating: 'Developing', 'Competent', 'Advanced', or 'Mastery'.
5. Ask one quick question that helps them test the boundary of their concept knowledge.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            masteryRating: { type: Type.STRING, description: "'Developing', 'Competent', 'Advanced', or 'Mastery'" },
            overallAssessment: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            misconceptionsOrGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            howToImproveExplanation: { type: Type.STRING },
            clarifyingAnalogy: { type: Type.STRING },
            followUpCheckpointQuestion: { type: Type.STRING },
          },
          required: ['masteryRating', 'overallAssessment', 'strengths', 'howToImproveExplanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Teach-back error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to evaluate teach-back' });
  }
});

// 7. Text-To-Speech Endpoint (EduGenie Voice Tutor)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // Limit text to avoid excessively large payload
    const truncatedText = text.slice(0, 500);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: truncatedText,
              speechMetadata: {
                style: 'Warm, articulate, patient academic tutor with natural cadence',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from Gemini TTS' });
    }

    return res.json({ audioBase64: base64Audio, format: 'audio/wav' });
  } catch (error: any) {
    console.error('TTS error:', error);
    return res.status(500).json({ error: error?.message || 'TTS generation failed' });
  }
});

// Vite Server middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduGenie server listening on port ${PORT}`);
  });
}

startServer();
