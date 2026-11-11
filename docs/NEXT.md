# Where we left off (update this at the end of every session)

Last updated: 11 Nov 2026

## Done
- Pipeline: Style 5 renderer (`lib/`), Kokoro voice, lo-fi mix, QA with retention gates, publisher (Chrome / Make / manual pack).
- 11 /yt-* skills installed (8 used). Publisher agent in `.claude/agents/`.
- #7 "'Guys' Comes From a 1605 Gunpowder Plot" built and QA-passed; scheduled by Rakesh for Thu 5 Nov 07:00 UK.
- #8 "Cans Came 40 Years Before Can Openers" built and QA-passed (episodes/can-opener); for Thu 5 Nov 17:00 UK.
- #9 "Cleopatra Was Closer to 1969 Than the Pyramids" built and QA-passed (episodes/cleopatra-moon); for Fri 6 Nov 17:00 UK.
- #10 "Some Clocks Will Hit 1901 in 2038" built and QA-passed (episodes/year-2038); for Sat 7 Nov 07:00 UK.
- #11 "Your Keyboard Is 150 Years Old" (T10, picked by Rakesh) built and QA-passed (episodes/qwerty); for Sat 7 Nov 17:00 UK.
- #12 "Ancient Rome Had a Pee Tax" (B5, brain-rot test) built, then REJECTED by Rakesh ('not good') - not uploaded; slot freed.
- #13 "The Sandwich Is Named After a Real Earl (1762)" (T18) built and QA-passed (episodes/sandwich); for Sun 8 Nov 07:00 UK.
- #14 "France Used the Guillotine Until 1977" (G1) built and QA-passed (episodes/guillotine-1977); for Sun 8 Nov 17:00 UK.
- #15 "The WW2 Army That Fought With Balloons" (Ghost Army, Rakesh's pick from the story list) built and QA-passed (episodes/ghost-army); NOT uploaded (Rakesh picked it for 'ghost', got balloons). Fact check: medal was 2024 (not 2022); '15 miles' sound range and the lifted-tank anecdote left out (not verified).
- #16 "The 1872 Ghost Ship Found With Nobody Aboard" (Mary Celeste) built and QA-passed (episodes/mary-celeste); for Mon 9 Nov 07:00 UK. 'Half-eaten breakfast' left out (Conan Doyle myth).
- #17 "Why Plane Windows Are Round (1954)" (X1) built and QA-passed (episodes/plane-windows); for Mon 9 Nov 17:00 UK. Mix needed BED_DB=-9 (audio/mix.py now reads BED_DB from the environment).
- #18 "Treadmills Were Built to Punish Prisoners (1818)" built and QA-passed (episodes/treadmill); for Tue 10 Nov 07:00 UK (Studio Inspiration idea Rakesh picked). Nintendo/Ripper idea needs rewording ('one year after'); chainsaw idea is the backup.
- #19 "Chainsaws Were Invented for Childbirth (1780s)" (P5) built and QA-passed (episodes/chainsaw); for Tue 10 Nov 17:00 UK. First video with the spoken question + subscribe ending (storyboard payoff beat `cta`).
- #18 treadmill at 9 h: 54.2% stayed, 91.3% avg viewed, +5 subs, 0 comments (analytics/2026-11-10_treadmill_9h.md).
- #20 "Bluetooth Was Named After a Viking King (1990s)" (P1) built and QA-passed (episodes/bluetooth); for Wed 11 Nov 17:00 UK. All-human cast at Rakesh's request. He is also trying Higgsfield himself with a prompt pack from chat (rule 1 unchanged for our builds).
- Open question for Rakesh: what was wrong with the brain-rot video (pace, voice, look, topic, or the whole format)?

## Waiting on Rakesh
- The #7-#11 and #13, #14, #16-#18 video links; Studio 'stayed to watch' % for #7-#11 -> `python3 -m timesketch.publish episodes/guy-fawkes-guys --link <url>`
- After 48 h (Sat 7 Nov): Studio exports (Advanced mode CSV, retention CSV, stayed-to-watch %) into `analytics/` -> /yt-retention + /yt-audit, fill row 7 of the results log in CLAUDE.md.

## Next
0. Waiting for Rakesh to pick the next topic from docs/TOPICS.md (explainers X2-X8, mystery list M2-M3 and story list S1-S8; Rakesh liked the 'ghost'/mystery direction) (workflow: Claude proposes, Rakesh picks, Claude builds).
1. Build agents: fact-checker, storyboarder, independent QA reviewer (+ scout, scriptwriter, analyst wrappers) in `.claude/agents/`.
2. Next Short: the 2,000-year-old vending machine (Hero of Alexandria).
4. vidIQ free credits reset 15 Nov: competitor scan with free (0-credit) calls only.

## Start a new session with
"Read CLAUDE.md and docs/NEXT.md, run scripts/setup.sh, then continue with Next."
