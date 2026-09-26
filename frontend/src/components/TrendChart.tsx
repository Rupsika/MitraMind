import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Lang } from "../services/types";
import { shortDate } from "../utils/format";

interface Point {
  date: string;
  [key: string]: number | string;
}

/** One simple line per chart, 1–10 scale. */
export function TrendChart({
  data,
  dataKey,
  label,
  lang,
  height = 160,
}: {
  data: Point[];
  dataKey: string;
  label: string;
  lang: Lang;
  height?: number;
}) {
  const points = data.map((d) => ({ ...d, day: shortDate(d.date, lang) }));
  return (
    <figure aria-label={label} className="m-0">
      <figcaption className="mb-1 text-sm font-medium">{label}</figcaption>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis domain={[1, 10]} ticks={[1, 5, 10]} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
            <Line type="monotone" dataKey={dataKey} stroke="#3f7d6e" strokeWidth={2} dot={{ r: 3 }} animationDuration={400} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
