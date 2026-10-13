import { LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function DashboardPlaceholder({ onReturn }: { onReturn: () => void }) {
    return <section className="panel dashboard-placeholder" aria-labelledby="dashboard-placeholder-title">
        <div className="placeholder-icon" aria-hidden="true"><LayoutDashboard size={30}/></div>
        <span className="badge blue">Belum tersedia</span>
        <h3 id="dashboard-placeholder-title">Dashboard sedang disiapkan</h3>
        <p className="muted">Dataset dan indikator bisnis untuk Dashboard 4 belum ditetapkan.
            Data, KPI, dan grafik akan ditampilkan setelah sumber data dan definisi indikator tersedia.</p>
        <button className="secondary" onClick={onReturn}><ArrowLeft size={15} aria-hidden="true"/>Kembali ke IJR - BNIdirect</button>
    </section>;
}
