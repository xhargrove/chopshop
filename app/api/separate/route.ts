import { Readable } from "node:stream";

import { DEMUCS_TIMEOUT_MS, MAX_SEPARATION_FILE_BYTES, STEM_TYPES } from "@/lib/constants";
import { API_ERRORS, type ApiErrorKey } from "@/lib/errors";
import { server } from "@/lib/logger";
import type { SeparationEvent, StemModel, StemType } from "@/types/stems";

export const runtime = "nodejs";
export const maxDuration = 120;

const encoder = new TextEncoder();
const validStemTypes = new Set<string>(STEM_TYPES);

const toJsonLine = (event: SeparationEvent): Uint8Array => encoder.encode(`${JSON.stringify(event)}\n`);

const errorEvent = (key: ApiErrorKey): SeparationEvent => ({
  type: "ERROR",
  message: API_ERRORS[key].message,
  code: API_ERRORS[key].code,
});

const responseFromEvents = (events: AsyncIterable<SeparationEvent>, status = 200): Response => {
  const nodeStream = Readable.from((async function* streamEvents() {
    for await (const event of events) {
      yield toJsonLine(event);
    }
  })());

  return new Response(Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>, {
    status,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "Transfer-Encoding": "chunked",
    },
  });
};

const singleErrorResponse = (key: ApiErrorKey): Response =>
  responseFromEvents(
    (async function* errorEvents() {
      yield errorEvent(key);
    })(),
    API_ERRORS[key].code,
  );

const isStemType = (value: string): value is StemType => validStemTypes.has(value);

const isStemModel = (value: FormDataEntryValue | null): value is StemModel => value === "2stems" || value === "4stems" || value === "6stems";

const isWavOrMp3 = async (file: File): Promise<boolean> => {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isWav = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45;
  const isId3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
  const isMp3Frame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;

  return isWav || isId3 || isMp3Frame;
};

const appendOptionalRegion = (formData: FormData, requestData: FormData): void => {
  const regionStart = requestData.get("region_start");
  const regionEnd = requestData.get("region_end");

  if (typeof regionStart === "string" && regionStart !== "") {
    formData.set("region_start", regionStart);
  }

  if (typeof regionEnd === "string" && regionEnd !== "") {
    formData.set("region_end", regionEnd);
  }
};

const parseEvent = (line: string): SeparationEvent | null => {
  const parsed: unknown = JSON.parse(line);

  if (typeof parsed !== "object" || parsed === null || !("type" in parsed)) {
    return null;
  }

  const event = parsed as SeparationEvent;

  if (event.type === "STEM_READY" && !isStemType(event.stem)) {
    return null;
  }

  return event;
};

async function* proxyDemucsEvents(response: Response): AsyncGenerator<SeparationEvent> {
  const reader = response.body?.getReader();
  const stems: Partial<Record<StemType, string>> = {};
  const failures: Partial<Record<StemType, string>> = {};

  if (!reader) {
    yield errorEvent("DEMUCS_UPSTREAM_ERROR");
    return;
  }

  const decoder = new TextDecoder();
  let pending = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    pending += decoder.decode(value, { stream: true });
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      const event = parseEvent(line);

      if (!event) {
        continue;
      }

      if (event.type === "STEM_READY") {
        stems[event.stem] = event.url;
      }

      if (event.type === "ERROR") {
        failures.other = event.message;
      }

      yield event;
    }
  }

  yield { type: "COMPLETE", stems, failures: Object.keys(failures).length > 0 ? failures : undefined };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const demucsApiUrl = process.env.DEMUCS_API_URL;

    if (!demucsApiUrl) {
      return singleErrorResponse("DEMUCS_NOT_CONFIGURED");
    }

    const requestData = await request.formData();
    const fileEntry = requestData.get("file");

    if (!(fileEntry instanceof File)) {
      return singleErrorResponse("INVALID_FORM_DATA");
    }

    if (fileEntry.size > MAX_SEPARATION_FILE_BYTES) {
      return singleErrorResponse("FILE_TOO_LARGE");
    }

    if (!(await isWavOrMp3(fileEntry))) {
      return singleErrorResponse("UNSUPPORTED_AUDIO_TYPE");
    }

    const requestedModel = requestData.get("model");
    const model: StemModel = isStemModel(requestedModel) ? requestedModel : "4stems";
    const upstreamData = new FormData();
    upstreamData.set("file", fileEntry, fileEntry.name);
    upstreamData.set("model", model);
    appendOptionalRegion(upstreamData, requestData);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEMUCS_TIMEOUT_MS);
    const headers = new Headers();

    if (process.env.DEMUCS_API_KEY) {
      headers.set("Authorization", `Bearer ${process.env.DEMUCS_API_KEY}`);
    }

    const upstreamResponse = await fetch(demucsApiUrl, {
      method: "POST",
      body: upstreamData,
      headers,
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    if (!upstreamResponse.ok) {
      server.warn("Demucs upstream returned an error", upstreamResponse.status);
      return singleErrorResponse("DEMUCS_UPSTREAM_ERROR");
    }

    return responseFromEvents(proxyDemucsEvents(upstreamResponse));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return singleErrorResponse("DEMUCS_TIMEOUT");
    }

    server.error("Stem separation route failed", error);
    return singleErrorResponse("DEMUCS_UPSTREAM_ERROR");
  }
}
