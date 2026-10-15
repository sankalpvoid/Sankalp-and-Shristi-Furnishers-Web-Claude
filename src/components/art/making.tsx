/** Illustrative workshop-process artwork. NOT photographs of the real workshop. */
const W1 = "#b98a52", W2 = "#8d5d33", W3 = "#6e4a2f";

function Bg({ id }: { id: string }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-g`} cx="50%" cy="35%" r="75%"><stop offset="0" stopColor="#4a443d" /><stop offset="1" stopColor="#262320" /></radialGradient>
        <linearGradient id={`${id}-w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c99d62" /><stop offset="1" stopColor="#8d5d33" /></linearGradient>
        <pattern id={`${id}-gr`} width="80" height="14" patternUnits="userSpaceOnUse"><path d="M0 4Q20 1 40 4T80 4M0 10Q20 7 40 10T80 10" stroke="#000" strokeOpacity=".16" fill="none" /></pattern>
      </defs>
      <rect width="800" height="500" fill={`url(#${id}-g)`} />
      <rect y="400" width="800" height="100" fill="#1d1b19" opacity=".7" />
    </>
  );
}
const Plank = ({ id, x, y, w, h, r = 4 }: { id: string; x: number; y: number; w: number; h: number; r?: number }) => (
  <g><rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-w)`} /><rect x={x} y={y} width={w} height={h} rx={r} fill={`url(#${id}-gr)`} /><rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke="#000" strokeOpacity=".25" /></g>
);

export function MakingArt({ stage, uid }: { stage: string; uid: string }) {
  const id = `m${uid}`;
  let body: React.ReactNode = null;
  switch (stage) {
    case "wood":
      body = (<g>
        {[0, 1, 2].map((r) => [0, 1, 2, 3].slice(0, 4 - (r === 2 ? 1 : 0)).map((c) => (
          <g key={`${r}${c}`}><ellipse cx={200 + c * 120 + (r % 2) * 60} cy={360 - r * 85} rx="62" ry="44" fill="#7c4f2a" /><ellipse cx={200 + c * 120 + (r % 2) * 60} cy={360 - r * 85} rx="52" ry="36" fill="#c99d62" /><ellipse cx={200 + c * 120 + (r % 2) * 60} cy={360 - r * 85} rx="34" ry="23" fill="none" stroke="#8d5d33" strokeWidth="2" /><ellipse cx={200 + c * 120 + (r % 2) * 60} cy={360 - r * 85} rx="16" ry="11" fill="none" stroke="#8d5d33" strokeWidth="2" /></g>
        )))}
      </g>);
      break;
    case "cut":
      body = (<g>
        <Plank id={id} x={110} y={270} w={580} h={70} />
        <Plank id={id} x={150} y={350} w={500} h={36} />
        {Array.from({ length: 29 }).map((_, i) => <line key={i} x1={130 + i * 20} y1={250} x2={130 + i * 20} y2={i % 5 === 0 ? 230 : 240} stroke="#d9c28a" strokeWidth="2" />)}
        <line x1="130" y1="250" x2="690" y2="250" stroke="#d9c28a" strokeWidth="2" />
        <line x1="470" y1="215" x2="470" y2="350" stroke="#e6dcc8" strokeWidth="2" strokeDasharray="8 6" />
        <path d="M455 180 l30 0 l-15 28 z" fill="#d9c28a" />
      </g>);
      break;
    case "build":
      body = (<g>
        <Plank id={id} x={170} y={190} w={460} h={34} />
        <Plank id={id} x={170} y={330} w={460} h={34} />
        <Plank id={id} x={170} y={190} w={34} h={174} />
        <Plank id={id} x={596} y={190} w={34} h={174} />
        <Plank id={id} x={383} y={224} w={34} h={106} />
        <path d="M120 150 h60 v20 h-40 v200 h-20z" fill="#9aa0a4" opacity=".9" />
        <path d="M680 380 h-60 v-20 h40 v-200 h20z" fill="#9aa0a4" opacity=".9" />
        {[[204, 224], [596, 224], [204, 330], [596, 330]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#d9c28a" />)}
      </g>);
      break;
    case "foam":
      body = (<g>
        <rect x="170" y="300" width="460" height="70" rx="10" fill="#f0e3b8" stroke="#000" strokeOpacity=".2" />
        <rect x="190" y="230" width="420" height="70" rx="10" fill="#f6ecc9" stroke="#000" strokeOpacity=".2" />
        <rect x="210" y="160" width="380" height="70" rx="22" fill="#fbf3dc" stroke="#000" strokeOpacity=".2" />
        {Array.from({ length: 16 }).map((_, i) => <circle key={i} cx={190 + (i * 53) % 420 + 10} cy={310 + ((i * 17) % 50)} r="4" fill="#d9c58a" opacity=".6" />)}
      </g>);
      break;
    case "fabric":
      body = (<g>
        {["#8b967f", "#b5694b", "#34425a", "#e6dccb", "#b3aa9b", "#4a4846"].map((c, i) => (
          <g key={c} transform={`rotate(${-35 + i * 14} 400 400)`}><rect x="370" y="140" width="60" height="260" rx="6" fill={c} stroke="#000" strokeOpacity=".25" /><rect x="370" y="140" width="60" height="18" rx="4" fill="#fff" fillOpacity=".18" /></g>
        ))}
        <circle cx="400" cy="400" r="14" fill="#d9c28a" />
      </g>);
      break;
    case "finish":
      body = (<g>
        <Plank id={id} x={120} y={270} w={560} h={90} />
        <rect x="120" y="270" width="290" height="90" rx="4" fill="#3b2a20" opacity=".5" />
        <path d="M120 285 H680" stroke="#fff" strokeOpacity=".2" strokeWidth="6" />
        <g transform="rotate(-24 440 200)"><rect x="420" y="90" width="26" height="110" rx="6" fill="#d9c28a" /><rect x="414" y="196" width="38" height="56" rx="4" fill="#e6dcc8" /></g>
      </g>);
      break;
    default: // home
      body = null;
  }
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Illustration: ${stage}`}>
      <Bg id={id} />
      {body}
    </svg>
  );
}
export const _unused = [W1, W2, W3];
