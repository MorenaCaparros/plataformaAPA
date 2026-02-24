'use client';

import { LucideIcon } from 'lucide-react';

interface DashboardMetricCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  sublabel?: string;
  colorClass: 'impulso' | 'sol' | 'crecimiento' | 'teal' | 'purple';
  pulseColor?: string; // override pulse dot color
}

const colorMap = {
  impulso: {
    bg: 'bg-impulso-50',
    text: 'text-impulso-500',
    shadow: 'shadow-[0_10px_40px_-10px_rgba(230,57,70,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(230,57,70,0.25)]',
    pulse: 'bg-impulso-400',
    sublabel: 'text-impulso-600',
  },
  sol: {
    bg: 'bg-sol-50',
    text: 'text-sol-500',
    shadow: 'shadow-[0_10px_40px_-10px_rgba(242,201,76,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(242,201,76,0.25)]',
    pulse: 'bg-sol-400',
    sublabel: 'text-sol-600',
  },
  crecimiento: {
    bg: 'bg-crecimiento-50',
    text: 'text-crecimiento-500',
    shadow: 'shadow-[0_10px_40px_-10px_rgba(164,198,57,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(164,198,57,0.25)]',
    pulse: 'bg-crecimiento-400',
    sublabel: 'text-crecimiento-600',
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-500',
    shadow: 'shadow-[0_10px_40px_-10px_rgba(20,184,166,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(20,184,166,0.25)]',
    pulse: 'bg-teal-400',
    sublabel: 'text-teal-600',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-500',
    shadow: 'shadow-[0_10px_40px_-10px_rgba(168,85,247,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(168,85,247,0.25)]',
    pulse: 'bg-purple-400',
    sublabel: 'text-purple-600',
  },
};

export default function DashboardMetricCard({
  icon: Icon,
  value,
  label,
  sublabel,
  colorClass,
}: DashboardMetricCardProps) {
  const colors = colorMap[colorClass];

  return (
    <div
      className={`relative group bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 transition-all duration-300 ${colors.shadow} hover:-translate-y-1`}
    >
      <div
        className={`h-14 w-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-4 ${colors.text} group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-7 h-7" strokeWidth={2.5} />
      </div>
      <h3 className="font-quicksand font-bold text-3xl text-neutro-carbon mb-1">{value}</h3>
      <p className="font-outfit font-medium text-neutro-piedra text-sm mb-1">{label}</p>
      {sublabel && (
        <p className={`font-outfit text-xs ${colors.sublabel}`}>{sublabel}</p>
      )}
      <div className={`absolute top-6 right-6 h-2 w-2 rounded-full ${colors.pulse} animate-pulse`} />
    </div>
  );
}

/** Skeleton para usar mientras isLoading = true */
export function DashboardMetricCardSkeleton() {
  return (
    <div className="bg-white/60 backdrop-blur-md rounded-[2rem] border border-white/60 p-6 animate-pulse">
      <div className="h-14 w-14 rounded-2xl bg-gray-200 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-28" />
    </div>
  );
}
