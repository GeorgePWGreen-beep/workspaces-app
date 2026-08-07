"use client";

import { Cafe } from "@/types/cafe";
import StudyScore from "./StudyScore";

interface CafeDetailsProps {
  cafe: Cafe;
}

export default function CafeDetails({ cafe }: CafeDetailsProps) {
  return (
    <div className="bg-white rounded-t-[32px] overflow-hidden">

      {/* Hero Image */}
      <img
        src={cafe.image}
        alt={cafe.name}
        className="w-full h-56 object-cover"
      />

      <div className="p-6">

        {/* Name + Study Score */}
        <div className="flex justify-between items-start gap-4">

          <h2 className="text-2xl font-bold text-slate-900 leading-tight">
            {cafe.name}
          </h2>

          <div className="mr-3 shrink-0">
            <StudyScore score={cafe.studyScore} size={114} />
          </div>

        </div>

        {/* Rating */}
        <div className="mt-3 text-amber-500 text-lg">
          ⭐ {cafe.rating}
        </div>

        {/* Price + Walk */}
        <div className="flex gap-3 mt-4">

          <div className="bg-slate-100 rounded-full px-4 py-2 text-sm font-medium">
            💷 {cafe.price}
          </div>

          <div className="bg-slate-100 rounded-full px-4 py-2 text-sm font-medium">
            🚶 {cafe.walkTime} min walk
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 my-6" />

        {/* Description */}
        <div>

          <h3 className="font-semibold text-slate-900 mb-2">
            About
          </h3>

          <p className="text-slate-600 leading-relaxed">
            {cafe.description}
          </p>

        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 my-6" />

        {/* Study Features */}

        <h3 className="font-semibold text-slate-900 mb-4">
          Study Features
        </h3>

        <div className="flex flex-wrap gap-2">

          <span className="bg-green-100 text-green-700 rounded-full px-3 py-2 text-sm">
            📶 {cafe.wifi}
          </span>

          <span className="bg-orange-100 text-orange-700 rounded-full px-3 py-2 text-sm">
            🔌 {cafe.sockets} sockets
          </span>

          <span className="bg-purple-100 text-purple-700 rounded-full px-3 py-2 text-sm">
            🤫 {cafe.noise}
          </span>

          <span className="bg-blue-100 text-blue-700 rounded-full px-3 py-2 text-sm">
            👥 {cafe.busyness}
          </span>

          <span className="bg-yellow-100 text-yellow-700 rounded-full px-3 py-2 text-sm">
            ☕ {cafe.coffee} coffee
          </span>

          <span className="bg-pink-100 text-pink-700 rounded-full px-3 py-2 text-sm">
            💺 {cafe.seating} seating
          </span>

        </div>

        {/* Divider */}

        <div className="border-t border-slate-200 my-6" />

        {/* Actions */}

        <div className="grid grid-cols-3 gap-3">

          <button className="rounded-2xl bg-slate-100 py-3 font-medium hover:bg-slate-200 transition">
            📍
            <br />
            Directions
          </button>

          <button className="rounded-2xl bg-slate-100 py-3 font-medium hover:bg-slate-200 transition">
            ⭐
            <br />
            Save
          </button>

          <button className="rounded-2xl bg-slate-100 py-3 font-medium hover:bg-slate-200 transition">
            ✍️
            <br />
            Review
          </button>

        </div>

      </div>

    </div>
  );
}
