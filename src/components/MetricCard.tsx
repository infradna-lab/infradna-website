interface MetricCardProps {
  value: string
  label: string
  caption?: string
}

function MetricCard({ value, label, caption }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xl md:text-2xl font-bold text-[#1e3a5f] break-keep">{value}</p>
      <p className="mt-2 text-sm font-semibold text-[#0891b2] break-keep">{label}</p>
      {caption && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500 break-keep">{caption}</p>
      )}
    </div>
  )
}

export default MetricCard
