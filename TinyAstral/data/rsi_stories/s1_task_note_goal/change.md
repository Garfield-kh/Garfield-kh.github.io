# H1 → H3: a per-task note tells the planner what "done" looks like

**Change.** Before the episode starts, the harness injects a short task note that the teacher wrote itself from the official task description and a few built-in expert demonstrations (start and end states, no checker code). Each later observation repeats the note's one-line goal. Many RoboTwin tasks hide their success condition: "relocate it" really means "about 30 cm farther outward, same row".

- **Capability:** task memory, tier 2 (expert end states → teacher-written note) + per-step "Task goal (from the note)" line. Failure type: end-state misunderstood / false done.
- **Proposed by:** the master agent after a gap analysis; the per-step goal line was suggested by another LLM agent in discussion.
- **Accepted on:** paired A/B against H1 on the same dev seeds (50 tasks × 8 seeds, run twice): pass 1 131/265 = 49.4% vs 93/265 = 35.1%; pass 2 125/265 = 47.2% vs 94/265 = 35.5%; mean +34.5 episodes per pass. Paired episodes where only the note changed behaviour (no new tool path): 27 wins / 12 losses / 55 ties.
- **This pair:** `move_playingcard_away`, seed 75002. H1 moves the deck 13 cm and calls `done` with no checks; H3 reads "about 30 cm outward" and places it at x = −37 cm.

**What the planner sees (observation text, H1 vs H3):**

```diff
 Task: Use the left arm to grab the rectangular playingcards case with patterns and relocate it.
+Task note (from earlier practice on this task):
+- End: card deck lies flat on table, about 30 cm farther outward from its start along x, same y, orientation unchanged, released.
+- If it started left of center, end about 30 cm left; if right, about 30 cm right; keep it on table, not held.
 Objects in the scene: playingcards
 ...
 Result of locate: {...}
+Task goal (from the note): Card deck released flat on table about 30 cm farther outward than start, same row and orientation.
```

**Harness code (prompt construction):**

```diff
-txt = (f"Task: {instr}\nObjects in the scene: {olist}\n" if k == 0
-       else f"Result of {steps[-1]['call']['name']}: {result_text}\n")
+memo = load_memory(a.task)        # per-task note (tier 2 memory)
+txt = (f"Task: {instr}\n" + (f"Task note (from earlier practice on this task):\n{memo['text']}\n" if memo else "")
+       + f"Objects in the scene: {olist}\n" if k == 0
+       else f"Result of {steps[-1]['call']['name']}: {result_text}\n"
+       + (f"Task goal (from the note): {memo['goal']}\n" if memo and memo["goal"] else ""))
```

