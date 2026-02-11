export const API_URL = "http://localhost:4000";

export interface Job {
  job_title: string;
  company: string;
  location: string;
  source_url: string;
  work_mode?: string;
  salary_or_stipend?: string;
  experience_required?: string;
  skills_required?: string[];
  education?: string;
  eligibility?: string;
  summary?: string;
  job_description?: string;
  responsibilities?: string[];
  requirements?: string[];
}

export interface ChatResponse {
  response: string;
  structured_data?: {
    jobs: Job[];
  };
  final_answer?: string;
}

export async function sendQuery(
  query: string,
  opts?: {
    sessionId?: string;
    mode?: string;
    limit?: number;
  }
): Promise<any> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      ...(opts?.sessionId ? { session_id: opts.sessionId } : {}),
      ...(opts?.mode ? { mode: opts.mode } : {}),
      ...(typeof opts?.limit === "number" ? { limit: opts.limit } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch response");
  }

  return res.json();
}

type StreamHandlers = {
  onStatus?: (status: string) => void;
  onDelta?: (delta: string) => void;
  signal?: AbortSignal;
};

function parseSseEvent(raw: string): { event?: string; data: string } | null {
  const lines = raw.split("\n");
  let event: string | undefined;
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice("event:".length).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice("data:".length));
  }

  if (!event && dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

export async function sendQueryStream(
  query: string,
  opts: {
    sessionId?: string;
    mode?: string;
    limit?: number;
  } & StreamHandlers
): Promise<{
  final_answer?: string;
  structured_data?: { jobs?: Job[] } | any;
  job_urls?: string[];
  status?: string;
}> {
  const res = await fetch(`${API_URL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      ...(opts.sessionId ? { session_id: opts.sessionId } : {}),
      ...(opts.mode ? { mode: opts.mode } : {}),
      ...(typeof opts.limit === "number" ? { limit: opts.limit } : {}),
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to start streaming response");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload:
    | {
        final_answer?: string;
        structured_data?: any;
        job_urls?: string[];
        status?: string;
      }
    | undefined;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by blank line
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const evt = parseSseEvent(part.trim());
      if (!evt) continue;

      if (evt.event === "status") opts.onStatus?.(evt.data.trim());
      if (evt.event === "token") opts.onDelta?.(evt.data);
      if (evt.event === "final") {
        try {
          finalPayload = JSON.parse(evt.data);
        } catch {
          // ignore parse errors; caller will handle missing payload
        }
      }
    }
  }

  return finalPayload || { status: "error" };
}

export async function fetchInitialJobs(): Promise<Job[]> {
  const res = await fetch(`${API_URL}/jobs/initial`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    console.error("Failed to fetch initial jobs");
    return [];
  }

  const data = await res.json();
  return data.jobs || [];
}
