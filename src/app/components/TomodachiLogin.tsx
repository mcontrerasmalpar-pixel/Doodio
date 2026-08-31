import { useState } from "react";

// ─── CSS ──────────────────────────────────────────────────────────────
const CSS = `
  @keyframes floatA {
    0%,100%{transform:translateY(0) rotate(0deg) scale(1)}
    50%{transform:translateY(-11px) rotate(8deg) scale(1.08)}
  }
  @keyframes floatB {
    0%,100%{transform:translateY(0) rotate(0deg)}
    50%{transform:translateY(-14px) rotate(-7deg)}
  }
  @keyframes floatC {
    0%,100%{transform:translateY(0)}
    33%{transform:translateY(-8px)}
    66%{transform:translateY(-4px)}
  }
  @keyframes cloudDrift {
    0%,100%{transform:translateX(0)}
    50%{transform:translateX(10px)}
  }
  @keyframes btnBounce {
    0%,100%{transform:scale(1)}
    50%{transform:scale(1.04)}
  }
  .tomo-input::placeholder{color:#B0A898;font-family:'Nunito',sans-serif;font-size:1rem}
  .tomo-input:focus{outline:none;border-color:#FF8C42!important;box-shadow:0 0 0 3px rgba(255,140,66,0.25)!important}
  .go-btn{transition:transform .12s ease,box-shadow .12s ease}
  .go-btn:hover{transform:scale(1.06)!important}
  .go-btn:active{transform:scale(0.93)!important}
  .first-link:hover{text-decoration:underline}
`;

// ─── Blob path (330×490 viewBox) ──────────────────────────────────────────
const BLOB = `
  M 118 28
  Q 140 10 165 24
  Q 190 8 218 26
  Q 240 10 262 32
  Q 288 20 308 48
  Q 326 42 328 70
  Q 342 94 328 122
  Q 344 148 326 175
  Q 342 202 322 228
  Q 338 258 316 278
  Q 332 308 308 322
  Q 320 354 294 366
  Q 290 396 262 404
  Q 248 426 220 420
  Q 200 438 175 430
  Q 152 445 130 432
  Q 106 443 84 424
  Q 56 430 40 408
  Q 12 398 14 368
  Q -6 346 12 318
  Q -6 292 12 265
  Q -4 238 14 212
  Q -4 184 14 158
  Q 0 130 18 108
  Q 4 78 30 66
  Q 28 38 58 30
  Q 75 14 102 28
  Q 112 12 118 28 Z
`;
