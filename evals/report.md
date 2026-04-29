# ChronoPath Eval Report

_Generated: 2026-04-29T11:09:29.277Z_

## Methodology

10 prompts × 2 generator models, scored on 4 dimensions by a held-out Claude judge (different model than the generator):

1. **Factual accuracy** — every claim traces to a provided source
2. **Persona fit** — narrative matches the persona's prompting directive
3. **Cultural sensitivity** — no orientalism, condescension, or flattening of caste/class/religious nuance
4. **Source-bias awareness** — uses sources critically, not interchangeably

**Cross-model judging within Claude family.** Sonnet generations are judged by Haiku; Haiku generations are judged by Sonnet. The judge model is never the same as the generator. This reduces — but does not eliminate — self-preference bias, since both judges share the same model family.

## Results

| Generator | n | Factual | Persona | Sensitivity | Bias-aware | Total /20 | Revisions triggered |
|---|---|---|---|---|---|---|---|
| Claude Sonnet 4.5 | 10 | 2.50 | 4.50 | 3.40 | 2.90 | 13.30 | 10/10 |
| Claude Haiku 4.5 | 10 | 3.10 | 4.20 | 3.50 | 3.30 | 14.10 | 6/10 |

## Per-prompt detail

| Prompt | Stop | Persona | Generator | Total |
|---|---|---|---|---|
| p01 | shaniwar-wada | italian-tourist | Claude Sonnet 4.5 | 11/20 |
| p01 | shaniwar-wada | italian-tourist | Claude Haiku 4.5 | 16/20 |
| p02 | shaniwar-wada | schoolkid | Claude Sonnet 4.5 | 10/20 |
| p02 | shaniwar-wada | schoolkid | Claude Haiku 4.5 | 11/20 |
| p03 | shaniwar-wada | historian | Claude Sonnet 4.5 | 17/20 |
| p03 | shaniwar-wada | historian | Claude Haiku 4.5 | 18/20 |
| p04 | lal-mahal | first-timer | Claude Sonnet 4.5 | 13/20 |
| p04 | lal-mahal | first-timer | Claude Haiku 4.5 | 14/20 |
| p05 | lal-mahal | historian | Claude Sonnet 4.5 | 12/20 |
| p05 | lal-mahal | historian | Claude Haiku 4.5 | 18/20 |
| p06 | kasba-ganpati | italian-tourist | Claude Sonnet 4.5 | 12/20 |
| p06 | kasba-ganpati | italian-tourist | Claude Haiku 4.5 | 11/20 |
| p07 | vishrambaug-wada | historian | Claude Sonnet 4.5 | 16/20 |
| p07 | vishrambaug-wada | historian | Claude Haiku 4.5 | 20/20 |
| p08 | vishrambaug-wada | schoolkid | Claude Sonnet 4.5 | 13/20 |
| p08 | vishrambaug-wada | schoolkid | Claude Haiku 4.5 | 9/20 |
| p09 | phule-wada | italian-tourist | Claude Sonnet 4.5 | 14/20 |
| p09 | phule-wada | italian-tourist | Claude Haiku 4.5 | 12/20 |
| p10 | phule-wada | first-timer | Claude Sonnet 4.5 | 15/20 |
| p10 | phule-wada | first-timer | Claude Haiku 4.5 | 12/20 |

## Limitations (stated openly)

- LLM-as-judge is useful for *relative* model ranking, not absolute scoring.
- All judges are Claude-family models. Cross-family validation (GPT, Gemini as third judges) is future work.
- Judges inherit family-level biases — particularly toward verbose, hedged outputs.
- Corpus is small (~14 sources, 5 stops). Absolute scores are not stable across runs; relative ordering is.
- Each prompt judged once. Production-grade evals would judge each output multiple times and average to reduce variance.
- The eval set itself was authored alongside the system; an independently authored eval set would be a stronger benchmark.

## How to read this

The score table is the headline. The per-prompt detail surfaces specific cases where models diverge sharply.

## Reproducing

Run `npm run eval` to regenerate this report.
