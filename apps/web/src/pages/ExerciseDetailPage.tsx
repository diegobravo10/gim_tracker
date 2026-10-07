import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate, useParams } from 'react-router-dom';
import { getExercise, getExerciseProgress } from '../api/exercises.ts';
import type { PRSummary } from '../api/types.ts';
import { formatDate, formatWeight } from '../lib/formatters.ts';
import { filterByRange, RANGE_LABELS, type ProgressRange } from '../lib/progressRange.ts';

type Metric = 'maxWeightKg' | 'estimated1RM' | 'volumeKg';

const METRIC_LABELS: Record<Metric, string> = {
  maxWeightKg: 'Peso máximo',
  estimated1RM: '1RM estimado',
  volumeKg: 'Volumen',
};

const RANGES: ProgressRange[] = ['1m', '3m', 'all'];

export function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [metric, setMetric] = useState<Metric>('maxWeightKg');
  const [range, setRange] = useState<ProgressRange>('3m');

  const exerciseQuery = useQuery({
    queryKey: ['exercise', id],
    queryFn: () => getExercise(id!),
    enabled: !!id,
  });

  const progressQuery = useQuery({
    queryKey: ['exercise-progress', id],
    queryFn: () => getExerciseProgress(id!),
    enabled: !!id,
  });

  const chartData = useMemo(() => {
    const points = progressQuery.data?.byWorkout ?? [];
    return filterByRange(points, range).map((point) => ({
      ...point,
      label: formatDate(point.startedAt),
    }));
  }, [progressQuery.data, range]);

  if (exerciseQuery.isLoading || progressQuery.isLoading) {
    return <p className="pt-16 text-center text-neutral-500">Cargando...</p>;
  }

  if (exerciseQuery.isError || !exerciseQuery.data) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16">
        <p className="text-neutral-400">No se encontró el ejercicio.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg bg-neutral-800 px-4 py-3 font-medium"
          style={{ minHeight: 48 }}
        >
          Volver
        </button>
      </div>
    );
  }

  const prs = progressQuery.data?.prs;

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={() => navigate(-1)} className="text-sm text-neutral-400">
        ← Volver
      </button>

      <h1 className="text-xl font-bold">{exerciseQuery.data.name}</h1>

      <div className="flex gap-2">
        {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              metric === m ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}
            style={{ minHeight: 44 }}
          >
            {METRIC_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-lg px-4 py-1 text-sm font-medium ${
              range === r ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-900 text-neutral-500'
            }`}
            style={{ minHeight: 36 }}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="h-64 rounded-2xl bg-neutral-900/40 p-2">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-neutral-500">
            Sin datos en este rango.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="label" stroke="#737373" fontSize={12} />
              <YAxis stroke="#737373" fontSize={12} width={40} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', border: 'none', borderRadius: 8 }}
                labelStyle={{ color: '#e5e5e5' }}
                formatter={(value) => [`${formatWeight(Number(value))} kg`, METRIC_LABELS[metric]]}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="#34d399"
                strokeWidth={2}
                dot={{ r: 3, fill: '#34d399' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-400">Récords personales</h2>
        <PRRow label="Peso máximo" pr={prs?.maxWeight ?? null} />
        <PRRow label="1RM estimado" pr={prs?.estimated1RM ?? null} />
        <PRRow label="Volumen en una sesión" pr={prs?.volume ?? null} />
      </section>
    </div>
  );
}

function PRRow({ label, pr }: { label: string; pr: PRSummary | null }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-neutral-900/60 p-3">
      <div>
        <p className="font-medium">{label}</p>
        {pr && <p className="text-sm text-neutral-500">{formatDate(pr.startedAt)}</p>}
      </div>
      <p className="text-lg font-bold text-emerald-400">
        {pr ? `${formatWeight(pr.value)} kg` : '—'}
      </p>
    </div>
  );
}
