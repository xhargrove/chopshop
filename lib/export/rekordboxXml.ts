import { formatBPM } from "@/lib/format";
import type { AudioSession } from "@/types/audio";

const setAttributes = (element: Element, attributes: Record<string, string>): void => {
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
};

const createDocument = (): XMLDocument => document.implementation.createDocument("", "DJ_PLAYLISTS");

const validateRekordboxXml = (xml: string): void => {
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  const track = parsed.querySelector("TRACK");

  if (!track?.getAttribute("TrackID") || !track.getAttribute("Name") || !track.querySelector("TEMPO")) {
    throw new Error("Generated Rekordbox XML is missing required track metadata.");
  }
};

export function generateRekordboxXml(session: AudioSession, editName: string = "Full Edit"): string {
  const doc = createDocument();
  const root = doc.documentElement;
  setAttributes(root, { Version: "1.0.0" });

  const product = doc.createElement("PRODUCT");
  setAttributes(product, { Name: "Chop Shop", Version: "1.0", Company: "Chop Shop" });
  root.appendChild(product);

  const collection = doc.createElement("COLLECTION");
  setAttributes(collection, { Entries: "1" });
  root.appendChild(collection);

  const track = doc.createElement("TRACK");
  setAttributes(track, {
    TrackID: "1",
    Name: `${session.file.name.replace(/\.[^/.]+$/, "")} (${editName})`,
    Artist: "",
    Album: "",
    Genre: "",
    TotalTime: String(Math.round(session.file.durationSeconds)),
    AverageBpm: session.file.bpm ? session.file.bpm.toFixed(2) : "0.00",
    Tonality: session.file.key ?? "",
    Comments: `Chop Shop edit - ${editName}`,
  });
  collection.appendChild(track);

  session.cuePoints.forEach((cuePoint, index) => {
    const mark = doc.createElement("POSITION_MARK");
    setAttributes(mark, {
      Name: cuePoint.label || `CUE ${index + 1}`,
      Type: "0",
      Start: cuePoint.position.toFixed(3),
      Num: String(index),
    });
    track.appendChild(mark);
  });

  const loopRegion = session.regions.find((region) => region.type === "loop");

  if (loopRegion) {
    const loopMark = doc.createElement("POSITION_MARK");
    setAttributes(loopMark, {
      Name: loopRegion.label,
      Type: "3",
      Start: loopRegion.start.toFixed(3),
      End: loopRegion.end.toFixed(3),
      Num: "-1",
    });
    track.appendChild(loopMark);
  }

  session.transitionCues.forEach((transitionCue) => {
    const mark = doc.createElement("POSITION_MARK");
    setAttributes(mark, {
      Name: transitionCue.label,
      Type: "4",
      Start: transitionCue.inPoint.toFixed(3),
      End: transitionCue.outPoint.toFixed(3),
      Num: "-1",
    });
    track.appendChild(mark);
  });

  const tempo = doc.createElement("TEMPO");
  setAttributes(tempo, {
    Inizio: "0.000",
    Bpm: session.file.bpm ? session.file.bpm.toFixed(2) : formatBPM(0).replace(" BPM", ""),
    Metro: "4/4",
    Battito: "1",
  });
  track.appendChild(tempo);

  const xml = new XMLSerializer().serializeToString(doc);
  validateRekordboxXml(xml);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}
