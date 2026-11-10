// Which subjects the lens focuses on at time t (shared by the renderer and the camera guard): the current shot's;
// in a flight / whip the outgoing shot's for the first half and the incoming shot's for the second.
import { trackCam, Track } from "./track";
export const focusIds = (specs: { subjects: string[] }[], tr: Track, t: number) => {
  const p = trackCam(tr, t);
  return (p.flying >= 0 ? (p.flying < 0.5 ? specs[p.shot] : specs[p.next]) : specs[p.shot]).subjects;
};
