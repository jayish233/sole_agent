import { Candidate, InterviewResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function checkBackendHealth(): Promise<{ healthy: boolean; ragChunks?: number; model?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET', cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return { healthy: true, ragChunks: data.rag_chunks, model: data.model };
    }
  } catch (e) {
    // Backend offline
  }
  return { healthy: false };
}

export async function startInterviewAPI(sessionId: string, candidate: Candidate): Promise<InterviewResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, candidate }),
    });

    if (!res.ok) {
      throw new Error(`API HTTP Error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn('Backend API unreachable, using simulated adaptive agent turn 1', error);
    return getSimulatedTurn1(candidate);
  }
}

export async function sendTurnAPI(sessionId: string, message: string, turnCount: number, candidate: Candidate): Promise<InterviewResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message }),
    });

    if (!res.ok) {
      throw new Error(`API HTTP Error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(`Backend API unreachable, using simulated turn ${turnCount}`, error);
    return getSimulatedTurn(message, turnCount, candidate);
  }
}

// Fallback simulator for smooth presentation experience if Python backend is offline
function getSimulatedTurn1(candidate: Candidate): InterviewResponse {
  const name = candidate.member.name;
  const role = candidate.member.jobRole;
  const firstTryRate = Math.round((candidate.signals.missionsFirstTry / Math.max(1, candidate.signals.missionsCompleted)) * 100);

  return {
    reply: `Welcome ${name}! I am SOLE_AGENT, your adaptive technical interviewer. Based on your background as a ${role} with a ${firstTryRate}% first-try completion rate across ${candidate.signals.missionsCompleted} missions, we are initiating a tailored assessment focused on Vector Embeddings, RAG Architecture, and Agent Orchestration.\n\nLet's start with Module 3 (Embeddings & Vector Search): When generating embeddings for large text chunks in RAG, what key trade-offs exist between cosine similarity and dot product similarity, and how do chunk overlap and distance metrics impact retrieval accuracy?`,
    done: false
  };
}

function getSimulatedTurn(message: string, turnCount: number, candidate: Candidate): InterviewResponse {
  const name = candidate.member.name;

  if (turnCount >= 4) {
    // End interview turn
    return {
      reply: `Thank you for your detailed responses, ${name}. We have thoroughly evaluated your technical depth across RAG pipelines, Vector Search optimization, and Multi-Agent Orchestration. Generating your comprehensive technical assessment report now...`,
      done: true,
      feedback: {
        summary: `${name} demonstrated strong foundational technical reasoning in system design, vector search mechanics, and RAG retrieval optimization. Showcased crisp understanding of high-dimensional embeddings and agentic tool dispatch.`,
        strengths: [
          `Deep understanding of Vector Similarity Search & Chunking Strategies (Day 7-9)`,
          `Solid architectural approach to multi-agent state management & fallback loops (Day 22)`,
          `Clarity in explaining trade-offs between dense vector retrieval vs structured SQL queries`
        ],
        gaps: [
          `Could deepen knowledge in Model Context Protocol (MCP) server tool discovery protocols`,
          `Edge-case handling for latency spikes during streaming responses in production`
        ],
        next: [
          `Review Day 23: Model Context Protocol (MCP) tool schema definitions`,
          `Implement retry mechanisms & circuit breakers for streaming FastAPI SSE endpoints`,
          `Explore hybrid search (BM25 + Dense Vectors with Reciprocal Rank Fusion)`
        ]
      }
    };
  }

  if (turnCount === 2) {
    return {
      reply: `Excellent analysis on vector distance metrics. Now let's dive into Module 6 (Agentic AI & Multi-Agent Orchestration):\n\nImagine you are designing a healthcare RAG agent that needs to query structured SQL databases and unstructured medical PDFs simultaneously. How would you structure the router node, handle state management between sub-agents, and prevent infinite reasoning loops?`,
      done: false
    };
  }

  return {
    reply: `Great breakdown of agent state machine handling. Let's move to Module 7 (Evaluation, Guardrails & Production Deployment):\n\nHow do you prevent prompt injection attacks while keeping structured JSON function calling outputs reliable for LLM tool invocation in production?`,
    done: false
  };
}
