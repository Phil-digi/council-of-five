import { CouncilResponse, PersonaType, Mode } from '../types';

const VALID_PERSONAS: PersonaType[] = ['Adrien', 'Nova', 'Henri', 'Aya', 'Damien'];
const VALID_MODES: Mode[] = ['auto', 'quick', 'duel', 'council'];

export function parseAndValidateJSON(raw: string): CouncilResponse {
  // Step 1: Clean the response
  let cleaned = raw.trim();
  
  // Remove markdown code blocks if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // Step 2: Try to parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    // Attempt repair: find JSON object boundaries
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      try {
        parsed = JSON.parse(cleaned.slice(startIdx, endIdx + 1));
      } catch {
        throw new Error(`Invalid JSON: ${(e as Error).message}`);
      }
    } else {
      throw new Error(`Invalid JSON: ${(e as Error).message}`);
    }
  }

  // Step 3: Validate structure
  const response = parsed as Record<string, unknown>;
  
  // Validate mode_used
  if (!response.mode_used || !VALID_MODES.includes(response.mode_used as Mode)) {
    response.mode_used = 'auto';
  }

  // Validate selected_personas
  const selectedRaw = response.selected_personas;
  let selectedPersonas: PersonaType[] = [];
  if (Array.isArray(selectedRaw)) {
    selectedPersonas = (selectedRaw as unknown[])
      .filter((p): p is PersonaType => typeof p === 'string' && VALID_PERSONAS.includes(p as PersonaType));
  }
  if (selectedPersonas.length === 0) {
    selectedPersonas = ['Adrien'];
  }
  response.selected_personas = selectedPersonas;

  // Validate conversation
  if (!Array.isArray(response.conversation)) {
    response.conversation = [];
  } else {
    response.conversation = (response.conversation as Array<Record<string, unknown>>)
      .filter(turn => 
        turn && 
        typeof turn.persona === 'string' && 
        VALID_PERSONAS.includes(turn.persona as PersonaType) &&
        typeof turn.message === 'string'
      )
      .map(turn => ({
        persona: turn.persona as PersonaType,
        message: turn.message as string
      }));
  }

  // Validate synthesis
  if (!response.synthesis || typeof response.synthesis !== 'object') {
    response.synthesis = {
      summary: 'Unable to generate synthesis.',
      recommendations: [],
      risks: [],
      next_steps: []
    };
  } else {
    const synthesis = response.synthesis as Record<string, unknown>;
    response.synthesis = {
      summary: typeof synthesis.summary === 'string' ? synthesis.summary : 'No summary available.',
      recommendations: Array.isArray(synthesis.recommendations) 
        ? synthesis.recommendations.filter((r): r is string => typeof r === 'string')
        : [],
      risks: Array.isArray(synthesis.risks)
        ? synthesis.risks.filter((r): r is string => typeof r === 'string')
        : [],
      next_steps: Array.isArray(synthesis.next_steps)
        ? synthesis.next_steps.filter((s): s is string => typeof s === 'string')
        : []
    };
  }

  return response as unknown as CouncilResponse;
}

export function generateMockResponse(question: string, mode: Mode): CouncilResponse {
  const personas: PersonaType[] = mode === 'quick' 
    ? ['Adrien']
    : mode === 'duel'
    ? ['Adrien', 'Aya']
    : ['Adrien', 'Nova', 'Henri', 'Aya', 'Damien'];

  return {
    mode_used: mode === 'auto' ? 'council' : mode,
    selected_personas: personas,
    conversation: personas.map(persona => ({
      persona,
      message: `[Mock ${persona} response to: "${question.slice(0, 50)}..."]`
    })),
    synthesis: {
      summary: `Mock synthesis for the question about ${question.slice(0, 30)}...`,
      recommendations: ['Mock recommendation 1', 'Mock recommendation 2'],
      risks: ['Mock risk 1'],
      next_steps: ['Mock next step 1', 'Mock next step 2']
    }
  };
}
